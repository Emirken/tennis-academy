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

const createAdminNotificationMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: (...args: any[]) => createAdminNotificationMock(...args) },
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

  it('kayıt formu profili belgeye yazılır ve bildirim "Ad Soyad (telefon)" biçimindedir', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-3' } })
    createAdminNotificationMock.mockClear()
    const now = new Date(2026, 8, 25, 10, 0)

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '2014-03-01',
      level: 'temel',
      profile: {
        isMinor: true,
        parentFirstName: 'Ayşe',
        parentLastName: 'Lovelace',
        parentPhone: '05559876543',
        trainingTypes: ['tennis_school'],
        hasHealthCondition: false,
        referralSource: 'friend',
        referralDetail: 'Mehmet Kaya',
        waiverAcceptedAt: now,
        dataConsentAcceptedAt: now,
        marketingConsent: false,
      },
    })

    expect(ok).toBe(true)
    const [, payload] = setDocMock.mock.calls[0]
    expect(payload).toMatchObject({
      isMinor: true,
      parentPhone: '05559876543',
      trainingTypes: ['tennis_school'],
      referralSource: 'friend',
      referralDetail: 'Mehmet Kaya',
      waiverAcceptedAt: now,
      status: 'pending',
    })
    expect(createAdminNotificationMock).toHaveBeenCalledWith(
      'Yeni Öğrenci Kaydı',
      'Ada Lovelace (0555 123 45 67) kayıt olmak istiyor.',
      'approval_pending',
      'uid-3',
    )
  })
})

// Not: Register.vue'nun eski kural dizilerinin kopyası olan "Form validasyon kuralları"
// testleri kaldırıldı; aynı iddialar (e-posta zorunlu/geçerli, doğum tarihi zorunlu /
// gelecekte olamaz, seviye zorunlu) artık gerçek fonksiyonu sınayan
// tests/unit/registrationForm.spec.ts içinde.
