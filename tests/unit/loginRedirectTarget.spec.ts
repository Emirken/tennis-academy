import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// auth store gerçek getter'larını (isAdmin/isStudent/isBoss) kullanacağız;
// Firebase bağımlılıklarını sadece import zincirini kırmamak için mockla.
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))
vi.mock('@/services/firebase', () => ({ auth: { currentUser: null }, db: {} }))
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: vi.fn() },
}))

import { useAuthStore } from '@/store/modules/auth'

// router/index.ts, Login.vue ve useAuth.ts'deki ortak login-sonrası yönlendirme
// kuralı: isAdmin (boss DAHİL) -> admin dashboard, student -> student dashboard.
// boss artık BossDashboard'a yönlenmez; izleme panelini menüden açar.
function resolveAfterLoginTarget(store: ReturnType<typeof useAuthStore>): string {
  if (store.isAdmin) return 'AdminDashboard'
  if (store.isStudent) return 'StudentDashboard'
  return 'Home'
}

describe('giriş sonrası yönlendirme hedefi', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('boss -> AdminDashboard (BossDashboard DEĞİL)', () => {
    const store = useAuthStore()
    store.user = { role: 'boss' } as any
    expect(store.isAdmin).toBe(true)
    expect(resolveAfterLoginTarget(store)).toBe('AdminDashboard')
    expect(resolveAfterLoginTarget(store)).not.toBe('BossDashboard')
  })

  it('admin -> AdminDashboard', () => {
    const store = useAuthStore()
    store.user = { role: 'admin' } as any
    expect(resolveAfterLoginTarget(store)).toBe('AdminDashboard')
  })

  it('student -> StudentDashboard', () => {
    const store = useAuthStore()
    store.user = { role: 'student' } as any
    expect(resolveAfterLoginTarget(store)).toBe('StudentDashboard')
  })
})
