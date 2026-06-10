import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { isLessonDoc, type RawReservationDoc } from '@/utils/dailyReservationLimit'

// Öğrenci dashboard'unda ders (grup/özel) ile öğrencinin kendi kort rezervasyonu
// AYRI kartlarda gösterilir; ayrım tek kaynaktan (isLessonDoc) yapılır.
// Bkz: "Dersler rezervasyon olarak görünmesin" düzeltmesi.
describe('StudentDashboard — ders / rezervasyon ayrımı', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, '../../src/views/StudentDashboard.vue'),
    'utf-8',
  )

  it('isLessonDoc tek kaynaktan import edilir (yerel kopya YOK)', () => {
    expect(content).toMatch(/import \{ isLessonDoc.*\} from '@\/utils\/dailyReservationLimit'/)
  })

  it('dersler ve kort rezervasyonları ayrı listelere bölünür', () => {
    expect(content).toMatch(/recentLessons/)
    expect(content).toMatch(/recentReservations/)
    expect(content).toMatch(/!isLessonDoc\(/)
  })

  it('şablonda iki ayrı kart vardır: Yaklaşan Derslerim + Yaklaşan Rezervasyonlarım', () => {
    expect(content).toMatch(/Yaklaşan Derslerim/)
    expect(content).toMatch(/Yaklaşan Rezervasyonlarım/)
  })

  it('"Bu Ayki Dersler" sayacı yalnızca dersleri sayar', () => {
    expect(content).toMatch(/isThisMonth && isValidStatus && isLessonDoc\(/)
  })

  it('split mantığı: grup dersi derslere, kort kiralama rezervasyonlara düşer', () => {
    const docs: RawReservationDoc[] = [
      { type: 'lesson', reservationType: 'group-lesson', groupId: 'g1', groupSchedule: true, status: 'confirmed' },
      { type: 'court_rental', reservationType: 'court-rental', status: 'confirmed' },
      { type: 'private-lesson', status: 'confirmed' },
    ]
    const lessons = docs.filter(d => isLessonDoc(d))
    const rentals = docs.filter(d => !isLessonDoc(d))
    expect(lessons).toHaveLength(2)
    expect(rentals).toHaveLength(1)
    expect(rentals[0].reservationType).toBe('court-rental')
  })
})
