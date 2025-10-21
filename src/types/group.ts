// src/types/group.ts

export interface ScheduleSlot {
    day: string
    time: string
}

export interface GroupMember {
    id: string
    name: string
    email: string
}

export interface Group {
    id?: string
    name: string
    membershipType: string
    maxCapacity: number
    description?: string
    schedule: ScheduleSlot[]
    members: GroupMember[]
    createdAt?: Date
    updatedAt?: Date
}

export const MEMBERSHIP_TYPES = {
    PRIVATE_GROUP_3: 'private_group_3_8',
    PRIVATE_GROUP_4: 'private_group_4_8',
    ADULT_GROUP: 'adult_group',
    TENNIS_SCHOOL_AGE: 'tennis_school_age',
    TENNIS_SCHOOL_PERFORMANCE: 'tennis_school_performance'
} as const

export const MEMBERSHIP_CAPACITIES: Record<string, number> = {
    [MEMBERSHIP_TYPES.PRIVATE_GROUP_3]: 3,
    [MEMBERSHIP_TYPES.PRIVATE_GROUP_4]: 4,
    [MEMBERSHIP_TYPES.ADULT_GROUP]: 8,
    [MEMBERSHIP_TYPES.TENNIS_SCHOOL_AGE]: 6,
    [MEMBERSHIP_TYPES.TENNIS_SCHOOL_PERFORMANCE]: 8
}

export const WEEKDAYS = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar'
] as const