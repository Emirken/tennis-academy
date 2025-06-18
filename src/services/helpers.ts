// Helper functions for Tennis Academy Application
import { Timestamp } from 'firebase/firestore'

// Types for better type safety
export type DateFormat = 'short' | 'long' | 'medium' | 'time' | 'datetime'
export type SortDirection = 'asc' | 'desc'
export type LessonType = 'private' | 'group' | 'semi-private'
export type InstructorLevel = 'junior' | 'senior' | 'head'
export type MembershipType = 'basic' | 'premium' | 'vip'

// Court slot interface
export interface CourtSlot {
    id: string
    courtId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    isAvailable: boolean
}

// Date and Time Utilities
export class DateHelpers {
    // Format date to various formats
    static formatDate(date: Date | Timestamp, format: DateFormat = 'medium'): string {
        const dateObj = date instanceof Timestamp ? date.toDate() : date

        const options: Record<DateFormat, Intl.DateTimeFormatOptions> = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: '2-digit', month: 'short', year: 'numeric' },
            long: { day: '2-digit', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        }

        return new Intl.DateTimeFormat('tr-TR', options[format]).format(dateObj)
    }

    // Get date range (start and end of day)
    static getDateRange(date: Date): { start: Date; end: Date } {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)

        const end = new Date(date)
        end.setHours(23, 59, 59, 999)

        return { start, end }
    }

    // Get week range
    static getWeekRange(date: Date): { start: Date; end: Date } {
        const start = new Date(date)
        const day = start.getDay()
        const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)

        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)

        return { start, end }
    }

    // Get month range
    static getMonthRange(date: Date): { start: Date; end: Date } {
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

        return { start, end }
    }

    // Check if date is today
    static isToday(date: Date | Timestamp): boolean {
        const dateObj = date instanceof Timestamp ? date.toDate() : date
        const today = new Date()

        return dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
    }

    // Check if date is in the past
    static isPast(date: Date | Timestamp): boolean {
        const dateObj = date instanceof Timestamp ? date.toDate() : date
        return dateObj < new Date()
    }

    // Check if date is in the future
    static isFuture(date: Date | Timestamp): boolean {
        const dateObj = date instanceof Timestamp ? date.toDate() : date
        return dateObj > new Date()
    }

    // Get days between two dates
    static daysBetween(date1: Date, date2: Date): number {
        const oneDay = 24 * 60 * 60 * 1000
        return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
    }

    // Add days to date
    static addDays(date: Date, days: number): Date {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
    }

    // Get time slots for a day
    static getTimeSlots(startHour: number = 8, endHour: number = 22, intervalMinutes: number = 60): string[] {
        const slots: string[] = []

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += intervalMinutes) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                slots.push(time)
            }
        }

        return slots
    }
}

// String Utilities
export class StringHelpers {
    // Capitalize first letter
    static capitalize(str: string): string {
        if (!str) return ''
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }

    // Convert to title case
    static toTitleCase(str: string): string {
        if (!str) return ''
        return str.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
    }

    // Generate slug from string
    static generateSlug(str: string): string {
        if (!str) return ''
        return str
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    // Truncate string
    static truncate(str: string, length: number, suffix: string = '...'): string {
        if (!str) return ''
        if (str.length <= length) return str
        return str.substring(0, length) + suffix
    }

    // Generate random string
    static generateRandomString(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    // Format phone number (Turkish format)
    static formatPhoneNumber(phone: string): string {
        if (!phone) return ''
        const cleaned = phone.replace(/\D/g, '')

        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`
        } else if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`
        }

        return phone
    }

    // Validate email
    static isValidEmail(email: string): boolean {
        if (!email) return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Validate phone number (Turkish)
    static isValidPhoneNumber(phone: string): boolean {
        if (!phone) return false
        const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/
        return phoneRegex.test(phone.replace(/\s/g, ''))
    }
}

// Number Utilities
export class NumberHelpers {
    // Format currency (Turkish Lira)
    static formatCurrency(amount: number, currency: string = 'TRY'): string {
        if (typeof amount !== 'number' || isNaN(amount)) return '₺0,00'
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount)
    }

    // Format number with thousand separators
    static formatNumber(num: number): string {
        if (typeof num !== 'number' || isNaN(num)) return '0'
        return new Intl.NumberFormat('tr-TR').format(num)
    }

    // Calculate percentage
    static calculatePercentage(value: number, total: number): number {
        if (total === 0 || typeof value !== 'number' || typeof total !== 'number') return 0
        return Math.round((value / total) * 100)
    }

    // Generate random number between min and max
    static randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // Round to decimal places
    static roundTo(num: number, decimals: number): number {
        if (typeof num !== 'number' || isNaN(num)) return 0
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
    }
}

// Array Utilities
export class ArrayHelpers {
    // Remove duplicates from array
    static removeDuplicates<T>(array: T[]): T[] {
        if (!Array.isArray(array)) return []
        return [...new Set(array)]
    }

