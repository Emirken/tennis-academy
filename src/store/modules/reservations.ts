import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Enhanced Reservation interfaces
export interface Reservation {
    id: string
    courtId: string
    courtName: string
    studentId: string
    studentName: string
    date: Date
    startTime: string
    endTime: string
    duration: number // in minutes
    type: 'court_rental' | 'private_lesson' | 'group_lesson' | 'group_clinic' | 'training' | 'tournament' | 'practice'
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'
    totalCost: number
    createdAt: Date
    updatedAt: Date
    // Additional fields for enhanced functionality
    purpose: string
    numberOfPlayers: number
    instructorId?: string
    instructorName?: string
    equipment: string[]
    notes?: string
    paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded' | 'partial'
    paymentMethod?: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'membership_credit'
    cancellationReason?: string
    cancellationDate?: Date
    cancellationPolicy: string
    contactPhone: string
    emergencyContact?: string
    specialRequests?: string[]
    weatherDependent: boolean
    recurringReservationId?: string
    checkedInAt?: Date
    checkedOutAt?: Date
    actualDuration?: number
    rating?: number
    feedback?: string
    charges: ReservationCharge[]
    discounts: ReservationDiscount[]
    reminders: ReservationReminder[]
}

export interface ReservationCharge {
    id: string
    type: 'court_rental' | 'equipment' | 'instructor' | 'late_fee' | 'overtime' | 'cleaning'
    description: string
    amount: number
    quantity: number
    unitPrice: number
}

export interface ReservationDiscount {
    id: string
    type: 'membership' | 'loyalty' | 'promotional' | 'early_bird' | 'bulk'
    description: string
    amount: number
    percentage?: number
}

export interface ReservationReminder {
    id: string
    type: 'email' | 'sms' | 'push' | 'call'
    scheduledTime: Date
    sent: boolean
    sentAt?: Date
    message: string
}

export interface RecurringReservation {
    id: string
    studentId: string
    courtId: string
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    dayOfWeek?: number // 0-6 for weekly patterns
    dayOfMonth?: number // 1-31 for monthly patterns
    startTime: string
    endTime: string
    duration: number
    startDate: Date
    endDate?: Date
    totalOccurrences?: number
    currentOccurrence: number
    status: 'active' | 'paused' | 'cancelled' | 'completed'
    reservationTemplate: Omit<Reservation, 'id' | 'date' | 'createdAt' | 'updatedAt'>
    generatedReservations: string[] // IDs of created reservations
    nextGenerationDate: Date
    skipDates: Date[]
    createdAt: Date
    updatedAt: Date
}

export interface ReservationConflict {
    type: 'time_overlap' | 'court_unavailable' | 'maintenance' | 'instructor_unavailable' | 'capacity_exceeded'
    message: string
    conflictingReservations: string[]
    suggestedAlternatives: AlternativeSlot[]
}

export interface AlternativeSlot {
    courtId: string
    courtName: string
    startTime: string
    endTime: string
    price: number
    available: boolean
}

export interface ReservationCalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    courtId: string
    studentName: string
    status: Reservation['status']
    type: Reservation['type']
    color: string
    extendedProps: {
        reservationId: string
        studentId: string
        instructorName?: string
        equipment: string[]
        notes?: string
        contactPhone: string
    }
}

export interface ReservationStats {
    totalReservations: number
    confirmedReservations: number
    pendingReservations: number
    cancelledReservations: number
    completedReservations: number
    noShowReservations: number
    totalRevenue: number
    averageReservationValue: number
    occupancyRate: number
    cancellationRate: number
    noShowRate: number
    averageDuration: number
    peakHours: Array<{ hour: number; count: number }>
    popularCourts: Array<{ courtId: string; courtName: string; count: number }>
    reservationsByType: Record<string, number>
    monthlyTrends: Array<{
        month: string
        reservations: number
        revenue: number
        occupancy: number
    }>
}

