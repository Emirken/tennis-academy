import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Student } from '@/types/student'

// Enhanced Student interfaces for store
export interface StudentProfile extends Student {
    // Contact Information
    alternateEmail?: string
    homePhone?: string
    workPhone?: string

    // Personal Details
    dateOfBirth?: Date
    gender?: 'male' | 'female' | 'other'
    nationality?: string
    occupation?: string

    // Tennis Information
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional'
    playingHand: 'right' | 'left' | 'ambidextrous'
    coachingPreferences?: string[]
    goals?: string[]
    medicalConditions?: string[]

    // Academy Information
    joinDate: Date
    membershipStartDate: Date
    membershipEndDate?: Date
    membershipStatus: 'active' | 'inactive' | 'suspended' | 'expired'
    membershipType: 'basic' | 'premium' | 'vip'

    // Payment Information
    paymentStatus: 'paid' | 'pending' | 'overdue'
    lastPaymentDate?: Date
    nextPaymentDue: Date
    totalDebt: number
    creditBalance: number
    preferredPaymentMethod?: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash'

    // Activity Statistics
    totalLessons: number
    attendedLessons: number
    cancelledLessons: number
    noShowLessons: number
    attendanceRate: number
    courtHours: number

    // Documents and Files
    documents: StudentDocument[]
    photos: StudentPhoto[]

    // Preferences and Settings
    preferences: StudentPreferences

    // Timestamps
    createdAt: Date
    updatedAt: Date
    lastLoginAt?: Date
    lastActivityAt?: Date
}

export interface StudentDocument {
    id: string
    type: 'medical_certificate' | 'insurance' | 'waiver' | 'id_copy' | 'other'
    name: string
    url: string
    uploadedAt: Date
    expiryDate?: Date
    verified: boolean
}

export interface StudentPhoto {
    id: string
    type: 'profile' | 'progress' | 'certificate' | 'event'
    url: string
    caption?: string
    uploadedAt: Date
}

export interface StudentPreferences {
    communicationMethod: 'email' | 'sms' | 'phone' | 'app'
    reminderSettings: {
        lessonReminders: boolean
        paymentReminders: boolean
        eventNotifications: boolean
        promotionalEmails: boolean
    }
    privacySettings: {
        profileVisible: boolean
        progressVisible: boolean
        contactInfoVisible: boolean
    }
    lessonPreferences: {
        preferredInstructors: string[]
        preferredCourts: string[]
        preferredTimes: string[]
        groupLessons: boolean
    }
}

export interface StudentActivity {
    id: string
    studentId: string
    type: 'lesson' | 'court_rental' | 'payment' | 'registration' | 'update' | 'login'
    description: string
    details?: Record<string, any>
    timestamp: Date
    ipAddress?: string
    userAgent?: string
}

export interface StudentNote {
    id: string
    studentId: string
    authorId: string
    authorName: string
    type: 'general' | 'medical' | 'coaching' | 'payment' | 'disciplinary'
    title: string
    content: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    tags: string[]
    isPrivate: boolean
    createdAt: Date
    updatedAt: Date
}

export interface StudentStats {
    totalStudents: number
    activeStudents: number
    newStudentsThisMonth: number
    newStudentsLastMonth: number
    membershipBreakdown: Record<string, number>
    statusBreakdown: Record<string, number>
    paymentStatusBreakdown: Record<string, number>
    skillLevelBreakdown: Record<string, number>
    averageAttendanceRate: number
    totalRevenue: number
    averageRevenuePerStudent: number
    retentionRate: number
    churnRate: number
    topPerformingStudents: Array<{
        studentId: string
        name: string
        attendanceRate: number
        totalLessons: number
    }>
    recentActivities: StudentActivity[]
    upcomingExpirations: Array<{
        studentId: string
        name: string
        expiryDate: Date
        type: 'membership' | 'document'
    }>
}

