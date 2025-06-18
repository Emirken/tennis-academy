import { computed, ref, reactive, watch, nextTick } from 'vue'
import { useStudentsStore } from '@/store/modules/students'
import { useAuthStore } from '@/store/modules/auth'
import type {
    StudentProfile,
    StudentActivity,
    StudentNote,
    StudentStats,
    StudentDocument,
    StudentPreferences
} from '@/store/modules/students'

// Interface for student form data
export interface StudentFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    emergencyContact: string
    dateOfBirth?: Date
    gender?: 'male' | 'female' | 'other'
    nationality?: string
    occupation?: string
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional'
    playingHand: 'right' | 'left' | 'ambidextrous'
    membershipType: 'basic' | 'premium' | 'vip'
    coachingPreferences?: string[]
    goals?: string[]
    medicalConditions?: string[]
    notes?: string
}

// Interface for student search/filter
export interface StudentFilter {
    membershipType?: StudentProfile['membershipType']
    membershipStatus?: StudentProfile['membershipStatus']
    paymentStatus?: StudentProfile['paymentStatus']
    skillLevel?: StudentProfile['skillLevel']
    hasDebt?: boolean
    joinedAfter?: Date
    joinedBefore?: Date
    search?: string
    activeOnly?: boolean
}

// Interface for student update
export interface StudentUpdateData {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    emergencyContact?: string
    skillLevel?: StudentProfile['skillLevel']
    membershipType?: StudentProfile['membershipType']
    membershipStatus?: StudentProfile['membershipStatus']
    paymentStatus?: StudentProfile['paymentStatus']
    totalDebt?: number
    creditBalance?: number
    preferences?: StudentProfile['preferences']
    notes?: string
}

// Interface for bulk operations
export interface BulkStudentOperation {
    operation: 'update_membership' | 'suspend' | 'reactivate' | 'send_notification' | 'export'
    studentIds: string[]
    data?: any
    reason?: string
}

// Interface for membership management
export interface MembershipData {
    type: StudentProfile['membershipType']
    startDate: Date
    endDate?: Date
    autoRenew?: boolean
    paymentMethod?: string
    notes?: string
}

// Interface for payment tracking
export interface PaymentData {
    amount: number
    type: 'membership' | 'lesson' | 'court_rental' | 'equipment' | 'late_fee'
    method: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer'
    description: string
    dueDate?: Date
    notes?: string
}

// Interface for communication
export interface NotificationData {
    type: 'email' | 'sms' | 'push'
    subject: string
    message: string
    urgent?: boolean
    scheduled?: Date
}

