import { User } from "@/types/user";

export interface Student extends User {
    phone: string
    address: string
    emergencyContact: string
    membershipType: string
    paymentStatus: 'paid' | 'pending' | 'overdue'
    lastPayment: Date
    nextPaymentDue: Date
    totalDebt: number
}