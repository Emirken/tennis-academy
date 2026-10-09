import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Bellek içi sahte Firestore ---------------------------------------------
// Servis sözleşmesi: onay/red YALNIZ hâlâ 'pending' olan talebe uygulanır ve
// okuma+yazma tek transaction'dadır. Sunucu tarafı karşılığı (kapanmış kort
// kiralaması yeniden aktif olamaz) tests/unit/firestore-rules.spec.ts'te.
type Ref = { col: string; id: string; path: string }
const store = new Map<string, Record<string, any>>()

const makeRef = (col: string, id: string): Ref => ({ col, id, path: `${col}/${id}` })
const fieldOf = (data: Record<string, any>, path: string) =>
  path.split('.').reduce((v: any, k) => (v == null ? undefined : v[k]), data)

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, col: string) => ({ col }),
  doc: (_db: unknown, col: string, id: string) => makeRef(col, id),
  where: (field: string, _op: string, value: unknown) => ({ field, value }),
  query: (c: { col: string }, ...wheres: Array<{ field: string; value: unknown }>) => ({ col: c.col, wheres }),
  getDocs: vi.fn(async (q: { col: string; wheres: Array<{ field: string; value: unknown }> }) => ({
    docs: [...store.entries()]
      .filter(([path, data]) =>
        path.startsWith(`${q.col}/`) && q.wheres.every((w) => fieldOf(data, w.field) === w.value))
      .map(([path]) => ({ ref: makeRef(q.col, path.slice(q.col.length + 1)) })),
  })),
  deleteDoc: vi.fn(async (ref: Ref) => { store.delete(ref.path) }),
  serverTimestamp: () => 'SERVER_TS',
  runTransaction: vi.fn(async (_db: unknown, fn: (tx: any) => Promise<unknown>) => {
    const writes: Array<() => void> = []
    const result = await fn({
      get: async (ref: Ref) => ({
        exists: () => store.has(ref.path),
        data: () => store.get(ref.path),
      }),
      update: (ref: Ref, data: Record<string, any>) => {
        writes.push(() => store.set(ref.path, { ...store.get(ref.path), ...data }))
      },
    })
    // Atomik: yazımlar fonksiyon başarıyla dönünce birlikte uygulanır.
    writes.forEach((w) => w())
    return result
  }),
}))

vi.mock('@/services/firebase', () => ({ db: {} }))

import { runTransaction } from 'firebase/firestore'
import {
  deletePendingRequestNotifications,
  reviewPendingReservation,
} from '../../src/services/reservationApproval'

beforeEach(() => {
  store.clear()
  vi.mocked(runTransaction).mockClear()
})

describe('reviewPendingReservation', () => {
  it('bekleyen talebi onaylar (pending → confirmed) ve transaction içinde yapar', async () => {
    store.set('reservations/r1', { status: 'pending', studentId: 'u1' })

    await expect(reviewPendingReservation('r1', 'approve')).resolves.toBe('done')

    expect(store.get('reservations/r1')).toMatchObject({ status: 'confirmed' })
    expect(runTransaction).toHaveBeenCalledTimes(1)
  })

  // 2026-10-08 olayı: öğrenci iptal etti, bildirim kaldı, admin onayladı.
  it('öğrencinin iptal ettiği talebi DİRİLTMEZ → stale, kayıt aynen kalır', async () => {
    const cancelled = { status: 'cancelled', cancelledAt: 'T', cancelledBy: 'student', studentId: 'u1' }
    store.set('reservations/r1', { ...cancelled })

    await expect(reviewPendingReservation('r1', 'approve')).resolves.toBe('stale')

    expect(store.get('reservations/r1')).toEqual(cancelled)
  })

  it('zaten onaylanmış ya da silinmiş talep → stale', async () => {
    store.set('reservations/r1', { status: 'confirmed' })
    await expect(reviewPendingReservation('r1', 'approve')).resolves.toBe('stale')
    await expect(reviewPendingReservation('yok', 'approve')).resolves.toBe('stale')
    expect(store.has('reservations/yok')).toBe(false)
  })

  it('bekleyen talebi reddeder (admin iptali alanlarıyla)', async () => {
    store.set('reservations/r1', { status: 'pending' })

    await expect(reviewPendingReservation('r1', 'reject')).resolves.toBe('done')

    expect(store.get('reservations/r1')).toEqual({
      status: 'cancelled', cancelledAt: 'SERVER_TS', cancelledBy: 'admin',
    })
  })

  it('öğrencinin iptal ettiğini reddetmez: cancelledBy "student" ezilmez', async () => {
    store.set('reservations/r1', { status: 'cancelled', cancelledBy: 'student' })

    await expect(reviewPendingReservation('r1', 'reject')).resolves.toBe('stale')

    expect(store.get('reservations/r1')).toEqual({ status: 'cancelled', cancelledBy: 'student' })
  })
})

describe('deletePendingRequestNotifications', () => {
  it('yalnız verilen taleplerin reservation_pending bildirimlerini siler', async () => {
    store.set('notifications/n1', { type: 'reservation_pending', relatedData: { reservationId: 'r1' } })
    store.set('notifications/n2', { type: 'reservation_pending', relatedData: { reservationId: 'r2' } })
    store.set('notifications/n3', { type: 'reservation_pending', relatedData: { reservationId: 'r3' } })
    store.set('notifications/n4', { type: 'reservation_rejected', relatedData: { reservationId: 'r1' } })

    await deletePendingRequestNotifications(['r1', 'r2'])

    expect([...store.keys()].sort()).toEqual(['notifications/n3', 'notifications/n4'])
  })

  it('boş liste → hiçbir şey yapmaz', async () => {
    store.set('notifications/n1', { type: 'reservation_pending', relatedData: { reservationId: 'r1' } })
    await deletePendingRequestNotifications([])
    expect(store.size).toBe(1)
  })
})