export const useStudentsStore = defineStore('students', () => {
    // State
    const students = ref<StudentProfile[]>([])
    const activities = ref<StudentActivity[]>([])
    const notes = ref<StudentNote[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const activeStudents = computed(() =>
        students.value.filter(student => student.membershipStatus === 'active')
    )

    const inactiveStudents = computed(() =>
        students.value.filter(student => student.membershipStatus === 'inactive')
    )

    const suspendedStudents = computed(() =>
        students.value.filter(student => student.membershipStatus === 'suspended')
    )

    const overdueStudents = computed(() =>
        students.value.filter(student => student.paymentStatus === 'overdue')
    )

    const premiumMembers = computed(() =>
        students.value.filter(student => student.membershipType === 'premium' || student.membershipType === 'vip')
    )

    const newStudentsThisMonth = computed(() => {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return students.value.filter(student => student.joinDate >= firstDayOfMonth)
    })

    const expiringMemberships = computed(() => {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        return students.value.filter(student =>
            student.membershipEndDate &&
            student.membershipEndDate <= nextMonth &&
            student.membershipStatus === 'active'
        )
    })

    const studentsWithOverduePayments = computed(() =>
        students.value.filter(student => student.totalDebt > 0)
    )

    // Actions
    const fetchStudents = async (filters?: {
        membershipType?: StudentProfile['membershipType']
        membershipStatus?: StudentProfile['membershipStatus']
        paymentStatus?: StudentProfile['paymentStatus']
        skillLevel?: StudentProfile['skillLevel']
        search?: string
        createdAfter?: Date
        createdBefore?: Date
    }) => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock students data
            const mockStudents: StudentProfile[] = [
                {
                    id: 'student_001',
                    firstName: 'Ahmet',
                    lastName: 'Yılmaz',
                    email: 'ahmet@example.com',
                    phone: '+90 555 123 4567',
                    address: 'Atatürk Mah. Cumhuriyet Cad. No:15 Urla/İzmir',
                    emergencyContact: '+90 555 987 6543',

                    // Enhanced fields
                    alternateEmail: 'ahmet.yilmaz@work.com',
                    homePhone: '+90 232 123 4567',
                    dateOfBirth: new Date('1985-03-15'),
                    gender: 'male',
                    nationality: 'Turkish',
                    occupation: 'Software Engineer',
                    lastPayment: new Date('2025-05-01'),
                    skillLevel: 'intermediate',
                    playingHand: 'right',
                    coachingPreferences: ['individual_focus', 'technique_improvement'],
                    goals: ['Improve serve', 'Tournament preparation'],
                    medicalConditions: [],

                    joinDate: new Date('2024-01-15'),
                    membershipStartDate: new Date('2024-01-15'),
                    membershipEndDate: new Date('2025-01-15'),
                    membershipStatus: 'active',
                    membershipType: 'premium',

                    paymentStatus: 'paid',
                    lastPaymentDate: new Date('2025-05-01'),
                    nextPaymentDue: new Date('2025-06-01'),
                    totalDebt: 0,
                    creditBalance: 50,
                    preferredPaymentMethod: 'credit_card',

                    totalLessons: 45,
                    attendedLessons: 42,
                    cancelledLessons: 2,
                    noShowLessons: 1,
                    attendanceRate: 93.3,
                    courtHours: 67.5,

                    documents: [
                        {
                            id: 'doc_001',
                            type: 'medical_certificate',
                            name: 'Medical Certificate 2024',
                            url: '/documents/medical_cert_ahmet.pdf',
                            uploadedAt: new Date('2024-01-10'),
                            expiryDate: new Date('2025-01-10'),
                            verified: true
                        }
                    ],
                    photos: [
                        {
                            id: 'photo_001',
                            type: 'profile',
                            url: '/photos/ahmet_profile.jpg',
                            uploadedAt: new Date('2024-01-15')
                        }
                    ],

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
                            preferredInstructors: ['instructor_001'],
                            preferredCourts: ['court_001'],
                            preferredTimes: ['09:00', '10:00'],
                            groupLessons: false
                        }
                    },

                    role: 'student',
                    createdAt: new Date('2024-01-15'),
                    updatedAt: new Date('2025-05-01'),
                    lastLoginAt: new Date('2025-06-03'),
                    lastActivityAt: new Date('2025-06-02')
                },
                {
                    id: 'student_002',
                    firstName: 'Ayşe',
                    lastName: 'Demir',
                    email: 'ayse@example.com',
                    phone: '+90 555 234 5678',
                    address: 'Yeni Mah. İstiklal Cad. No:28 Urla/İzmir',
                    emergencyContact: '+90 555 876 5432',

                    dateOfBirth: new Date('1990-07-22'),
                    gender: 'female',
                    nationality: 'Turkish',
                    occupation: 'Doctor',
                    lastPayment: new Date('2025-05-01'),
                    skillLevel: 'beginner',
                    playingHand: 'right',
                    coachingPreferences: ['patient_instructor', 'basic_techniques'],
                    goals: ['Learn basics', 'Fitness improvement'],
                    medicalConditions: [],

                    joinDate: new Date('2024-03-22'),
                    membershipStartDate: new Date('2024-03-22'),
                    membershipEndDate: new Date('2025-03-22'),
                    membershipStatus: 'active',
                    membershipType: 'basic',

                    paymentStatus: 'pending',
                    lastPaymentDate: new Date('2025-04-01'),
                    nextPaymentDue: new Date('2025-06-01'),
                    totalDebt: 150,
                    creditBalance: 0,

                    totalLessons: 20,
                    attendedLessons: 18,
                    cancelledLessons: 1,
                    noShowLessons: 1,
                    attendanceRate: 90.0,
                    courtHours: 30,

                    documents: [],
                    photos: [],

                    preferences: {
                        communicationMethod: 'sms',
                        reminderSettings: {
                            lessonReminders: true,
                            paymentReminders: true,
                            eventNotifications: false,
                            promotionalEmails: true
                        },
                        privacySettings: {
                            profileVisible: false,
                            progressVisible: true,
                            contactInfoVisible: false
                        },
                        lessonPreferences: {
                            preferredInstructors: [],
                            preferredCourts: ['court_002'],
                            preferredTimes: ['14:00', '15:00'],
                            groupLessons: true
                        }
                    },

                    role: 'student',
                    createdAt: new Date('2024-03-22'),
                    updatedAt: new Date('2025-05-15'),
                    lastLoginAt: new Date('2025-06-01'),
                    lastActivityAt: new Date('2025-05-30')
                },
                {
                    id: 'student_003',
                    firstName: 'Mehmet',
                    lastName: 'Kaya',
                    email: 'mehmet@example.com',
                    phone: '+90 555 345 6789',
                    address: 'Çeşme Yolu No:42 Urla/İzmir',
                    emergencyContact: '+90 555 765 4321',

                    dateOfBirth: new Date('1978-11-10'),
                    gender: 'male',
                    nationality: 'Turkish',
                    occupation: 'Business Owner',
                    lastPayment: new Date('2025-05-01'),
                    skillLevel: 'advanced',
                    playingHand: 'left',
                    coachingPreferences: ['strategy_focus', 'match_play'],
                    goals: ['Tournament participation', 'Advanced techniques'],
                    medicalConditions: ['Previous knee injury'],

                    joinDate: new Date('2023-11-10'),
                    membershipStartDate: new Date('2023-11-10'),
                    membershipEndDate: new Date('2024-11-10'),
                    membershipStatus: 'active',
                    membershipType: 'vip',

                    paymentStatus: 'paid',
                    lastPaymentDate: new Date('2025-05-01'),
                    nextPaymentDue: new Date('2025-06-01'),
                    totalDebt: 0,
                    creditBalance: 200,

                    totalLessons: 85,
                    attendedLessons: 80,
                    cancelledLessons: 3,
                    noShowLessons: 2,
                    attendanceRate: 94.1,
                    courtHours: 127.5,

                    documents: [
                        {
                            id: 'doc_002',
                            type: 'medical_certificate',
                            name: 'Medical Certificate with Knee Note',
                            url: '/documents/medical_cert_mehmet.pdf',
                            uploadedAt: new Date('2023-11-05'),
                            expiryDate: new Date('2024-11-05'),
                            verified: true
                        }
                    ],
                    photos: [],

                    preferences: {
                        communicationMethod: 'phone',
                        reminderSettings: {
                            lessonReminders: false,
                            paymentReminders: true,
                            eventNotifications: true,
                            promotionalEmails: false
                        },
                        privacySettings: {
                            profileVisible: true,
                            progressVisible: true,
                            contactInfoVisible: true
                        },
                        lessonPreferences: {
                            preferredInstructors: ['instructor_002', 'instructor_003'],
                            preferredCourts: ['court_001', 'court_003'],
                            preferredTimes: ['16:00', '17:00', '18:00'],
                            groupLessons: false
                        }
                    },

                    role: 'student',
                    createdAt: new Date('2023-11-10'),
                    updatedAt: new Date('2025-05-20'),
                    lastLoginAt: new Date('2025-06-02'),
                    lastActivityAt: new Date('2025-06-01')
                },
                {
                    id: 'student_004',
                    firstName: 'Fatma',
                    lastName: 'Özkan',
                    email: 'fatma@example.com',
                    phone: '+90 555 456 7890',
                    address: 'Foça Yolu Km.5 Urla/İzmir',
                    emergencyContact: '+90 555 654 3210',

                    dateOfBirth: new Date('1992-04-18'),
                    gender: 'female',
                    nationality: 'Turkish',
                    occupation: 'Teacher',
                    lastPayment: new Date('2025-05-01'),
                    skillLevel: 'intermediate',
                    playingHand: 'right',
                    coachingPreferences: ['fitness_focus', 'consistency'],
                    goals: ['Improve fitness', 'Consistent play'],
                    medicalConditions: [],

                    joinDate: new Date('2024-02-05'),
                    membershipStartDate: new Date('2024-02-05'),
                    membershipEndDate: new Date('2025-02-05'),
                    membershipStatus: 'suspended',
                    membershipType: 'premium',

                    paymentStatus: 'overdue',
                    lastPaymentDate: new Date('2025-03-01'),
                    nextPaymentDue: new Date('2025-05-01'),
                    totalDebt: 320,
                    creditBalance: 0,

                    totalLessons: 25,
                    attendedLessons: 20,
                    cancelledLessons: 4,
                    noShowLessons: 1,
                    attendanceRate: 80.0,
                    courtHours: 37.5,

                    documents: [],
                    photos: [],

                    preferences: {
                        communicationMethod: 'email',
                        reminderSettings: {
                            lessonReminders: true,
                            paymentReminders: true,
                            eventNotifications: false,
                            promotionalEmails: false
                        },
                        privacySettings: {
                            profileVisible: false,
                            progressVisible: false,
                            contactInfoVisible: false
                        },
                        lessonPreferences: {
                            preferredInstructors: [],
                            preferredCourts: [],
                            preferredTimes: ['10:00', '11:00'],
                            groupLessons: true
                        }
                    },

                    role: 'student',
                    createdAt: new Date('2024-02-05'),
                    updatedAt: new Date('2025-04-15'),
                    lastLoginAt: new Date('2025-04-10'),
                    lastActivityAt: new Date('2025-04-08')
                }
            ]

            // Apply filters if provided
            let filteredStudents = mockStudents

            if (filters) {
                if (filters.membershipType) {
                    filteredStudents = filteredStudents.filter(s => s.membershipType === filters.membershipType)
                }
                if (filters.membershipStatus) {
                    filteredStudents = filteredStudents.filter(s => s.membershipStatus === filters.membershipStatus)
                }
                if (filters.paymentStatus) {
                    filteredStudents = filteredStudents.filter(s => s.paymentStatus === filters.paymentStatus)
                }
                if (filters.skillLevel) {
                    filteredStudents = filteredStudents.filter(s => s.skillLevel === filters.skillLevel)
                }
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase()
                    filteredStudents = filteredStudents.filter(s =>
                        s.firstName.toLowerCase().includes(searchTerm) ||
                        s.lastName.toLowerCase().includes(searchTerm) ||
                        s.email.toLowerCase().includes(searchTerm) ||
                        s.phone.includes(searchTerm)
                    )
                }
                if (filters.createdAfter) {
                    filteredStudents = filteredStudents.filter(s => s.createdAt >= filters.createdAfter!)
                }
                if (filters.createdBefore) {
                    filteredStudents = filteredStudents.filter(s => s.createdAt <= filters.createdBefore!)
                }
            }

            students.value = filteredStudents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        } catch (err: any) {
            error.value = err.message || 'Failed to fetch students'
        } finally {
            loading.value = false
        }
    }

    const fetchStudentActivities = async (studentId?: string) => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockActivities: StudentActivity[] = [
                {
                    id: 'activity_001',
                    studentId: 'student_001',
                    type: 'lesson',
                    description: 'Completed private tennis lesson',
                    details: { instructor: 'Coach Smith', duration: 60, court: 'Court 1' },
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
                },
                {
                    id: 'activity_002',
                    studentId: 'student_001',
                    type: 'payment',
                    description: 'Monthly membership payment processed',
                    details: { amount: 199, method: 'credit_card' },
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                },
                {
                    id: 'activity_003',
                    studentId: 'student_002',
                    type: 'court_rental',
                    description: 'Booked court for practice session',
                    details: { court: 'Court 2', duration: 90 },
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 'activity_004',
                    studentId: 'student_001',
                    type: 'login',
                    description: 'Logged into mobile app',
                    details: { device: 'mobile', os: 'iOS' },
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    ipAddress: '192.168.1.100',
                    userAgent: 'Tennis Academy App iOS/1.2.0'
                }
            ]

            if (studentId) {
                activities.value = mockActivities.filter(a => a.studentId === studentId)
            } else {
                activities.value = mockActivities
            }

        } catch (err: any) {
            error.value = err.message || 'Failed to fetch activities'
        } finally {
            loading.value = false
        }
    }

    const fetchStudentNotes = async (studentId?: string) => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const mockNotes: StudentNote[] = [
                {
                    id: 'note_001',
                    studentId: 'student_001',
                    authorId: 'instructor_001',
                    authorName: 'Coach Smith',
                    type: 'coaching',
                    title: 'Backhand Improvement Progress',
                    content: 'Student has shown significant improvement in backhand technique. Recommend continuing with current training plan.',
                    priority: 'medium',
                    tags: ['technique', 'backhand', 'progress'],
                    isPrivate: false,
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 'note_002',
                    studentId: 'student_003',
                    authorId: 'admin_001',
                    authorName: 'Academy Admin',
                    type: 'medical',
                    title: 'Knee Injury Note',
                    content: 'Student has previous knee injury. Instructor should be aware and modify training accordingly.',
                    priority: 'high',
                    tags: ['medical', 'knee', 'injury'],
                    isPrivate: true,
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            ]

            if (studentId) {
                notes.value = mockNotes.filter(n => n.studentId === studentId)
            } else {
                notes.value = mockNotes
            }

        } catch (err: any) {
            error.value = err.message || 'Failed to fetch notes'
        } finally {
            loading.value = false
        }
    }

    const createStudent = async (studentData: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentProfile> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const newStudent: StudentProfile = {
                ...studentData,
                id: `student_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            students.value.unshift(newStudent)
            return newStudent
        } catch (err: any) {
            error.value = err.message || 'Failed to create student'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateStudent = async (id: string, updates: Partial<StudentProfile>): Promise<StudentProfile> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = students.value.findIndex(s => s.id === id)
            if (index === -1) {
                throw new Error('Student not found')
            }

            const updatedStudent = {
                ...students.value[index],
                ...updates,
                updatedAt: new Date()
            }

            students.value[index] = updatedStudent
            return updatedStudent
        } catch (err: any) {
            error.value = err.message || 'Failed to update student'
            throw err
        } finally {
            loading.value = false
        }
    }

    const deleteStudent = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = students.value.findIndex(s => s.id === id)
            if (index === -1) {
                throw new Error('Student not found')
            }

            students.value.splice(index, 1)
        } catch (err: any) {
            error.value = err.message || 'Failed to delete student'
            throw err
        } finally {
            loading.value = false
        }
    }

    const suspendStudent = async (id: string, reason: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const student = students.value.find(s => s.id === id)
            if (!student) {
                throw new Error('Student not found')
            }

            await updateStudent(id, {
                membershipStatus: 'suspended'
            })

            // Add activity log
            activities.value.unshift({
                id: `activity_${Date.now()}`,
                studentId: id,
                type: 'update',
                description: `Student account suspended: ${reason}`,
                details: { reason, previousStatus: student.membershipStatus },
                timestamp: new Date()
            })

        } catch (err: any) {
            error.value = err.message || 'Failed to suspend student'
            throw err
        } finally {
            loading.value = false
        }
    }

    const reactivateStudent = async (id: string): Promise<void> => {
        await updateStudent(id, {
            membershipStatus: 'active'
        })

        // Add activity log
        activities.value.unshift({
            id: `activity_${Date.now()}`,
            studentId: id,
            type: 'update',
            description: 'Student account reactivated',
            details: {},
            timestamp: new Date()
        })
    }

    const addStudentNote = async (noteData: Omit<StudentNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentNote> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const newNote: StudentNote = {
                ...noteData,
                id: `note_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            notes.value.unshift(newNote)
            return newNote
        } catch (err: any) {
            error.value = err.message || 'Failed to add note'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateStudentNote = async (id: string, updates: Partial<StudentNote>): Promise<StudentNote> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const index = notes.value.findIndex(n => n.id === id)
            if (index === -1) {
                throw new Error('Note not found')
            }

            const updatedNote = {
                ...notes.value[index],
                ...updates,
                updatedAt: new Date()
            }

            notes.value[index] = updatedNote
            return updatedNote
        } catch (err: any) {
            error.value = err.message || 'Failed to update note'
            throw err
        } finally {
            loading.value = false
        }
    }

    const deleteStudentNote = async (id: string): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const index = notes.value.findIndex(n => n.id === id)
            if (index === -1) {
                throw new Error('Note not found')
            }

            notes.value.splice(index, 1)
        } catch (err: any) {
            error.value = err.message || 'Failed to delete note'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getStudentById = (id: string): StudentProfile | undefined => {
        return students.value.find(student => student.id === id)
    }

    const getStudentsByInstructor = (instructorId: string) => {
        return students.value.filter(student =>
            student.preferences.lessonPreferences.preferredInstructors.includes(instructorId)
        )
    }

    const getStudentStatistics = (): StudentStats => {
        const total = students.value.length
        const active = activeStudents.value.length
        const newThisMonth = newStudentsThisMonth.value.length

        // Calculate new students last month
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const firstDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
        const lastDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        const newLastMonth = students.value.filter(student =>
            student.joinDate >= firstDayLastMonth && student.joinDate <= lastDayLastMonth
        ).length

        // Membership breakdown
        const membershipTypes = ['basic', 'premium', 'vip']
        const membershipBreakdown = membershipTypes.reduce((acc, type) => {
            acc[type] = students.value.filter(s => s.membershipType === type).length
            return acc
        }, {} as Record<string, number>)

        // Status breakdown
        const statuses = ['active', 'inactive', 'suspended', 'expired']
        const statusBreakdown = statuses.reduce((acc, status) => {
            acc[status] = students.value.filter(s => s.membershipStatus === status).length
            return acc
        }, {} as Record<string, number>)

        // Payment status breakdown
        const paymentStatuses = ['paid', 'pending', 'overdue']
        const paymentStatusBreakdown = paymentStatuses.reduce((acc, status) => {
            acc[status] = students.value.filter(s => s.paymentStatus === status).length
            return acc
        }, {} as Record<string, number>)

        // Skill level breakdown
        const skillLevels = ['beginner', 'intermediate', 'advanced', 'professional']
        const skillLevelBreakdown = skillLevels.reduce((acc, level) => {
            acc[level] = students.value.filter(s => s.skillLevel === level).length
            return acc
        }, {} as Record<string, number>)

        // Average attendance rate
        const totalAttendanceRates = students.value.reduce((sum, s) => sum + s.attendanceRate, 0)
        const averageAttendanceRate = total > 0 ? totalAttendanceRates / total : 0

        // Revenue calculations
        const totalRevenue = students.value.reduce((sum, s) => {
            const membershipFees = {
                basic: 99,
                premium: 199,
                vip: 299
            }
            return sum + (membershipFees[s.membershipType] || 0)
        }, 0)

        const averageRevenuePerStudent = total > 0 ? totalRevenue / total : 0

        // Retention and churn rates (simplified calculation)
        const retentionRate = total > 0 ? (active / total) * 100 : 0
        const churnRate = 100 - retentionRate

        // Top performing students
        const topPerformingStudents = students.value
            .filter(s => s.totalLessons > 0)
            .sort((a, b) => b.attendanceRate - a.attendanceRate)
            .slice(0, 5)
            .map(s => ({
                studentId: s.id,
                name: `${s.firstName} ${s.lastName}`,
                attendanceRate: s.attendanceRate,
                totalLessons: s.totalLessons
            }))

        // Recent activities (last 10)
        const recentActivities = activities.value
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10)

        // Upcoming expirations
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        const upcomingExpirations = students.value
            .filter(s => s.membershipEndDate && s.membershipEndDate <= nextMonth)
            .map(s => ({
                studentId: s.id,
                name: `${s.firstName} ${s.lastName}`,
                expiryDate: s.membershipEndDate!,
                type: 'membership' as const
            }))
            .concat(
                students.value.flatMap((s:any) =>
                    s.documents
                        .filter((d:any) => d.expiryDate && d.expiryDate <= nextMonth)
                        .map((d:any) => ({
                            studentId: s.id,
                            name: `${s.firstName} ${s.lastName}`,
                            expiryDate: d.expiryDate!,
                            type: 'document' as const
                        }))
                )
            )
            .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())

        return {
            totalStudents: total,
            activeStudents: active,
            newStudentsThisMonth: newThisMonth,
            newStudentsLastMonth: newLastMonth,
            membershipBreakdown,
            statusBreakdown,
            paymentStatusBreakdown,
            skillLevelBreakdown,
            averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
            totalRevenue,
            averageRevenuePerStudent: Math.round(averageRevenuePerStudent * 100) / 100,
            retentionRate: Math.round(retentionRate * 100) / 100,
            churnRate: Math.round(churnRate * 100) / 100,
            topPerformingStudents,
            recentActivities,
            upcomingExpirations
        }
    }

    const searchStudents = (query: string, filters?: {
        membershipType?: StudentProfile['membershipType']
        membershipStatus?: StudentProfile['membershipStatus']
        paymentStatus?: StudentProfile['paymentStatus']
        skillLevel?: StudentProfile['skillLevel']
        hasDebt?: boolean
        joinedAfter?: Date
        joinedBefore?: Date
    }) => {
        let filtered = students.value

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase()
            filtered = filtered.filter(student =>
                student.firstName.toLowerCase().includes(searchTerm) ||
                student.lastName.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm) ||
                student.phone.includes(searchTerm) ||
                student.address.toLowerCase().includes(searchTerm) ||
                (student.occupation && student.occupation.toLowerCase().includes(searchTerm))
            )
        }

        // Apply filters
        if (filters) {
            if (filters.membershipType) {
                filtered = filtered.filter(student => student.membershipType === filters.membershipType)
            }
            if (filters.membershipStatus) {
                filtered = filtered.filter(student => student.membershipStatus === filters.membershipStatus)
            }
            if (filters.paymentStatus) {
                filtered = filtered.filter(student => student.paymentStatus === filters.paymentStatus)
            }
            if (filters.skillLevel) {
                filtered = filtered.filter(student => student.skillLevel === filters.skillLevel)
            }
            if (filters.hasDebt !== undefined) {
                filtered = filtered.filter(student =>
                    filters.hasDebt ? student.totalDebt > 0 : student.totalDebt === 0
                )
            }
            if (filters.joinedAfter) {
                filtered = filtered.filter(student => student.joinDate >= filters.joinedAfter!)
            }
            if (filters.joinedBefore) {
                filtered = filtered.filter(student => student.joinDate <= filters.joinedBefore!)
            }
        }

        return filtered
    }

    const bulkUpdateStudents = async (studentIds: string[], updates: Partial<StudentProfile>): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            studentIds.forEach(id => {
                const index = students.value.findIndex(s => s.id === id)
                if (index !== -1) {
                    students.value[index] = {
                        ...students.value[index],
                        ...updates,
                        updatedAt: new Date()
                    }
                }
            })
        } catch (err: any) {
            error.value = err.message || 'Failed to bulk update students'
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportStudents = async (format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: any) => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            // In a real application, this would generate and download the file
            const exportData = searchStudents('', filters)
            console.log(`Exporting ${exportData.length} students as ${format}`)

            return {
                format,
                count: exportData.length,
                downloadUrl: `/exports/students_${Date.now()}.${format}`
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to export students'
            throw err
        } finally {
            loading.value = false
        }
    }

    const sendBulkNotification = async (studentIds: string[], notification: {
        type: 'email' | 'sms' | 'push'
        subject: string
        message: string
        urgent?: boolean
    }) => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            // In a real application, this would send actual notifications
            const targetStudents = students.value.filter(s => studentIds.includes(s.id))

            // Log activity for each student
            targetStudents.forEach(student => {
                activities.value.unshift({
                    id: `activity_${Date.now()}_${student.id}`,
                    studentId: student.id,
                    type: 'update',
                    description: `${notification.type.toUpperCase()} notification sent: ${notification.subject}`,
                    details: {
                        type: notification.type,
                        subject: notification.subject,
                        message: notification.message,
                        urgent: notification.urgent || false
                    },
                    timestamp: new Date()
                })
            })

            return {
                sent: targetStudents.length,
                failed: 0,
                type: notification.type
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to send notifications'
            throw err
        } finally {
            loading.value = false
        }
    }

    const clearError = () => {
        error.value = null
    }

    const reset = () => {
        students.value = []
        activities.value = []
        notes.value = []
        loading.value = false
        error.value = null
    }

    return {
        // State
        students,
        activities,
        notes,
        loading,
        error,

        // Getters
        activeStudents,
        inactiveStudents,
        suspendedStudents,
        overdueStudents,
        premiumMembers,
        newStudentsThisMonth,
        expiringMemberships,
        studentsWithOverduePayments,

        // Actions
        fetchStudents,
        fetchStudentActivities,
        fetchStudentNotes,
        createStudent,
        updateStudent,
        deleteStudent,
        suspendStudent,
        reactivateStudent,
        addStudentNote,
        updateStudentNote,
        deleteStudentNote,
        getStudentById,
        getStudentsByInstructor,
        getStudentStatistics,
        searchStudents,
        bulkUpdateStudents,
        exportStudents,
        sendBulkNotification,
        clearError,
        reset
    }
})