import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Kayıt girişsiz `users` sorgusu ATMAZ (kurallar girişsiz okumayı reddettiği için
// eskiden her kayıt bu sorguda düşüyordu). Telefonun Auth hesabı zaten varsa
// girilen şifreyle giriş denenir: belge yoksa (reddedilmiş kayıt) yeniden yazılır,
// belge varsa kayıt yapılmaz ve oturum kapatılır.

const setDocMock = vi.fn().mockResolvedValue(undefined)
const getDocMock = vi.fn()
const getDocsMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
  setDoc: (...args: any[]) => setDocMock(...args),
  getDoc: (...args: any[]) => getDocMock(...args),
  getDocs: (...args: any[]) => getDocsMock(...args),
  onSnapshot: vi.fn(() => () => {}),
  collection: (_db: any, name: string) => ({ _coll: name }),
  query: (...args: any[]) => ({ _query: args }),
  where: (field: string, op: string, value: any) => ({ _where: { field, op, value } }),
}))

const createUserMock = vi.fn()
const signInMock = vi.fn()
const signOutMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => signInMock(...args),
  createUserWithEmailAndPassword: (...args: any[]) => createUserMock(...args),
  signOut: (...args: any[]) => signOutMock(...args),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({ auth: { currentUser: null }, db: {} }))

const createAdminNotificationMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: (...args: any[]) => createAdminNotificationMock(...args) },
}))

import { useAuthStore } from '@/store/modules/auth'

const input = {
  phone_number: '05551112233',
  password: 'pw123456',
  firstName: 'Yeni',
  lastName: 'Kullanici',
  role: 'student' as const,
}

beforeEach(() => {
  setActivePinia(createPinia())
  setDocMock.mockClear()
  getDocMock.mockReset()
  getDocsMock.mockReset()
  createUserMock.mockReset()
  signInMock.mockReset()
  signOutMock.mockClear()
  createAdminNotificationMock.mockReset().mockResolvedValue(undefined)
})

describe('register — girişsiz sorgu yok', () => {
  it('normal kayıt users koleksiyonunu sorgulamadan belgeyi yazar', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })
    const ok = await useAuthStore().register(input)
    expect(ok).toBe(true)
    expect(getDocsMock).not.toHaveBeenCalled()
    expect(setDocMock).toHaveBeenCalledTimes(1)
  })

  it('bildirim yazılamasa da kayıt başarılı sayılır', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })
    createAdminNotificationMock.mockRejectedValueOnce(new Error('permission-denied'))
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(true)
    expect(store.error).toBeNull()
    expect(store.user?.id).toBe('uid-new')
  })
})

describe('register — telefonun Auth hesabı zaten var', () => {
  beforeEach(() => {
    createUserMock.mockRejectedValue({ code: 'auth/email-already-in-use' })
  })

  it('belge yoksa (reddedilmiş kayıt) belge yeniden yazılır', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-old' } })
    getDocMock.mockResolvedValueOnce({ exists: () => false })
    const ok = await useAuthStore().register(input)
    expect(ok).toBe(true)
    const [ref, payload] = setDocMock.mock.calls[0]
    expect(ref._path).toBe('users/uid-old')
    expect(payload).toMatchObject({ id: 'uid-old', status: 'pending' })
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('belge silinmişse kayıt yapılmaz, oturum kapanır, yöneticiye yönlendirilir', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-del' } })
    getDocMock.mockResolvedValueOnce({ exists: () => true, data: () => ({ deleted: true, status: 'deleted' }) })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(signOutMock).toHaveBeenCalled()
    expect(store.error).toMatch(/silinmiş/i)
    expect(store.error).toMatch(/yöneticiyle iletişime geçin/i)
  })

  it('belge etkinse kayıt yapılmaz, oturum kapanır, "zaten kayıtlı" denir', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-act' } })
    getDocMock.mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'active' }) })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(signOutMock).toHaveBeenCalled()
    expect(store.error).toMatch(/zaten kayıtlı/i)
  })

  it('şifre tutmazsa "zaten kayıtlı" denir, belge yazılmaz', async () => {
    signInMock.mockRejectedValueOnce({ code: 'auth/wrong-password' })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(store.error).toMatch(/zaten kayıtlı/i)
  })
})
