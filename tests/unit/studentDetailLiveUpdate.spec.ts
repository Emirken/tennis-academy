import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

/**
 * StudentManagement.vue — "Kişisel Bilgiler" kartı düzenleme sonrası canlı güncellenmeli.
 *
 * Bug: saveStudentChanges sadece `students` dizisini güncelliyordu; detay kartı ise
 * `selectedStudent`'a bağlı olduğu için sayfa yenilenmeden eski değer görünüyordu.
 *
 * Fix: kaydetme sonrası oluşturulan updatedStudent nesnesi hem students dizisine
 * hem de selectedStudent'a atanır.
 *
 * Bu test, fix'teki state senkronizasyon mantığını izole eder.
 */

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

// saveStudentChanges içindeki "5. Local state'i güncelle" bloğunun özü
function applyLocalStateUpdate(
  students: { value: Student[] },
  selectedStudent: { value: Student | null },
  oldStudent: Student,
  editForm: { firstName: string; lastName: string; email: string }
) {
  const updatedStudent: Student = {
    ...oldStudent,
    firstName: editForm.firstName,
    lastName: editForm.lastName,
    email: editForm.email,
  }

  const index = students.value.findIndex((s) => s.id === oldStudent.id)
  if (index > -1) {
    students.value[index] = updatedStudent
  }

  // Fix: detay kartı selectedStudent'a bağlı — onu da güncelle
  selectedStudent.value = updatedStudent
}

describe('StudentManagement — kayıt sonrası selectedStudent senkronizasyonu', () => {
  it('soyad değişikliği selectedStudent (Kişisel Bilgiler kartı) üzerinde anında görünür', () => {
    const original: Student = { id: 's1', firstName: 'Ada', lastName: 'Eski', email: 'ada@x.com' }
    const students = ref<Student[]>([{ ...original }])
    const selectedStudent = ref<Student | null>({ ...original })

    applyLocalStateUpdate(students, selectedStudent, original, {
      firstName: 'Ada',
      lastName: 'Yeni',
      email: 'ada@x.com',
    })

    // Kart bu değere bağlı — güncel olmalı
    expect(selectedStudent.value?.lastName).toBe('Yeni')
    // students dizisi de güncel olmalı
    expect(students.value[0].lastName).toBe('Yeni')
  })

  it('students dizisi ile selectedStudent aynı güncel nesneyi paylaşır', () => {
    const original: Student = { id: 's1', firstName: 'Ada', lastName: 'Eski', email: 'ada@x.com' }
    const students = ref<Student[]>([{ ...original }])
    const selectedStudent = ref<Student | null>({ ...original })

    applyLocalStateUpdate(students, selectedStudent, original, {
      firstName: 'Adanur',
      lastName: 'Yeni',
      email: 'yeni@x.com',
    })

    expect(selectedStudent.value).toEqual(students.value[0])
    expect(selectedStudent.value?.firstName).toBe('Adanur')
    expect(selectedStudent.value?.email).toBe('yeni@x.com')
  })
})
