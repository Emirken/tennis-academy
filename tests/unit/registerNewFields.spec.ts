import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Firestore mock — setDoc çağrısını yakalamak için
const setDocMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => {
  return {
    doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
    setDoc: (...args: any[]) => setDocMock(...args),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(() => () => {}),
    collection: (_db: any, name: string) => ({ _coll: name }),
    query: (...args: any[]) => ({ _query: args }),
    where: (field: string, op: string, value: any) => ({ _where: { field, op, value } }),
    // Default: silinmiş kullanıcı bulunamadı (empty)
    getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  }
})

const createUserMock = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: (...args: any[]) => createUserMock(...args),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}))

vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: vi.fn().mockResolvedValue(undefined) },
}))

import { useAuthStore } from '@/store/modules/auth'

describe('Auth store register — yeni alanlar (email, birthDate, level)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setDocMock.mockClear()
    createUserMock.mockReset()
  })

  it('register, email/birthDate/level alanlarını Firestore dokümanına yazar', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-1' } })

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '1990-05-10',
      level: 'orta',
    })

    expect(ok).toBe(true)
    expect(setDocMock).toHaveBeenCalledTimes(1)

    const [, payload] = setDocMock.mock.calls[0]
    expect(payload.email).toBe('ada@example.com')
    expect(payload.birthDate).toBe('1990-05-10')
    expect(payload.level).toBe('orta')
    expect(payload.phone_number).toBe('05551234567')
    expect(payload.role).toBe('student')
    expect(payload.status).toBe('pending')
  })

  it('opsiyonel alanlar verilmezse undefined yazılmaz', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-2' } })

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05559876543',
      password: 'secret123',
      firstName: 'Grace',
      lastName: 'Hopper',
      role: 'student',
    })

    expect(ok).toBe(true)
    const [, payload] = setDocMock.mock.calls[0]
    expect('email' in payload).toBe(false)
    expect('birthDate' in payload).toBe(false)
    expect('level' in payload).toBe(false)
  })
})

describe('Form validasyon kuralları', () => {
  const emailRules = [
    (v: string) => !!v || 'E-posta gereklidir',
    (v: string) => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz',
  ]

  const birthDateRules = [
    (v: string) => !!v || 'Doğum tarihi gereklidir',
    (v: string) => {
      if (!v) return true
      const d = new Date(v)
      if (isNaN(d.getTime())) return 'Geçerli bir tarih giriniz'
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (d > today) return 'Doğum tarihi gelecekte olamaz'
      return true
    },
  ]

  const levelRules = [(v: string) => !!v || 'Seviye seçiniz']

  const runAll = (rules: Array<(v: string) => true | string>, v: string) =>
    rules.map((r) => r(v))

  it('emailRules: boş reddedilir, geçersiz reddedilir, geçerli kabul edilir', () => {
    expect(runAll(emailRules, '')[0]).toBe('E-posta gereklidir')
    expect(runAll(emailRules, 'yanlisformat')[1]).toBe('Geçerli bir e-posta adresi giriniz')
    expect(runAll(emailRules, 'ok@mail.com').every((r) => r === true)).toBe(true)
  })

  it('birthDateRules: boş reddedilir, gelecek tarih reddedilir, geçmiş tarih kabul edilir', () => {
    expect(runAll(birthDateRules, '')[0]).toBe('Doğum tarihi gereklidir')

    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const futureStr = future.toISOString().slice(0, 10)
    expect(runAll(birthDateRules, futureStr)[1]).toBe('Doğum tarihi gelecekte olamaz')

    expect(runAll(birthDateRules, '1995-03-15').every((r) => r === true)).toBe(true)
  })

  it('levelRules: boş reddedilir, seçilen değer kabul edilir', () => {
    expect(levelRules[0]('')).toBe('Seviye seçiniz')
    expect(levelRules[0]('temel')).toBe(true)
    expect(levelRules[0]('orta')).toBe(true)
    expect(levelRules[0]('ileri')).toBe(true)
  })
})
