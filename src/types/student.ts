import {User} from "@/types/user";

export interface Student extends User {
    phone: string
    address: string
    emergencyContact: string
    membershipType: 'basic' | 'premium' | 'vip'
    paymentStatus: 'paid' | 'pending' | 'overdue'
    lastPayment: Date
    nextPaymentDue: Date
    totalDebt: number
}