// Geçici Şifre (Temporary Password) Servisi
//
// Admin, bir öğrencinin Firebase Auth şifresini doğrudan client SDK ile
// değiştiremez. Bu yüzden geçici şifre atama işi `setTempPassword` adlı
// Cloud Function (Admin SDK) üzerinden yapılır:
//
//  1) Admin geçici şifre atar -> setTempPassword çağrılır. Fonksiyon öğrencinin
//     GERÇEK Auth şifresini geçici şifreye eşitler ve
//     users/{userId}.mustResetPassword = true yazar.
//  2) Öğrenci geçici şifreyle NORMAL şekilde giriş yapar (Firestore tabanlı
//     fallback yok). Giriş sonrası mustResetPassword bayrağı nedeniyle kalıcı
//     şifre belirlemeye zorlanır (bkz. ForcePasswordReset.vue).
//  3) Öğrenci yeni şifreyi belirleyince updatePassword ile gerçek Auth şifresi
//     güncellenir ve bayrak temizlenir (bkz. auth.completePasswordReset).

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

// Rastgele, okunması kolay geçici şifre üret (8 karakter, karışık)
export function generateTempPassword(length = 8): string {
    // Karıştırılması kolay karakterler (0/O, 1/l/I) çıkarıldı
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let result = ''
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : undefined
    if (cryptoObj?.getRandomValues) {
        const arr = new Uint32Array(length)
        cryptoObj.getRandomValues(arr)
        for (let i = 0; i < length; i++) {
            result += chars[arr[i] % chars.length]
        }
    } else {
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)]
        }
    }
    return result
}

// ADMIN: Bir öğrenciye geçici şifre ata.
// setTempPassword Cloud Function öğrencinin gerçek Auth şifresini geçici şifreye
// eşitler ve mustResetPassword bayrağını yazar. (phoneNumber yalnızca eski imzayla
// uyum için kabul edilir; artık kullanılmaz.)
export async function assignTempPassword(
    userId: string,
    _phoneNumber: string,
    tempPassword: string
): Promise<void> {
    if (!userId) throw new Error('Geçici şifre atamak için kullanıcı kimliği gerekli')
    if (!tempPassword || tempPassword.length < 6) {
        throw new Error('Geçici şifre en az 6 karakter olmalı')
    }

    const callable = httpsCallable<{ userId: string; tempPassword: string }, { success: boolean }>(
        functions,
        'setTempPassword'
    )

    try {
        await callable({ userId, tempPassword })
    } catch (err: any) {
        // Cloud Function HttpsError mesajını kullanıcıya aktar
        throw new Error(err?.message || 'Geçici şifre atanırken bir hata oluştu')
    }
}

// ADMIN/BOSS: Bir kullanıcının telefon numarasını değiştir.
// Giriş telefondan türetilen dummy email ile yapıldığından, numarayı sadece Firestore'da
// güncellemek yetmez — updateUserPhone Cloud Function Auth email'ini de yeni numaraya
// eşitler ve Firestore phone_number'ı günceller. (Numara çakışması net hatayla döner.)
export async function updateStudentPhone(userId: string, newPhone: string): Promise<void> {
    if (!userId) throw new Error('Telefon güncellemek için kullanıcı kimliği gerekli')
    if (!newPhone || !/^0\d{10}$/.test(newPhone)) {
        throw new Error('Telefon numarası 0 ile başlayan 11 haneli rakam olmalı')
    }

    const callable = httpsCallable<{ userId: string; newPhone: string }, { success: boolean }>(
        functions,
        'updateUserPhone'
    )

    try {
        await callable({ userId, newPhone })
    } catch (err: any) {
        throw new Error(err?.message || 'Telefon numarası güncellenirken bir hata oluştu')
    }
}

// ADMIN/BOSS: Bir kullanıcının Firebase Auth kaydını sil.
// Soft-delete sonrası Auth kaydı silinmezse kullanıcı eski şifresiyle giriş yapabiliyordu;
// deleteUserAccount Cloud Function bunu engeller. Firestore soft-delete'i çağıran tarafta
// (performStudentDelete) ayrıca yapılır. Auth kaydı zaten yoksa hata atmaz (idempotent).
export async function deleteStudentAuth(userId: string): Promise<void> {
    if (!userId) throw new Error('Auth kaydı silmek için kullanıcı kimliği gerekli')

    const callable = httpsCallable<{ userId: string }, { success: boolean }>(
        functions,
        'deleteUserAccount'
    )

    try {
        await callable({ userId })
    } catch (err: any) {
        throw new Error(err?.message || 'Kullanıcının Auth kaydı silinirken bir hata oluştu')
    }
}

// LOGIN sonrası: mustResetPassword bayrağını kaldır.
// (öğrenci kalıcı şifresini belirledikten sonra çağrılır)
export async function clearMustResetPassword(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
        mustResetPassword: false,
        updatedAt: serverTimestamp(),
    })
}
