// Attendance Archive Service for Tennis Academy
// Yoklama arşivleme, Excel export ve temizleme işlemleri

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  AttendanceArchive,
  AttendanceRecord,
  ArchiveReason,
  ArchiveWarningData,
  ExcelExportData,
  PendingArchiveNotification
} from '@/types/attendanceArchive'

const ATTENDANCE_ARCHIVE_COLLECTION = 'attendanceArchive'
const ATTENDANCE_COLLECTION = 'attendance'
const ARCHIVE_RETENTION_DAYS = 90 // 3 ay

/**
 * Öğrencinin yoklama geçmişi olup olmadığını kontrol eder
 */
export const checkStudentAttendanceHistory = async (
  studentId: string
): Promise<{ hasHistory: boolean; attendanceCount: number; records: any[] }> => {
  try {
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION)
    const snapshot = await getDocs(attendanceRef)
    
    let totalAttendanceCount = 0
    const allRecords: any[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      
      // attendanceData içinde bu öğrencinin kaydı var mı kontrol et
      if (data.attendanceData && data.attendanceData[studentId]) {
        const studentAttendance = data.attendanceData[studentId]
        const presentCount = studentAttendance.filter((present: boolean) => present).length
        totalAttendanceCount += presentCount

        // Her ders için kayıt oluştur
        if (data.lessons) {
          data.lessons.forEach((lesson: any, index: number) => {
            if (studentAttendance[index] !== undefined) {
              allRecords.push({
                date: lesson.date?.toDate ? lesson.date.toDate() : new Date(lesson.date),
                present: studentAttendance[index],
                lessonNumber: lesson.lessonNumber || index + 1,
                year: data.year,
                month: data.month
              })
            }
          })
        }
      }
    })

    return {
      hasHistory: allRecords.length > 0,
      attendanceCount: totalAttendanceCount,
      records: allRecords
    }
  } catch (error) {
    console.error('❌ Yoklama geçmişi kontrol hatası:', error)
    return { hasHistory: false, attendanceCount: 0, records: [] }
  }
}

/**
 * Grup için yoklama geçmişini kontrol eder
 */
export const checkGroupAttendanceHistory = async (
  groupId: string,
  memberIds: string[]
): Promise<{ hasHistory: boolean; totalAttendance: number; memberRecords: Map<string, any[]> }> => {
  try {
    const memberRecords = new Map<string, any[]>()
    let totalAttendance = 0

    for (const memberId of memberIds) {
      const result = await checkStudentAttendanceHistory(memberId)
      if (result.hasHistory) {
        memberRecords.set(memberId, result.records)
        totalAttendance += result.attendanceCount
      }
    }

    return {
      hasHistory: memberRecords.size > 0,
      totalAttendance,
      memberRecords
    }
  } catch (error) {
    console.error('❌ Grup yoklama geçmişi kontrol hatası:', error)
    return { hasHistory: false, totalAttendance: 0, memberRecords: new Map() }
  }
}

/**
 * Öğrenci yoklamasını arşivler
 */
export const archiveStudentAttendance = async (
  studentId: string,
  studentName: string,
  groupId?: string,
  groupName?: string,
  membershipType?: string,
  archiveReason: ArchiveReason = 'student_deleted'
): Promise<string | null> => {
  try {
    const { hasHistory, records } = await checkStudentAttendanceHistory(studentId)

    if (!hasHistory) {
      console.log('📝 Arşivlenecek yoklama geçmişi bulunamadı')
      return null
    }

    // Kayıtları düzenle
    const attendanceRecords: AttendanceRecord[] = records.map(record => ({
      date: record.date,
      present: record.present,
      lessonNumber: record.lessonNumber
    }))

    const totalLessons = attendanceRecords.length
    const attendedCount = attendanceRecords.filter(r => r.present).length
    const percentage = totalLessons > 0 ? Math.round((attendedCount / totalLessons) * 100) : 0

    // Arşiv sona erme tarihi (3 ay sonra)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + ARCHIVE_RETENTION_DAYS)

    const archiveData: Omit<AttendanceArchive, 'id'> = {
      studentId,
      studentName,
      groupId,
      groupName,
      membershipType,
      attendanceRecords,
      totalLessons,
      attendedCount,
      percentage,
      archivedAt: new Date(),
      archiveReason,
      expiresAt,
      exportedToExcel: false,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    }

    const docRef = await addDoc(collection(db, ATTENDANCE_ARCHIVE_COLLECTION), {
      ...archiveData,
      archivedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    })

    console.log(`✅ Yoklama arşivlendi: ${studentName} (${docRef.id})`)
    return docRef.id
  } catch (error) {
    console.error('❌ Yoklama arşivleme hatası:', error)
    throw error
  }
}

/**
 * Birden fazla öğrencinin yoklamasını arşivler (grup silme için)
 */
