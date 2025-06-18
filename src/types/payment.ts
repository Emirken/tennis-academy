export interface Payment {
    id: string
    studentId: string
    amount: number
    type: 'membership' | 'lesson' | 'court-rental'
    status: 'completed' | 'pending' | 'failed'
    dueDate: Date
    paidDate?: Date
    description: string
}