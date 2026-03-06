export interface User {
    id: string
    phone_number: string
    firstName: string
    lastName: string
    role: 'admin' | 'student'
    status?: 'pending' | 'approved'
    phone?: string
    address?: string
    emergencyContact?: string
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
    membershipType?: string
}