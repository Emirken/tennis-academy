import { describe, it, expect } from 'vitest'
import {
  countCourtReservationsByPeriod,
  computeMonthlyRevenue,
  countActiveStudents,
  getWeekRange,
  type RevenueStudentLike,
  type PackagePriceInfo,
} from '../../src/utils/bossMetrics'
import type { RawReservationDoc } from '../../src/utils/dailyReservationLimit'

// Firestore Timestamp benzeri obje üretici (toDate() döndüren).
const fakeTimestamp = (d: Date) => ({ toDate: () => d })

// Referans: Salı, 2 Haziran 2026. O haftanın Pazartesi'si 1 Haziran, Pazar'ı 7 Haziran.
const REF = new Date(2026, 5, 2, 12, 0, 0)

// Kısa yol: belirli bir günde (yerel) confirmed bir kort rezervasyonu.
const courtResv = (date: unknown, status = 'confirmed'): RawReservationDoc => ({
  studentId: 's1',
  status,
  date,
  type: 'court-rental',
})

describe('bossMetrics — getWeekRange', () => {
  it('Salı için hafta Pazartesi→Pazar döner', () => {
    expect(getWeekRange(REF)).toEqual({ start: '2026-06-01', end: '2026-06-07' })
  })

  it('Pazar gününü içinde bulunduğu haftaya (önceki Pazartesi) bağlar', () => {
    // 7 Haziran 2026 Pazar → aynı hafta 1–7 Haziran
    expect(getWeekRange(new Date(2026, 5, 7, 12, 0))).toEqual({
      start: '2026-06-01',
      end: '2026-06-07',
    })
  })

  it('Pazartesi gününde hafta o günle başlar', () => {
    expect(getWeekRange(new Date(2026, 5, 1, 9, 0))).toEqual({
      start: '2026-06-01',
      end: '2026-06-07',
    })
  })
})

describe('bossMetrics — countCourtReservationsByPeriod', () => {
  it('aynı gün/hafta/ay sınırlarını doğru sayar', () => {
    const docs: RawReservationDoc[] = [
      courtResv('2026-06-02'), // bugün → daily+weekly+monthly
      courtResv('2026-06-05'), // aynı hafta → weekly+monthly
      courtResv('2026-06-20'), // aynı ay, farklı hafta → monthly
      courtResv('2026-05-31'), // önceki ay (ve önceki hafta) → hiçbiri
      courtResv('2026-06-08'), // sonraki hafta, aynı ay → monthly
    ]
    expect(countCourtReservationsByPeriod(docs, REF)).toEqual({
      daily: 1,
      weekly: 2,
      monthly: 4,
    })
  })

  it('dersleri (isLessonDoc) saymaz — yalnızca kort rezervasyonları', () => {
    const docs: RawReservationDoc[] = [
      courtResv('2026-06-02'), // sayılır
      { studentId: 's2', status: 'confirmed', date: '2026-06-02', type: 'group-lesson' }, // ders → atla
      { studentId: 's3', status: 'confirmed', date: '2026-06-02', groupId: 'g1' }, // grup dersi → atla
      { studentId: 's4', status: 'confirmed', date: '2026-06-02', reservationType: 'private-lesson' }, // özel ders → atla
    ]
    expect(countCourtReservationsByPeriod(docs, REF)).toEqual({
      daily: 1,
      weekly: 1,
      monthly: 1,
    })
  })

  it('iptal/no_show/completed durumlarını saymaz, status\'suzu sayar', () => {
    const docs: RawReservationDoc[] = [
      courtResv('2026-06-02', 'cancelled'), // boş → atla
      courtResv('2026-06-02', 'no_show'), // boş → atla
      courtResv('2026-06-02', 'completed'), // boş → atla
      courtResv('2026-06-02', 'pending'), // dolu → say
      { studentId: 's9', date: '2026-06-02', type: 'court-rental' }, // status yok → dolu say
    ]
    expect(countCourtReservationsByPeriod(docs, REF)).toEqual({
      daily: 2,
      weekly: 2,
      monthly: 2,
    })
  })

  it('Timestamp ve Date tarih formatlarını da normalize eder', () => {
    const docs: RawReservationDoc[] = [
      courtResv(fakeTimestamp(new Date(2026, 5, 2, 9, 0))), // Timestamp, bugün
      courtResv(new Date(2026, 5, 3, 9, 0)), // Date, aynı hafta
    ]
    expect(countCourtReservationsByPeriod(docs, REF)).toEqual({
      daily: 1,
      weekly: 2,
      monthly: 2,
    })
  })

  it('tarihi çözülemeyen dokümanları yok sayar', () => {
    const docs: RawReservationDoc[] = [
      courtResv('2026-06-02'),
      courtResv(null),
      courtResv('geçersiz-tarih'),
    ]
    expect(countCourtReservationsByPeriod(docs, REF)).toEqual({
      daily: 1,
      weekly: 1,
      monthly: 1,
    })
  })
})