export const archiveGroupAttendance = async (
  groupId: string,
  groupName: string,
  members: { id: string; name: string; membershipType?: string }[],
  archiveReason: ArchiveReason = 'group_deleted'
): Promise<string[]> => {
  const archiveIds: string[] = []

  for (const member of members) {
    try {
      const archiveId = await archiveStudentAttendance(
        member.id,
        member.name,
        groupId,
        groupName,
        member.membershipType,
        archiveReason
      )
      if (archiveId) {
        archiveIds.push(archiveId)
      }
    } catch (error) {
      console.error(`❌ ${member.name} için arşivleme hatası:`, error)
    }
  }

  console.log(`✅ ${archiveIds.length} üye arşivlendi (${groupName})`)
  return archiveIds
}

/**
 * Süresi dolmak üzere olan arşivleri getirir
 */
export const getPendingArchives = async (
  daysBeforeExpiry: number = 7
): Promise<PendingArchiveNotification[]> => {
  try {
    const archiveRef = collection(db, ATTENDANCE_ARCHIVE_COLLECTION)
    const snapshot = await getDocs(archiveRef)

    const now = new Date()
    const notifications: PendingArchiveNotification[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining <= daysBeforeExpiry && daysRemaining > 0) {
        notifications.push({
          id: docSnap.id,
          studentName: data.studentName,
          groupName: data.groupName,
          expiresAt,
          daysRemaining,
          archiveReason: data.archiveReason
        })
      }
    })

    // Sona erme tarihine göre sırala
    notifications.sort((a, b) => a.daysRemaining - b.daysRemaining)

    return notifications
  } catch (error) {
    console.error('❌ Bekleyen arşivler getirme hatası:', error)
    return []
  }
}

/**
 * Süresi dolmuş arşivleri getirir
 */
export const getExpiredArchives = async (): Promise<AttendanceArchive[]> => {
  try {
    const archiveRef = collection(db, ATTENDANCE_ARCHIVE_COLLECTION)
    const snapshot = await getDocs(archiveRef)

    const now = new Date()
    const expiredArchives: AttendanceArchive[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)

      if (expiresAt <= now) {
        expiredArchives.push({
          id: docSnap.id,
          ...data,
          archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : new Date(data.archivedAt),
          expiresAt
        } as AttendanceArchive)
      }
    })

    return expiredArchives
  } catch (error) {
    console.error('❌ Süresi dolmuş arşivler getirme hatası:', error)
    return []
  }
}

/**
 * Arşivi siler
 */
export const deleteArchive = async (archiveId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ATTENDANCE_ARCHIVE_COLLECTION, archiveId))
    console.log(`✅ Arşiv silindi: ${archiveId}`)
  } catch (error) {
    console.error('❌ Arşiv silme hatası:', error)
    throw error
  }
}

/**
 * Süresi dolmuş tüm arşivleri siler
 */
export const deleteExpiredArchives = async (): Promise<number> => {
  try {
    const expiredArchives = await getExpiredArchives()
    
    for (const archive of expiredArchives) {
      await deleteArchive(archive.id)
    }

    console.log(`✅ ${expiredArchives.length} süresi dolmuş arşiv silindi`)
    return expiredArchives.length
  } catch (error) {
    console.error('❌ Süresi dolmuş arşivleri silme hatası:', error)
    return 0
  }
}

/**
 * Arşivi Excel'e export edildi olarak işaretler
 */
export const markAsExported = async (archiveId: string): Promise<void> => {
  try {
    const archiveRef = doc(db, ATTENDANCE_ARCHIVE_COLLECTION, archiveId)
    await updateDoc(archiveRef, {
      exportedToExcel: true
    })
    console.log(`✅ Arşiv export edildi olarak işaretlendi: ${archiveId}`)
  } catch (error) {
    console.error('❌ Export işaretleme hatası:', error)
    throw error
  }
}

/**
 * Excel export için veri hazırlar
 */
export const prepareExcelData = (
  studentName: string,
  records: AttendanceRecord[]
): ExcelExportData => {
  const formattedRecords = records.map(record => ({
    date: formatDate(record.date),
    present: record.present ? 'Geldi' : 'Gelmedi',
    lessonNumber: record.lessonNumber
  }))

  const totalLessons = records.length
  const attendedCount = records.filter(r => r.present).length
  const absentCount = totalLessons - attendedCount
  const percentage = totalLessons > 0 ? Math.round((attendedCount / totalLessons) * 100) : 0

  return {
    studentName,
    records: formattedRecords,
    summary: {
      totalLessons,
      attendedCount,
      absentCount,
      percentage
    }
  }
}

/**
 * Excel dosyası oluşturur ve indirir
 */
