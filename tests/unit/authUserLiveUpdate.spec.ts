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
import { setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'

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
    vi.mocked(setDoc).mockClear()
    vi.mocked(signOut).mockClear()
    ;(auth as any).currentUser = null
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

  // REGRESYON: Eskiden doküman "yok" göründüğünde otomatik student profili
  // YAZILIYORDU; bu, geçici bir okuma hatasında boss/admin dokümanını ezip
  // 'Kullanıcı'/student'a çeviriyordu. Artık asla otomatik yazma yapılmamalı.
  describe('doküman bulunamadığında veri ezilmez (regresyon: boss hesabı kaybı)', () => {
    it('snapshot exists()=false iken setDoc ÇAĞRILMAZ ve oturum açılmaz', async () => {
      ;(auth as any).currentUser = { uid: 'boss-uid', email: '05426908768@tennis.local' }
      const store = useAuthStore()
      const promise = store.fetchUserData('boss-uid')

      // Firestore anlık olarak "doküman yok" döndürüyor (geçici hata/kural gecikmesi)
      capturedOnNext!(makeSnapshot(null))
      await promise

      // Kritik: hiçbir şekilde yeni doküman yazılmamalı
      expect(setDoc).not.toHaveBeenCalled()
      // Ve gerçek veriyi bilmeden oturum açılmamalı
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBeTruthy()
    })

    it('boş snapshot sonrası gerçek doküman gelirse (kendine gelir) kullanıcı doğru yüklenir', async () => {
      ;(auth as any).currentUser = { uid: 'boss-uid', email: '05426908768@tennis.local' }
      const store = useAuthStore()
      const promise = store.fetchUserData('boss-uid')

      // 1. snapshot boş geldi
      capturedOnNext!(makeSnapshot(null))
      await promise
      expect(setDoc).not.toHaveBeenCalled()

      // 2. snapshot gerçek boss dokümanını getirdi → doğru role yüklenmeli, ezilmeden
      capturedOnNext!(makeSnapshot({
        id: 'boss-uid',
        firstName: 'Emircan',
        lastName: 'Adak',
        role: 'boss',
        status: 'approved',
      }))

      expect(setDoc).not.toHaveBeenCalled()
      expect(store.user?.role).toBe('boss')
      expect(store.user?.firstName).toBe('Emircan')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  // Silinmiş hesap savunması: öğrenci silindiğinde doküman kalır (soft delete) ama
  // deleted=true / status='deleted' olur. Login akışı bunu görünce oturumu kapatmalı,
  // böylece Auth kaydı (henüz) silinmemiş olsa bile giriş engellenir.
  describe('silinmiş hesap girişi engellenir', () => {
    it('deleted=true snapshot\'ında signOut çağrılır ve oturum açılmaz', async () => {
      const store = useAuthStore()
      const promise = store.fetchUserData('deleted-uid')

      capturedOnNext!(makeSnapshot({
        id: 'deleted-uid',
        firstName: '',
        lastName: '',
        role: 'student',
        deleted: true,
        status: 'deleted',
      }))
      await promise

      expect(signOut).toHaveBeenCalledTimes(1)
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBeTruthy()
    })

    it('deleted alanı yok ama status=\'deleted\' ise de giriş engellenir', async () => {
      const store = useAuthStore()
      const promise = store.fetchUserData('deleted-uid-2')

      capturedOnNext!(makeSnapshot({
        id: 'deleted-uid-2',
        firstName: 'X',
        role: 'student',
        status: 'deleted',
      }))
      await promise

      expect(signOut).toHaveBeenCalledTimes(1)
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('aktif öğrenci (deleted=false) normal giriş yapar, signOut çağrılmaz', async () => {
      const store = useAuthStore()
      const promise = store.fetchUserData('active-uid')

      capturedOnNext!(makeSnapshot({
        id: 'active-uid',
        firstName: 'Ali',
        role: 'student',
        deleted: false,
        status: 'approved',
      }))
      await promise

      expect(signOut).not.toHaveBeenCalled()
      expect(store.user?.firstName).toBe('Ali')
      expect(store.isAuthenticated).toBe(true)
    })

    it('açık oturumdayken doküman deleted=true olursa canlı snapshot oturumu düşürür', async () => {
      const store = useAuthStore()
      const promise = store.fetchUserData('live-uid')

      // Önce normal giriş
      capturedOnNext!(makeSnapshot({ id: 'live-uid', firstName: 'Ali', role: 'student', status: 'approved' }))
      await promise
      expect(store.isAuthenticated).toBe(true)

      // Admin öğrenciyi siliyor → canlı snapshot deleted=true getiriyor.
      // Guard içindeki signOut asenkron olduğundan, temizleme microtask kuyruğunda
      // tamamlanır; bekleyip sonra doğruluyoruz (gerçek davranışla aynı).
      capturedOnNext!(makeSnapshot({ id: 'live-uid', firstName: '', role: 'student', deleted: true, status: 'deleted' }))
      await vi.waitFor(() => expect(store.isAuthenticated).toBe(false))

      expect(signOut).toHaveBeenCalledTimes(1)
      expect(store.user).toBeNull()
    })
  })
})
