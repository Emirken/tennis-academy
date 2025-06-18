export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'admin' | 'student'
    phone?: string
    address?: string
    emergencyContact?: string
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
}