export const useReservationsStore = defineStore('reservations', () => {
    // State
    const reservations = ref<Reservation[]>([])
    const recurringReservations = ref<RecurringReservation[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const calendarView = ref<'month' | 'week' | 'day'>('week')
    const selectedDate = ref(new Date())

    // Getters
    const confirmedReservations = computed(() =>
        reservations.value.filter(r => r.status === 'confirmed')
    )

    const pendingReservations = computed(() =>
        reservations.value.filter(r => r.status === 'pending')
    )

    const cancelledReservations = computed(() =>
        reservations.value.filter(r => r.status === 'cancelled')
    )

    const completedReservations = computed(() =>
        reservations.value.filter(r => r.status === 'completed')
    )

    const todayReservations = computed(() => {
        const today = new Date().toISOString().split('T')[0]
        return reservations.value.filter(r =>
            r.date.toISOString().split('T')[0] === today
        ).sort((a, b) => a.startTime.localeCompare(b.startTime))
    })

    const upcomingReservations = computed(() => {
        const now = new Date()
        return reservations.value.filter(r => {
            const reservationDateTime = new Date(r.date)
            const [hours, minutes] = r.startTime.split(':').map(Number)
            reservationDateTime.setHours(hours, minutes)
            return reservationDateTime > now && r.status !== 'cancelled'
        }).sort((a, b) => {
            const aDate = new Date(a.date)
            const bDate = new Date(b.date)
            const [aHours, aMinutes] = a.startTime.split(':').map(Number)
            const [bHours, bMinutes] = b.startTime.split(':').map(Number)
            aDate.setHours(aHours, aMinutes, 0, 0)
            bDate.setHours(bHours, bMinutes, 0, 0)
            return aDate.getTime() - bDate.getTime()
        })
    })

    const overdueReservations = computed(() => {
        const now = new Date()
        return reservations.value.filter(r => {
            if (r.status !== 'confirmed') return false
            const reservationDateTime = new Date(r.date)
            const [hours, minutes] = r.endTime.split(':').map(Number)
            reservationDateTime.setHours(hours, minutes)
            return reservationDateTime < now
        })
    })

    const unpaidReservations = computed(() =>
        reservations.value.filter(r =>
            r.paymentStatus === 'pending' || r.paymentStatus === 'failed'
        )
    )

    const activeRecurringReservations = computed(() =>
        recurringReservations.value.filter(r => r.status === 'active')
    )

    const calendarEvents = computed((): ReservationCalendarEvent[] => {
        return reservations.value.map(reservation => ({
            id: reservation.id,
            title: `${reservation.studentName} - ${reservation.type}`,
            start: (() => {
                const date = new Date(reservation.date)
                const [hours, minutes] = reservation.startTime.split(':').map(Number)
                date.setHours(hours, minutes, 0, 0)
                return date
            })(),
            end: (() => {
                const date = new Date(reservation.date)
                const [hours, minutes] = reservation.endTime.split(':').map(Number)
                date.setHours(hours, minutes, 0, 0)
                return date
            })(),
            courtId: reservation.courtId,
            studentName: reservation.studentName,
            status: reservation.status,
            type: reservation.type,
            color: getReservationColor(reservation.status, reservation.type),
            extendedProps: {
                reservationId: reservation.id,
                studentId: reservation.studentId,
                instructorName: reservation.instructorName,
                equipment: reservation.equipment,
                notes: reservation.notes,
                contactPhone: reservation.contactPhone
            }
        }))
    })

    // Helper function for calendar colors
    const getReservationColor = (status: Reservation['status'], type: Reservation['type']): string => {
        if (status === 'cancelled') return '#f44336'
        if (status === 'pending') return '#ff9800'
        if (status === 'completed') return '#9e9e9e'
        if (status === 'no_show') return '#e91e63'

        // Color by type for confirmed reservations
        const typeColors: Record<string, string> = {
            'court_rental': '#2196f3',
            'private_lesson': '#4caf50',
            'group_lesson': '#ff5722',
            'group_clinic': '#9c27b0',
            'training': '#607d8b',
            'tournament': '#e91e63',
            'practice': '#795548'
        }

        return typeColors[type] || '#2196f3'
    }

    // Actions
    const fetchReservations = async (filters?: {
        studentId?: string
        courtId?: string
        dateFrom?: Date
        dateTo?: Date
        status?: Reservation['status']
        type?: Reservation['type']
        instructorId?: string
    }) => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock reservations data
            const mockReservations: Reservation[] = [
                {
                    id: 'res_001',
                    courtId: 'court_001',
                    courtName: 'Court 1',
                    studentId: 'student_001',
                    studentName: 'Ahmet Yılmaz',
                    date: new Date(),
                    startTime: '09:00',
                    endTime: '10:00',
                    duration: 60,
                    type: 'private_lesson',
                    status: 'confirmed',
                    totalCost: 75.00,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    purpose: 'Improve backhand technique',
                    numberOfPlayers: 1,
                    instructorId: 'instructor_001',
                    instructorName: 'Coach Smith',
                    equipment: ['tennis_racket'],
                    notes: 'Focus on backhand improvement',
                    paymentStatus: 'paid',
                    paymentMethod: 'credit_card',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 123 4567',
                    weatherDependent: false,
                    charges: [
                        {
                            id: 'charge_001',
                            type: 'instructor',
                            description: 'Private lesson fee',
                            amount: 60.00,
                            quantity: 1,
                            unitPrice: 60.00
                        },
                        {
                            id: 'charge_002',
                            type: 'court_rental',
                            description: 'Court rental',
                            amount: 15.00,
                            quantity: 1,
                            unitPrice: 15.00
                        }
                    ],
                    discounts: [],
                    reminders: [
                        {
                            id: 'reminder_001',
                            type: 'email',
                            scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            sent: true,
                            sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            message: 'Reminder: Your tennis lesson is tomorrow at 9:00 AM'
                        }
                    ]
                },
                {
                    id: 'res_002',
                    courtId: 'court_002',
                    courtName: 'Court 2',
                    studentId: 'student_002',
                    studentName: 'Ayşe Demir',
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    startTime: '14:00',
                    endTime: '15:30',
                    duration: 90,
                    type: 'court_rental',
                    status: 'confirmed',
                    totalCost: 45.00,
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    purpose: 'Practice with friend',
                    numberOfPlayers: 2,
                    equipment: [],
                    paymentStatus: 'paid',
                    paymentMethod: 'debit_card',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 234 5678',
                    weatherDependent: true,
                    charges: [
                        {
                            id: 'charge_003',
                            type: 'court_rental',
                            description: 'Court rental (90 minutes)',
                            amount: 45.00,
                            quantity: 1,
                            unitPrice: 45.00
                        }
                    ],
                    discounts: [],
                    reminders: []
                },
                {
                    id: 'res_003',
                    courtId: 'court_001',
                    courtName: 'Court 1',
                    studentId: 'student_003',
                    studentName: 'Mehmet Kaya',
                    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    startTime: '16:00',
                    endTime: '17:00',
                    duration: 60,
                    type: 'group_lesson',
                    status: 'pending',
                    totalCost: 30.00,
                    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    purpose: 'Group training session',
                    numberOfPlayers: 4,
                    instructorId: 'instructor_002',
                    instructorName: 'Coach Johnson',
                    equipment: [],
                    paymentStatus: 'pending',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 345 6789',
                    weatherDependent: false,
                    charges: [
                        {
                            id: 'charge_004',
                            type: 'instructor',
                            description: 'Group lesson fee (per person)',
                            amount: 30.00,
                            quantity: 1,
                            unitPrice: 30.00
                        }
                    ],
                    discounts: [
                        {
                            id: 'discount_001',
                            type: 'membership',
                            description: 'Premium member discount',
                            amount: 5.00,
                            percentage: 15
                        }
                    ],
                    reminders: []
                },
                {
                    id: 'res_004',
                    courtId: 'court_003',
                    courtName: 'Court 3',
                    studentId: 'student_004',
                    studentName: 'Fatma Özkan',
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    startTime: '10:00',
                    endTime: '11:00',
                    duration: 60,
                    type: 'private_lesson',
                    status: 'completed',
                    totalCost: 65.00,
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    purpose: 'Serve improvement',
                    numberOfPlayers: 1,
                    instructorId: 'instructor_001',
                    instructorName: 'Coach Smith',
                    equipment: ['ball_machine'],
                    paymentStatus: 'paid',
                    paymentMethod: 'cash',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 456 7890',
                    weatherDependent: false,
                    checkedInAt: new Date(Date.now() - 24 * 60 * 60 * 1000 - 5 * 60 * 1000),
                    checkedOutAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                    actualDuration: 65,
                    rating: 5,
                    feedback: 'Excellent lesson, made great progress on serve technique',
                    charges: [
                        {
                            id: 'charge_005',
                            type: 'instructor',
                            description: 'Private lesson fee',
                            amount: 50.00,
                            quantity: 1,
                            unitPrice: 50.00
                        },
                        {
                            id: 'charge_006',
                            type: 'equipment',
                            description: 'Ball machine rental',
                            amount: 15.00,
                            quantity: 1,
                            unitPrice: 15.00
                        }
                    ],
                    discounts: [],
                    reminders: []
                },
                {
                    id: 'res_005',
                    courtId: 'court_002',
                    courtName: 'Court 2',
                    studentId: 'student_005',
                    studentName: 'Can Aslan',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    startTime: '18:00',
                    endTime: '19:00',
                    duration: 60,
                    type: 'court_rental',
                    status: 'no_show',
                    totalCost: 25.00,
                    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    purpose: 'Solo practice',
                    numberOfPlayers: 1,
                    equipment: [],
                    paymentStatus: 'paid',
                    paymentMethod: 'membership_credit',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 567 8901',
                    weatherDependent: true,
                    charges: [
                        {
                            id: 'charge_007',
                            type: 'court_rental',
                            description: 'Evening court rental',
                            amount: 25.00,
                            quantity: 1,
                            unitPrice: 25.00
                        }
                    ],
                    discounts: [],
                    reminders: [
                        {
                            id: 'reminder_002',
                            type: 'sms',
                            scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
                            sent: true,
                            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
                            message: 'Reminder: Your court booking is in 2 hours'
                        }
                    ]
                }
            ]

            // Apply filters if provided
            let filteredReservations = mockReservations

            if (filters) {
                if (filters.studentId) {
                    filteredReservations = filteredReservations.filter(r => r.studentId === filters.studentId)
                }
                if (filters.courtId) {
                    filteredReservations = filteredReservations.filter(r => r.courtId === filters.courtId)
                }
                if (filters.status) {
                    filteredReservations = filteredReservations.filter(r => r.status === filters.status)
                }
                if (filters.type) {
                    filteredReservations = filteredReservations.filter(r => r.type === filters.type)
                }
                if (filters.instructorId) {
                    filteredReservations = filteredReservations.filter(r => r.instructorId === filters.instructorId)
                }
                if (filters.dateFrom) {
                    filteredReservations = filteredReservations.filter(r => r.date >= filters.dateFrom!)
                }
                if (filters.dateTo) {
                    filteredReservations = filteredReservations.filter(r => r.date <= filters.dateTo!)
                }
            }

            reservations.value = filteredReservations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        } catch (err: any) {
            error.value = err.message || 'Failed to fetch reservations'
        } finally {
            loading.value = false
        }
    }

    const fetchRecurringReservations = async () => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            recurringReservations.value = [
                {
                    id: 'recurring_001',
                    studentId: 'student_001',
                    courtId: 'court_001',
                    pattern: 'weekly',
                    dayOfWeek: 1, // Monday
                    startTime: '09:00',
                    endTime: '10:00',
                    duration: 60,
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-12-31'),
                    totalOccurrences: 52,
                    currentOccurrence: 22,
                    status: 'active',
                    reservationTemplate: {
                        courtId: 'court_001',
                        courtName: 'Court 1',
                        studentId: 'student_001',
                        studentName: 'Ahmet Yılmaz',
                        startTime: '09:00',
                        endTime: '10:00',
                        duration: 60,
                        type: 'private_lesson',
                        status: 'confirmed',
                        totalCost: 75.00,
                        purpose: 'Weekly private lesson',
                        numberOfPlayers: 1,
                        instructorId: 'instructor_001',
                        instructorName: 'Coach Smith',
                        equipment: [],
                        paymentStatus: 'paid',
                        cancellationPolicy: '24h notice required',
                        contactPhone: '+90 555 123 4567',
                        weatherDependent: false,
                        charges: [],
                        discounts: [],
                        reminders: []
                    },
                    generatedReservations: ['res_001', 'res_022', 'res_023'],
                    nextGenerationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    skipDates: [],
                    createdAt: new Date('2025-01-01'),
                    updatedAt: new Date()
                }
            ]
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch recurring reservations'
        } finally {
            loading.value = false
        }
    }

    const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> => {
        loading.value = true
        error.value = null

        try {
            // Validate reservation
            const conflicts = await checkReservationConflicts(reservationData)
            if (conflicts.length > 0) {
                throw new Error(`Reservation conflicts detected: ${conflicts.map(c => c.message).join(', ')}`)
            }

            await new Promise(resolve => setTimeout(resolve, 1000))

            const newReservation: Reservation = {
                ...reservationData,
                id: `res_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            reservations.value.unshift(newReservation)
            return newReservation
        } catch (err: any) {
            error.value = err.message || 'Failed to create reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateReservation = async (id: string, updates: Partial<Reservation>): Promise<Reservation> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = reservations.value.findIndex(r => r.id === id)
            if (index === -1) {
                throw new Error('Reservation not found')
            }

            const updatedReservation = {
                ...reservations.value[index],
                ...updates,
                updatedAt: new Date()
            }

            reservations.value[index] = updatedReservation
            return updatedReservation
        } catch (err: any) {
            error.value = err.message || 'Failed to update reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const cancelReservation = async (id: string, reason: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = reservations.value.findIndex(r => r.id === id)
            if (index === -1) {
                throw new Error('Reservation not found')
            }

            reservations.value[index] = {
                ...reservations.value[index],
                status: 'cancelled',
                cancellationReason: reason,
                cancellationDate: new Date(),
                updatedAt: new Date()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to cancel reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const checkInReservation = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const index = reservations.value.findIndex(r => r.id === id)
            if (index === -1) {
                throw new Error('Reservation not found')
            }

            reservations.value[index] = {
                ...reservations.value[index],
                checkedInAt: new Date(),
                updatedAt: new Date()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to check in reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const checkOutReservation = async (id: string, rating?: number, feedback?: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const index = reservations.value.findIndex(r => r.id === id)
            if (index === -1) {
                throw new Error('Reservation not found')
            }

            const reservation = reservations.value[index]
            const checkedOutAt = new Date()
            const checkedInAt = reservation.checkedInAt || new Date(reservation.date)
            const actualDuration = Math.round((checkedOutAt.getTime() - checkedInAt.getTime()) / (1000 * 60))

            reservations.value[index] = {
                ...reservation,
                status: 'completed',
                checkedOutAt,
                actualDuration,
                rating,
                feedback,
                updatedAt: new Date()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to check out reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const checkReservationConflicts = async (reservationData: Partial<Reservation>): Promise<ReservationConflict[]> => {
        const conflicts: ReservationConflict[] = []

        // Check for time overlaps
        const existingReservations = reservations.value.filter(r =>
            r.courtId === reservationData.courtId &&
            r.date?.toDateString() === reservationData.date?.toDateString() &&
            r.status !== 'cancelled' &&
            r.id !== reservationData.id
        )

        for (const existing of existingReservations) {
            const existingStart = existing.startTime
            const existingEnd = existing.endTime
            const newStart = reservationData.startTime
            const newEnd = reservationData.endTime

            if (newStart && newEnd && (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            )) {
                conflicts.push({
                    type: 'time_overlap',
                    message: `Time conflict with existing reservation from ${existingStart} to ${existingEnd}`,
                    conflictingReservations: [existing.id],
                    suggestedAlternatives: []
                })
            }
        }

        return conflicts
    }

    const generateRecurringReservations = async (recurringId: string, numberOfOccurrences: number): Promise<Reservation[]> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const recurring = recurringReservations.value.find(r => r.id === recurringId)
            if (!recurring) {
                throw new Error('Recurring reservation not found')
            }

            const generatedReservations: Reservation[] = []
            let currentDate = new Date(recurring.nextGenerationDate)

            for (let i = 0; i < numberOfOccurrences; i++) {
                // Skip if date is in skip list
                if (recurring.skipDates.some(skipDate =>
                    skipDate.toDateString() === currentDate.toDateString()
                )) {
                    // Move to next occurrence date
                    currentDate = getNextOccurrenceDate(currentDate, recurring.pattern, recurring.dayOfWeek, recurring.dayOfMonth)
                    continue
                }

                const reservation: Reservation = {
                    ...recurring.reservationTemplate,
                    id: `res_${Date.now()}_${i}`,
                    date: new Date(currentDate),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }

                generatedReservations.push(reservation)
                reservations.value.push(reservation)

                // Move to next occurrence date
                currentDate = getNextOccurrenceDate(currentDate, recurring.pattern, recurring.dayOfWeek, recurring.dayOfMonth)
            }

            // Update recurring reservation
            const recurringIndex = recurringReservations.value.findIndex(r => r.id === recurringId)
            if (recurringIndex !== -1) {
                recurringReservations.value[recurringIndex] = {
                    ...recurring,
                    currentOccurrence: recurring.currentOccurrence + numberOfOccurrences,
                    generatedReservations: [
                        ...recurring.generatedReservations,
                        ...generatedReservations.map(r => r.id)
                    ],
                    nextGenerationDate: currentDate,
                    updatedAt: new Date()
                }
            }

            return generatedReservations
        } catch (err: any) {
            error.value = err.message || 'Failed to generate recurring reservations'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getNextOccurrenceDate = (currentDate: Date, pattern: RecurringReservation['pattern'], dayOfWeek?: number, dayOfMonth?: number): Date => {
        const nextDate = new Date(currentDate)

        switch (pattern) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1)
                break
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7)
                break
            case 'biweekly':
                nextDate.setDate(nextDate.getDate() + 14)
                break
            case 'monthly':
                if (dayOfMonth) {
                    nextDate.setMonth(nextDate.getMonth() + 1)
                    nextDate.setDate(dayOfMonth)
                } else {
                    nextDate.setMonth(nextDate.getMonth() + 1)
                }
                break
        }

        return nextDate
    }

    const getReservationsByStudent = (studentId: string) => {
        return reservations.value.filter(reservation => reservation.studentId === studentId)
    }

    const getReservationsByCourt = (courtId: string, date?: Date) => {
        let filtered = reservations.value.filter(reservation => reservation.courtId === courtId)

        if (date) {
            const targetDate = date.toDateString()
            filtered = filtered.filter(reservation => reservation.date.toDateString() === targetDate)
        }

        return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    const getReservationStatistics = (): ReservationStats => {
        const total = reservations.value.length
        const confirmed = confirmedReservations.value.length
        const pending = pendingReservations.value.length
        const cancelled = cancelledReservations.value.length
        const completed = completedReservations.value.length
        const noShow = reservations.value.filter(r => r.status === 'no_show').length

        const totalRevenue = confirmedReservations.value.concat(completedReservations.value)
            .reduce((sum, r) => sum + r.totalCost, 0)

        const averageReservationValue = total > 0 ? totalRevenue / total : 0
        const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0
        const noShowRate = total > 0 ? (noShow / total) * 100 : 0

        const averageDuration = reservations.value.length > 0
            ? reservations.value.reduce((sum, r) => sum + r.duration, 0) / reservations.value.length
            : 0

        // Peak hours analysis
        const hourCounts: Record<number, number> = {}
        reservations.value.forEach(r => {
            const hour = parseInt(r.startTime.split(':')[0])
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })

        const peakHours = Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)

        // Popular courts
        const courtCounts: Record<string, { name: string; count: number }> = {}
        reservations.value.forEach(r => {
            if (!courtCounts[r.courtId]) {
                courtCounts[r.courtId] = { name: r.courtName, count: 0 }
            }
            courtCounts[r.courtId].count++
        })

        const popularCourts = Object.entries(courtCounts)
            .map(([courtId, data]) => ({ courtId, courtName: data.name, count: data.count }))
            .sort((a, b) => b.count - a.count)

        // Reservations by type
        const typeOptions = ['court_rental', 'private_lesson', 'group_lesson', 'group_clinic', 'training', 'tournament', 'practice']
        const reservationsByType = typeOptions.reduce((acc, type) => {
            acc[type] = reservations.value.filter(r => r.type === type).length
            return acc
        }, {} as Record<string, number>)

        // Monthly trends (last 6 months)
        const monthlyTrends = []
        for (let i = 5; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

            const monthReservations = reservations.value.filter(r => {
                const reservationDate = new Date(r.date)
                return reservationDate.getMonth() === date.getMonth() &&
                    reservationDate.getFullYear() === date.getFullYear()
            })

            const monthRevenue = monthReservations.reduce((sum, r) => sum + r.totalCost, 0)
            const monthOccupancy = monthReservations.length > 0 ? (monthReservations.filter(r => r.status !== 'cancelled').length / monthReservations.length) * 100 : 0

            monthlyTrends.push({
                month: monthName,
                reservations: monthReservations.length,
                revenue: monthRevenue,
                occupancy: Math.round(monthOccupancy)
            })
        }

        return {
            totalReservations: total,
            confirmedReservations: confirmed,
            pendingReservations: pending,
            cancelledReservations: cancelled,
            completedReservations: completed,
            noShowReservations: noShow,
            totalRevenue,
            averageReservationValue: Math.round(averageReservationValue * 100) / 100,
            occupancyRate: total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0,
            cancellationRate: Math.round(cancellationRate * 100) / 100,
            noShowRate: Math.round(noShowRate * 100) / 100,
            averageDuration: Math.round(averageDuration),
            peakHours,
            popularCourts,
            reservationsByType,
            monthlyTrends
        }
    }

    const searchReservations = (query: string, filters?: {
        status?: Reservation['status']
        type?: Reservation['type']
        courtId?: string
        dateFrom?: Date
        dateTo?: Date
        paymentStatus?: Reservation['paymentStatus']
        instructorId?: string
    }) => {
        let filtered = reservations.value

        // Text search
        if (query) {
            filtered = filtered.filter(reservation =>
                reservation.studentName.toLowerCase().includes(query.toLowerCase()) ||
                reservation.courtName.toLowerCase().includes(query.toLowerCase()) ||
                reservation.instructorName?.toLowerCase().includes(query.toLowerCase()) ||
                reservation.purpose.toLowerCase().includes(query.toLowerCase()) ||
                reservation.notes?.toLowerCase().includes(query.toLowerCase())
            )
        }

        // Apply filters
        if (filters) {
            if (filters.status) {
                filtered = filtered.filter(reservation => reservation.status === filters.status)
            }
            if (filters.type) {
                filtered = filtered.filter(reservation => reservation.type === filters.type)
            }
            if (filters.courtId) {
                filtered = filtered.filter(reservation => reservation.courtId === filters.courtId)
            }
            if (filters.dateFrom) {
                filtered = filtered.filter(reservation => reservation.date >= filters.dateFrom!)
            }
            if (filters.dateTo) {
                filtered = filtered.filter(reservation => reservation.date <= filters.dateTo!)
            }
            if (filters.paymentStatus) {
                filtered = filtered.filter(reservation => reservation.paymentStatus === filters.paymentStatus)
            }
            if (filters.instructorId) {
                filtered = filtered.filter(reservation => reservation.instructorId === filters.instructorId)
            }
        }

        return filtered
    }

    const getAvailableSlots = (courtId: string, date: Date, duration: number = 60) => {
        const dayReservations = getReservationsByCourt(courtId, date)
            .filter(r => r.status !== 'cancelled')

        const slots = []
        const startHour = 8
        const endHour = 22

        for (let hour = startHour; hour < endHour; hour++) {
            const slotStart = `${hour.toString().padStart(2, '0')}:00`
            const slotEndHour = hour + Math.floor(duration / 60)
            const slotEndMinute = duration % 60
            const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`

            // Check if slot is available
            const isAvailable = !dayReservations.some(reservation => {
                return (slotStart >= reservation.startTime && slotStart < reservation.endTime) ||
                    (slotEnd > reservation.startTime && slotEnd <= reservation.endTime) ||
                    (slotStart <= reservation.startTime && slotEnd >= reservation.endTime)
            })

            if (isAvailable) {
                slots.push({
                    startTime: slotStart,
                    endTime: slotEnd,
                    duration,
                    available: true
                })
            }
        }

        return slots
    }

    const bulkUpdateReservations = async (reservationIds: string[], updates: Partial<Reservation>): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            reservationIds.forEach(id => {
                const index = reservations.value.findIndex(r => r.id === id)
                if (index !== -1) {
                    reservations.value[index] = {
                        ...reservations.value[index],
                        ...updates,
                        updatedAt: new Date()
                    }
                }
            })
        } catch (err: any) {
            error.value = err.message || 'Failed to bulk update reservations'
            throw err
        } finally {
            loading.value = false
        }
    }

    const setCalendarView = (view: 'month' | 'week' | 'day') => {
        calendarView.value = view
    }

    const setSelectedDate = (date: Date) => {
        selectedDate.value = date
    }

    const clearError = () => {
        error.value = null
    }

    const reset = () => {
        reservations.value = []
        recurringReservations.value = []
        loading.value = false
        error.value = null
        calendarView.value = 'week'
        selectedDate.value = new Date()
    }

    return {
        // State
        reservations,
        recurringReservations,
        loading,
        error,
        calendarView,
        selectedDate,

        // Getters
        confirmedReservations,
        pendingReservations,
        cancelledReservations,
        completedReservations,
        todayReservations,
        upcomingReservations,
        overdueReservations,
        unpaidReservations,
        activeRecurringReservations,
        calendarEvents,

        // Actions
        fetchReservations,
        fetchRecurringReservations,
        createReservation,
        updateReservation,
        cancelReservation,
        checkInReservation,
        checkOutReservation,
        checkReservationConflicts,
        generateRecurringReservations,
        getReservationsByStudent,
        getReservationsByCourt,
        getReservationStatistics,
        searchReservations,
        getAvailableSlots,
        bulkUpdateReservations,
        setCalendarView,
        setSelectedDate,
        clearError,
        reset
    }
})