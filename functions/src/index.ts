import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

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