    // Group array by property
    static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
        if (!Array.isArray(array)) return {}
        return array.reduce((groups, item) => {
            const group = String(item[key])
            groups[group] = groups[group] || []
            groups[group].push(item)
            return groups
        }, {} as Record<string, T[]>)
    }

    // Sort array by property
    static sortBy<T>(array: T[], key: keyof T, direction: SortDirection = 'asc'): T[] {
        if (!Array.isArray(array)) return []
        return [...array].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
            return 0
        })
    }

    // Chunk array into smaller arrays
    static chunk<T>(array: T[], size: number): T[][] {
        if (!Array.isArray(array) || size <= 0) return []
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size))
        }
        return chunks
    }

    // Get random item from array
    static randomItem<T>(array: T[]): T | null {
        if (!Array.isArray(array) || array.length === 0) return null
        return array[Math.floor(Math.random() * array.length)]
    }

    // Shuffle array
    static shuffle<T>(array: T[]): T[] {
        if (!Array.isArray(array)) return []
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }
}

// URL Utilities
export class UrlHelpers {
    // Get query parameter from URL
    static getQueryParam(param: string): string | null {
        if (typeof window === 'undefined') return null
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(param)
    }

    // Build URL with query parameters
    static buildUrl(baseUrl: string, params: Record<string, string | number>): string {
        if (typeof window === 'undefined') return baseUrl
        const url = new URL(baseUrl, window.location.origin)
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, String(value))
        })
        return url.toString()
    }

    // Remove query parameter from URL
    static removeQueryParam(param: string): void {
        if (typeof window === 'undefined') return
        const url = new URL(window.location.href)
        url.searchParams.delete(param)
        window.history.replaceState({}, '', url.toString())
    }
}

// Local Storage Utilities
export class StorageHelpers {
    // Get item from localStorage with JSON parsing
    static getItem<T>(key: string, defaultValue: T | null = null): T | null {
        if (typeof window === 'undefined') return defaultValue
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error('Error getting item from localStorage:', error)
            return defaultValue
        }
    }

    // Set item to localStorage with JSON stringifying
    static setItem<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error('Error setting item to localStorage:', error)
        }
    }

    // Remove item from localStorage
    static removeItem(key: string): void {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem(key)
        } catch (error) {
            console.error('Error removing item from localStorage:', error)
        }
    }

    // Clear all localStorage
    static clear(): void {
        if (typeof window === 'undefined') return
        try {
            localStorage.clear()
        } catch (error) {
            console.error('Error clearing localStorage:', error)
        }
    }
}

