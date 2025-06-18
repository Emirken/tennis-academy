// types/reservation.ts dosyasını bu şekilde güncelle

export interface Reservation {
    id: string
    courtId: string
    courtName: string // Bu satırı ekle
    studentId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    type: 'court-rental' | 'private-lesson' | 'group-clinic'
    status: 'confirmed' | 'pending' | 'cancelled'
    totalCost: number
    createdAt: Date
}