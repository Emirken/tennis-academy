import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

// Telefon numarasından dummy email üret (client'taki phoneToEmail ile birebir aynı
// olmalı — giriş bu email üzerinden yapılıyor). bkz. src/store/modules/auth.ts
function phoneToEmail(phone: string): string {
    return `${phone}@tennis.local`
}

// Çağıran kullanıcı admin VEYA boss mu? (boss, isAdmin getter'ında admin sayılır.)
async function assertAdminOrBoss(uid: string): Promise<void> {
    const snap = await db.collection('users').doc(uid).get()
    const role = snap.data()?.role
    if (!snap.exists || (role !== 'admin' && role !== 'boss')) {
        throw new HttpsError('permission-denied', 'Bu işlemi yalnızca yönetici yapabilir.')
    }
}

interface SetTempPasswordData {
    userId?: string
    tempPassword?: string
}

/**
 * ADMIN: Bir öğrenciye geçici şifre atar.
 *
 * Spark planda client SDK başka kullanıcının Firebase Auth şifresini değiştiremez.
 * Bu callable function Admin SDK ile öğrencinin GERÇEK Auth şifresini doğrudan
 * geçici şifreye eşitler; ayrıca users/{userId}.mustResetPassword = true yazar.
 *
 * Böylece öğrenci geçici şifreyle NORMAL şekilde giriş yapar (Firestore tabanlı
 * fallback'e gerek kalmaz) ve giriş sonrası kalıcı şifresini belirlemeye zorlanır.
 */
export const setTempPassword = onCall(async (request) => {
    // 1) Çağıran kimliği doğrulanmış mı?
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmalısınız.')
    }

    // 2) Çağıran admin mi? (users/{uid}.role === 'admin')
    const callerSnap = await db.collection('users').doc(request.auth.uid).get()
    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Bu işlemi yalnızca yönetici yapabilir.')
    }

    // 3) Girdi doğrulama
    const { userId, tempPassword } = (request.data || {}) as SetTempPasswordData
    if (!userId || typeof userId !== 'string') {
        throw new HttpsError('invalid-argument', 'Geçerli bir kullanıcı kimliği (userId) gerekli.')
    }
    if (!tempPassword || typeof tempPassword !== 'string' || tempPassword.length < 6) {
        throw new HttpsError('invalid-argument', 'Geçici şifre en az 6 karakter olmalı.')
    }

    // 4) Hedef kullanıcı gerçekten var mı? (Firestore dokümanı)
    const targetSnap = await db.collection('users').doc(userId).get()
    if (!targetSnap.exists) {
        throw new HttpsError('not-found', 'Hedef kullanıcı bulunamadı.')
    }

    // 5) Gerçek Firebase Auth şifresini güncelle
    try {
        await admin.auth().updateUser(userId, { password: tempPassword })
    } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
            throw new HttpsError('not-found', 'Bu kullanıcının Firebase Auth kaydı bulunamadı.')
        }
        throw new HttpsError('internal', 'Auth şifresi güncellenemedi: ' + (err?.message || 'bilinmeyen hata'))
    }

    // 6) Kullanıcıyı kalıcı şifre belirlemeye zorlamak için bayrak yaz
    await db.collection('users').doc(userId).update({
        mustResetPassword: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
})

interface UpdateUserPhoneData {
    userId?: string
    newPhone?: string
}

/**
 * ADMIN/BOSS: Bir kullanıcının telefon numarasını değiştirir.
 *
 * Giriş, telefondan türetilen dummy email ({phone}@tennis.local) üzerinden yapıldığı
 * için, sadece Firestore'daki phone_number'ı güncellemek YETMEZ — kullanıcı eski
 * numarayla giriş yapmaya devam eder. Bu fonksiyon Admin SDK ile Auth email'ini de
 * yeni numaraya eşitler ve Firestore phone_number'ı günceller (tek atomik akış).
 */
export const updateUserPhone = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmalısınız.')
    }
    await assertAdminOrBoss(request.auth.uid)

    const { userId, newPhone } = (request.data || {}) as UpdateUserPhoneData
    if (!userId || typeof userId !== 'string') {
        throw new HttpsError('invalid-argument', 'Geçerli bir kullanıcı kimliği (userId) gerekli.')
    }
    // Login.vue phoneRules ile aynı: 11 haneli, sadece rakam, 0 ile başlar
    if (!newPhone || typeof newPhone !== 'string' || !/^0\d{10}$/.test(newPhone)) {
        throw new HttpsError('invalid-argument', 'Telefon numarası 0 ile başlayan 11 haneli rakam olmalı.')
    }

    const targetSnap = await db.collection('users').doc(userId).get()
    if (!targetSnap.exists) {
        throw new HttpsError('not-found', 'Hedef kullanıcı bulunamadı.')
    }

    // 1) Auth email'ini yeni numaraya eşitle (Auth başarısızsa Firestore'a hiç dokunma)
    try {
        await admin.auth().updateUser(userId, { email: phoneToEmail(newPhone) })
    } catch (err: any) {
        if (err?.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'Bu telefon numarası başka bir kullanıcıya ait.')
        }
        if (err?.code === 'auth/user-not-found') {
            throw new HttpsError('not-found', 'Bu kullanıcının Firebase Auth kaydı bulunamadı.')
        }
        throw new HttpsError('internal', 'Telefon güncellenemedi: ' + (err?.message || 'bilinmeyen hata'))
    }

    // 2) Auth başarılı — Firestore phone_number'ı da güncelle
    await db.collection('users').doc(userId).update({
        phone_number: newPhone,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
})

interface DeleteUserAccountData {
    userId?: string
}

/**
 * ADMIN/BOSS: Bir kullanıcının Firebase Auth kaydını siler.
 *
 * Client SDK başka kullanıcının Auth kaydını silemez; bu yüzden soft-delete sonrası
 * Auth kaydı kalıyor ve silinen kullanıcı eski şifresiyle giriş yapabiliyordu. Bu
 * fonksiyon sadece Auth kaydını siler — Firestore soft-delete'i (anonimleştirme, grup
 * çıkarma, local state) client tarafında performStudentDelete'te yapılmaya devam eder.
 */
export const deleteUserAccount = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmalısınız.')
    }
    await assertAdminOrBoss(request.auth.uid)

    const { userId } = (request.data || {}) as DeleteUserAccountData
    if (!userId || typeof userId !== 'string') {
        throw new HttpsError('invalid-argument', 'Geçerli bir kullanıcı kimliği (userId) gerekli.')
    }

    try {
        await admin.auth().deleteUser(userId)
    } catch (err: any) {
        // Auth kaydı zaten yoksa silme başarılı sayılır (idempotent)
        if (err?.code === 'auth/user-not-found') {
            return { success: true, alreadyDeleted: true }
        }
        throw new HttpsError('internal', 'Auth kaydı silinemedi: ' + (err?.message || 'bilinmeyen hata'))
    }

    return { success: true }
})
