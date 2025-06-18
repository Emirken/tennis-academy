export interface Attendance {
    id: string
    studentId: string
    date: Date
    present: boolean
    lessonType: string
    notes?: string
    recordedBy: string
}