export const exportToExcel = async (
  studentName: string,
  records: AttendanceRecord[],
  archiveId?: string
): Promise<void> => {
  try {
    const data = prepareExcelData(studentName, records)
    
    // CSV formatında oluştur (Türkçe Excel için noktalı virgül ayracı)
    let csv = '\uFEFF' // UTF-8 BOM for Turkish characters
    csv += 'Öğrenci Adı;Tarih;Devam Durumu;Ders No\n'
    
    data.records.forEach(record => {
      csv += `${data.studentName};${record.date};${record.present};${record.lessonNumber}\n`
    })
    
    csv += '\n'
    csv += 'ÖZET\n'
    csv += `Toplam Ders;${data.summary.totalLessons}\n`
    csv += `Katılım;${data.summary.attendedCount}\n`
    csv += `Devamsızlık;${data.summary.absentCount}\n`
    csv += `Devam Yüzdesi;%${data.summary.percentage}\n`

    // Dosyayı indir
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `yoklama_${sanitizeFileName(studentName)}_${formatDateForFileName(new Date())}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Arşivi export edildi olarak işaretle
    if (archiveId) {
      await markAsExported(archiveId)
    }

    console.log(`✅ Excel export tamamlandı: ${studentName}`)
  } catch (error) {
    console.error('❌ Excel export hatası:', error)
    throw error
  }
}

/**
 * Arşiv verilerini doğrudan export eder
 */
export const exportArchiveToExcel = async (archiveId: string): Promise<void> => {
  try {
    const archiveRef = doc(db, ATTENDANCE_ARCHIVE_COLLECTION, archiveId)
    const archiveSnap = await getDoc(archiveRef)

    if (!archiveSnap.exists()) {
      throw new Error('Arşiv bulunamadı')
    }

    const data = archiveSnap.data()
    const records: AttendanceRecord[] = data.attendanceRecords.map((r: any) => ({
      date: r.date?.toDate ? r.date.toDate() : new Date(r.date),
      present: r.present,
      lessonNumber: r.lessonNumber
    }))

    await exportToExcel(data.studentName, records, archiveId)
  } catch (error) {
    console.error('❌ Arşiv export hatası:', error)
    throw error
  }
}

/**
 * Tüm arşivleri getirir
 */
export const getAllArchives = async (): Promise<AttendanceArchive[]> => {
  try {
    const archiveRef = collection(db, ATTENDANCE_ARCHIVE_COLLECTION)
    const snapshot = await getDocs(archiveRef)

    const archives: AttendanceArchive[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      archives.push({
        id: docSnap.id,
        ...data,
        archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : new Date(data.archivedAt),
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
        attendanceRecords: data.attendanceRecords?.map((r: any) => ({
          date: r.date?.toDate ? r.date.toDate() : new Date(r.date),
          present: r.present,
          lessonNumber: r.lessonNumber
        })) || []
      } as AttendanceArchive)
    })

    // Arşivleme tarihine göre sırala (en yeni önce)
    archives.sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime())

    return archives
  } catch (error) {
    console.error('❌ Arşivleri getirme hatası:', error)
    return []
  }
}

/**
 * Arşiv uyarı verilerini hazırlar
 */
export const prepareArchiveWarning = async (
  studentId: string,
  studentName: string,
  groupId?: string,
  groupName?: string,
  archiveReason: ArchiveReason = 'student_deleted'
): Promise<ArchiveWarningData> => {
  const { hasHistory, attendanceCount } = await checkStudentAttendanceHistory(studentId)

  return {
    studentId,
    studentName,
    groupId,
    groupName,
    hasAttendanceHistory: hasHistory,
    attendanceCount,
    archiveReason
  }
}

/**
 * Öğrencinin tüm yoklama geçmişini Excel olarak export eder (arşivden bağımsız)
 */
export const exportStudentAttendanceToExcel = async (
  studentId: string,
  studentName: string
): Promise<boolean> => {
  try {
    const { hasHistory, records } = await checkStudentAttendanceHistory(studentId)

    if (!hasHistory || records.length === 0) {
      console.log('📝 Export edilecek yoklama geçmişi bulunamadı')
      return false
    }

    const attendanceRecords: AttendanceRecord[] = records.map(record => ({
      date: record.date,
      present: record.present,
      lessonNumber: record.lessonNumber
    }))

    await exportToExcel(studentName, attendanceRecords)
    return true
  } catch (error) {
    console.error('❌ Öğrenci yoklama export hatası:', error)
    throw error
  }
}

/**
 * Grup üyelerinin tüm yoklamalarını tek bir Excel dosyasında export eder
 */
export const exportGroupAttendanceToExcel = async (
  groupId: string,
  groupName: string,
  members: { id: string; name: string }[]
): Promise<boolean> => {
  try {
    // Tüm üyelerin yoklama verilerini topla
    const allMemberData: { memberName: string; records: AttendanceRecord[] }[] = []

    for (const member of members) {
      const { hasHistory, records } = await checkStudentAttendanceHistory(member.id)
      if (hasHistory && records.length > 0) {
        allMemberData.push({
          memberName: member.name,
          records: records.map(r => ({
            date: r.date,
            present: r.present,
            lessonNumber: r.lessonNumber
          }))
        })
      }
    }

    if (allMemberData.length === 0) {
      console.log('📝 Export edilecek grup yoklama geçmişi bulunamadı')
      return false
    }

    // Grup için özel CSV oluştur (Türkçe Excel için noktalı virgül ayracı)
    let csv = '\uFEFF' // UTF-8 BOM for Turkish characters
    csv += `GRUP: ${groupName}\n`
    csv += `Export Tarihi: ${formatDate(new Date())}\n`
    csv += `Toplam Üye: ${allMemberData.length}\n\n`
    csv += 'Öğrenci Adı;Tarih;Devam Durumu;Ders No\n'

    let totalLessons = 0
    let totalAttended = 0

    allMemberData.forEach(memberData => {
      memberData.records.forEach(record => {
        csv += `${memberData.memberName};${formatDate(record.date)};${record.present ? 'Geldi' : 'Gelmedi'};${record.lessonNumber}\n`
        totalLessons++
        if (record.present) totalAttended++
      })
    })

    csv += '\n'
    csv += 'GRUP ÖZET\n'
    csv += `Toplam Ders Kayıtları;${totalLessons}\n`
    csv += `Toplam Katılım;${totalAttended}\n`
    csv += `Toplam Devamsızlık;${totalLessons - totalAttended}\n`
    csv += `Genel Devam Yüzdesi;%${totalLessons > 0 ? Math.round((totalAttended / totalLessons) * 100) : 0}\n`

    // Dosyayı indir
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `grup_yoklama_${sanitizeFileName(groupName)}_${formatDateForFileName(new Date())}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`✅ Grup yoklama export tamamlandı: ${groupName}`)
    return true
  } catch (error) {
    console.error('❌ Grup yoklama export hatası:', error)
    throw error
  }
}

