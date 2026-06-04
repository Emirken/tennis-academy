import { describe, it, expect } from 'vitest'
import {
  buildCourtSchedule,
  type CourtScheduleMap,
} from '../../src/utils/courtScheduleBuild'
import type { RawReservationDoc } from '../../src/utils/dailyReservationLimit'

// Courts.vue (/courts) kort programı oluşturma mantığı.
// Doğru kaynak canlı `reservations`'tır; kaydedilmiş courtSchedule snapshot
// yalnızca admin durumları (maintenance/closed) ve grup dersi yedeği için.

const COURT_IDS = ['K1', 'K2', 'K3']
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
]

const mapCourtId = (id: string): string => {
  const m: Record<string, string> = { 'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3' }
  return m[id] || id
}

const emptyStored = (): CourtScheduleMap => {
  const s: CourtScheduleMap = {}
  for (const c of COURT_IDS) {
    s[c] = {}
    for (const t of TIME_SLOTS) s[c][t] = 'available'
  }
  return s
}

describe('buildCourtSchedule — canlı rezervasyon doğru kaynak', () => {
  it('gerçek hata: bayat grup snapshot, canlı kort kiralamasını EZMEZ (2 Haziran 20:00 K1)', () => {
    // Snapshot hâlâ silinmiş/değişmiş grup dersini tutuyor.
    const storedSchedule = emptyStored()
    storedSchedule.K1['20:00'] = {
      status: 'occupied',
      reservationType: 'group-lesson',
      membershipType: 'adult_group',
      groupAssignment: 'ESKI_GRUP',
      groupName: 'Yetişkin Grup E',
      studentFullName: 'Eski Üye',
    }

    // Canlı rezervasyon: Ayda İleri kort kiralaması.
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'court-1',
        startTime: '20:00',
        endTime: '21:00',
        status: 'confirmed',
        reservationType: 'court-rental',
        type: 'court_rental',
        studentName: 'Ayda İleri',
        studentId: 'u-ayda',
      },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule,
      reservations,
      existingGroupIds: new Set(['ESKI_GRUP']), // grup hâlâ var olsa bile canlı kazanır
      mapCourtId,
    })

    const slot = result.K1['20:00'] as any
    expect(slot.status).toBe('occupied')
    expect(slot.studentFullName).toBe('Ayda İleri')
    // Bayat grup etiketi taşınmamalı.
    expect(slot.groupName).toBe('')
    expect(slot.groupAssignment).toBe('')
    expect(slot.reservationType).toBe('court-rental')
  })

  it('snapshot occupied ama canlı rezervasyon yoksa slot available olur (bayat temizliği)', () => {
    const storedSchedule = emptyStored()
    storedSchedule.K1['20:00'] = {
      status: 'occupied',
      reservationType: 'group-lesson',
      groupAssignment: 'ESKI_GRUP',
      groupName: 'Yetişkin Grup E',
    }

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule,
      reservations: [],
      // Grup silinmiş → yetim, gösterilmez.
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect(result.K1['20:00']).toBe('available')
  })

  it('canlı grup dersi doğru şekilde occupied + grup adı ile gösterilir', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K2',
        startTime: '18:00',
        endTime: '19:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'GRUP_A',
        membershipType: 'adult_group',
        studentName: 'Üye Bir',
      },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(['GRUP_A']),
      mapCourtId,
      groupNames: { GRUP_A: 'Sabah Grubu' },
    })

    const slot = result.K2['18:00'] as any
    expect(slot.status).toBe('occupied')
    expect(slot.groupAssignment).toBe('GRUP_A')
    expect(slot.groupName).toBe('Sabah Grubu')
    expect(slot.reservationType).toBe('group-lesson')
  })

  it('yetim (grubu silinmiş) canlı rezervasyon slotu doldurmaz', () => {
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K3',
        startTime: '17:00',
        endTime: '18:00',
        status: 'confirmed',
        reservationType: 'group-lesson',
        groupId: 'SILINMIS',
        studentName: 'Lena Engin',
      },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(['BASKA']),
      mapCourtId,
    })

    expect(result.K3['17:00']).toBe('available')
  })

  it('admin maintenance/closed durumları korunur (canlı rezervasyon yokken)', () => {
    const storedSchedule = emptyStored()
    storedSchedule.K1['10:00'] = 'maintenance'
    storedSchedule.K1['11:00'] = 'closed'

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule,
      reservations: [],
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect(result.K1['10:00']).toBe('maintenance')
    expect(result.K1['11:00']).toBe('closed')
  })

  it('admin maintenance, canlı rezervasyon tarafından EZİLMEZ (bilinçli admin kararı korunur)', () => {
    const storedSchedule = emptyStored()
    storedSchedule.K1['09:00'] = 'maintenance'

    const reservations: RawReservationDoc[] = [
      { courtId: 'K1', startTime: '09:00', endTime: '10:00', status: 'confirmed', studentName: 'X' },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule,
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect(result.K1['09:00']).toBe('maintenance')
  })

  it('çok saatlik rezervasyon kapsadığı tüm slotları doldurur', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K2', startTime: '14:00', endTime: '17:00', status: 'confirmed', studentName: 'Uzun Ders' },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect((result.K2['14:00'] as any).status).toBe('occupied')
    expect((result.K2['15:00'] as any).status).toBe('occupied')
    expect((result.K2['16:00'] as any).status).toBe('occupied')
    expect(result.K2['17:00']).toBe('available') // endTime hariç
  })

  it('iptal edilen rezervasyon slotu doldurmaz', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K1', startTime: '12:00', endTime: '13:00', status: 'cancelled', studentName: 'İptal' },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect(result.K1['12:00']).toBe('available')
  })

  it('gerçek hata: pending rezervasyon slotu DOLU yapar (takvimle tutarlı)', () => {
    // Önceden /courts yalnızca confirmed/active sayıyordu; pending bir
    // rezervasyon takvimde görünüyor ama burada slot 'available' kalıyordu.
    const reservations: RawReservationDoc[] = [
      {
        courtId: 'K1',
        startTime: '18:00',
        endTime: '19:00',
        status: 'pending',
        reservationType: 'court-rental',
        studentName: 'Bekleyen Öğrenci',
      },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect((result.K1['18:00'] as any).status).toBe('occupied')
  })

  it('status alanı olmayan (legacy) rezervasyon slotu DOLU yapar', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K1', startTime: '18:00', endTime: '19:00', studentName: 'Eski Kayıt' },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect((result.K1['18:00'] as any).status).toBe('occupied')
  })

  it('completed/no_show rezervasyon slotu DOLDURMAZ', () => {
    const reservations: RawReservationDoc[] = [
      { courtId: 'K1', startTime: '18:00', endTime: '19:00', status: 'completed', studentName: 'A' },
      { courtId: 'K2', startTime: '18:00', endTime: '19:00', status: 'no_show', studentName: 'B' },
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    expect(result.K1['18:00']).toBe('available')
    expect(result.K2['18:00']).toBe('available')
  })

  it('snapshot grup dersi yedeği: canlı rezervasyon yoksa ve grup hâlâ varsa gösterilir', () => {
    const storedSchedule = emptyStored()
    storedSchedule.K3['19:00'] = {
      status: 'occupied',
      reservationType: 'group-lesson',
      groupAssignment: 'VAR_GRUP',
      groupName: 'Akşam Grubu',
    }

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule,
      reservations: [],
      existingGroupIds: new Set(['VAR_GRUP']),
      mapCourtId,
    })

    const slot = result.K3['19:00'] as any
    expect(slot.status).toBe('occupied')
    expect(slot.groupName).toBe('Akşam Grubu')
  })

  it('canlı rezervasyon slotuna iptal alanlarını (reservationId/startTime/rawCourtId) yazar', () => {
    // Courts.vue admin iptali bu alanlara dayanır; build bunları doldurmalı.
    const reservations: RawReservationDoc[] = [
      {
        id: 'res-123',
        courtId: 'court-2',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        reservationType: 'court-rental',
        studentName: 'Test Öğrenci',
        studentId: 'u-test',
      } as any,
    ]

    const result = buildCourtSchedule({
      courtIds: COURT_IDS,
      timeSlots: TIME_SLOTS,
      storedSchedule: emptyStored(),
      reservations,
      existingGroupIds: new Set(),
      mapCourtId,
    })

    const slot = result.K2['14:00'] as any
    expect(slot.status).toBe('occupied')
    expect(slot.reservationId).toBe('res-123')
    expect(slot.startTime).toBe('14:00')
    expect(slot.endTime).toBe('15:00')
    // Ham (Firestore) kort id'si korunmalı — ekran id'si K2 değil.
    expect(slot.rawCourtId).toBe('court-2')
  })

  // Tarihi geçmiş kort rezervasyonları (dersler hariç) takvimde boş görünür.
  // now verildiğinde devreye girer; verilmezse eski davranış (geriye uyumlu).
  describe('geçmiş rezervasyon elemesi (now alanı)', () => {
    // Sabit referans an: 3 Haziran 2026 öğlen (yerel).
    const now = new Date(2026, 5, 3, 12, 0, 0)

    it('now VERİLMEDEN geçmiş rezervasyon hâlâ DOLU (geriye uyumlu)', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K1', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'court-rental', date: '2026-06-02', studentName: 'Dün' },
      ]
      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: emptyStored(),
        reservations,
        existingGroupIds: new Set(),
        mapCourtId,
        // now YOK
      })
      expect((result.K1['18:00'] as any).status).toBe('occupied')
    })

    it('now VERİLİNCE dün tarihli kort rezervasyonu boşalır (slot available)', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K1', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'court-rental', date: '2026-06-02', studentName: 'Dün' },
      ]
      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: emptyStored(),
        reservations,
        existingGroupIds: new Set(),
        mapCourtId,
        now,
      })
      expect(result.K1['18:00']).toBe('available')
    })

    it('now VERİLİNCE bugünün rezervasyonu DOLU kalır (gün granülerliği)', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K1', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'court-rental', date: '2026-06-03', studentName: 'Bugün' },
      ]
      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: emptyStored(),
        reservations,
        existingGroupIds: new Set(),
        mapCourtId,
        now,
      })
      expect((result.K1['18:00'] as any).status).toBe('occupied')
    })

    it('now VERİLSE bile dün tarihli GRUP DERSİ DOLU kalır (dersler korunur)', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K2', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'group-lesson', groupId: 'GRUP_A', date: '2026-06-02', studentName: 'Geçmiş Grup' },
      ]
      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: emptyStored(),
        reservations,
        existingGroupIds: new Set(['GRUP_A']),
        mapCourtId,
        groupNames: { GRUP_A: 'Sabah Grubu' },
        now,
      })
      const slot = result.K2['18:00'] as any
      expect(slot.status).toBe('occupied')
      expect(slot.groupName).toBe('Sabah Grubu')
    })

    it('adminParity (öğrenci takvimi yolu): dün rezervasyon boşalır, dün ders DOLU kalır', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K1', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'court-rental', date: '2026-06-02', studentName: 'Dün Rez' },
        { courtId: 'K2', startTime: '18:00', endTime: '19:00', status: 'confirmed', reservationType: 'group-lesson', groupId: 'GRUP_A', date: '2026-06-02', studentName: 'Dün Ders' },
      ]
      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: {},
        reservations,
        existingGroupIds: new Set(['GRUP_A']),
        mapCourtId,
        adminParity: true,
        now,
      })
      expect(result.K1['18:00']).toBe('available')
      expect((result.K2['18:00'] as any).status).toBe('occupied')
    })
  })

  // /courts (Courts.vue) bu bayrağı KULLANIR. Bir grup dersi kort değiştirince
  // (ör. K1 -> K2) eski kort anahtarındaki snapshot girdisi bayat kalabiliyor;
  // grup hâlâ var olduğundan yedek onu YANLIŞ "dolu" gösterirdi (AdminCalendar
  // canlıdan okuduğu için K1'i boş gösterir → tutarsızlık). Bayrak bu yedeği
  // atlar AMA maintenance/closed admin durumlarını korur.
  describe('ignoreSnapshotGroupFallback (Courts.vue tek-canlı-kaynak)', () => {
    it('gerçek hata (7 Haziran 11:00 sınıfı): bayat K1 snapshot grup yedeği DİRİLMEZ', () => {
      // Snapshot K1@10:00'de hâlâ var olan bir grubun bayat girdisi; canlı
      // rezervasyonlar ise K2/K3'te (grup kort değiştirmiş).
      const storedSchedule = emptyStored()
      storedSchedule.K1['10:00'] = {
        status: 'occupied',
        reservationType: 'group-lesson',
        groupAssignment: 'TASINMIS_GRUP',
        groupName: 'Eski Kort Grubu',
      }
      const reservations: RawReservationDoc[] = [
        { courtId: 'K2', startTime: '10:00', endTime: '11:00', status: 'confirmed', reservationType: 'group-lesson', groupId: 'BASKA_GRUP', studentName: 'Canlı K2' },
        { courtId: 'K3', startTime: '10:00', endTime: '11:00', status: 'confirmed', reservationType: 'group-lesson', groupId: 'BASKA_GRUP_2', studentName: 'Canlı K3' },
      ]

      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule,
        reservations,
        // Grup hâlâ var — eski davranışta yedek dirilirdi.
        existingGroupIds: new Set(['TASINMIS_GRUP', 'BASKA_GRUP', 'BASKA_GRUP_2']),
        mapCourtId,
        ignoreSnapshotGroupFallback: true,
      })

      // Düzeltme: K1 boş (AdminCalendar ile birebir), K2/K3 dolu.
      expect(result.K1['10:00']).toBe('available')
      expect((result.K2['10:00'] as any).status).toBe('occupied')
      expect((result.K3['10:00'] as any).status).toBe('occupied')
    })

    it('regresyon: bayrak YOKKEN eski yedek davranışı korunur (K1 dolu kalır)', () => {
      const storedSchedule = emptyStored()
      storedSchedule.K1['10:00'] = {
        status: 'occupied',
        reservationType: 'group-lesson',
        groupAssignment: 'TASINMIS_GRUP',
        groupName: 'Eski Kort Grubu',
      }

      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule,
        reservations: [],
        existingGroupIds: new Set(['TASINMIS_GRUP']),
        mapCourtId,
        // ignoreSnapshotGroupFallback YOK
      })

      const slot = result.K1['10:00'] as any
      expect(slot.status).toBe('occupied')
      expect(slot.groupName).toBe('Eski Kort Grubu')
    })

    it('bayrak açıkken bile maintenance/closed admin durumları KORUNUR', () => {
      const storedSchedule = emptyStored()
      storedSchedule.K1['10:00'] = 'maintenance'
      storedSchedule.K1['11:00'] = 'closed'
      // Bu da atlanmalı (grup yedeği):
      storedSchedule.K2['10:00'] = {
        status: 'occupied',
        reservationType: 'group-lesson',
        groupAssignment: 'VAR_GRUP',
        groupName: 'Yedek Grup',
      }

      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule,
        reservations: [],
        existingGroupIds: new Set(['VAR_GRUP']),
        mapCourtId,
        ignoreSnapshotGroupFallback: true,
      })

      expect(result.K1['10:00']).toBe('maintenance')
      expect(result.K1['11:00']).toBe('closed')
      // Grup yedeği atlandığı için K2 boş.
      expect(result.K2['10:00']).toBe('available')
    })

    it('bayrak açıkken canlı rezervasyon yine doğru doldurur', () => {
      const reservations: RawReservationDoc[] = [
        { courtId: 'K2', startTime: '11:00', endTime: '12:30', status: 'confirmed', reservationType: 'group-lesson', groupId: 'CANLI_GRUP', studentName: 'Canlı Üye' },
      ]

      const result = buildCourtSchedule({
        courtIds: COURT_IDS,
        timeSlots: TIME_SLOTS,
        storedSchedule: emptyStored(),
        reservations,
        existingGroupIds: new Set(['CANLI_GRUP']),
        mapCourtId,
        groupNames: { CANLI_GRUP: 'Canlı Grup' },
        ignoreSnapshotGroupFallback: true,
      })

      expect((result.K2['11:00'] as any).status).toBe('occupied')
      // slotsInRange saat granülerdir: endTime 12:30 -> endH=12, yani 11:00 slotu
      // dolu, 12:00 slotu hariçtir (slotH < 12).
      expect(result.K2['12:00']).toBe('available')
      expect((result.K2['11:00'] as any).groupName).toBe('Canlı Grup')
    })
  })
})