describe('bossMetrics — computeMonthlyRevenue', () => {
  const typesMap: Record<string, PackagePriceInfo> = {
    premium: { name: 'Premium Üyelik', monthlyPrice: 10000 },
    vip: { name: 'VIP Üyelik', monthlyPrice: 15000 },
    basic: { name: 'Temel Üyelik', monthlyPrice: 6000 },
  }

  it('pakete göre aktif öğrenci × fiyat toplar ve ara toplama göre sıralar (basic hariç)', () => {
    const students: RevenueStudentLike[] = [
      { membershipType: 'premium', status: 'active' },
      { membershipType: 'premium', status: 'active' },
      { membershipType: 'vip', status: 'active' },
      { membershipType: 'basic', status: 'active' }, // Temel Üyelik → ciroya GİRMEZ
    ]
    const result = computeMonthlyRevenue(students, typesMap)
    expect(result.total).toBe(10000 * 2 + 15000) // 35000 (basic 6000 dahil DEĞİL)
    // En yüksek ara toplam (premium 20000) ilk sırada
    expect(result.byPackage[0]).toEqual({
      key: 'premium',
      name: 'Premium Üyelik',
      count: 2,
      unitPrice: 10000,
      subtotal: 20000,
    })
    // basic satırı tabloda görünmemeli
    expect(result.byPackage.some((r) => r.key === 'basic')).toBe(false)
  })

  it("'Temel Üyelik' (basic) öğrencilerini ciro dağılımından tamamen hariç tutar", () => {
    const students: RevenueStudentLike[] = [
      { membershipType: 'basic', status: 'active' },
      { membershipType: 'basic', status: 'approved' },
    ]
    const result = computeMonthlyRevenue(students, typesMap)
    expect(result.total).toBe(0)
    expect(result.byPackage).toHaveLength(0)
  })

  it('rezervasyon sayısını 1000 TL birim fiyatla ayrı satır olarak ekler', () => {
    const students: RevenueStudentLike[] = [{ membershipType: 'vip', status: 'active' }]
    const result = computeMonthlyRevenue(students, typesMap, 3)
    // vip 15000 + rezervasyon 3 × 1000
    expect(result.total).toBe(15000 + 3000)
    const resvRow = result.byPackage.find((r) => r.key === '__reservations__')
    expect(resvRow).toEqual({
      key: '__reservations__',
      name: 'Kort Rezervasyonu',
      count: 3,
      unitPrice: 1000,
      subtotal: 3000,
    })
  })

  it('rezervasyon sayısı 0 ise rezervasyon satırı eklemez', () => {
    const students: RevenueStudentLike[] = [{ membershipType: 'vip', status: 'active' }]
    const result = computeMonthlyRevenue(students, typesMap, 0)
    expect(result.byPackage.some((r) => r.key === '__reservations__')).toBe(false)
    expect(result.total).toBe(15000)
  })

  it('hiç öğrenci olmasa da rezervasyon cirosu tek başına yansır', () => {
    const result = computeMonthlyRevenue([], typesMap, 5)
    expect(result.total).toBe(5000)
    expect(result.byPackage).toHaveLength(1)
    expect(result.byPackage[0].key).toBe('__reservations__')
  })

  it("yalnızca 'active'/'approved' öğrencileri sayar; diğerlerini hariç tutar", () => {
    // Aktif tanımı admin paneliyle birebir: active/approved aktif; deleted,
    // inactive, suspended, pending ve status'suz öğrenciler ciroya GİRMEZ.
    const students: RevenueStudentLike[] = [
      { membershipType: 'vip', status: 'active' }, // aktif
      { membershipType: 'vip', status: 'approved' }, // aktif
      { membershipType: 'vip', deleted: true }, // silinmiş → hariç
      { membershipType: 'vip', status: 'inactive' }, // pasif → hariç
      { membershipType: 'vip', status: 'suspended' }, // askıda → hariç
      { membershipType: 'vip', status: 'pending' }, // onaysız → hariç
    ]
    const result = computeMonthlyRevenue(students, typesMap)
    expect(result.total).toBe(15000 * 2)
    expect(result.byPackage).toHaveLength(1)
    expect(result.byPackage[0].count).toBe(2)
  })

  it("status'u olmayan/onaysız öğrenciyi aktif SAYMAZ (admin paritesi)", () => {
    const students: RevenueStudentLike[] = [
      { status: undefined }, // status yok → aktif değil
      {}, // hiç alan yok → aktif değil
      { status: 'pending' }, // onaysız → aktif değil
    ]
    const result = computeMonthlyRevenue(students, typesMap)
    expect(result.byPackage).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('bilinmeyen / fiyatsız paketi 0 fiyatla ele alır (yine sayar)', () => {
    const students: RevenueStudentLike[] = [
      { membershipType: 'olmayan_paket', status: 'active' },
    ]
    const result = computeMonthlyRevenue(students, typesMap)
    expect(result.total).toBe(0)
    expect(result.byPackage[0]).toMatchObject({
      key: 'olmayan_paket',
      name: 'olmayan_paket',
      count: 1,
      unitPrice: 0,
      subtotal: 0,
    })
  })

  it('boş öğrenci listesi için sıfır döner', () => {
    expect(computeMonthlyRevenue([], typesMap)).toEqual({ total: 0, byPackage: [] })
  })
})

describe('bossMetrics — countActiveStudents', () => {
  const typesMap: Record<string, PackagePriceInfo> = {
    vip: { name: 'VIP Üyelik', monthlyPrice: 15000 },
    basic: { name: 'Temel Üyelik', monthlyPrice: 6000 },
  }

  it("yalnızca 'active'/'approved' öğrencileri sayar (admin paritesi)", () => {
    const students: RevenueStudentLike[] = [
      { status: 'active' },
      { status: 'approved' },
      { deleted: true }, // silinmiş → hariç
      { status: 'inactive' }, // hariç
      { status: 'suspended' }, // hariç
      { status: 'expired' }, // hariç
      { status: 'pending' }, // onaysız → hariç
    ]
    expect(countActiveStudents(students)).toBe(2)
  })

  it("status'u olmayan/boş öğrenciyi aktif SAYMAZ", () => {
    const students: RevenueStudentLike[] = [{ status: undefined }, {}]
    expect(countActiveStudents(students)).toBe(0)
  })

  it('boş liste için 0 döner', () => {
    expect(countActiveStudents([])).toBe(0)
  })

  it("aktif öğrenci sayısı 'basic' öğrencileri de kapsar (ciroya girmeseler de)", () => {
    // Aktif öğrenci sayısı admin paritesiyle hesaplanır: basic dahil tüm
    // active/approved öğrenciler aktiftir. ANCAK ciro tablosu basic'i hariç
    // tuttuğu için byPackage[].count toplamı aktif sayıdan AZ olabilir.
    const students: RevenueStudentLike[] = [
      { membershipType: 'vip', status: 'active' },
      { membershipType: 'basic', status: 'approved' }, // aktif ama ciroya girmez
      { membershipType: 'vip', status: 'pending' }, // onaysız → hariç
      { membershipType: 'vip', deleted: true }, // hariç
      { membershipType: 'basic', status: 'suspended' }, // hariç
    ]
    // 2 aktif öğrenci (vip-active + basic-approved)
    expect(countActiveStudents(students)).toBe(2)
    // Ciro tablosunda yalnızca vip öğrencisi var (basic hariç)
    const revenueActiveCount = computeMonthlyRevenue(students, typesMap).byPackage.reduce(
      (sum, row) => sum + row.count,
      0,
    )
    expect(revenueActiveCount).toBe(1)
  })
})
