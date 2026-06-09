/**
 * Private-ders takvim olayı için öğrenci AD ve TELEFON çözümü.
 * AdminCalendar.vue private-ders başlık dalının saf karşılığı (satır ~1172-1188).
 * Davranış birebir korunur; Firebase'e DOKUNMAZ.
 *
 * Ad önceliği: taze isim (freshNames[studentId]) > first+last > studentFullName >
 *   studentName > 'Bilinmiyor'.
 * Telefon önceliği: taze telefon (freshPhones[studentId]) > contactPhone > ''.
 */
export interface ResolvedStudent {
  displayName: string
  phone: string
}

export function resolveStudentDisplay(
  data: {
    studentId?: string
    studentFirstName?: string
    studentLastName?: string
    studentFullName?: string
    studentName?: string
    contactPhone?: string
  },
  freshNames: Record<string, string>,
  freshPhones: Record<string, string>,
): ResolvedStudent {
  let displayName: string
  if (data.studentId && freshNames[data.studentId]) {
    displayName = freshNames[data.studentId]
  } else if (data.studentFirstName && data.studentLastName) {
    displayName = `${data.studentFirstName} ${data.studentLastName}`
  } else if (data.studentFullName) {
    displayName = data.studentFullName
  } else if (data.studentName) {
    displayName = data.studentName
  } else {
    displayName = 'Bilinmiyor'
  }

  const phone = (data.studentId && freshPhones[data.studentId]) || data.contactPhone || ''
  return { displayName, phone }
}
