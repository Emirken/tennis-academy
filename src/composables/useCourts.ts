import { computed, ref, reactive, watch, nextTick } from 'vue'
import { useCourtsStore } from '@/store/modules/courts'
import type {
    Court,
    CourtReservation,
    TimeSlot,
    CourtFilter,
    CourtSearchParams,
    ReservationValidation,
    CourtAvailability
} from '@/types/court'

// Interface for court form data
export interface CourtFormData {
    name: string
    type: 'indoor' | 'outdoor'
    hourlyRate: number
    peakHourRate: number
    capacity: number
    features: string[]
    description: string
    equipment: string[]
    rules: string[]
    location: string
}

// Interface for reservation form data
export interface ReservationFormData {
    courtId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    purpose: CourtReservation['purpose']
    numberOfPlayers: number
    notes?: string
    equipment: string[]
    contactPhone: string
    emergencyContact?: string
    specialRequests?: string[]
}

// Interface for bulk operations
export interface BulkOperation {
    operation: 'update_status' | 'update_rates' | 'schedule_maintenance' | 'delete'
    courtIds: string[]
    data?: any
}

// Interface for court statistics
export interface CourtAnalytics {
    utilizationTrend: Array<{ date: string; rate: number }>
    revenueTrend: Array<{ date: string; revenue: number }>
    popularTimeSlots: Array<{ time: string; bookings: number }>
    averageSessionDuration: number
    peakDays: string[]
    courtComparison: Array<{ courtId: string; name: string; utilization: number; revenue: number }>
}

