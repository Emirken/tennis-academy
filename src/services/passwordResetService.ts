// Geçici Şifre (Temporary Password) Servisi
//
// Bu projede Cloud Functions / Admin SDK YOK. Bu yüzden admin, başka bir
// kullanıcının Firebase Auth şifresini doğrudan değiştiremez. Çözüm:
//
//  1) Admin bir "geçici şifre" atar -> passwordResets/{phone} dokümanına yazılır,
//     kullanıcı dokümanına mustResetPassword: true bayrağı eklenir.
//  2) Öğrenci giriş yaparken normal Auth şifresi başarısız olursa, login akışı
//     passwordResets/{phone} dokümanını okur; geçici şifre eşleşirse onunla giriş
//     yapılır ve öğrenci hemen yeni (kalıcı) şifresini belirlemeye zorlanır.
//  3) Öğrenci yeni şifreyi belirleyince updatePassword ile gerçek Auth şifresi
//     güncellenir, geçici kayıt silinir ve bayrak temizlenir.
//
// GÜVENLİK NOTU: Geçici şifre, öğrenci ilk girişini yapana kadar Firestore'da
// düz metin olarak tutulur. passwordResets koleksiyonu yalnızca doküman ID'si
// (telefon) ile tek tek okunabilir (listelenemez) ve sadece admin yazabilir.
// Geçici şifre ilk kullanımdan hemen sonra silinir.

import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const RESET_COLLECTION = 'passwordResets'

export interface PasswordResetRecord {
    phone: string
    userId: string
    tempPassword: string
    used: boolean
    createdAt?: any
}

// Telefon numarasını doküman ID olarak güvenli kullanmak için normalize et
function normalizePhone(phone: string): string {
    return (phone || '').trim()
}

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

// ADMIN: Bir öğrenciye geçici şifre ata
// - passwordResets/{phone} oluşturulur
// - users/{userId}.mustResetPassword = true
export async function assignTempPassword(
    userId: string,
    phoneNumber: string,
    tempPassword: string
): Promise<void> {
    const phone = normalizePhone(phoneNumber)
    if (!phone) throw new Error('Geçici şifre atamak için telefon numarası gerekli')
    if (!tempPassword || tempPassword.length < 6) {
        throw new Error('Geçici şifre en az 6 karakter olmalı')
    }

    const record: PasswordResetRecord = {
        phone,
        userId,
        tempPassword,
        used: false,
    }

    await setDoc(doc(db, RESET_COLLECTION, phone), {
        ...record,
        createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'users', userId), {
        mustResetPassword: true,
        updatedAt: serverTimestamp(),
    })
}

// LOGIN: Verilen telefon için aktif (kullanılmamış) geçici şifre kaydını getir
export async function getTempPasswordRecord(phoneNumber: string): Promise<PasswordResetRecord | null> {
    const phone = normalizePhone(phoneNumber)
    if (!phone) return null

    const snap = await getDoc(doc(db, RESET_COLLECTION, phone))
    if (!snap.exists()) return null

    const data = snap.data() as PasswordResetRecord
    if (data.used) return null
    return { ...data, phone }
}

// LOGIN sonrası: geçici şifre kaydını temizle ve bayrağı kaldır
// (öğrenci kalıcı şifresini belirledikten sonra çağrılır)
export async function clearTempPassword(userId: string, phoneNumber: string): Promise<void> {
    const phone = normalizePhone(phoneNumber)
    try {
        if (phone) {
            await deleteDoc(doc(db, RESET_COLLECTION, phone))
        }
    } catch (e) {
        // Doküman zaten yoksa sorun değil
        console.warn('Geçici şifre kaydı silinemedi (zaten silinmiş olabilir):', e)
    }

    await updateDoc(doc(db, 'users', userId), {
        mustResetPassword: false,
        updatedAt: serverTimestamp(),
    })
}
