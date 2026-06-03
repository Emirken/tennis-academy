import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Patron (boss) admin'in tüm yetkilerine sahip olmalı. Bu test, auth store'un
// isAdmin getter'ının boss'u da kapsadığını (yetki kapısı) ve Courts.vue'daki
// getStudentInfo mantığının bu getter sayesinde boss'a kort detaylarını
// gösterdiğini doğrular. Önceki bug: boss isAdmin=false görüp öğrenci gibi
// muamele görüyordu — kortları sadece "Dolu" olarak görüyordu, kimin olduğunu
// göremiyordu.

// Firestore/auth/services mock'ları (auth store import'u için gerekli)
vi.mock('firebase/firestore', () => ({
  doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({ auth: { currentUser: null }, db: {} }))
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: vi.fn() },
}))
vi.mock('@/services/pushNotificationService', () => ({
  pushNotificationService: {
    registerDeviceToken: vi.fn(),
    unregisterDeviceToken: vi.fn(),
  },
}))

import { useAuthStore } from '@/store/modules/auth'
import type { UserRole } from '@/types/user'

function makeUser(role: UserRole) {
  return {
    id: 'u1',
    phone_number: '5550000000',
    firstName: 'Test',
    lastName: 'Kullanıcı',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Courts.vue:490-530 getStudentInfo ile birebir yetki kapısı: isAdmin değilse
// detay gizli. Bu izole kopya, store'un isAdmin'i ile beslendiğinde boss'un da
// admin gibi detay gördüğünü kanıtlar.
function getStudentInfo(slotData: any, isAdmin: boolean): string | null {
  if (!slotData || typeof slotData !== 'object') return null
  const status = slotData.status || 'available'
  if (status !== 'occupied') return null
  if (!isAdmin) return null // öğrenci: sadece "Dolu"
  if (slotData.studentFirstName && slotData.studentLastName) {
    return `${slotData.studentFirstName} ${slotData.studentLastName}`
  }
  return slotData.studentFullName || null
}

describe('Patron (boss) admin yetki paritesi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('boss rolü isAdmin=true döndürür (admin yetkilerine sahip)', () => {
    const store = useAuthStore()
    store.user = makeUser('boss') as any
    expect(store.isAdmin).toBe(true)
  })

  it('boss aynı zamanda isBoss=true ve isStudent=false', () => {
    const store = useAuthStore()
    store.user = makeUser('boss') as any
    expect(store.isBoss).toBe(true)
    expect(store.isStudent).toBe(false)
  })

  it('admin rolü isAdmin=true, isBoss=false', () => {
    const store = useAuthStore()
    store.user = makeUser('admin') as any
    expect(store.isAdmin).toBe(true)
    expect(store.isBoss).toBe(false)
  })

  it('student rolü isAdmin=false (detaylar gizli kalmalı)', () => {
    const store = useAuthStore()
    store.user = makeUser('student') as any
    expect(store.isAdmin).toBe(false)
    expect(store.isStudent).toBe(true)
  })

  it('kullanıcı yokken isAdmin=false', () => {
    const store = useAuthStore()
    store.user = null
    expect(store.isAdmin).toBe(false)
  })

  const occupiedSlot = {
    status: 'occupied',
    studentFirstName: 'Ali',
    studentLastName: 'Yılmaz',
    studentFullName: 'Ali Yılmaz',
  }

  it('boss kortta kimin olduğunu görür (öğrenci gibi gizlenmez)', () => {
    const store = useAuthStore()
    store.user = makeUser('boss') as any
    expect(getStudentInfo(occupiedSlot, store.isAdmin)).toBe('Ali Yılmaz')
  })

  it('öğrenci kortta sadece "Dolu" görür, isim göremez', () => {
    const store = useAuthStore()
    store.user = makeUser('student') as any
    expect(getStudentInfo(occupiedSlot, store.isAdmin)).toBeNull()
  })

  it('admin de kortta kimin olduğunu görür', () => {
    const store = useAuthStore()
    store.user = makeUser('admin') as any
    expect(getStudentInfo(occupiedSlot, store.isAdmin)).toBe('Ali Yılmaz')
  })
})
