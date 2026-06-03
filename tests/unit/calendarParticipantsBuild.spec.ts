import { describe, it, expect } from 'vitest'

// AdminCalendar.vue içindeki showEventDetails katılımcı çıkarma mantığının saf
// versiyonunu doğruluyoruz: grup üyesi map'leme + özel ders fallback'i.

interface CalendarEventLike {
  title: string
  studentName: string
  groupId?: string
  isGroup: boolean
  extendedProps: { studentId: string; contactPhone?: string }
}

interface Participant {
  id?: string
  name: string
  phone?: string
  email?: string
}

const mapGroupMembers = (members: any[]): Participant[] =>
  members.map((m: any) => ({
    id: m.id,
    name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Bilinmiyor',
    email: m.email,
    phone: m.phone || m.phone_number,
  }))

const buildPrivateParticipant = (event: CalendarEventLike): Participant => {
  const studentName =
    event.studentName ||
    event.title.replace(/\s*\(.*\)\s*$/, '').trim()
  return {
    id: event.extendedProps.studentId || undefined,
    name: studentName || 'Bilinmiyor',
    phone: event.extendedProps.contactPhone,
  }
}

describe('Calendar event katılımcı çıkarımı', () => {
  it('grup üyelerini name/email/phone ile maple eder', () => {
    const members = [
      { id: 'u1', name: 'Ada Lovelace', email: 'ada@x.com', phone: '0555' },
      { id: 'u2', firstName: 'Grace', lastName: 'Hopper' },
      { id: 'u3', email: 'noname@x.com' },
    ]
    const result = mapGroupMembers(members)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ id: 'u1', name: 'Ada Lovelace', email: 'ada@x.com', phone: '0555' })
    expect(result[1].name).toBe('Grace Hopper')
    expect(result[1].id).toBe('u2')
    expect(result[2].name).toBe('Bilinmiyor')
    expect(result[2].email).toBe('noname@x.com')
  })

  it('özel ders: studentName varsa onu kullanır', () => {
    const ev: CalendarEventLike = {
      title: 'Ada Lovelace (05551112233)',
      studentName: 'Ada Lovelace',
      isGroup: false,
      extendedProps: { studentId: 'u1', contactPhone: '05551112233' },
    }
    const p = buildPrivateParticipant(ev)
    expect(p).toEqual({ id: 'u1', name: 'Ada Lovelace', phone: '05551112233' })
  })

  it('özel ders: studentName boşsa title\'dan parantezli telefonu temizler', () => {
    const ev: CalendarEventLike = {
      title: 'Grace Hopper (05559998877)',
      studentName: '',
      isGroup: false,
      extendedProps: { studentId: '', contactPhone: '05559998877' },
    }
    const p = buildPrivateParticipant(ev)
    expect(p.name).toBe('Grace Hopper')
    expect(p.phone).toBe('05559998877')
    expect(p.id).toBeUndefined()
  })

  it('özel ders: hem studentName hem title boşsa Bilinmiyor döner', () => {
    const ev: CalendarEventLike = {
      title: '',
      studentName: '',
      isGroup: false,
      extendedProps: { studentId: '' },
    }
    const p = buildPrivateParticipant(ev)
    expect(p.name).toBe('Bilinmiyor')
  })
})
