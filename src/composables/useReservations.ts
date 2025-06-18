import { computed, ref, reactive, watch, nextTick } from 'vue'
import { useReservationsStore } from '@/store/modules/reservations'
import { useCourtsStore } from '@/store/modules/courts'
import { useAuthStore } from '@/store/modules/auth'
import type {
    Reservation,
    ReservationConflict,
    RecurringReservation,
    ReservationCalendarEvent,
    ReservationStats,
    AlternativeSlot
} from '@/store/modules/reservations'

// Interface for reservation form data
export interface ReservationFormData {
    courtId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    type: Reservation['type']
    purpose: string
    numberOfPlayers: number
    instructorId?: string
    equipment: string[]
    notes?: string
    contactPhone: string
    emergencyContact?: string
    specialRequests?: string[]
    weatherDependent?: boolean
}

// Interface for reservation search/filter
export interface ReservationFilter {
    status?: Reservation['status']
    type?: Reservation['type']
    courtId?: string
    dateFrom?: Date
    dateTo?: Date
    studentId?: string
    instructorId?: string
    paymentStatus?: Reservation['paymentStatus']
}

// Interface for reservation update
export interface ReservationUpdateData {
    startTime?: string
    endTime?: string
    duration?: number
    numberOfPlayers?: number
    equipment?: string[]
    notes?: string
    specialRequests?: string[]
}

// Interface for bulk operations
export interface BulkReservationOperation {
    operation: 'cancel' | 'confirm' | 'complete' | 'reschedule'
    reservationIds: string[]
    data?: any
    reason?: string
}

// Interface for recurring reservation setup
export interface RecurringReservationData {
    reservationTemplate: Omit<ReservationFormData, 'date'>
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    dayOfWeek?: number // 0-6 for weekly patterns
    dayOfMonth?: number // 1-31 for monthly patterns
    startDate: Date
    endDate?: Date
    totalOccurrences?: number
    skipDates?: Date[]
}

// Interface for check-in/out data
export interface CheckInOutData {
    actualStartTime?: Date
    actualEndTime?: Date
    actualNumberOfPlayers?: number
    equipmentUsed?: string[]
    notes?: string
    rating?: number
    feedback?: string
}

