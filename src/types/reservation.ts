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
    isGroupLesson?: boolean
    // Grup VEYA özel ders ise true. Dersler "Rezervasyonlarım" listesinde
    // gösterilmez; sadece öğrencinin kendi yaptığı kort rezervasyonları görünür.
    isLesson?: boolean
    groupId?: string
}