// Öğrenci sayıları için tek kaynak yardımcılar.
// "Aktif" tanımı StudentManagement ekranıyla birebir aynıdır:
// status === 'active' || status === 'approved'.
// Silinmiş (deleted === true) dokümanlar her iki sayıya da dahil edilmez.

export interface StudentCountInput {
  status?: string | null
  deleted?: boolean | null
}

export interface StudentCounts {
  /** Silinmemiş tüm öğrenciler */
  total: number
  /** Silinmemiş ve aktif/onaylı öğrenciler */
  active: number
}

/** Bir öğrencinin aktif sayılıp sayılmadığı (StudentManagement ile aynı kural). */
export function isActiveStudent(student: StudentCountInput): boolean {
  return student.status === 'active' || student.status === 'approved'
}

/** Öğrenci dokümanı listesinden toplam ve aktif sayıları hesaplar. */
export function computeStudentCounts(students: StudentCountInput[]): StudentCounts {
  let total = 0
  let active = 0
  for (const student of students) {
    if (student.deleted === true) continue
    total++
    if (isActiveStudent(student)) active++
  }
  return { total, active }
}
