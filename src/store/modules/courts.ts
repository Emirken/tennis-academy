import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Court, CourtReservation, TimeSlot } from '@/types/court'

interface CourtsState {
    courts: Court[]
    reservations: CourtReservation[]
    loading: boolean
    error: string | null
}

export const useCourtsStore = defineStore('courts', () => {
    // State
    const courts = ref<Court[]>([])
    const reservations = ref<CourtReservation[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const availableCourts = computed(() =>
        courts.value.filter(court => court.status === 'available')
    )

    const indoorCourts = computed(() =>
        courts.value.filter(court => court.type === 'indoor')
    )

    const outdoorCourts = computed(() =>
        courts.value.filter(court => court.type === 'outdoor')
    )

    const activeCourts = computed(() =>
        courts.value.filter(court => court.status !== 'maintenance')
    )

    const courtUtilizationRate = computed(() => {
        if (courts.value.length === 0) return 0
        const totalUtilization = courts.value.reduce((sum, court:any) => sum + (court.utilizationRate || 0), 0)
        return Math.round(totalUtilization / courts.value.length)
    })

    const todayReservations = computed(() => {
        const today = new Date().toISOString().split('T')[0]
        return reservations.value.filter((reservation:any) =>
            reservation.date.toISOString().split('T')[0] === today
        )
    })

    const upcomingReservations = computed(() => {
        const now = new Date()
        return reservations.value.filter((reservation:any) =>
            new Date(reservation.date) > now
        ).sort((a:any, b:any) => a.date.getTime() - b.date.getTime())
    })

    // Actions
    const fetchCourts = async () => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock data
            courts.value = [
                {
                    id: '1',
                    name: 'Court 1',
                    type: 'indoor',
                    status: 'available',
                    capacity: 4,
                    hourlyRate: 25,
                    peakHourRate: 35,
                    features: ['Climate Control', 'Professional Net', 'Sound System', 'LED Lighting'],
                    description: 'Premium indoor court with climate control and professional equipment',
                    images: ['/images/indoor-court-1.jpg'],
                    utilizationRate: 85,
                    maintenanceSchedule: null,
                    equipment: ['Professional Tennis Net', 'Ball Machine Available', 'Scoreboard'],
                    rules: [
                        'No outside food or drinks',
                        'Proper tennis attire required',
                        'Maximum 4 players at a time'
                    ],
                    location: 'Building A, Level 1',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    name: 'Court 2',
                    type: 'outdoor',
                    status: 'available',
                    capacity: 4,
                    hourlyRate: 20,
                    peakHourRate: 25,
                    features: ['Natural Lighting', 'Wind Shield', 'Covered Seating'],
                    description: 'Outdoor court with natural lighting and wind protection',
                    images: ['/images/outdoor-court-1.jpg'],
                    utilizationRate: 72,
                    maintenanceSchedule: null,
                    equipment: ['Professional Tennis Net', 'Covered Seating for 8'],
                    rules: [
                        'Weather dependent availability',
                        'Proper tennis attire required',
                        'Maximum 4 players at a time'
                    ],
                    location: 'Outdoor Area East',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    name: 'Court 3',
                    type: 'indoor',
                    status: 'maintenance',
                    capacity: 4,
                    hourlyRate: 25,
                    peakHourRate: 35,
                    features: ['Climate Control', 'Video Recording', 'Advanced Lighting'],
                    description: 'High-tech indoor court with video recording capabilities',
                    images: ['/images/indoor-court-2.jpg'],
                    utilizationRate: 0,
                    maintenanceSchedule: {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                        description: 'Net replacement and court resurfacing'
                    },
                    equipment: ['Professional Tennis Net', 'Video Recording System', 'Ball Machine'],
                    rules: [
                        'No outside food or drinks',
                        'Recording equipment available upon request',
                        'Maximum 4 players at a time'
                    ],
                    location: 'Building A, Level 2',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date()
                },
                {
                    id: '4',
                    name: 'Court 4',
                    type: 'outdoor',
                    status: 'occupied',
                    capacity: 4,
                    hourlyRate: 20,
                    peakHourRate: 25,
                    features: ['Evening Lights', 'Spectator Area', 'Water Station'],
                    description: 'Outdoor court with evening lighting for extended play hours',
                    images: ['/images/outdoor-court-2.jpg'],
                    utilizationRate: 68,
                    maintenanceSchedule: null,
                    equipment: ['Professional Tennis Net', 'LED Floodlights', 'Water Station'],
                    rules: [
                        'Available until 22:00 with lighting',
                        'Weather dependent during day hours',
                        'Maximum 4 players at a time'
                    ],
                    location: 'Outdoor Area West',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date()
                }
            ]
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch courts'
        } finally {
            loading.value = false
        }
    }

    const fetchReservations = async () => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            // Mock reservations data
            reservations.value = [
                {
                    id: '1',
                    courtId: '1',
                    userId: 'user1',
                    userName: 'Ahmet Yılmaz',
                    date: new Date(),
                    startTime: '09:00',
                    endTime: '10:00',
                    duration: 60,
                    status: 'confirmed',
                    purpose: 'private_lesson',
                    numberOfPlayers: 2,
                    totalAmount: 25,
                    notes: 'Private lesson with Coach Smith',
                    equipment: ['tennis_racket'],
                    paymentStatus: 'paid',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 123 4567',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    courtId: '4',
                    userId: 'user2',
                    userName: 'Ayşe Demir',
                    date: new Date(Date.now() + 3 * 60 * 60 * 1000),
                    startTime: '14:00',
                    endTime: '15:30',
                    duration: 90,
                    status: 'confirmed',
                    purpose: 'practice',
                    numberOfPlayers: 2,
                    totalAmount: 30,
                    notes: 'Practice session with friend',
                    equipment: [],
                    paymentStatus: 'paid',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 234 5678',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    courtId: '2',
                    userId: 'user3',
                    userName: 'Mehmet Kaya',
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    startTime: '10:00',
                    endTime: '11:00',
                    duration: 60,
                    status: 'pending',
                    purpose: 'training',
                    numberOfPlayers: 1,
                    totalAmount: 20,
                    notes: 'Solo training session',
                    equipment: ['ball_machine'],
                    paymentStatus: 'pending',
                    cancellationPolicy: '24h notice required',
                    contactPhone: '+90 555 345 6789',
                    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            ]
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch reservations'
        } finally {
            loading.value = false
        }
    }

    const getCourtById = (id: string): Court | undefined => {
        return courts.value.find(court => court.id === id)
    }

    const getAvailableTimeSlots = (courtId: string, date: Date): TimeSlot[] => {
        const court = getCourtById(courtId)
        if (!court || court.status !== 'available') return []

        const slots: TimeSlot[] = []
        const dayReservations = reservations.value.filter(r =>
            r.courtId === courtId &&
            r.date.toDateString() === date.toDateString() &&
            r.status !== 'cancelled'
        )

        // Generate time slots from 8 AM to 10 PM
        for (let hour = 8; hour <= 22; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`
            const slotStart = new Date(date)
            slotStart.setHours(hour, 0, 0, 0)

            const slotEnd = new Date(slotStart)
            slotEnd.setHours(hour + 1, 0, 0, 0)

            // Check if this slot conflicts with any reservation
            const isBooked = dayReservations.some((reservation:any) => {
                const reservationStart = new Date(reservation.date)
                const [startHour, startMinute] = reservation.startTime.split(':').map(Number)
                reservationStart.setHours(startHour, startMinute, 0, 0)

                const reservationEnd = new Date(reservation.date)
                const [endHour, endMinute] = reservation.endTime.split(':').map(Number)
                reservationEnd.setHours(endHour, endMinute, 0, 0)

                return (slotStart >= reservationStart && slotStart < reservationEnd) ||
                    (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
                    (slotStart <= reservationStart && slotEnd >= reservationEnd)
            })

            // Determine if it's peak hour (5-8 PM)
            const isPeakHour = hour >= 17 && hour <= 20
            const price = isPeakHour ? court.peakHourRate : court.hourlyRate

            slots.push({
                time: timeString,
                available: !isBooked,
                price,
                isPeakHour
            })
        }

        return slots
    }

    const createReservation = async (reservationData: Omit<CourtReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourtReservation> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const newReservation: CourtReservation = {
                ...reservationData,
                id: `res_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            reservations.value.push(newReservation)
            return newReservation
        } catch (err: any) {
            error.value = err.message || 'Failed to create reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateReservation = async (id: string, updates: Partial<CourtReservation>): Promise<CourtReservation> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = reservations.value.findIndex((r:any) => r.id === id)
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

    const cancelReservation = async (id: string, reason?: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = reservations.value.findIndex((r:any) => r.id === id)
            if (index === -1) {
                throw new Error('Reservation not found')
            }

            reservations.value[index] = {
                ...reservations.value[index],
                status: 'cancelled',
                notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
                updatedAt: new Date()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to cancel reservation'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateCourtStatus = async (courtId: string, status: Court['status']): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = courts.value.findIndex(c => c.id === courtId)
            if (index === -1) {
                throw new Error('Court not found')
            }

            courts.value[index] = {
                ...courts.value[index],
                status,
                updatedAt: new Date()
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to update court status'
            throw err
        } finally {
            loading.value = false
        }
    }

    const addCourt = async (courtData: Omit<Court, 'id' | 'createdAt' | 'updatedAt'>): Promise<Court> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const newCourt: Court = {
                ...courtData,
                id: `court_${Date.now()}`,
                utilizationRate: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            courts.value.push(newCourt)
            return newCourt
        } catch (err: any) {
            error.value = err.message || 'Failed to add court'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateCourt = async (id: string, updates: Partial<Court>): Promise<Court> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = courts.value.findIndex(c => c.id === id)
            if (index === -1) {
                throw new Error('Court not found')
            }

            const updatedCourt = {
                ...courts.value[index],
                ...updates,
                updatedAt: new Date()
            }

            courts.value[index] = updatedCourt
            return updatedCourt
        } catch (err: any) {
            error.value = err.message || 'Failed to update court'
            throw err
        } finally {
            loading.value = false
        }
    }

    const deleteCourt = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = courts.value.findIndex(c => c.id === id)
            if (index === -1) {
                throw new Error('Court not found')
            }

            // Check if court has active reservations
            const activeReservations = reservations.value.filter((r:any) =>
                r.courtId === id &&
                r.status !== 'cancelled' &&
                new Date(r.date) >= new Date()
            )

            if (activeReservations.length > 0) {
                throw new Error('Cannot delete court with active reservations')
            }

            courts.value.splice(index, 1)
        } catch (err: any) {
            error.value = err.message || 'Failed to delete court'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getCourtStatistics = () => {
        const total = courts.value.length
        const available = availableCourts.value.length
        const occupied = courts.value.filter(c => c.status === 'occupied').length
        const maintenance = courts.value.filter(c => c.status === 'maintenance').length

        const totalReservationsToday = todayReservations.value.length
        const confirmedReservationsToday = todayReservations.value.filter((r:any) => r.status === 'confirmed').length

        return {
            totalCourts: total,
            availableCourts: available,
            occupiedCourts: occupied,
            maintenanceCourts: maintenance,
            utilizationRate: courtUtilizationRate.value,
            todayReservations: totalReservationsToday,
            confirmedTodayReservations: confirmedReservationsToday,
            upcomingReservationsCount: upcomingReservations.value.length
        }
    }

    const searchCourts = (query: string, filters?: {
        type?: 'indoor' | 'outdoor'
        status?: Court['status']
        minRate?: number
        maxRate?: number
        features?: string[]
    }) => {
        let filtered = courts.value

        // Text search
        if (query) {
            filtered = filtered.filter(court =>
                court.name.toLowerCase().includes(query.toLowerCase()) ||
                court.description.toLowerCase().includes(query.toLowerCase()) ||
                court.features.some((feature:any) => feature.toLowerCase().includes(query.toLowerCase()))
            )
        }

        // Apply filters
        if (filters) {
            if (filters.type) {
                filtered = filtered.filter(court => court.type === filters.type)
            }

            if (filters.status) {
                filtered = filtered.filter(court => court.status === filters.status)
            }

            if (filters.minRate !== undefined) {
                filtered = filtered.filter(court => court.hourlyRate >= filters.minRate!)
            }

            if (filters.maxRate !== undefined) {
                filtered = filtered.filter(court => court.hourlyRate <= filters.maxRate!)
            }

            if (filters.features && filters.features.length > 0) {
                filtered = filtered.filter(court =>
                    filters.features!.some(feature => court.features.includes(feature))
                )
            }
        }

        return filtered
    }

    const clearError = () => {
        error.value = null
    }

    const reset = () => {
        courts.value = []
        reservations.value = []
        loading.value = false
        error.value = null
    }

    return {
        // State
        courts,
        reservations,
        loading,
        error,

        // Getters
        availableCourts,
        indoorCourts,
        outdoorCourts,
        activeCourts,
        courtUtilizationRate,
        todayReservations,
        upcomingReservations,

        // Actions
        fetchCourts,
        fetchReservations,
        getCourtById,
        getAvailableTimeSlots,
        createReservation,
        updateReservation,
        cancelReservation,
        updateCourtStatus,
        addCourt,
        updateCourt,
        deleteCourt,
        getCourtStatistics,
        searchCourts,
        clearError,
        reset
    }
})