// Tennis Academy Specific Helpers
export class TennisHelpers {
    // Court time slot helpers
    static generateCourtSlots(date: Date, courtId: string): CourtSlot[] {
        const slots: CourtSlot[] = []
        const timeSlots = DateHelpers.getTimeSlots(8, 22, 60)

        timeSlots.forEach((timeSlot) => {
            const [hour, minute] = timeSlot.split(':').map(Number)
            const startTime = new Date(date)
            startTime.setHours(hour, minute, 0, 0)

            const endTime = new Date(startTime)
            endTime.setHours(hour + 1, minute, 0, 0)

            slots.push({
                id: `${courtId}-${date.toISOString().split('T')[0]}-${timeSlot}`,
                courtId,
                date: new Date(date),
                startTime: timeSlot,
                endTime: `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                duration: 60,
                isAvailable: true
            })
        })

        return slots
    }

    // Calculate lesson price based on type and duration
    static calculateLessonPrice(
        type: LessonType,
        duration: number,
        instructorLevel: InstructorLevel,
        membershipType: MembershipType = 'basic'
    ): number {
        const basePrices: Record<LessonType, Record<InstructorLevel, number>> = {
            private: { junior: 150, senior: 200, head: 250 },
            'semi-private': { junior: 100, senior: 130, head: 170 },
            group: { junior: 60, senior: 80, head: 100 }
        }

        const membershipDiscounts: Record<MembershipType, number> = {
            basic: 0,
            premium: 0.1,
            vip: 0.2
        }

        const basePrice = basePrices[type][instructorLevel]
        const durationMultiplier = duration / 60 // Price per hour
        const discount = membershipDiscounts[membershipType]

        return Math.round(basePrice * durationMultiplier * (1 - discount))
    }

    // Generate lesson schedule
    static generateLessonSchedule(
        startDate: Date,
        endDate: Date,
        dayOfWeek: number[], // 0-6 (Sunday-Saturday)
        timeSlot: string
    ): Date[] {
        const lessons: Date[] = []
        const current = new Date(startDate)

        while (current <= endDate) {
            if (dayOfWeek.includes(current.getDay())) {
                const [hour, minute] = timeSlot.split(':').map(Number)
                const lessonDate = new Date(current)
                lessonDate.setHours(hour, minute, 0, 0)
                lessons.push(new Date(lessonDate))
            }
            current.setDate(current.getDate() + 1)
        }

        return lessons
    }

    // Check if user can make reservation
    static canMakeReservation(
        userMembershipType: MembershipType,
        reservationDate: Date,
        currentReservations: number
    ): { canReserve: boolean; reason?: string } {
        const limits: Record<MembershipType, { maxReservations: number; maxDaysAhead: number }> = {
            basic: { maxReservations: 2, maxDaysAhead: 7 },
            premium: { maxReservations: 5, maxDaysAhead: 14 },
            vip: { maxReservations: 10, maxDaysAhead: 30 }
        }

        const limit = limits[userMembershipType]
        const daysAhead = DateHelpers.daysBetween(new Date(), reservationDate)

        if (currentReservations >= limit.maxReservations) {
            return {
                canReserve: false,
                reason: `Maximum ${limit.maxReservations} reservations allowed for ${userMembershipType} membership`
            }
        }

        if (daysAhead > limit.maxDaysAhead) {
            return {
                canReserve: false,
                reason: `Can only reserve ${limit.maxDaysAhead} days ahead for ${userMembershipType} membership`
            }
        }

        return { canReserve: true }
    }
}

// Error Handling Utilities
export class ErrorHelpers {
    // Extract error message
    static getErrorMessage(error: unknown): string {
        if (typeof error === 'string') return error
        if (error && typeof error === 'object' && 'message' in error) {
            return String((error as { message: unknown }).message)
        }
        if (error && typeof error === 'object' && 'error' in error) {
            return String((error as { error: unknown }).error)
        }
        return 'An unexpected error occurred'
    }

    // Log error with context
    static logError(error: unknown, context: string, additionalInfo?: unknown): void {
        console.error(`[${context}]`, {
            error: error,
            message: this.getErrorMessage(error),
            additionalInfo,
            timestamp: new Date().toISOString()
        })
    }

    // Create user-friendly error message
    static createUserFriendlyError(error: unknown): string {
        const message = this.getErrorMessage(error)

        // Common Firebase errors
        if (message.includes('permission-denied')) {
            return 'You do not have permission to perform this action'
        }
        if (message.includes('not-found')) {
            return 'The requested item was not found'
        }
        if (message.includes('already-exists')) {
            return 'This item already exists'
        }
        if (message.includes('network')) {
            return 'Network error. Please check your connection'
        }

        return message
    }
}

// Validation Utilities
export class ValidationHelpers {
    // Validate required fields
    static validateRequired(fields: Record<string, unknown>): string[] {
        const errors: string[] = []

        Object.entries(fields).forEach(([key, value]) => {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(`${StringHelpers.toTitleCase(key)} is required`)
            }
        })

        return errors
    }

    // Validate date range
    static validateDateRange(startDate: Date, endDate: Date): string[] {
        const errors: string[] = []

        if (startDate >= endDate) {
            errors.push('Start date must be before end date')
        }

        if (DateHelpers.isPast(startDate)) {
            errors.push('Start date cannot be in the past')
        }

        return errors
    }

    // Validate tennis lesson data
    static validateLessonData(data: {
        instructorId: string
        studentId: string
        courtId: string
        date: Date
        duration: number
    }): string[] {
        const errors: string[] = []

        const required = this.validateRequired({
            instructor: data.instructorId,
            student: data.studentId,
            court: data.courtId
        })

        errors.push(...required)

        if (data.duration < 30 || data.duration > 180) {
            errors.push('Lesson duration must be between 30 and 180 minutes')
        }

        if (DateHelpers.isPast(data.date)) {
            errors.push('Lesson date cannot be in the past')
        }

        return errors
    }
}

// Export commonly used functions directly
export const formatDate = DateHelpers.formatDate
export const isToday = DateHelpers.isToday
export const isPast = DateHelpers.isPast
export const isFuture = DateHelpers.isFuture
export const addDays = DateHelpers.addDays
export const getTimeSlots = DateHelpers.getTimeSlots

export const capitalize = StringHelpers.capitalize
export const toTitleCase = StringHelpers.toTitleCase
export const truncate = StringHelpers.truncate
export const formatPhoneNumber = StringHelpers.formatPhoneNumber
export const isValidEmail = StringHelpers.isValidEmail

export const formatCurrency = NumberHelpers.formatCurrency
export const formatNumber = NumberHelpers.formatNumber
export const calculatePercentage = NumberHelpers.calculatePercentage

export const removeDuplicates = ArrayHelpers.removeDuplicates
export const groupBy = ArrayHelpers.groupBy
export const sortBy = ArrayHelpers.sortBy

// Default export with all helpers
export default {
    DateHelpers,
    StringHelpers,
    NumberHelpers,
    ArrayHelpers,
    UrlHelpers,
    StorageHelpers,
    TennisHelpers,
    ErrorHelpers,
    ValidationHelpers
}