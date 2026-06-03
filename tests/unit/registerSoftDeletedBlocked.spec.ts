import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const setDocMock = vi.fn().mockResolvedValue(undefined)
const getDocsMock = vi.fn()

vi.mock('firebase/firestore', () => {
  return {
    doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
    setDoc: (...args: any[]) => setDocMock(...args),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(() => () => {}),
    collection: (_db: any, name: string) => ({ _coll: name }),
    query: (...args: any[]) => ({ _query: args }),
    where: (field: string, op: string, value: any) => ({ _where: { field, op, value } }),
    getDocs: (...args: any[]) => getDocsMock(...args),
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

describe('register — soft-deleted telefonla yeniden kayıt yönlendirmesi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setDocMock.mockClear()
    createUserMock.mockReset()
    getDocsMock.mockReset()
  })

  it('aynı telefonla deleted=true doc varsa: yeni Auth kaydı oluşturulmaz, anlamlı hata döner', async () => {
    // Soft-deleted kullanıcı bulundu
    getDocsMock.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'old-uid', data: () => ({ phone_number: '05551112233', deleted: true }) }],
    })

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05551112233',
      password: 'newpass123',
      firstName: 'Yeni',
      lastName: 'Kullanici',
      role: 'student',
    })

    expect(ok).toBe(false)
    expect(createUserMock).not.toHaveBeenCalled()
    expect(setDocMock).not.toHaveBeenCalled()
    expect(store.error).toMatch(/daha önce/i)
    expect(store.error).toMatch(/yöneticiyle iletişime geçin/i)
  })

  it('telefon numarasının soft-deleted kaydı yoksa kayıt normal akışla devam eder', async () => {
    getDocsMock.mockResolvedValueOnce({ empty: true, docs: [] })
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05550000000',
      password: 'pw123456',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
    })

    expect(ok).toBe(true)
    expect(createUserMock).toHaveBeenCalledTimes(1)
    expect(setDocMock).toHaveBeenCalledTimes(1)
  })
})
