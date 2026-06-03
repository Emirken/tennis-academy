import { describe, it, expect, beforeEach, vi } from 'vitest'

// Firestore mock — updateDoc çağrısını yakalamak için
const updateDocMock = vi.fn().mockResolvedValue(undefined)
const getDocMock = vi.fn()

vi.mock('firebase/firestore', () => {
  return {
    doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
    updateDoc: (...args: any[]) => updateDocMock(...args),
    getDoc: (...args: any[]) => getDocMock(...args),
    setDoc: vi.fn().mockResolvedValue(undefined),
    onSnapshot: vi.fn(() => () => {}),
    serverTimestamp: () => '__SERVER_TS__',
  }
})

const updateFirebaseProfileMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: (...args: any[]) => updateFirebaseProfileMock(...args),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: { uid: 'uid-1' } },
  db: {},
}))

import { AuthService } from '@/services/auth'

describe('AuthService.updateProfile — email ve birthDate alanları', () => {
  beforeEach(() => {
    updateDocMock.mockClear()
    getDocMock.mockReset()
    updateFirebaseProfileMock.mockClear()
  })

  it('email ve birthDate alanlarını Firestore dokümanına yazar', async () => {
    // updateProfile, firstName/lastName geldiğinde getUserDocument çağırıyor
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      id: 'uid-1',
      data: () => ({ firstName: 'Ada', lastName: 'L', role: 'student' }),
    })

    await AuthService.updateProfile('uid-1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '05551234567',
      email: 'ada@example.com',
      birthDate: '1990-05-10',
    })

    expect(updateDocMock).toHaveBeenCalledTimes(1)
    const [, payload] = updateDocMock.mock.calls[0]
    expect(payload.email).toBe('ada@example.com')
    expect(payload.birthDate).toBe('1990-05-10')
    expect(payload.firstName).toBe('Ada')
    expect(payload.lastName).toBe('Lovelace')
    expect(payload.phone).toBe('05551234567')
  })

  it('sadece email güncellenirse, sadece o alan + updatedAt yazılır', async () => {
    await AuthService.updateProfile('uid-1', {
      email: 'yeni@mail.com',
    })

    expect(updateDocMock).toHaveBeenCalledTimes(1)
    const [, payload] = updateDocMock.mock.calls[0]
    expect(payload.email).toBe('yeni@mail.com')
    expect('birthDate' in payload).toBe(false)
    expect('firstName' in payload).toBe(false)
  })

  it('sadece birthDate güncellenirse, undefined alanlar payloadda yer almaz', async () => {
    await AuthService.updateProfile('uid-1', {
      birthDate: '2000-01-15',
    })

    const [, payload] = updateDocMock.mock.calls[0]
    expect(payload.birthDate).toBe('2000-01-15')
    expect('email' in payload).toBe(false)
    expect('phone' in payload).toBe(false)
  })
})