export function useReservations() {
    const reservationsStore = useReservationsStore()
    const courtsStore = useCourtsStore()
    const authStore = useAuthStore()

    // Local reactive state
    const isCreatingReservation = ref(false)
    const isUpdatingReservation = ref(false)
    const isCancellingReservation = ref(false)
    const isCheckingIn = ref(false)
    const isCheckingOut = ref(false)
    const isBulkOperating = ref(false)
    const isCreatingRecurring = ref(false)

    // Form validation errors
    const validationErrors = ref<Record<string, string>>({})

    // Success/error messages
    const successMessage = ref('')
    const operationMessage = ref('')

    // Filter and search state
    const searchQuery = ref('')
    const activeFilters = reactive<ReservationFilter>({})
    const dateRange = reactive({
        start: new Date(),
        end: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    })

    // Calendar state
    const calendarView = ref<'month' | 'week' | 'day'>('week')
    const selectedDate = ref(new Date())

    // Selected reservations for bulk operations
    const selectedReservations = ref<string[]>([])

    // Conflict resolution state
    const pendingConflicts = ref<ReservationConflict[]>([])
    const suggestedAlternatives = ref<AlternativeSlot[]>([])

    // Computed properties from store
    const reservations = computed(() => reservationsStore.reservations)
    const recurringReservations = computed(() => reservationsStore.recurringReservations)
    const loading = computed(() => reservationsStore.loading)
    const error = computed(() => reservationsStore.error)

    // Computed - filtered reservations
    const filteredReservations = computed(() => {
        return reservationsStore.searchReservations(searchQuery.value, activeFilters)
    })

    // Computed - user's reservations (if student)
    const myReservations = computed(() => {
        if (!authStore.user) return []
        return reservations.value.filter(r => r.studentId === authStore.user?.id)
    })

    // Computed - today's reservations
    const todayReservations = computed(() => reservationsStore.todayReservations)

    // Computed - upcoming reservations
    const upcomingReservations = computed(() => reservationsStore.upcomingReservations)

    // Computed - calendar events
    const calendarEvents = computed(() => reservationsStore.calendarEvents)

    // Computed - reservation statistics
    const reservationStats = computed(() => reservationsStore.getReservationStatistics())

    // Computed - overdue and unpaid reservations
    const overdueReservations = computed(() => reservationsStore.overdueReservations)
    const unpaidReservations = computed(() => reservationsStore.unpaidReservations)

    // Computed - my upcoming reservations (for students)
    const myUpcomingReservations = computed(() => {
        if (!authStore.user) return []
        return upcomingReservations.value.filter(r => r.studentId === authStore.user?.id)
    })

    // Computed - reservations needing attention
    const reservationsNeedingAttention = computed(() => {
        const now = new Date()
        return reservations.value.filter(r => {
            // Pending reservations older than 1 hour
            if (r.status === 'pending' &&
                (now.getTime() - r.createdAt.getTime()) > 60 * 60 * 1000) {
                return true
            }
            // Confirmed reservations without check-in 15 minutes after start time
            if (r.status === 'confirmed' && !r.checkedInAt) {
                const reservationStart = new Date(r.date)
                const [hours, minutes] = r.startTime.split(':').map(Number)
                reservationStart.setHours(hours, minutes, 0, 0)
                if (now.getTime() > reservationStart.getTime() + 15 * 60 * 1000) {
                    return true
                }
            }
            return false
        })
    })

    // Validation functions
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
        } else if (data.duration > 240) {
            errors.duration = 'Maximum duration is 4 hours'
        }

        if (!data.type) {
            errors.type = 'Reservation type is required'
        }

        if (!data.purpose?.trim()) {
            errors.purpose = 'Purpose is required'
        }

        if (!data.numberOfPlayers || data.numberOfPlayers < 1) {
            errors.numberOfPlayers = 'At least 1 player is required'
        } else if (data.numberOfPlayers > 4) {
            errors.numberOfPlayers = 'Maximum 4 players allowed'
        }

        if (!data.contactPhone?.trim()) {
            errors.contactPhone = 'Contact phone is required'
        } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(data.contactPhone)) {
            errors.contactPhone = 'Please enter a valid phone number'
        }

        // Validate against court capacity
        if (data.courtId && data.numberOfPlayers) {
            const court = courtsStore.getCourtById(data.courtId)
            if (court && data.numberOfPlayers > court.capacity) {
                errors.numberOfPlayers = `Court capacity is ${court.capacity} players`
            }
        }

        validationErrors.value = errors
        return Object.keys(errors).length === 0
    }

    const validateRecurringReservation = (data: RecurringReservationData): boolean => {
        const errors: Record<string, string> = {}

        if (!validateReservationForm({
            ...data.reservationTemplate,
            date: data.startDate
        })) {
            return false
        }

        if (!data.pattern) {
            errors.pattern = 'Recurrence pattern is required'
        }

        if (!data.startDate) {
            errors.startDate = 'Start date is required'
        }

        if (data.endDate && data.startDate && data.endDate <= data.startDate) {
            errors.endDate = 'End date must be after start date'
        }

        if (data.pattern === 'weekly' && (data.dayOfWeek === undefined || data.dayOfWeek < 0 || data.dayOfWeek > 6)) {
            errors.dayOfWeek = 'Valid day of week is required for weekly pattern'
        }

        if (data.pattern === 'monthly' && (data.dayOfMonth === undefined || data.dayOfMonth < 1 || data.dayOfMonth > 31)) {
            errors.dayOfMonth = 'Valid day of month is required for monthly pattern'
        }

        if (!data.totalOccurrences && !data.endDate) {
            errors.endDate = 'Either end date or total occurrences is required'
        }

        validationErrors.value = { ...validationErrors.value, ...errors }
        return Object.keys(errors).length === 0
    }

    // Reservation management actions
    const fetchReservations = async (filters?: ReservationFilter, refresh = false) => {
        if (refresh) reservationsStore.clearError()
        await reservationsStore.fetchReservations(filters)
    }

    const fetchRecurringReservations = async (refresh = false) => {
        if (refresh) reservationsStore.clearError()
        await reservationsStore.fetchRecurringReservations()
    }

    const createReservation = async (data: ReservationFormData): Promise<Reservation | null> => {
        if (!validateReservationForm(data)) return null

        isCreatingReservation.value = true

        try {
            // Check for conflicts first
            const conflicts = await checkReservationConflicts(data)
            if (conflicts.length > 0) {
                pendingConflicts.value = conflicts
                // Get suggested alternatives
                suggestedAlternatives.value = await getSuggestedAlternatives(data)
                validationErrors.value.conflicts = 'Time conflicts detected. Please check suggested alternatives.'
                return null
            }

            // Calculate total cost
            const court = courtsStore.getCourtById(data.courtId)
            if (!court) {
                validationErrors.value.courtId = 'Selected court not found'
                return null
            }

            const totalCost = calculateReservationCost(court, data.startTime, data.duration)

            const reservationData = {
                courtId: data.courtId,
                courtName: court.name,
                studentId: authStore.user?.id || 'guest',
                studentName: authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'Guest',
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                duration: data.duration,
                type: data.type,
                status: 'pending' as const,
                totalCost,
                purpose: data.purpose,
                numberOfPlayers: data.numberOfPlayers,
                instructorId: data.instructorId,
                instructorName: data.instructorId ? 'Instructor Name' : undefined, // This should be fetched from instructor store
                equipment: data.equipment,
                notes: data.notes,
                paymentStatus: 'pending' as const,
                paymentMethod: undefined,
                cancellationReason: undefined,
                cancellationDate: undefined,
                cancellationPolicy: '24h notice required',
                contactPhone: data.contactPhone,
                emergencyContact: data.emergencyContact,
                specialRequests: data.specialRequests || [],
                weatherDependent: data.weatherDependent ?? (court.type === 'outdoor'),
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
                        description: `${court.name} rental (${data.duration} minutes)`,
                        amount: totalCost,
                        quantity: 1,
                        unitPrice: totalCost
                    }
                ],
                discounts: [],
                reminders: []
            }

            const newReservation = await reservationsStore.createReservation(reservationData)
            successMessage.value = 'Reservation created successfully'

            // Clear validation errors
            clearValidationErrors()

            return newReservation
        } catch (error: any) {
            console.error('Failed to create reservation:', error)
            return null
        } finally {
            isCreatingReservation.value = false
        }
    }

    const updateReservation = async (id: string, updates: ReservationUpdateData): Promise<Reservation | null> => {
        isUpdatingReservation.value = true

        try {
            // If time is being updated, check for conflicts
            if (updates.startTime || updates.endTime || updates.duration) {
                const reservation = getReservationById(id)
                if (reservation) {
                    const updatedData = {
                        ...reservation,
                        ...updates
                    }

                    const conflicts = await checkReservationConflicts(updatedData)
                    if (conflicts.length > 0) {
                        pendingConflicts.value = conflicts
                        validationErrors.value.conflicts = 'Time conflicts detected'
                        return null
                    }
                }
            }

            const updatedReservation = await reservationsStore.updateReservation(id, updates)
            successMessage.value = 'Reservation updated successfully'
            return updatedReservation
        } catch (error: any) {
            console.error('Failed to update reservation:', error)
            return null
        } finally {
            isUpdatingReservation.value = false
        }
    }

    const cancelReservation = async (id: string, reason: string): Promise<void> => {
        isCancellingReservation.value = true

        try {
            await reservationsStore.cancelReservation(id, reason)
            successMessage.value = 'Reservation cancelled successfully'

            // Remove from selected reservations if present
            const index = selectedReservations.value.indexOf(id)
            if (index > -1) {
                selectedReservations.value.splice(index, 1)
            }
        } catch (error: any) {
            console.error('Failed to cancel reservation:', error)
        } finally {
            isCancellingReservation.value = false
        }
    }

    const checkInReservation = async (id: string, data?: CheckInOutData): Promise<void> => {
        isCheckingIn.value = true

        try {
            await reservationsStore.checkInReservation(id)

            if (data) {
                // Update with check-in data
                await reservationsStore.updateReservation(id, {
                    actualDuration: data.actualNumberOfPlayers,
                    notes: data.notes
                })
            }

            successMessage.value = 'Checked in successfully'
        } catch (error: any) {
            console.error('Failed to check in:', error)
        } finally {
            isCheckingIn.value = false
        }
    }

    const checkOutReservation = async (id: string, data?: CheckInOutData): Promise<void> => {
        isCheckingOut.value = true

        try {
            await reservationsStore.checkOutReservation(id, data?.rating, data?.feedback)
            successMessage.value = 'Checked out successfully'
        } catch (error: any) {
            console.error('Failed to check out:', error)
        } finally {
            isCheckingOut.value = false
        }
    }

    // Recurring reservations
    const createRecurringReservation = async (data: RecurringReservationData): Promise<RecurringReservation | null> => {
        if (!validateRecurringReservation(data)) return null

        isCreatingRecurring.value = true

        try {
            // This would typically call a store method to create recurring reservation
            // For now, we'll simulate it
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Generate first few reservations
            const generatedCount = await reservationsStore.generateRecurringReservations('recurring_id', 5)

            successMessage.value = `Recurring reservation created with ${generatedCount.length} initial bookings`
            clearValidationErrors()

            return {} as RecurringReservation // Placeholder
        } catch (error: any) {
            console.error('Failed to create recurring reservation:', error)
            return null
        } finally {
            isCreatingRecurring.value = false
        }
    }

    // Conflict checking and resolution
    const checkReservationConflicts = async (data: Partial<Reservation>): Promise<ReservationConflict[]> => {
        return await reservationsStore.checkReservationConflicts(data)
    }

    const getSuggestedAlternatives = async (data: ReservationFormData): Promise<AlternativeSlot[]> => {
        const alternatives: AlternativeSlot[] = []

        try {
            // Check same court for different times
            const availableSlots = courtsStore.getAvailableTimeSlots(data.courtId, data.date)
            for (const slot of availableSlots) {
                if (slot.available && slot.time !== data.startTime) {
                    const endTime = calculateEndTime(slot.time, data.duration)
                    alternatives.push({
                        courtId: data.courtId,
                        courtName: courtsStore.getCourtById(data.courtId)?.name || 'Unknown',
                        startTime: slot.time,
                        endTime,
                        price: slot.price,
                        available: true
                    })
                }
            }

            // Check other courts for same time
            for (const court of courtsStore.availableCourts) {
                if (court.id !== data.courtId) {
                    const courtSlots = courtsStore.getAvailableTimeSlots(court.id, data.date)
                    const targetSlot = courtSlots.find(slot => slot.time === data.startTime && slot.available)
                    if (targetSlot) {
                        alternatives.push({
                            courtId: court.id,
                            courtName: court.name,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            price: targetSlot.price,
                            available: true
                        })
                    }
                }
            }

            return alternatives.slice(0, 5) // Return top 5 alternatives
        } catch (error) {
            console.error('Failed to get alternatives:', error)
            return []
        }
    }

    const resolveConflictWithAlternative = async (alternative: AlternativeSlot, originalData: ReservationFormData): Promise<Reservation | null> => {
        const updatedData = {
            ...originalData,
            courtId: alternative.courtId,
            startTime: alternative.startTime,
            endTime: alternative.endTime
        }

        // Clear conflicts and try again
        pendingConflicts.value = []
        suggestedAlternatives.value = []

        return await createReservation(updatedData)
    }

    // Bulk operations
    const bulkCancelReservations = async (reservationIds: string[], reason: string): Promise<void> => {
        isBulkOperating.value = true

        try {
            for (const id of reservationIds) {
                await reservationsStore.cancelReservation(id, reason)
            }

            operationMessage.value = `${reservationIds.length} reservations cancelled successfully`
            selectedReservations.value = []
        } catch (error: any) {
            console.error('Bulk cancel failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    const bulkConfirmReservations = async (reservationIds: string[]): Promise<void> => {
        isBulkOperating.value = true

        try {
            for (const id of reservationIds) {
                await reservationsStore.updateReservation(id, { status: 'confirmed' })
            }

            operationMessage.value = `${reservationIds.length} reservations confirmed successfully`
            selectedReservations.value = []
        } catch (error: any) {
            console.error('Bulk confirm failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    // Helper functions
    const getReservationById = (id: string): Reservation | undefined => {
        return reservations.value.find(r => r.id === id)
    }

    const getReservationsByCourt = (courtId: string, date?: Date): Reservation[] => {
        return reservationsStore.getReservationsByCourt(courtId, date)
    }

    const getReservationsByStudent = (studentId: string): Reservation[] => {
        return reservationsStore.getReservationsByStudent(studentId)
    }

    const calculateReservationCost = (court: any, startTime: string, duration: number): number => {
        const hour = parseInt(startTime.split(':')[0])
        const isPeakHour = hour >= 17 && hour <= 20 // 5-8 PM
        const rate = isPeakHour ? court.peakHourRate : court.hourlyRate

        return (rate * duration) / 60
    }

    const calculateEndTime = (startTime: string, duration: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const startDate = new Date()
        startDate.setHours(hours, minutes, 0, 0)

        const endDate = new Date(startDate.getTime() + duration * 60000)
        return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    }

    const isReservationEditable = (reservation: Reservation): boolean => {
        if (reservation.status === 'cancelled' || reservation.status === 'completed') {
            return false
        }

        // Can only edit up to 1 hour before start time
        const reservationStart = new Date(reservation.date)
        const [hours, minutes] = reservation.startTime.split(':').map(Number)
        reservationStart.setHours(hours, minutes, 0, 0)

        const now = new Date()
        const timeDiff = reservationStart.getTime() - now.getTime()

        return timeDiff > 60 * 60 * 1000 // 1 hour in milliseconds
    }

    const canCancelReservation = (reservation: Reservation): boolean => {
        if (reservation.status === 'cancelled' || reservation.status === 'completed') {
            return false
        }

        // Can cancel up to 24 hours before (based on cancellation policy)
        const reservationStart = new Date(reservation.date)
        const [hours, minutes] = reservation.startTime.split(':').map(Number)
        reservationStart.setHours(hours, minutes, 0, 0)

        const now = new Date()
        const timeDiff = reservationStart.getTime() - now.getTime()

        return timeDiff > 24 * 60 * 60 * 1000 // 24 hours
    }

    // Filter and search functions
    const setFilter = (filter: Partial<ReservationFilter>) => {
        Object.assign(activeFilters, filter)
    }

    const clearFilters = () => {
        Object.keys(activeFilters).forEach(key => {
            delete (activeFilters as any)[key]
        })
        searchQuery.value = ''
    }

    const setDateRange = (start: Date, end: Date) => {
        dateRange.start = start
        dateRange.end = end
        setFilter({ dateFrom: start, dateTo: end })
    }

    // Selection functions
    const toggleReservationSelection = (reservationId: string) => {
        const index = selectedReservations.value.indexOf(reservationId)
        if (index > -1) {
            selectedReservations.value.splice(index, 1)
        } else {
            selectedReservations.value.push(reservationId)
        }
    }

    const selectAllReservations = () => {
        selectedReservations.value = filteredReservations.value.map(r => r.id)
    }

    const clearSelection = () => {
        selectedReservations.value = []
    }

    // Calendar functions
    const setCalendarView = (view: 'month' | 'week' | 'day') => {
        reservationsStore.setCalendarView(view)
        calendarView.value = view
    }

    const setSelectedDate = (date: Date) => {
        reservationsStore.setSelectedDate(date)
        selectedDate.value = date
    }

    // Utility functions
    const clearValidationErrors = () => {
        validationErrors.value = {}
        pendingConflicts.value = []
        suggestedAlternatives.value = []
    }

    const clearMessages = () => {
        successMessage.value = ''
        operationMessage.value = ''
        reservationsStore.clearError()
    }

    const refreshData = async () => {
        await Promise.all([
            fetchReservations(activeFilters, true),
            fetchRecurringReservations(true)
        ])
    }

    // Watch for filter changes
    watch(activeFilters, () => {
        clearSelection()
    }, { deep: true })

    // Export everything
    return {
        // Store state
        reservations,
        recurringReservations,
        loading,
        error,

        // Computed
        filteredReservations,
        myReservations,
        todayReservations,
        upcomingReservations,
        myUpcomingReservations,
        calendarEvents,
        reservationStats,
        overdueReservations,
        unpaidReservations,
        reservationsNeedingAttention,

        // Local state
        validationErrors,
        successMessage,
        operationMessage,
        searchQuery,
        activeFilters,
        dateRange,
        calendarView,
        selectedDate,
        selectedReservations,
        pendingConflicts,
        suggestedAlternatives,

        // Loading states
        isCreatingReservation,
        isUpdatingReservation,
        isCancellingReservation,
        isCheckingIn,
        isCheckingOut,
        isBulkOperating,
        isCreatingRecurring,

        // Actions
        fetchReservations,
        fetchRecurringReservations,
        createReservation,
        updateReservation,
        cancelReservation,
        checkInReservation,
        checkOutReservation,
        createRecurringReservation,

        // Conflict resolution
        checkReservationConflicts,
        getSuggestedAlternatives,
        resolveConflictWithAlternative,

        // Bulk operations
        bulkCancelReservations,
        bulkConfirmReservations,

        // Helpers
        getReservationById,
        getReservationsByCourt,
        getReservationsByStudent,
        calculateReservationCost,
        calculateEndTime,
        isReservationEditable,
        canCancelReservation,

        // Filters and search
        setFilter,
        clearFilters,
        setDateRange,

        // Selection
        toggleReservationSelection,
        selectAllReservations,
        clearSelection,

        // Calendar
        setCalendarView,
        setSelectedDate,

        // Validation
        validateReservationForm,
        validateRecurringReservation,

        // Utilities
        clearValidationErrors,
        clearMessages,
        refreshData
    }
}