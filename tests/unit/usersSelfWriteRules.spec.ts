import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { setActivePinia, createPinia } from 'pinia'

// Kullanıcının KENDİ users belgesine yazdığı alanlar ile firestore.rules'taki
// beyaz listeler arasındaki sapmayı yakalar (emülatör gerektirmez). Kuralın
// kendisi tests/unit/firestore-rules.spec.ts'te emülatörle sınanır. Profil
// formuna yeni alan eklenip kural güncellenmezse öğrencinin kaydı canlıda
// "izin yok" hatasıyla düşer — bu test onu önceden yakalar.

const rules = readFileSync('firestore.rules', 'utf8')

function hasOnlyList(functionName: string): string[] {
  const match = new RegExp(
    `function ${functionName}\\([^)]*\\)\\s*\\{[\\s\\S]*?hasOnly\\(\\[([\\s\\S]*?)\\]\\)`,
  ).exec(rules)
  if (!match) throw new Error(`${functionName} içinde hasOnly listesi bulunamadı`)
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^'|'$/g, ''))
    .filter(Boolean)
}

const REGISTRATION_FIELDS = hasOnlyList('isValidSelfRegistration')
const SELF_UPDATE_FIELDS = hasOnlyList('isAllowedSelfUpdate')

const expectKeysWithin = (payload: Record<string, unknown>, allowed: string[]) => {
  const extra = Object.keys(payload).filter((k) => !allowed.includes(k))
  expect(extra, `kuralda izin verilmeyen alanlar: ${extra.join(', ')}`).toEqual([])
}

// --- Mocklar ------------------------------------------------------------------
const setDocMock = vi.fn().mockResolvedValue(undefined)
const updateDocMock = vi.fn().mockResolvedValue(undefined)
const getDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  onSnapshot: vi.fn(() => () => {}),
  collection: (_db: unknown, name: string) => ({ _coll: name }),
  query: (...args: unknown[]) => ({ _query: args }),
  where: (field: string, op: string, value: unknown) => ({ _where: { field, op, value } }),
  serverTimestamp: () => '__SERVER_TS__',
}))

const createUserMock = vi.fn()
const signInMock = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => signInMock(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserMock(...args),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }))

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: { uid: 'uid-1' } },
  db: {},
  functions: {},
}))

vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('@/services/pushNotificationService', () => ({
  pushNotificationService: {},
}))

import { useAuthStore } from '@/store/modules/auth'
import { AuthService } from '@/services/auth'
import { clearMustResetPassword } from '@/services/passwordResetService'

beforeEach(() => {
  setActivePinia(createPinia())
  setDocMock.mockClear()
  updateDocMock.mockClear()
  getDocMock.mockReset()
  createUserMock.mockReset()
  signInMock.mockReset()
})

describe('firestore.rules — users beyaz listeleri', () => {
  it('kullanıcının kendi belgesine serbest yazma kuralı kaldırıldı', () => {
    expect(rules).not.toMatch(/allow read, write: if request\.auth != null && request\.auth\.uid == userId/)
  })

  it('kendi güncellemesinde yetki alanı yok', () => {
    for (const field of [
      'role', 'status', 'deleted', 'phone_number', 'membershipType',
      'groupAssignment', 'groupSchedule', 'level', 'balance', 'id',
    ]) {
      expect(SELF_UPDATE_FIELDS).not.toContain(field)
    }
  })

  it('kayıtta yetki alanı yok; rol öğrenci ve durum onay bekliyor zorunlu', () => {
    for (const field of ['deleted', 'membershipType', 'groupAssignment', 'groupSchedule', 'balance', 'mustResetPassword']) {
      expect(REGISTRATION_FIELDS).not.toContain(field)
    }
    expect(rules).toMatch(/d\.get\('role', null\) == 'student'/)
    expect(rules).toMatch(/d\.get\('status', null\) == 'pending'/)
  })
})

describe('istemcinin kendi belgesine yazdıkları kurala uyar', () => {
  it('kayıt (auth store register) — tüm opsiyonel alanlarla', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })

    const ok = await useAuthStore().register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '2010-05-10',
      level: 'orta',
    })

    expect(ok).toBe(true)
    const [ref, payload] = setDocMock.mock.calls[0]
    expect(ref._path).toBe('users/uid-new')
    expectKeysWithin(payload, REGISTRATION_FIELDS)
    expect(payload).toMatchObject({ id: 'uid-new', role: 'student', status: 'pending' })
  })

  it('kayıt kurtarma yolu (auth hesabı var, belge yok)', async () => {
    createUserMock.mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-old' } })
    getDocMock.mockResolvedValueOnce({ exists: () => false })

    const ok = await useAuthStore().register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
    })

    expect(ok).toBe(true)
    const [ref, payload] = setDocMock.mock.calls[0]
    expect(ref._path).toBe('users/uid-old')
    expectKeysWithin(payload, REGISTRATION_FIELDS)
    expect(payload).toMatchObject({ id: 'uid-old', role: 'student', status: 'pending' })
  })

  it('kayıt (AuthService.createUserDocument)', async () => {
    await AuthService.createUserDocument({
      id: 'uid-svc',
      phone_number: '05551234567',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
    } as any)

    const [, payload] = setDocMock.mock.calls[0]
    expectKeysWithin(payload, REGISTRATION_FIELDS)
    expect(payload).toMatchObject({ id: 'uid-svc', role: 'student', status: 'pending' })
  })

  it('profil formu (AuthService.updateProfile) — UpdateProfileData alanlarının tamamı', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      id: 'uid-1',
      data: () => ({ firstName: 'Ada', lastName: 'L', role: 'student' }),
    })

    await AuthService.updateProfile('uid-1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '05551234567',
      email: 'ada@example.com',
      birthDate: '2010-05-10',
      address: 'Urla',
      emergencyContact: 'Anne',
    })

    const [ref, payload] = updateDocMock.mock.calls[0]
    expect(ref._path).toBe('users/uid-1')
    expectKeysWithin(payload, SELF_UPDATE_FIELDS)
  })

  it('son giriş zamanı (AuthService.updateLastLogin)', async () => {
    await AuthService.updateLastLogin('uid-1')

    const [, payload] = updateDocMock.mock.calls[0]
    expectKeysWithin(payload, SELF_UPDATE_FIELDS)
  })

  it('zorunlu şifre bayrağını kaldırma (clearMustResetPassword) — yalnız false', async () => {
    await clearMustResetPassword('uid-1')

    const [, payload] = updateDocMock.mock.calls[0]
    expectKeysWithin(payload, SELF_UPDATE_FIELDS)
    expect(payload.mustResetPassword).toBe(false)
  })
})
