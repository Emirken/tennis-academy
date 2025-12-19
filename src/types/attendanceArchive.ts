// Attendance Archive Types for Tennis Academy
// Bu dosya yoklama arşivleme sisteminin tip tanımlamalarını içerir

export interface AttendanceRecord {
  date: Date
  present: boolean
  lessonNumber: number
}

export interface AttendanceArchive {
  id: string
  studentId: string
  studentName: string              // Snapshot - öğrenci silinse bile kalır
  groupId?: string
  groupName?: string               // Snapshot - grup silinse bile kalır
  membershipType?: string
  attendanceRecords: AttendanceRecord[]
  totalLessons: number
  attendedCount: number
  percentage: number
  archivedAt: Date                 // Arşivleme tarihi
  archiveReason: ArchiveReason
  expiresAt: Date                  // 3 ay sonrası (silme tarihi)
  exportedToExcel: boolean
  year: number                     // Yoklama yılı
  month: number                    // Yoklama ayı
}

export type ArchiveReason = 'student_deleted' | 'removed_from_group' | 'group_changed' | 'group_deleted'

export interface ArchiveWarningData {
  studentId: string
  studentName: string
  groupId?: string
  groupName?: string
  hasAttendanceHistory: boolean
  attendanceCount: number
  archiveReason: ArchiveReason
}

export interface ExcelExportData {
  studentName: string
  records: {
    date: string
    present: string
    lessonNumber: number
  }[]
  summary: {
    totalLessons: number
    attendedCount: number
    absentCount: number
    percentage: number
  }
}

export interface PendingArchiveNotification {
  id: string
  studentName: string
  groupName?: string
  expiresAt: Date
  daysRemaining: number
  archiveReason: ArchiveReason
}


