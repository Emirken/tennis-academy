export type PlayerLevel = 'temel' | 'orta' | 'ileri'

// Üye kayıt formu (UTA dijital form) seçenek değerleri. tenis-project-new ile BİREBİR
// aynı tutulur (Firestore → Postgres taşıması değerleri düz kopyalar).
export type TrainingType = 'private_lesson' | 'adult_group' | 'tennis_school' | 'court_rental' | 'other'
export type ReferralSource = 'instagram' | 'facebook' | 'google' | 'website' | 'friend' | 'existing_student' | 'other'
export type ParentRelation = 'mother' | 'father' | 'other'

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
    // Veli bilgileri: çocuk/yaş grubu üyelik türlerinde (tennis_school_age, premium,
    // vip, court_rental_equipment) ya da öğrenci 18 yaş altıysa (isMinor) doldurulur.
    parentFirstName?: string
    parentLastName?: string
    parentPhone?: string
    parentEmail?: string
    parentRelation?: ParentRelation | ''
    // Üye kayıt formu (kayıtta öğrenci doldurur; admin detayda görür/düzenler).
    heightCm?: number | null
    weightKg?: number | null
    occupation?: string
    isMinor?: boolean | null
    trainingTypes?: TrainingType[]
    trainingTypeOther?: string
    hasHealthCondition?: boolean | null
    healthConditionNote?: string
    specialCareNote?: string
    coachNote?: string
    referralSource?: ReferralSource | ''
    referralDetail?: string
    // Zorunlu onayların kanıtı (kayıt anı) ve isteğe bağlı pazarlama izni.
    waiverAcceptedAt?: Date
    dataConsentAcceptedAt?: Date
    marketingConsent?: boolean
    marketingConsentAt?: Date | null
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
    membershipType?: string
    // Admin geçici şifre atadığında true; öğrenci kalıcı şifre belirleyince false
    mustResetPassword?: boolean
}