export function useCourts() {
    const courtsStore = useCourtsStore()

    // Local reactive state
    const isCreatingCourt = ref(false)
    const isUpdatingCourt = ref(false)
    const isDeletingCourt = ref(false)
    const isCheckingAvailability = ref(false)
    const isBulkOperating = ref(false)

    // Form validation errors
    const validationErrors = ref<Record<string, string>>({})

    // Success/error messages
    const successMessage = ref('')
    const operationMessage = ref('')

    // Filter and search state
    const searchQuery = ref('')
    const activeFilters = reactive<CourtFilter>({})
    const sortBy = ref<'name' | 'hourlyRate' | 'utilizationRate' | 'status'>('name')
    const sortOrder = ref<'asc' | 'desc'>('asc')

    // Selected courts for bulk operations
    const selectedCourts = ref<string[]>([])

    // Calendar/availability state
    const selectedDate = ref(new Date())
    const selectedCourt = ref<string>('')
    const availabilityCache = reactive<Map<string, CourtAvailability>>(new Map())

    // Computed properties from store
    const courts = computed(() => courtsStore.courts)
    const reservations = computed(() => courtsStore.reservations)
    const loading = computed(() => courtsStore.loading)
    const error = computed(() => courtsStore.error)

    // Computed - filtered and sorted courts
    const filteredCourts = computed(() => {
        let filtered = courtsStore.searchCourts(searchQuery.value, activeFilters)

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortBy.value) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'hourlyRate':
                    aValue = a.hourlyRate
                    bValue = b.hourlyRate
                    break
                case 'utilizationRate':
                    aValue = a.utilizationRate
                    bValue = b.utilizationRate
                    break
                case 'status':
                    aValue = a.status
                    bValue = b.status
                    break
                default:
                    return 0
            }

            if (sortOrder.value === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
        })

        return filtered
    })

    // Computed - court statistics
    const courtStatistics = computed(() => courtsStore.getCourtStatistics())

    // Computed - available courts
    const availableCourts = computed(() => courtsStore.availableCourts)
    const indoorCourts = computed(() => courtsStore.indoorCourts)
    const outdoorCourts = computed(() => courtsStore.outdoorCourts)
    const activeCourts = computed(() => courtsStore.activeCourts)

    // Computed - reservations
    const todayReservations = computed(() => courtsStore.todayReservations)
    const upcomingReservations = computed(() => courtsStore.upcomingReservations)

    // Computed - court analytics
    const courtAnalytics = computed((): CourtAnalytics => {
        const now = new Date()
        const courts = courtsStore.courts
        const reservations = courtsStore.reservations

        // Utilization trend (last 7 days)
        const utilizationTrend = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            const dayReservations = reservations.filter((r: any) =>
                r.date.toISOString().split('T')[0] === dateStr && r.status !== 'cancelled'
            )

            const totalSlots = courts.length * 14 // 14 hours per day (8am-10pm)
            const bookedSlots = dayReservations.length
            const rate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

            utilizationTrend.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                rate: Math.round(rate)
            })
        }

        // Revenue trend (last 7 days)
        const revenueTrend = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            const dayReservations = reservations.filter((r: any) =>
                r.date.toISOString().split('T')[0] === dateStr &&
                (r.status === 'confirmed' || r.status === 'completed')
            )

            const revenue = dayReservations.reduce((sum: number, r: any) => sum + r.totalAmount, 0)

            revenueTrend.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue
            })
        }

        // Popular time slots
        const timeSlotCounts: Record<string, number> = {}
        reservations.forEach((r: any) => {
            if (r.status !== 'cancelled') {
                const hour = r.startTime.split(':')[0]
                const timeSlot = `${hour}:00`
                timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1
            }
        })

        const popularTimeSlots = Object.entries(timeSlotCounts)
            .map(([time, bookings]) => ({ time, bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5)

        // Average session duration
        const totalDuration = reservations.reduce((sum: number, r: any) => sum + r.duration, 0)
        const averageSessionDuration = reservations.length > 0 ? totalDuration / reservations.length : 0

        // Peak days
        const dayBookings: Record<string, number> = {}
        reservations.forEach((r: any) => {
            if (r.status !== 'cancelled') {
                const dayName = r.date.toLocaleDateString('en-US', { weekday: 'long' })
                dayBookings[dayName] = (dayBookings[dayName] || 0) + 1
            }
        })

        const peakDays = Object.entries(dayBookings)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([day]) => day)

        // Court comparison
        const courtComparison = courts.map((court: any) => {
            const courtReservations = reservations.filter((r: any) => r.courtId === court.id)
            const revenue = courtReservations
                .filter((r: any) => r.status === 'confirmed' || r.status === 'completed')
                .reduce((sum: number, r: any) => sum + r.totalAmount, 0)

            return {
                courtId: court.id,
                name: court.name,
                utilization: court.utilizationRate || 0,
                revenue
            }
        }).sort((a, b) => b.utilization - a.utilization)

        return {
            utilizationTrend,
            revenueTrend,
            popularTimeSlots,
            averageSessionDuration: Math.round(averageSessionDuration),
            peakDays,
            courtComparison
        }
    })

    // Validation functions
    const validateCourtForm = (data: CourtFormData): boolean => {
        const errors: Record<string, string> = {}

        if (!data.name.trim()) {
            errors.name = 'Court name is required'
        } else if (data.name.length < 3) {
            errors.name = 'Court name must be at least 3 characters'
        }

        if (!data.type) {
            errors.type = 'Court type is required'
        }

        if (!data.hourlyRate || data.hourlyRate <= 0) {
            errors.hourlyRate = 'Hourly rate must be greater than 0'
        }

        if (!data.peakHourRate || data.peakHourRate <= 0) {
            errors.peakHourRate = 'Peak hour rate must be greater than 0'
        }

        if (data.peakHourRate < data.hourlyRate) {
            errors.peakHourRate = 'Peak hour rate must be higher than regular rate'
        }

        if (!data.capacity || data.capacity < 1 || data.capacity > 10) {
            errors.capacity = 'Capacity must be between 1 and 10'
        }

        if (!data.description.trim()) {
            errors.description = 'Description is required'
        }

        if (!data.location.trim()) {
            errors.location = 'Location is required'
        }

        validationErrors.value = errors
        return Object.keys(errors).length === 0
    }

    const validateReservationForm = (data: ReservationFormData): boolean => {
        const errors: Record<string, string> = {}

        if (!data.courtId) {
            errors.courtId = 'Please select a court'
        }

        if (!data.date) {
            errors.date = 'Date is required'
        } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (data.date.getTime() < today.getTime()) {
                errors.date = 'Date cannot be in the past'
            }
        }

        if (!data.startTime) {
            errors.startTime = 'Start time is required'
        }

        if (!data.endTime) {
            errors.endTime = 'End time is required'
        }

        if (data.startTime && data.endTime && data.startTime >= data.endTime) {
            errors.endTime = 'End time must be after start time'
        }

        if (!data.duration || data.duration < 30) {
            errors.duration = 'Minimum duration is 30 minutes'
        }

        if (!data.purpose) {
            errors.purpose = 'Purpose is required'
        }

        if (!data.numberOfPlayers || data.numberOfPlayers < 1) {
            errors.numberOfPlayers = 'At least 1 player is required'
        }

        if (!data.contactPhone.trim()) {
            errors.contactPhone = 'Contact phone is required'
        }

        validationErrors.value = errors
        return Object.keys(errors).length === 0
    }

    // Court management actions
    const fetchCourts = async (refresh = false) => {
        if (refresh) courtsStore.clearError()
        await courtsStore.fetchCourts()
    }

    const fetchReservations = async (refresh = false) => {
        if (refresh) courtsStore.clearError()
        await courtsStore.fetchReservations()
    }

    const createCourt = async (data: CourtFormData): Promise<Court | null> => {
        if (!validateCourtForm(data)) return null

        isCreatingCourt.value = true

        try {
            const courtData = {
                ...data,
                status: 'available' as const,
                images: [],
                maintenanceSchedule: null,
                utilizationRate: 0
            }

            const newCourt = await courtsStore.addCourt(courtData)
            successMessage.value = 'Court created successfully'

            // Clear form
            clearValidationErrors()

            return newCourt
        } catch (error: any) {
            console.error('Failed to create court:', error)
            return null
        } finally {
            isCreatingCourt.value = false
        }
    }

    const updateCourt = async (id: string, data: Partial<CourtFormData>): Promise<Court | null> => {
        isUpdatingCourt.value = true

        try {
            const updatedCourt = await courtsStore.updateCourt(id, data)
            successMessage.value = 'Court updated successfully'
            return updatedCourt
        } catch (error: any) {
            console.error('Failed to update court:', error)
            return null
        } finally {
            isUpdatingCourt.value = false
        }
    }

    const deleteCourt = async (id: string): Promise<boolean> => {
        isDeletingCourt.value = true

        try {
            await courtsStore.deleteCourt(id)
            successMessage.value = 'Court deleted successfully'

            // Remove from selected courts if present
            const index = selectedCourts.value.indexOf(id)
            if (index > -1) {
                selectedCourts.value.splice(index, 1)
            }

            return true
        } catch (error: any) {
            console.error('Failed to delete court:', error)
            return false
        } finally {
            isDeletingCourt.value = false
        }
    }

    const updateCourtStatus = async (courtId: string, status: Court['status']): Promise<void> => {
        try {
            await courtsStore.updateCourtStatus(courtId, status)
            successMessage.value = `Court status updated to ${status}`
        } catch (error: any) {
            console.error('Failed to update court status:', error)
        }
    }

    // Reservation management
    const createReservation = async (data: ReservationFormData): Promise<CourtReservation | null> => {
        if (!validateReservationForm(data)) return null

        try {
            // Calculate total amount
            const totalAmount = calculateReservationCost(data.courtId, data.startTime, data.duration)

            const reservationData = {
                ...data,
                courtName: getCourtById(data.courtId)?.name || 'Unknown Court',
                userId: 'current_user_id', // This should come from auth
                userName: 'Current User', // This should come from auth
                status: 'pending' as const,
                paymentStatus: 'pending' as const,
                cancellationPolicy: '24h notice required',
                weatherDependent: data.courtId ? getCourtById(data.courtId)?.type === 'outdoor' : false,
                totalAmount,
                paymentMethod: undefined,
                cancellationReason: undefined,
                cancellationDate: undefined,
                recurringReservationId: undefined,
                checkedInAt: undefined,
                checkedOutAt: undefined,
                actualDuration: undefined,
                rating: undefined,
                feedback: undefined,
                charges: [
                    {
                        id: `charge_${Date.now()}`,
                        type: 'court_rental' as const,
                        description: `Court rental (${data.duration} minutes)`,
                        amount: totalAmount,
                        quantity: 1,
                        unitPrice: totalAmount
                    }
                ],
                discounts: [],
                reminders: []
            }

            const newReservation = await courtsStore.createReservation(reservationData)
            successMessage.value = 'Reservation created successfully'

            // Clear availability cache for the date
            const cacheKey = `${data.courtId}-${data.date.toISOString().split('T')[0]}`
            availabilityCache.delete(cacheKey)

            return newReservation
        } catch (error: any) {
            console.error('Failed to create reservation:', error)
            return null
        }
    }

    const updateReservation = async (id: string, updates: Partial<CourtReservation>): Promise<CourtReservation | null> => {
        try {
            const updatedReservation = await courtsStore.updateReservation(id, updates)
            successMessage.value = 'Reservation updated successfully'
            return updatedReservation
        } catch (error: any) {
            console.error('Failed to update reservation:', error)
            return null
        }
    }

    const cancelReservation = async (id: string, reason?: string): Promise<void> => {
        try {
            await courtsStore.cancelReservation(id, reason)
            successMessage.value = 'Reservation cancelled successfully'
        } catch (error: any) {
            console.error('Failed to cancel reservation:', error)
        }
    }

    // Availability checking
    const checkAvailability = async (courtId: string, date: Date): Promise<TimeSlot[]> => {
        const cacheKey = `${courtId}-${date.toISOString().split('T')[0]}`

        // Check cache first
        if (availabilityCache.has(cacheKey)) {
            const cached = availabilityCache.get(cacheKey)
            return cached?.availableSlots || []
        }

        isCheckingAvailability.value = true

        try {
            const slots = courtsStore.getAvailableTimeSlots(courtId, date)

            // Cache the result
            availabilityCache.set(cacheKey, {
                courtId,
                date,
                availableSlots: slots,
                blockedSlots: []
            })

            return slots
        } catch (error: any) {
            console.error('Failed to check availability:', error)
            return []
        } finally {
            isCheckingAvailability.value = false
        }
    }

    const getAvailableCourtsForDateTime = async (date: Date, startTime: string, duration: number): Promise<Court[]> => {
        const available: Court[] = []

        for (const court of courtsStore.availableCourts) {
            const slots = await checkAvailability(court.id, date)
            const hasAvailableSlot = slots.some(slot =>
                slot.time === startTime && slot.available
            )

            if (hasAvailableSlot) {
                available.push(court)
            }
        }

        return available
    }

    // Bulk operations
    const bulkUpdateStatus = async (courtIds: string[], status: Court['status']): Promise<void> => {
        isBulkOperating.value = true

        try {
            for (const courtId of courtIds) {
                await courtsStore.updateCourtStatus(courtId, status)
            }

            operationMessage.value = `${courtIds.length} courts updated successfully`
            selectedCourts.value = []
        } catch (error: any) {
            console.error('Bulk status update failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    const bulkUpdateRates = async (courtIds: string[], hourlyRate: number, peakHourRate: number): Promise<void> => {
        isBulkOperating.value = true

        try {
            for (const courtId of courtIds) {
                await courtsStore.updateCourt(courtId, { hourlyRate, peakHourRate })
            }

            operationMessage.value = `${courtIds.length} courts' rates updated successfully`
            selectedCourts.value = []
        } catch (error: any) {
            console.error('Bulk rate update failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    // Helper functions
    const getCourtById = (id: string): Court | undefined => {
        return courtsStore.getCourtById(id)
    }

    const getCourtReservations = (courtId: string, date?: Date): CourtReservation[] => {
        return courtsStore.reservations.filter((r: any) => {
            if (r.courtId !== courtId) return false
            if (date && r.date.toDateString() !== date.toDateString()) return false
            return true
        })
    }

    const isCourtAvailable = async (courtId: string, date: Date, startTime: string): Promise<boolean> => {
        const slots = await checkAvailability(courtId, date)
        return slots.some(slot => slot.time === startTime && slot.available)
    }

    const calculateReservationCost = (courtId: string, startTime: string, duration: number): number => {
        const court = getCourtById(courtId)
        if (!court) return 0

        const hour = parseInt(startTime.split(':')[0])
        const isPeakHour = hour >= 17 && hour <= 20 // 5-8 PM
        const rate = isPeakHour ? court.peakHourRate : court.hourlyRate

        return (rate * duration) / 60
    }

    // Filter and search functions
    const setFilter = (filter: Partial<CourtFilter>) => {
        Object.assign(activeFilters, filter)
    }

    const clearFilters = () => {
        Object.keys(activeFilters).forEach(key => {
            delete (activeFilters as any)[key]
        })
        searchQuery.value = ''
    }

    const setSorting = (field: typeof sortBy.value, order: typeof sortOrder.value) => {
        sortBy.value = field
        sortOrder.value = order
    }

    // Selection functions
    const toggleCourtSelection = (courtId: string) => {
        const index = selectedCourts.value.indexOf(courtId)
        if (index > -1) {
            selectedCourts.value.splice(index, 1)
        } else {
            selectedCourts.value.push(courtId)
        }
    }

    const selectAllCourts = () => {
        selectedCourts.value = filteredCourts.value.map(court => court.id)
    }

    const clearSelection = () => {
        selectedCourts.value = []
    }

    // Utility functions
    const clearValidationErrors = () => {
        validationErrors.value = {}
    }

    const clearMessages = () => {
        successMessage.value = ''
        operationMessage.value = ''
        courtsStore.clearError()
    }

    const refreshData = async () => {
        availabilityCache.clear()
        await Promise.all([
            fetchCourts(true),
            fetchReservations(true)
        ])
    }

    // Watch for date changes to clear availability cache
    watch(selectedDate, () => {
        availabilityCache.clear()
    })

    // Export everything
    return {
        // Store state
        courts,
        reservations,
        loading,
        error,

        // Computed
        filteredCourts,
        courtStatistics,
        courtAnalytics,
        availableCourts,
        indoorCourts,
        outdoorCourts,
        activeCourts,
        todayReservations,
        upcomingReservations,

        // Local state
        validationErrors,
        successMessage,
        operationMessage,
        searchQuery,
        activeFilters,
        sortBy,
        sortOrder,
        selectedCourts,
        selectedDate,
        selectedCourt,

        // Loading states
        isCreatingCourt,
        isUpdatingCourt,
        isDeletingCourt,
        isCheckingAvailability,
        isBulkOperating,

        // Actions
        fetchCourts,
        fetchReservations,
        createCourt,
        updateCourt,
        deleteCourt,
        updateCourtStatus,
        createReservation,
        updateReservation,
        cancelReservation,

        // Availability
        checkAvailability,
        getAvailableCourtsForDateTime,
        isCourtAvailable,

        // Bulk operations
        bulkUpdateStatus,
        bulkUpdateRates,

        // Helpers
        getCourtById,
        getCourtReservations,
        calculateReservationCost,

        // Filters and search
        setFilter,
        clearFilters,
        setSorting,

        // Selection
        toggleCourtSelection,
        selectAllCourts,
        clearSelection,

        // Validation
        validateCourtForm,
        validateReservationForm,

        // Utilities
        clearValidationErrors,
        clearMessages,
        refreshData
    }
}