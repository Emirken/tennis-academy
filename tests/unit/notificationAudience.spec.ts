import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

// Boss admin-eşidir: admin'e giden bildirimleri (kayıt onayı, rezervasyon onayı) o da
// görür ve işler. Eskiden abonelik, bekleyen kayıt listesi ve rozet yalnız
// role === 'admin' için çalışıyordu; boss kayıt bildirimlerini hiç görmüyordu.

const whereMock = vi.fn((...args: unknown[]) => ({ _where: args }))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn((...args: unknown[]) => ({ _query: args })),
  where: (...args: unknown[]) => whereMock(...args),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {},
}))
vi.mock('@/services/firebase', () => ({ db: {} }))
vi.mock('@/services/pushNotificationService', () => ({
  pushNotificationService: { showBrowserNotification: vi.fn() },
}))

import { isAdminAudience } from '@/utils/notificationAudience'
import { notificationService } from '@/services/notificationService'

beforeEach(() => whereMock.mockClear())

describe('isAdminAudience', () => {
  it('admin ve boss admin kitlesidir; öğrenci değildir', () => {
    expect(isAdminAudience('admin')).toBe(true)
    expect(isAdminAudience('boss')).toBe(true)
    expect(isAdminAudience('Boss')).toBe(true)
    expect(isAdminAudience('student')).toBe(false)
    expect(isAdminAudience('')).toBe(false)
    expect(isAdminAudience(undefined)).toBe(false)
  })
})

describe('subscribeToNotifications', () => {
  it('boss admin bildirimlerini dinler', () => {
    notificationService.subscribeToNotifications('boss-1', 'boss', () => {})
    expect(whereMock).toHaveBeenCalledWith('targetType', 'in', ['admin', 'all'])
  })

  it('öğrenci yalnız kendine gelenleri dinler', () => {
    notificationService.subscribeToNotifications('stu-1', 'student', () => {})
    expect(whereMock).toHaveBeenCalledWith('targetId', '==', 'stu-1')
    expect(whereMock).not.toHaveBeenCalledWith('targetType', 'in', ['admin', 'all'])
  })
})

describe('kayıt bildirimi ekranları boss için de çalışır', () => {
  for (const file of ['src/views/Notifications.vue', 'src/components/common/AppHeader.vue']) {
    it(`${file} rolü yalnız 'admin' ile karşılaştırmaz`, () => {
      const src = readFileSync(file, 'utf8')
      expect(src).not.toMatch(/role\s*[!=]==\s*'admin'/)
    })
  }

  it('sentetik bekleyen kayıt mesajı ortak biçimi kullanır', () => {
    const src = readFileSync('src/views/Notifications.vue', 'utf8')
    expect(src).toContain('registrationNotificationMessage(')
    expect(src).not.toContain('kayıt oldu, onayınızı bekliyor')
  })
})