export function useStudents() {
    const studentsStore = useStudentsStore()
    const authStore = useAuthStore()

    // Local reactive state
    const isCreatingStudent = ref(false)
    const isUpdatingStudent = ref(false)
    const isDeletingStudent = ref(false)
    const isSuspendingStudent = ref(false)
    const isBulkOperating = ref(false)
    const isSendingNotification = ref(false)
    const isExporting = ref(false)

    // Form validation errors
    const validationErrors = ref<Record<string, string>>({})

    // Success/error messages
    const successMessage = ref('')
    const operationMessage = ref('')

    // Filter and search state
    const searchQuery = ref('')
    const activeFilters = reactive<StudentFilter>({})
    const sortBy = ref<'name' | 'joinDate' | 'membershipType' | 'paymentStatus' | 'attendanceRate'>('name')
    const sortOrder = ref<'asc' | 'desc'>('asc')

    // Selected students for bulk operations
    const selectedStudents = ref<string[]>([])

    // View state
    const viewMode = ref<'list' | 'grid' | 'table'>('table')
    const showInactive = ref(false)
    const showSuspended = ref(false)

    // Computed properties from store
    const students = computed(() => studentsStore.students)
    const activities = computed(() => studentsStore.activities)
    const notes = computed(() => studentsStore.notes)
    const loading = computed(() => studentsStore.loading)
    const error = computed(() => studentsStore.error)

    // Computed - filtered and sorted students
    const filteredStudents = computed(() => {
        let filtered = studentsStore.searchStudents(searchQuery.value, activeFilters)

        // Apply view filters
        if (!showInactive.value) {
            filtered = filtered.filter(s => s.membershipStatus !== 'inactive')
        }

        if (!showSuspended.value) {
            filtered = filtered.filter(s => s.membershipStatus !== 'suspended')
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortBy.value) {
                case 'name':
                    aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
                    bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
                    break
                case 'joinDate':
                    aValue = a.joinDate.getTime()
                    bValue = b.joinDate.getTime()
                    break
                case 'membershipType':
                    aValue = a.membershipType
                    bValue = b.membershipType
                    break
                case 'paymentStatus':
                    aValue = a.paymentStatus
                    bValue = b.paymentStatus
                    break
                case 'attendanceRate':
                    aValue = a.attendanceRate
                    bValue = b.attendanceRate
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

    // Computed - student statistics
    const studentStatistics = computed(() => studentsStore.getStudentStatistics())

    // Computed - categorized students
    const activeStudents = computed(() => studentsStore.activeStudents)
    const inactiveStudents = computed(() => studentsStore.inactiveStudents)
    const suspendedStudents = computed(() => studentsStore.suspendedStudents)
    const overdueStudents = computed(() => studentsStore.overdueStudents)
    const premiumMembers = computed(() => studentsStore.premiumMembers)
    const newStudentsThisMonth = computed(() => studentsStore.newStudentsThisMonth)
    const expiringMemberships = computed(() => studentsStore.expiringMemberships)

    // Computed - students needing attention
    const studentsNeedingAttention = computed(() => {
        const attention: Array<{ student: StudentProfile; reason: string; priority: 'high' | 'medium' | 'low' }> = []

        students.value.forEach(student => {
            // Overdue payments
            if (student.paymentStatus === 'overdue') {
                attention.push({
                    student,
                    reason: `Overdue payment: $${student.totalDebt}`,
                    priority: 'high'
                })
            }

            // Expiring memberships (within 7 days)
            if (student.membershipEndDate) {
                const daysUntilExpiry = Math.ceil((student.membershipEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                    attention.push({
                        student,
                        reason: `Membership expires in ${daysUntilExpiry} days`,
                        priority: 'medium'
                    })
                }
            }

            // Low attendance rate
            if (student.attendanceRate < 60 && student.totalLessons > 5) {
                attention.push({
                    student,
                    reason: `Low attendance rate: ${student.attendanceRate}%`,
                    priority: 'medium'
                })
            }

            // No recent activity (30+ days)
            if (student.lastActivityAt) {
                const daysSinceActivity = Math.ceil((new Date().getTime() - student.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
                if (daysSinceActivity >= 30) {
                    attention.push({
                        student,
                        reason: `No activity for ${daysSinceActivity} days`,
                        priority: 'low'
                    })
                }
            }
        })

        return attention.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    })

    // Validation functions
    const validateStudentForm = (data: StudentFormData): boolean => {
        const errors: Record<string, string> = {}

        // Required fields
        if (!data.firstName?.trim()) {
            errors.firstName = 'First name is required'
        } else if (data.firstName.length < 2) {
            errors.firstName = 'First name must be at least 2 characters'
        } else if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(data.firstName)) {
            errors.firstName = 'First name can only contain letters'
        }

        if (!data.lastName?.trim()) {
            errors.lastName = 'Last name is required'
        } else if (data.lastName.length < 2) {
            errors.lastName = 'Last name must be at least 2 characters'
        } else if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(data.lastName)) {
            errors.lastName = 'Last name can only contain letters'
        }

        if (!data.email?.trim()) {
            errors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Please enter a valid email address'
        }

        if (!data.phone?.trim()) {
            errors.phone = 'Phone number is required'
        } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(data.phone)) {
            errors.phone = 'Please enter a valid phone number'
        }

        if (!data.address?.trim()) {
            errors.address = 'Address is required'
        } else if (data.address.length < 10) {
            errors.address = 'Please enter a complete address'
        }

        if (!data.emergencyContact?.trim()) {
            errors.emergencyContact = 'Emergency contact is required'
        }

        if (!data.skillLevel) {
            errors.skillLevel = 'Skill level is required'
        }

        if (!data.playingHand) {
            errors.playingHand = 'Playing hand is required'
        }

        if (!data.membershipType) {
            errors.membershipType = 'Membership type is required'
        }

        // Optional field validations
        if (data.dateOfBirth) {
            const age = Math.floor((new Date().getTime() - data.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            if (age < 5 || age > 100) {
                errors.dateOfBirth = 'Please enter a valid date of birth'
            }
        }

        // Check for duplicate email (exclude current student if updating)
        const existingStudent = students.value.find(s => s.email === data.email)
        if (existingStudent) {
            errors.email = 'Email address is already registered'
        }

        validationErrors.value = errors
        return Object.keys(errors).length === 0
    }

    const validateMembershipData = (data: MembershipData): boolean => {
        const errors: Record<string, string> = {}

        if (!data.type) {
            errors.type = 'Membership type is required'
        }

        if (!data.startDate) {
            errors.startDate = 'Start date is required'
        }

        if (data.endDate && data.startDate && data.endDate <= data.startDate) {
            errors.endDate = 'End date must be after start date'
        }

        validationErrors.value = { ...validationErrors.value, ...errors }
        return Object.keys(errors).length === 0
    }

    // Student management actions
    const fetchStudents = async (filters?: StudentFilter, refresh = false) => {
        if (refresh) studentsStore.clearError()
        await studentsStore.fetchStudents(filters)
    }

    const fetchStudentActivities = async (studentId?: string, refresh = false) => {
        if (refresh) studentsStore.clearError()
        await studentsStore.fetchStudentActivities(studentId)
    }

    const fetchStudentNotes = async (studentId?: string, refresh = false) => {
        if (refresh) studentsStore.clearError()
        await studentsStore.fetchStudentNotes(studentId)
    }

    const createStudent = async (data: StudentFormData): Promise<StudentProfile | null> => {
        if (!validateStudentForm(data)) return null

        isCreatingStudent.value = true

        try {
            const studentData: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
                // Basic information
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                emergencyContact: data.emergencyContact,

                // Optional personal details
                alternateEmail: undefined,
                homePhone: undefined,
                workPhone: undefined,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                nationality: data.nationality,
                occupation: data.occupation,

                // Tennis information
                skillLevel: data.skillLevel,
                playingHand: data.playingHand,
                coachingPreferences: data.coachingPreferences || [],
                goals: data.goals || [],
                medicalConditions: data.medicalConditions || [],

                // Academy information
                role: 'student' as const,
                joinDate: new Date(),
                membershipStartDate: new Date(),
                membershipEndDate: undefined,
                membershipStatus: 'active',
                membershipType: data.membershipType,

                // Payment information
                paymentStatus: 'pending',
                lastPayment: new Date(), // Set to current date as initial payment date
                lastPaymentDate: undefined,
                nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                totalDebt: 0,
                creditBalance: 0,
                preferredPaymentMethod: undefined,

                // Activity statistics
                totalLessons: 0,
                attendedLessons: 0,
                cancelledLessons: 0,
                noShowLessons: 0,
                attendanceRate: 0,
                courtHours: 0,

                // Documents and files
                documents: [],
                photos: [],

                // Preferences and settings
                preferences: {
                    communicationMethod: 'email',
                    reminderSettings: {
                        lessonReminders: true,
                        paymentReminders: true,
                        eventNotifications: true,
                        promotionalEmails: false
                    },
                    privacySettings: {
                        profileVisible: true,
                        progressVisible: true,
                        contactInfoVisible: false
                    },
                    lessonPreferences: {
                        preferredInstructors: [],
                        preferredCourts: [],
                        preferredTimes: [],
                        groupLessons: true
                    }
                },

                // Timestamps
                lastLoginAt: undefined,
                lastActivityAt: undefined
            }

            const newStudent = await studentsStore.createStudent(studentData)
            successMessage.value = 'Student created successfully'

            // Clear form validation errors
            clearValidationErrors()

            return newStudent
        } catch (error: any) {
            console.error('Failed to create student:', error)
            return null
        } finally {
            isCreatingStudent.value = false
        }
    }

    const updateStudent = async (id: string, updates: StudentUpdateData): Promise<StudentProfile | null> => {
        isUpdatingStudent.value = true

        try {
            const updatedStudent = await studentsStore.updateStudent(id, updates)
            successMessage.value = 'Student updated successfully'
            return updatedStudent
        } catch (error: any) {
            console.error('Failed to update student:', error)
            return null
        } finally {
            isUpdatingStudent.value = false
        }
    }

    const deleteStudent = async (id: string): Promise<boolean> => {
        isDeletingStudent.value = true

        try {
            await studentsStore.deleteStudent(id)
            successMessage.value = 'Student deleted successfully'

            // Remove from selected students if present
            const index = selectedStudents.value.indexOf(id)
            if (index > -1) {
                selectedStudents.value.splice(index, 1)
            }

            return true
        } catch (error: any) {
            console.error('Failed to delete student:', error)
            return false
        } finally {
            isDeletingStudent.value = false
        }
    }

    const suspendStudent = async (id: string, reason: string): Promise<void> => {
        isSuspendingStudent.value = true

        try {
            await studentsStore.suspendStudent(id, reason)
            successMessage.value = 'Student suspended successfully'
        } catch (error: any) {
            console.error('Failed to suspend student:', error)
        } finally {
            isSuspendingStudent.value = false
        }
    }

    const reactivateStudent = async (id: string): Promise<void> => {
        try {
            await studentsStore.reactivateStudent(id)
            successMessage.value = 'Student reactivated successfully'
        } catch (error: any) {
            console.error('Failed to reactivate student:', error)
        }
    }

    // Notes management
    const addStudentNote = async (studentId: string, noteData: {
        title: string
        content: string
        type: 'general' | 'medical' | 'coaching' | 'payment' | 'disciplinary'
        priority: 'low' | 'medium' | 'high' | 'urgent'
        tags?: string[]
        isPrivate?: boolean
    }): Promise<StudentNote | null> => {
        try {
            const fullNoteData = {
                ...noteData,
                studentId,
                authorId: authStore.user?.id || 'system',
                authorName: authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'System',
                tags: noteData.tags || [],
                isPrivate: noteData.isPrivate || false
            }

            const newNote = await studentsStore.addStudentNote(fullNoteData)
            successMessage.value = 'Note added successfully'
            return newNote
        } catch (error: any) {
            console.error('Failed to add note:', error)
            return null
        }
    }

    const updateStudentNote = async (noteId: string, updates: Partial<StudentNote>): Promise<StudentNote | null> => {
        try {
            const updatedNote = await studentsStore.updateStudentNote(noteId, updates)
            successMessage.value = 'Note updated successfully'
            return updatedNote
        } catch (error: any) {
            console.error('Failed to update note:', error)
            return null
        }
    }

    const deleteStudentNote = async (noteId: string): Promise<void> => {
        try {
            await studentsStore.deleteStudentNote(noteId)
            successMessage.value = 'Note deleted successfully'
        } catch (error: any) {
            console.error('Failed to delete note:', error)
        }
    }

    // Membership management
    const updateMembership = async (studentId: string, membershipData: MembershipData): Promise<void> => {
        if (!validateMembershipData(membershipData)) return

        try {
            await studentsStore.updateStudent(studentId, {
                membershipType: membershipData.type,
                membershipStartDate: membershipData.startDate,
                membershipEndDate: membershipData.endDate
            })
            successMessage.value = 'Membership updated successfully'
        } catch (error: any) {
            console.error('Failed to update membership:', error)
        }
    }

    // Bulk operations
    const bulkUpdateMembership = async (studentIds: string[], membershipType: StudentProfile['membershipType']): Promise<void> => {
        isBulkOperating.value = true

        try {
            await studentsStore.bulkUpdateStudents(studentIds, { membershipType })
            operationMessage.value = `${studentIds.length} students' membership updated successfully`
            selectedStudents.value = []
        } catch (error: any) {
            console.error('Bulk membership update failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    const bulkSuspendStudents = async (studentIds: string[], reason: string): Promise<void> => {
        isBulkOperating.value = true

        try {
            for (const studentId of studentIds) {
                await studentsStore.suspendStudent(studentId, reason)
            }

            operationMessage.value = `${studentIds.length} students suspended successfully`
            selectedStudents.value = []
        } catch (error: any) {
            console.error('Bulk suspend failed:', error)
        } finally {
            isBulkOperating.value = false
        }
    }

    const sendBulkNotification = async (studentIds: string[], notification: NotificationData): Promise<void> => {
        isSendingNotification.value = true

        try {
            const result = await studentsStore.sendBulkNotification(studentIds, notification)
            operationMessage.value = `Notification sent to ${result.sent} students successfully`
            selectedStudents.value = []
        } catch (error: any) {
            console.error('Bulk notification failed:', error)
        } finally {
            isSendingNotification.value = false
        }
    }

    const exportStudents = async (format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<void> => {
        isExporting.value = true

        try {
            const result = await studentsStore.exportStudents(format, activeFilters)
            operationMessage.value = `${result.count} students exported as ${format.toUpperCase()}`
        } catch (error: any) {
            console.error('Export failed:', error)
        } finally {
            isExporting.value = false
        }
    }

    // Helper functions
    const getStudentById = (id: string): StudentProfile | undefined => {
        return studentsStore.getStudentById(id)
    }

    const getStudentsByInstructor = (instructorId: string): StudentProfile[] => {
        return studentsStore.getStudentsByInstructor(instructorId)
    }

    const getStudentFullName = (student: StudentProfile): string => {
        return `${student.firstName} ${student.lastName}`.trim()
    }

    const getStudentInitials = (student: StudentProfile): string => {
        return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase()
    }

    const getStudentAge = (student: StudentProfile): number | null => {
        if (!student.dateOfBirth) return null
        return Math.floor((new Date().getTime() - student.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    }

    const getMembershipColor = (membershipType: StudentProfile['membershipType']): string => {
        const colors = {
            basic: 'info',
            premium: 'warning',
            vip: 'error'
        }
        return colors[membershipType] || 'grey'
    }

    const getStatusColor = (status: StudentProfile['membershipStatus']): string => {
        const colors = {
            active: 'success',
            inactive: 'grey',
            suspended: 'error',
            expired: 'warning'
        }
        return colors[status] || 'grey'
    }

    const getPaymentStatusColor = (status: StudentProfile['paymentStatus']): string => {
        const colors = {
            paid: 'success',
            pending: 'warning',
            overdue: 'error'
        }
        return colors[status] || 'grey'
    }

    const calculateMembershipValue = (student: StudentProfile): number => {
        const membershipFees = {
            basic: 99,
            premium: 199,
            vip: 299
        }
        return membershipFees[student.membershipType] || 0
    }

    const getDaysUntilMembershipExpiry = (student: StudentProfile): number | null => {
        if (!student.membershipEndDate) return null
        return Math.ceil((student.membershipEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }

    // Filter and search functions
    const setFilter = (filter: Partial<StudentFilter>) => {
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

    const setViewMode = (mode: typeof viewMode.value) => {
        viewMode.value = mode
    }

    // Selection functions
    const toggleStudentSelection = (studentId: string) => {
        const index = selectedStudents.value.indexOf(studentId)
        if (index > -1) {
            selectedStudents.value.splice(index, 1)
        } else {
            selectedStudents.value.push(studentId)
        }
    }

    const selectAllStudents = () => {
        selectedStudents.value = filteredStudents.value.map(student => student.id)
    }

    const clearSelection = () => {
        selectedStudents.value = []
    }

    const isStudentSelected = (studentId: string): boolean => {
        return selectedStudents.value.includes(studentId)
    }

    // Utility functions
    const clearValidationErrors = () => {
        validationErrors.value = {}
    }

    const clearMessages = () => {
        successMessage.value = ''
        operationMessage.value = ''
        studentsStore.clearError()
    }

    const refreshData = async () => {
        await Promise.all([
            fetchStudents(activeFilters, true),
            fetchStudentActivities(undefined, true),
            fetchStudentNotes(undefined, true)
        ])
    }

    // Watch for filter changes
    watch(activeFilters, () => {
        clearSelection()
    }, { deep: true })

    // Watch for search query changes
    watch(searchQuery, () => {
        clearSelection()
    })

    return {
        // Store state
        students,
        activities,
        notes,
        loading,
        error,

        // Computed
        filteredStudents,
        studentStatistics,
        activeStudents,
        inactiveStudents,
        suspendedStudents,
        overdueStudents,
        premiumMembers,
        newStudentsThisMonth,
        expiringMemberships,
        studentsNeedingAttention,

        // Local state
        validationErrors,
        successMessage,
        operationMessage,
        searchQuery,
        activeFilters,
        sortBy,
        sortOrder,
        selectedStudents,
        viewMode,
        showInactive,
        showSuspended,

        // Loading states
        isCreatingStudent,
        isUpdatingStudent,
        isDeletingStudent,
        isSuspendingStudent,
        isBulkOperating,
        isSendingNotification,
        isExporting,

        // Actions
        fetchStudents,
        fetchStudentActivities,
        fetchStudentNotes,
        createStudent,
        updateStudent,
        deleteStudent,
        suspendStudent,
        reactivateStudent,

        // Notes management
        addStudentNote,
        updateStudentNote,
        deleteStudentNote,

        // Membership management
        updateMembership,

        // Bulk operations
        bulkUpdateMembership,
        bulkSuspendStudents,
        sendBulkNotification,
        exportStudents,

        // Helpers
        getStudentById,
        getStudentsByInstructor,
        getStudentFullName,
        getStudentInitials,
        getStudentAge,
        getMembershipColor,
        getStatusColor,
        getPaymentStatusColor,
        calculateMembershipValue,
        getDaysUntilMembershipExpiry,

        // Filters and search
        setFilter,
        clearFilters,
        setSorting,
        setViewMode,

        // Selection
        toggleStudentSelection,
        selectAllStudents,
        clearSelection,
        isStudentSelected,

        // Validation
        validateStudentForm,
        validateMembershipData,

        // Utilities
        clearValidationErrors,
        clearMessages,
        refreshData
    }
}