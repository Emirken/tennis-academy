export type PlayerLevel = 'temel' | 'orta' | 'ileri'

// Kullanıcı rolleri. 'boss' (patron) admin sayfalarına erişebilen, ayrıca
// kendi monitoring panelini gören üst düzey roldür.
export type UserRole = 'admin' | 'student' | 'boss'

export interface User {
    id: string
    phone_number: string
    firstName: string
    lastName: string
    role: UserRole
    // 'deleted': öğrenci silindiğinde soft-delete ile yazılır (alanlar anonimleştirilir).
    // Login akışı bu durumda girişi engeller (bkz. auth.ts fetchUserData guard'ı).
    status?: 'pending' | 'approved' | 'deleted'
    // Soft-delete bayrağı: doküman silinmiş sayılır ama kayıt fiziksel olarak durur.
    deleted?: boolean
    deletedAt?: Date
    phone?: string
    email?: string
    birthDate?: string
    level?: PlayerLevel
    address?: string
    emergencyContact?: string
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
    membershipType?: string
    // Admin geçici şifre atadığında true; öğrenci kalıcı şifre belirleyince false
    mustResetPassword?: boolean
}