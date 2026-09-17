import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Bellek içi sahte Firestore ---------------------------------------------
// Yalnızca servis sözleşmesini sınar: rezervasyon + kilit TEK batch'te mi,
// kilit doğru belgeyi mi gösteriyor, admin dolu kilide dokunuyor mu.
// Kuralların kendisi tests/unit/firestore-rules.spec.ts'te (emülatör) sınanır.
type Ref = { col: string; id: string; path: string }
const store = new Map<string, Record<string, unknown>>()
const commits: Array<Array<{ ref: Ref; data: Record<string, unknown> }>> = []
let commitError: unknown = null
let autoId = 0

const makeRef = (col: string, id: string): Ref => ({ col, id, path: `${col}/${id}` })

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, col: string) => ({ col }),
  doc: (parent: any, col?: string, id?: string) =>
    col === undefined ? makeRef(parent.col, `auto-${++autoId}`) : makeRef(col, id as string),
  getDoc: vi.fn(async (ref: Ref) => ({
    exists: () => store.has(ref.path),
    data: () => store.get(ref.path),
  })),
  serverTimestamp: () => 'SERVER_TS',
  writeBatch: () => {
    const ops: Array<{ ref: Ref; data: Record<string, unknown> }> = []
    return {
      set: (ref: Ref, data: Record<string, unknown>) => { ops.push({ ref, data }) },
      commit: vi.fn(async () => {
        commits.push(ops)
        if (commitError) throw commitError
        // Atomik: ret yoksa hepsi birlikte uygulanır.
        for (const op of ops) store.set(op.ref.path, op.data)
      }),
    }
  },
}))

vi.mock('@/services/firebase', () => ({ db: {} }))

import { getDoc } from 'firebase/firestore'
import {
  commitAdminCourtRental,
  commitStudentCourtRental,
} from '../../src/services/reservationDayLock'

const studentRental = (overrides: Record<string, unknown> = {}) => ({
  studentId: 'u1',
  courtId: 'court-1',
  dateKey: '2026-09-17',
  status: 'pending',
  type: 'court-rental',
  ...overrides,
})

beforeEach(() => {
  store.clear()
  commits.length = 0
  commitError = null
  autoId = 0
  vi.mocked(getDoc).mockClear()
})

describe('commitStudentCourtRental', () => {
  it('rezervasyon ve günün kilidi TEK batch commit\'inde yazılır; kilit yeni rezervasyonu gösterir', async () => {
    const id = await commitStudentCourtRental({
      studentId: 'u1',
      dateKey: '2026-09-17',
      reservation: studentRental(),
    })

    expect(commits).toHaveLength(1)
    const paths = commits[0].map((op) => op.ref.path)
    expect(paths).toEqual([`reservations/${id}`, 'reservationDayLocks/u1_2026-09-17'])

    expect(store.get(`reservations/${id}`)).toMatchObject({ studentId: 'u1', status: 'pending' })
    expect(store.get('reservationDayLocks/u1_2026-09-17')).toEqual({
      studentId: 'u1',
      dateKey: '2026-09-17',
      reservationId: id,
      updatedAt: 'SERVER_TS',
    })
  })

  it('kilit alanları kuraldaki beyaz listeyle birebir (studentId, dateKey, reservationId, updatedAt)', async () => {
    await commitStudentCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: studentRental() })
    const lock = store.get('reservationDayLocks/u1_2026-09-17')!
    expect(Object.keys(lock).sort()).toEqual(['dateKey', 'reservationId', 'studentId', 'updatedAt'])
  })

  it('öğrenci akışı kilidi okumaz — karar tamamen sunucudaki kurala bırakılır', async () => {
    await commitStudentCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: studentRental() })
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('kural batch\'i reddederse hata yukarı taşınır ve HİÇBİR şey yazılmaz (ikinci rezervasyon oluşmaz)', async () => {
    commitError = Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })

    await expect(
      commitStudentCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: studentRental() }),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    expect(store.size).toBe(0)
  })

  it('geçersiz tarih anahtarı → yazım denenmez', async () => {
    await expect(
      commitStudentCourtRental({ studentId: 'u1', dateKey: '17.09.2026', reservation: studentRental() }),
    ).rejects.toThrow()
    expect(commits).toHaveLength(0)
  })
})

describe('commitAdminCourtRental', () => {
  const adminRental = { studentId: 'u1', status: 'confirmed', type: 'court_rental', dateKey: '2026-09-17' }

  it('kilit yoksa öğrencinin kilidi admin kaydına bağlanır', async () => {
    const id = await commitAdminCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: adminRental })

    expect(commits).toHaveLength(1)
    expect(store.get('reservationDayLocks/u1_2026-09-17')).toMatchObject({ reservationId: id })
  })

  it('kilit İPTAL edilmiş kaydı gösteriyorsa devralınır', async () => {
    store.set('reservations/old', { studentId: 'u1', status: 'cancelled' })
    store.set('reservationDayLocks/u1_2026-09-17', { studentId: 'u1', dateKey: '2026-09-17', reservationId: 'old' })

    const id = await commitAdminCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: adminRental })

    expect(store.get('reservationDayLocks/u1_2026-09-17')).toMatchObject({ reservationId: id })
  })

  it('kilit SİLİNMİŞ bir kaydı gösteriyorsa devralınır', async () => {
    store.set('reservationDayLocks/u1_2026-09-17', { studentId: 'u1', dateKey: '2026-09-17', reservationId: 'gone' })

    const id = await commitAdminCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: adminRental })

    expect(store.get('reservationDayLocks/u1_2026-09-17')).toMatchObject({ reservationId: id })
  })

  it('kilit AKTİF bir kaydı gösteriyorsa (admin bilinçli ikinci kayıt) kayıt açılır ama kilide dokunulmaz', async () => {
    store.set('reservations/active', { studentId: 'u1', status: 'pending' })
    store.set('reservationDayLocks/u1_2026-09-17', { studentId: 'u1', dateKey: '2026-09-17', reservationId: 'active' })

    const id = await commitAdminCourtRental({ studentId: 'u1', dateKey: '2026-09-17', reservation: adminRental })

    expect(commits[0].map((op) => op.ref.path)).toEqual([`reservations/${id}`])
    expect(store.get('reservationDayLocks/u1_2026-09-17')).toMatchObject({ reservationId: 'active' })
  })

  it('misafir (kayıtsız kişi) kaydında kilit yok ve kilit okunmaz', async () => {
    const id = await commitAdminCourtRental({
      studentId: null,
      dateKey: '2026-09-17',
      reservation: { ...adminRental, studentId: null },
    })

    expect(commits[0].map((op) => op.ref.path)).toEqual([`reservations/${id}`])
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('tarih anahtarı bozuksa admin kaydı ENGELLENMEZ, yalnız kilit atlanır', async () => {
    const id = await commitAdminCourtRental({ studentId: 'u1', dateKey: '', reservation: adminRental })

    expect(commits[0].map((op) => op.ref.path)).toEqual([`reservations/${id}`])
  })
})
