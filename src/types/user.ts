export type PlayerLevel = 'temel' | 'orta' | 'ileri'

export interface User {
    id: string
    phone_number: string
    firstName: string
    lastName: string
    role: 'admin' | 'student'
    status?: 'pending' | 'approved'
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
}