/**
 * Belirli ay ve grup/öğrenci için yoklama verilerini export eder (Yoklama sayfası için)
 */
export const exportCurrentViewToExcel = async (
  year: number,
  month: number,
  students: { id: string; name: string }[],
  attendanceData: Record<string, boolean[]>,
  lessons: { date: Date; lessonNumber: number }[],
  viewTitle: string = 'Yoklama'
): Promise<boolean> => {
  try {
    if (students.length === 0 || lessons.length === 0) {
      console.log('📝 Export edilecek veri bulunamadı')
      return false
    }

    // CSV oluştur (Türkçe Excel için noktalı virgül ayracı)
    let csv = '\uFEFF' // UTF-8 BOM for Turkish characters
    csv += `${viewTitle}\n`
    csv += `Dönem: ${month}/${year}\n`
    csv += `Export Tarihi: ${formatDate(new Date())}\n\n`
    csv += 'Öğrenci Adı;Tarih;Devam Durumu;Ders No\n'

    let totalRecords = 0
    let totalPresent = 0

    students.forEach(student => {
      const studentAttendance = attendanceData[student.id] || []
      lessons.forEach((lesson, index) => {
        const present = studentAttendance[index] || false
        csv += `${student.name};${formatDate(lesson.date)};${present ? 'Geldi' : 'Gelmedi'};${lesson.lessonNumber}\n`
        totalRecords++
        if (present) totalPresent++
      })
    })

    csv += '\n'
    csv += 'ÖZET\n'
    csv += `Toplam Kayıt;${totalRecords}\n`
    csv += `Katılım;${totalPresent}\n`
    csv += `Devamsızlık;${totalRecords - totalPresent}\n`
    csv += `Devam Yüzdesi;%${totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0}\n`

    // Dosyayı indir
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `yoklama_${month}_${year}_${formatDateForFileName(new Date())}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`✅ Görünüm export tamamlandı: ${viewTitle}`)
    return true
  } catch (error) {
    console.error('❌ Görünüm export hatası:', error)
    throw error
  }
}

// Yardımcı fonksiyonlar
const formatDate = (date: Date): string => {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
}

const formatDateForFileName = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

export default {
  checkStudentAttendanceHistory,
  checkGroupAttendanceHistory,
  archiveStudentAttendance,
  archiveGroupAttendance,
  getPendingArchives,
  getExpiredArchives,
  deleteArchive,
  deleteExpiredArchives,
  markAsExported,
  prepareExcelData,
  exportToExcel,
  exportArchiveToExcel,
  getAllArchives,
  prepareArchiveWarning,
  exportStudentAttendanceToExcel,
  exportGroupAttendanceToExcel,
  exportCurrentViewToExcel
}


