import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Firestore'u mockla — onSnapshot davranışını test amaçlı kontrol edeceğiz
let capturedOnNext: ((snap: any) => void) | null = null
let capturedOnError: ((err: any) => void) | null = null
let unsubscribeCallCount = 0

vi.mock('firebase/firestore', () => {
  return {
    doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn(),
    onSnapshot: vi.fn((_ref: any, onNext: any, onError: any) => {
      capturedOnNext = onNext
      capturedOnError = onError
      return () => { unsubscribeCallCount++ }
    }),
  }
})

// firebase auth ve services/firebase'i de mockla
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}))

vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: vi.fn() },
}))

import { useAuthStore } from '@/store/modules/auth'

function makeSnapshot(data: any | null) {
  return {
    exists: () => data !== null,
    data: () => data,
  }
}

describe('Auth store — canlı kullanıcı dokümanı dinleyicisi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    capturedOnNext = null
    capturedOnError = null
    unsubscribeCallCount = 0
  })

  it('fetchUserData çağrıldığında onSnapshot ile listener kurar ve ilk snapshot\'ta resolve olur', async () => {
    const store = useAuthStore()
    const promise = store.fetchUserData('uid-1')

    expect(capturedOnNext).not.toBeNull()

    // İlk snapshot simülasyonu
    capturedOnNext!(makeSnapshot({
      id: 'uid-1',
      firstName: 'Ali',
      lastName: 'Veli',
      role: 'student',
      membershipType: 'basic',
    }))

    await promise

    expect(store.user).not.toBeNull()
    expect(store.user?.firstName).toBe('Ali')
    expect((store.user as any).membershipType).toBe('basic')
    expect(store.isAuthenticated).toBe(true)
  })

  it('sonraki snapshot geldiğinde membershipType dahil alanlar otomatik güncellenir', async () => {
    const store = useAuthStore()
    const promise = store.fetchUserData('uid-2')
    capturedOnNext!(makeSnapshot({
      id: 'uid-2',
      firstName: 'Ali',
      role: 'student',
      membershipType: 'basic',
      groupAssignment: '',
    }))
    await promise

    expect((store.user as any).membershipType).toBe('basic')

    // Admin öğrenciyi gruba alıyor → Firestore dokümanı değişiyor → 2. snapshot
    capturedOnNext!(makeSnapshot({
      id: 'uid-2',
      firstName: 'Ali',
      role: 'student',
      membershipType: 'adult_group',
      groupAssignment: 'group-42',
    }))

    expect((store.user as any).membershipType).toBe('adult_group')
    expect((store.user as any).groupAssignment).toBe('group-42')
  })

  it('logout çağrıldığında listener kapatılır ve kullanıcı temizlenir', async () => {
    const store = useAuthStore()
    const promise = store.fetchUserData('uid-3')
    capturedOnNext!(makeSnapshot({ id: 'uid-3', firstName: 'Ali', role: 'student' }))
    await promise

    const before = unsubscribeCallCount
    await store.logout()

    expect(unsubscribeCallCount).toBe(before + 1)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('fetchUserData aynı store üzerinde tekrar çağrılırsa eski listener kapatılır', async () => {
    const store = useAuthStore()
    const p1 = store.fetchUserData('uid-A')
    capturedOnNext!(makeSnapshot({ id: 'uid-A', firstName: 'A', role: 'student' }))
    await p1

    const before = unsubscribeCallCount
    const p2 = store.fetchUserData('uid-B')
    expect(unsubscribeCallCount).toBe(before + 1) // Eski listener kapatıldı

    capturedOnNext!(makeSnapshot({ id: 'uid-B', firstName: 'B', role: 'student' }))
    await p2

    expect(store.user?.firstName).toBe('B')
  })
})
