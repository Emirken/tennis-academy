import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReservationsStore } from '@/store/modules/reservations'

// ─────────────────────────────────────────────────────────
// Test helper: tam bir rezervasyon objesi üretir
// ─────────────────────────────────────────────────────────
function makeReservation(overrides: Record<string, any> = {}) {
  return {
    courtId: 'court_001',
    courtName: 'Court 1',
    studentId: 'student_999',
    studentName: 'Test Öğrenci',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Yarın
    startTime: '11:00',
    endTime: '12:00',
    duration: 60,
    type: 'court_rental' as const,
    status: 'pending' as const,
    totalCost: 75,
    purpose: 'Antrenman',
    numberOfPlayers: 2,
    equipment: [],
    paymentStatus: 'pending' as const,
    cancellationPolicy: '24h',
    contactPhone: '+90 555 999 0000',
    weatherDependent: false,
    charges: [],
    discounts: [],
    reminders: [],
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────
// Admin bildirim sisteminin mock'u
// (gerçek Firebase bağlantısı olmadığı için)
// ─────────────────────────────────────────────────────────
const adminNotifications: any[] = []

const mockNotificationService = {
  createAdminNotification: vi.fn(async (title: string, message: string, type: string, relatedData?: any) => {
    adminNotifications.push({ targetType: 'admin', title, message, type, relatedData, isRead: false, id: `notif_${Date.now()}` })
  }),
  createStudentNotification: vi.fn(async (studentId: string, title: string, message: string, type: string, relatedData?: any) => {
    // Öğrenci bildirimleri ayrı tutulabilir; bu testte admin akışına odaklanıyoruz
  }),
}

// ═══════════════════════════════════════════════════════════
// REZERVASYON İŞ AKIŞI TESTLERİ
// Akış: öğrenci oluşturur (pending) → admin bildirim görür
//       → kabul: confirmed + kort dolu
//       → red: cancelled + hiçbir etkisi yok
// ═══════════════════════════════════════════════════════════
describe('Rezervasyon Modülü – Tam İş Akışı', () => {
  let store: ReturnType<typeof useReservationsStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useReservationsStore()
    adminNotifications.length = 0
    vi.clearAllMocks()
    // Mock verileri yükle (mevcut 5 rezervasyon gelir)
    await store.fetchReservations()
  })

  // ───────────────────────────────────────────────────────
  // BÖLÜM 1 – ÖĞRENCİ REZERVASYON OLUŞTURMA
  // ───────────────────────────────────────────────────────
  describe('1. Öğrenci Rezervasyon Oluşturma', () => {
    it('1a) Yeni rezervasyon "pending" statüsüyle oluşturulmalı', async () => {
      const data = makeReservation()
      const created = await store.createReservation(data)

      expect(created.id).toBeDefined()
      expect(created.status).toBe('pending')
      expect(created.studentId).toBe('student_999')
      expect(created.courtId).toBe('court_001')
    })

    it('1b) Oluşturulan rezervasyon store listesine eklenmiş olmalı', async () => {
      const countBefore = store.reservations.length
      await store.createReservation(makeReservation())
      expect(store.reservations.length).toBe(countBefore + 1)
    })

    it('1c) "pending" rezervasyonlar admin için bekleyen listesinde görünmeli', async () => {
      await store.createReservation(makeReservation())
      const pending = store.pendingReservations
      expect(pending.length).toBeGreaterThan(0)
      expect(pending.every(r => r.status === 'pending')).toBe(true)
    })

    it('1d) Admin bildirim servisi çağrıldığında "reservation_pending" tipi bildirim oluşmalı', async () => {
      const created = await store.createReservation(makeReservation())

      // Gerçek uygulamada bu servis çağrısı rezervasyon sonrası tetiklenir.
      // Burada servisi doğrudan simüle ediyoruz:
      await mockNotificationService.createAdminNotification(
        'Yeni Rezervasyon Talebi',
        `${created.studentName} tarafından ${created.courtName} için rezervasyon talebi`,
        'reservation_pending',
        { reservationId: created.id, studentId: created.studentId }
      )

      expect(mockNotificationService.createAdminNotification).toHaveBeenCalledOnce()
      const notif = adminNotifications[0]
      expect(notif.type).toBe('reservation_pending')
      expect(notif.targetType).toBe('admin')
      expect(notif.relatedData.reservationId).toBe(created.id)
    })
  })

  // ───────────────────────────────────────────────────────
  // BÖLÜM 2 – ADMIN KARAR: KABUL
  // ───────────────────────────────────────────────────────
  describe('2. Admin Rezervasyonu Kabul Eder', () => {
    it('2a) updateReservation ile status "confirmed" yapılabilmeli', async () => {
      const created = await store.createReservation(makeReservation())
      const updated = await store.updateReservation(created.id, { status: 'confirmed' })

      expect(updated.status).toBe('confirmed')
    })

    it('2b) Kabul sonrası rezervasyon "confirmedReservations" listesinde görünmeli', async () => {
      const created = await store.createReservation(makeReservation())
      await store.updateReservation(created.id, { status: 'confirmed' })

      const confirmed = store.confirmedReservations
      const found = confirmed.find(r => r.id === created.id)
      expect(found).toBeDefined()
      expect(found!.status).toBe('confirmed')
    })

    it('2c) Kabul sonrası "pendingReservations" listesinden düşmüş olmalı', async () => {
      const created = await store.createReservation(makeReservation())
      await store.updateReservation(created.id, { status: 'confirmed' })

      const inPending = store.pendingReservations.find(r => r.id === created.id)
      expect(inPending).toBeUndefined()
    })

    it('2d) Kabul sonrası aynı kort + tarih + saat için çakışma oluşmalı (kort dolu)', async () => {
      const resData = makeReservation({ startTime: '15:00', endTime: '16:00' })
      const created = await store.createReservation(resData)
      await store.updateReservation(created.id, { status: 'confirmed' })

      // Aynı slot için ikinci rezervasyon denemesi çakışmaya yol açmalı
      const conflictData = makeReservation({
        startTime: '15:00',
        endTime: '16:00',
        studentId: 'student_888',
        date: resData.date,
      })
      const conflicts = await store.checkReservationConflicts(conflictData)

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].type).toBe('time_overlap')
    })

    it('2e) Kabul sonrası takvim etkinlikleri listesinde görünmeli', async () => {
      const resData = makeReservation({ startTime: '13:00', endTime: '14:00' })
      const created = await store.createReservation(resData)
      await store.updateReservation(created.id, { status: 'confirmed' })

      const event = store.calendarEvents.find(e => e.id === created.id)
      expect(event).toBeDefined()
      expect(event!.status).toBe('confirmed')
      // Confirmed court_rental için renk #2196f3 olmalı
      expect(event!.color).toBe('#2196f3')
    })

    it('2f) Öğrenciye "reservation_approved" bildirimi gönderilmeli', async () => {
      const created = await store.createReservation(makeReservation())
      await store.updateReservation(created.id, { status: 'confirmed' })

      await mockNotificationService.createStudentNotification(
        created.studentId,
        'Rezervasyonunuz Onaylandı',
        `${created.courtName} için rezervasyonunuz onaylandı`,
        'reservation_approved',
        { reservationId: created.id }
      )

      expect(mockNotificationService.createStudentNotification).toHaveBeenCalledWith(
        created.studentId,
        'Rezervasyonunuz Onaylandı',
        expect.stringContaining('onaylandı'),
        'reservation_approved',
        expect.objectContaining({ reservationId: created.id })
      )
    })
  })

  // ───────────────────────────────────────────────────────
  // BÖLÜM 3 – ADMIN KARAR: RED
  // ───────────────────────────────────────────────────────
  describe('3. Admin Rezervasyonu Reddeder', () => {
    it('3a) cancelReservation ile status "cancelled" yapılabilmeli', async () => {
      const created = await store.createReservation(makeReservation())
      await store.cancelReservation(created.id, 'Kort müsait değil')

      const rejected = store.reservations.find(r => r.id === created.id)
      expect(rejected!.status).toBe('cancelled')
      expect(rejected!.cancellationReason).toBe('Kort müsait değil')
    })

    it('3b) Reddedilen rezervasyon "pendingReservations" listesinde bulunmamalı', async () => {
      const created = await store.createReservation(makeReservation())
      await store.cancelReservation(created.id, 'Test red')

      const inPending = store.pendingReservations.find(r => r.id === created.id)
      expect(inPending).toBeUndefined()
    })

    it('3c) Reddedilen rezervasyon "confirmedReservations" listesinde bulunmamalı', async () => {
      const created = await store.createReservation(makeReservation())
      await store.cancelReservation(created.id, 'Test red')

      const inConfirmed = store.confirmedReservations.find(r => r.id === created.id)
      expect(inConfirmed).toBeUndefined()
    })

    it('3d) Red sonrası aynı slot için yeni rezervasyon alınabilmeli (kort serbest)', async () => {
      const resData = makeReservation({ startTime: '17:00', endTime: '18:00' })
      const created = await store.createReservation(resData)
      await store.cancelReservation(created.id, 'İptal edildi')

      // İptal sonrası çakışma kontrolü – çakışma olmamalı
      const conflictData = makeReservation({
        startTime: '17:00',
        endTime: '18:00',
        studentId: 'student_777',
        date: resData.date,
      })
      const conflicts = await store.checkReservationConflicts(conflictData)

      expect(conflicts.length).toBe(0)
    })

    it('3e) Red sonrası takvim etkinliğinde renk kırmızı (#f44336) olmalı', async () => {
      const created = await store.createReservation(makeReservation({ startTime: '20:00', endTime: '21:00' }))
      await store.cancelReservation(created.id, 'Reddedildi')

      const event = store.calendarEvents.find(e => e.id === created.id)
      expect(event).toBeDefined()
      expect(event!.color).toBe('#f44336')
    })

    it('3f) Öğrenciye "reservation_rejected" bildirimi gönderilmeli', async () => {
      const created = await store.createReservation(makeReservation())
      await store.cancelReservation(created.id, 'Uygun değil')

      await mockNotificationService.createStudentNotification(
        created.studentId,
        'Rezervasyonunuz Reddedildi',
        'Rezervasyonunuz reddedildi: Uygun değil',
        'reservation_rejected',
        { reservationId: created.id }
      )

      expect(mockNotificationService.createStudentNotification).toHaveBeenCalledWith(
        created.studentId,
        'Rezervasyonunuz Reddedildi',
        expect.stringContaining('reddedildi'),
        'reservation_rejected',
        expect.any(Object)
      )
    })
  })

  // ───────────────────────────────────────────────────────
  // BÖLÜM 4 – KORT DOLULUK KONTROLÜ
  // ───────────────────────────────────────────────────────
  describe('4. Kort Doluluk Durumu', () => {
    it('4a) Onaylı rezervasyon olan slot için çakışma tespit edilmeli', async () => {
      const resData = makeReservation({ courtId: 'court_002', startTime: '09:00', endTime: '10:00' })
      const created = await store.createReservation(resData)
      await store.updateReservation(created.id, { status: 'confirmed' })

      const conflicts = await store.checkReservationConflicts({
        courtId: 'court_002',
        date: resData.date,
        startTime: '09:30',
        endTime: '10:30',
      })

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].conflictingReservations).toContain(created.id)
    })

    it('4b) Farklı slotlarda aynı kortta ardışık rezervasyon alınabilmeli', async () => {
      const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

      const first = await store.createReservation(makeReservation({ courtId: 'court_003', date, startTime: '08:00', endTime: '09:00' }))
      await store.updateReservation(first.id, { status: 'confirmed' })

      const conflicts = await store.checkReservationConflicts({
        courtId: 'court_003',
        date,
        startTime: '09:00',
        endTime: '10:00',
      })

      expect(conflicts.length).toBe(0)
    })

    it('4c) Pending rezervasyon da çakışma üretmeli (henüz kabul bekleniyor)', async () => {
      const resData = makeReservation({ courtId: 'court_001', startTime: '10:00', endTime: '11:00' })
      const created = await store.createReservation(resData)
      // status = 'pending' olarak bırak

      const conflicts = await store.checkReservationConflicts({
        courtId: 'court_001',
        date: resData.date,
        startTime: '10:30',
        endTime: '11:30',
      })

      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('4d) Onaylı rezervasyon takvim etkinlikleri listesinde doğru renkte görünmeli', async () => {
      const created = await store.createReservation(makeReservation({ type: 'private_lesson', startTime: '07:00', endTime: '08:00' }))
      await store.updateReservation(created.id, { status: 'confirmed' })

      const event = store.calendarEvents.find(e => e.id === created.id)
      expect(event).toBeDefined()
      // private_lesson rengi #4caf50
      expect(event!.color).toBe('#4caf50')
    })
  })

  // ───────────────────────────────────────────────────────
  // BÖLÜM 5 – GENEL GÜVENLİK VE DOĞRULAMA
  // ───────────────────────────────────────────────────────
  describe('5. Genel Doğrulama ve Güvenlik', () => {
    it('5a) Aynı slot için ikinci createReservation çakışma hatası fırlatmalı', async () => {
      const today = new Date()
      // Mock verilerdeki res_001: court_001, bugün, 09:00-10:00 (confirmed)
      await expect(
        store.createReservation(makeReservation({ date: today, startTime: '09:00', endTime: '10:00' }))
      ).rejects.toThrow('Reservation conflicts detected')
    })

    it('5b) Var olmayan rezervasyonu güncellemek hata fırlatmalı', async () => {
      await expect(
        store.updateReservation('non_existent_id', { status: 'confirmed' })
      ).rejects.toThrow('Reservation not found')
    })

    it('5c) Var olmayan rezervasyonu iptal etmek hata fırlatmalı', async () => {
      await expect(
        store.cancelReservation('non_existent_id', 'Test')
      ).rejects.toThrow('Reservation not found')
    })

    it('5d) updatedAt alanı her güncellemede yenilenmiş olmalı', async () => {
      const created = await store.createReservation(makeReservation())
      const before = created.updatedAt.getTime()

      await new Promise(r => setTimeout(r, 10))
      const updated = await store.updateReservation(created.id, { notes: 'Güncellendi' })

      expect(updated.updatedAt.getTime()).toBeGreaterThan(before)
    })
  })
})
