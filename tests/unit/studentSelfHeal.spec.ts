import { describe, it, expect } from 'vitest'

// StudentDashboard.vue'deki ensureGroupReservations fonksiyonunun karar
// mantığını saf fonksiyon olarak yeniden uyguluyoruz. Firestore çağrıları
// burada değil — sadece "hangi koşulda rezervasyon oluşturma çağrılmalı?"
// sorusunun yanıtı test ediliyor.

interface UserDoc {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  groupAssignment?: string | null
}

interface GroupDoc {
  id: string
  membershipType?: string
  schedule?: Array<{ day: string; time: string; court: string }>
  name?: string
}

type HealAction =
  | { kind: 'skip'; reason: string }
  | { kind: 'create'; groupId: string; membershipType: string }

function decideSelfHeal(args: {
  user: UserDoc | null
  futureReservationCount: number
  group: GroupDoc | null
}): HealAction {
  const { user, futureReservationCount, group } = args

  if (!user?.id) return { kind: 'skip', reason: 'no-user' }
  if (!user.groupAssignment) return { kind: 'skip', reason: 'no-group-assignment' }
  if (futureReservationCount > 0) return { kind: 'skip', reason: 'has-future-reservations' }
  if (!group) return { kind: 'skip', reason: 'group-not-found' }
  if (!group.schedule || group.schedule.length === 0) return { kind: 'skip', reason: 'empty-schedule' }
  if (!group.membershipType) return { kind: 'skip', reason: 'missing-membership-type' }

  return { kind: 'create', groupId: user.groupAssignment, membershipType: group.membershipType }
}

describe('StudentDashboard self-heal: eksik grup rezervasyonu kararı', () => {
  const validGroup: GroupDoc = {
    id: 'g1',
    membershipType: 'adult_group',
    schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K1' }],
    name: 'Yetişkin Pazartesi',
  }

  it('groupAssignment var, hiç gelecek rezervasyonu yok → create', () => {
    const action = decideSelfHeal({
      user: { id: 'berke', groupAssignment: 'g1', firstName: 'Berke' },
      futureReservationCount: 0,
      group: validGroup,
    })
    expect(action).toEqual({ kind: 'create', groupId: 'g1', membershipType: 'adult_group' })
  })

  it('gelecek rezervasyonu varsa → skip (çift yazma engeli)', () => {
    const action = decideSelfHeal({
      user: { id: 'berke', groupAssignment: 'g1' },
      futureReservationCount: 12,
      group: validGroup,
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('has-future-reservations')
  })

  it('groupAssignment yoksa (temel üye) → skip, Firestore çağrısı olmaz', () => {
    const action = decideSelfHeal({
      user: { id: 'temel', groupAssignment: null },
      futureReservationCount: 0,
      group: null,
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('no-group-assignment')
  })

  it('grup schedule boşsa → skip', () => {
    const action = decideSelfHeal({
      user: { id: 'berke', groupAssignment: 'g1' },
      futureReservationCount: 0,
      group: { ...validGroup, schedule: [] },
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('empty-schedule')
  })

  it('grup dokümanı silinmişse → skip', () => {
    const action = decideSelfHeal({
      user: { id: 'berke', groupAssignment: 'g-silinmis' },
      futureReservationCount: 0,
      group: null,
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('group-not-found')
  })

  it('grup membershipType yoksa → skip', () => {
    const action = decideSelfHeal({
      user: { id: 'berke', groupAssignment: 'g1' },
      futureReservationCount: 0,
      group: { ...validGroup, membershipType: undefined },
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('missing-membership-type')
  })

  it('user null ise → skip', () => {
    const action = decideSelfHeal({
      user: null,
      futureReservationCount: 0,
      group: null,
    })
    expect(action.kind).toBe('skip')
    if (action.kind === 'skip') expect(action.reason).toBe('no-user')
  })
})

// Firestore composite index'e bağımlı kalmamak için groupId+studentId ile
// sorgu yapıp tarih & status filtresini JS tarafında uyguluyoruz. Bu filtrenin
// mantığını doğrulayan saf fonksiyon testi.
interface ReservationDoc {
  date: Date
  status: string
}

function countFutureActiveReservations(records: ReservationDoc[], now: Date): number {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return records.filter(r =>
    r.date.getTime() >= today.getTime() && r.status !== 'cancelled'
  ).length
}

describe('Client-side rezervasyon filtresi (composite index bypass)', () => {
  const now = new Date('2026-04-22T10:00:00')

  it('gelecek + onaylı rezervasyon hasFuture=true', () => {
    expect(countFutureActiveReservations([
      { date: new Date('2026-05-01T18:00:00'), status: 'confirmed' },
    ], now)).toBe(1)
  })

  it('geçmiş rezervasyonları saymaz', () => {
    expect(countFutureActiveReservations([
      { date: new Date('2026-03-01T18:00:00'), status: 'confirmed' },
      { date: new Date('2026-04-21T18:00:00'), status: 'confirmed' },
    ], now)).toBe(0)
  })

  it('cancelled gelecek rezervasyonları saymaz (self-heal yine tetiklenmeli)', () => {
    expect(countFutureActiveReservations([
      { date: new Date('2026-05-01T18:00:00'), status: 'cancelled' },
      { date: new Date('2026-06-01T18:00:00'), status: 'cancelled' },
    ], now)).toBe(0)
  })

  it('karışık listede sadece gelecek+aktif olanları sayar', () => {
    expect(countFutureActiveReservations([
      { date: new Date('2026-03-10T18:00:00'), status: 'completed' },
      { date: new Date('2026-05-01T18:00:00'), status: 'cancelled' },
      { date: new Date('2026-05-08T18:00:00'), status: 'confirmed' },
      { date: new Date('2026-06-15T18:00:00'), status: 'pending' },
    ], now)).toBe(2)
  })
})
