// Court related types

export interface Court {
    id: string
    name: string
    type: 'indoor' | 'outdoor'
    status: 'available' | 'occupied' | 'maintenance'
    capacity: number
    hourlyRate: number
    peakHourRate: number
    features: string[]
    description: string
    images: string[]
    utilizationRate: number
    maintenanceSchedule: MaintenanceSchedule | null
    equipment: string[]
    rules: string[]
    location: string
    createdAt: Date
    updatedAt: Date
    // Legacy support for existing code
    occupancyRate?: any
    nextAvailable?: any
}

export interface MaintenanceSchedule {
    startDate: Date
    endDate: Date
    description: string
    technician?: string
    estimatedCost?: number
}

export interface CourtReservation {
    id: string
    courtId: string
    userId: string
    userName: string
    date: Date
    startTime: string
    endTime: string
    duration: number // in minutes
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    purpose: 'private_lesson' | 'group_lesson' | 'practice' | 'training' | 'tournament' | 'recreation'
    numberOfPlayers: number
    totalAmount: number
    notes?: string
    equipment: string[]
    paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded'
    cancellationPolicy: string
    contactPhone: string
    emergencyContact?: string
    createdAt: Date
    updatedAt: Date
}

export interface TimeSlot {
    time: string
    available: boolean
    price: number
    isPeakHour: boolean
    reservationId?: string
    duration?: number
}

export interface CourtAvailability {
    courtId: string
    date: Date
    availableSlots: TimeSlot[]
    blockedSlots: TimeSlot[]
    maintenanceBlocks?: MaintenanceBlock[]
}

export interface MaintenanceBlock {
    startTime: string
    endTime: string
    reason: string
    recurring?: boolean
}

export interface CourtUsageStats {
    courtId: string
    date: Date
    totalHours: number
    peakHours: number
    offPeakHours: number
    revenue: number
    utilizationRate: number
    mostPopularTimeSlots: string[]
}

export interface CourtFilter {
    type?: 'indoor' | 'outdoor'
    status?: Court['status']
    minRate?: number
    maxRate?: number
    features?: string[]
    capacity?: number
    available?: boolean
    date?: Date
    timeSlot?: string
}

export interface CourtSearchParams {
    query?: string
    filters?: CourtFilter
    sortBy?: 'name' | 'hourlyRate' | 'utilizationRate' | 'status'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export interface CourtSearchResult {
    courts: Court[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

// Equipment related types
export interface CourtEquipment {
    id: string
    name: string
    type: 'racket' | 'balls' | 'net' | 'machine' | 'accessory'
    available: boolean
    hourlyRate?: number
    description: string
    maintenanceStatus: 'good' | 'needs_attention' | 'out_of_service'
    lastMaintenance: Date
    nextMaintenance: Date
}

export interface EquipmentReservation {
    id: string
    equipmentId: string
    reservationId: string
    quantity: number
    totalCost: number
    status: 'reserved' | 'checked_out' | 'returned' | 'damaged'
    checkedOutAt?: Date
    returnedAt?: Date
    condition?: 'excellent' | 'good' | 'fair' | 'poor'
    notes?: string
}

// Pricing related types
export interface CourtPricing {
    id: string
    courtId: string
    name: string
    description: string
    hourlyRate: number
    peakHourRate: number
    peakHours: PeakHour[]
    discounts: Discount[]
    seasonalRates?: SeasonalRate[]
    validFrom: Date
    validTo?: Date
    active: boolean
}

export interface PeakHour {
    dayOfWeek: number // 0-6 (Sunday-Saturday)
    startTime: string
    endTime: string
    multiplier: number
}

export interface Discount {
    id: string
    name: string
    type: 'percentage' | 'fixed'
    value: number
    conditions: DiscountCondition[]
    validFrom: Date
    validTo: Date
    active: boolean
}

export interface DiscountCondition {
    type: 'membership' | 'duration' | 'frequency' | 'time' | 'day'
    value: string | number
    operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'between'
}

export interface SeasonalRate {
    name: string
    startDate: Date
    endDate: Date
    multiplier: number
    description?: string
}

// Statistics and reporting types
export interface CourtStatistics {
    totalCourts: number
    availableCourts: number
    occupiedCourts: number
    maintenanceCourts: number
    utilizationRate: number
    todayReservations: number
    confirmedTodayReservations: number
    upcomingReservationsCount: number
    revenue: RevenueStats
    popular: PopularityStats
}

export interface RevenueStats {
    today: number
    thisWeek: number
    thisMonth: number
    lastMonth: number
    growth: number
}

export interface PopularityStats {
    mostPopularCourt: string
    mostPopularTimeSlot: string
    averageReservationDuration: number
    averagePlayersPerReservation: number
}

// Event types for real-time updates
export interface CourtEvent {
    type: 'status_change' | 'reservation_created' | 'reservation_cancelled' | 'maintenance_scheduled'
    courtId: string
    timestamp: Date
    data: any
    userId?: string
}

// Validation types
export interface ReservationValidation {
    isValid: boolean
    errors: string[]
    warnings: string[]
    conflicts: CourtReservation[]
}

export interface CourtValidation {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

// Export utility types
export type CourtStatus = Court['status']
export type CourtType = Court['type']
export type ReservationStatus = CourtReservation['status']
export type ReservationPurpose = CourtReservation['purpose']
export type PaymentStatus = CourtReservation['paymentStatus']