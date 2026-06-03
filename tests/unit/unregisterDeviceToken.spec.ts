import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mocklar ---------------------------------------------------------------
const getFCMToken = vi.fn()
const deleteToken = vi.fn()
const deleteDoc = vi.fn()
const doc = vi.fn((_db: unknown, col: string, id: string) => ({ col, id }))

vi.mock('firebase/messaging', () => ({
  getToken: (...args: unknown[]) => getFCMToken(...args),
  onMessage: vi.fn(),
  deleteToken: (...args: unknown[]) => deleteToken(...args),
}))

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => (doc as any)(...args),
  setDoc: vi.fn(),
  deleteDoc: (...args: unknown[]) => deleteDoc(...args),
}))

vi.mock('@/services/firebase', () => ({
  messaging: {}, // truthy: messaging başlatılmış sayılır
  db: {},
}))

// navigator.serviceWorker stub (jsdom'da yok)
;(globalThis as any).navigator = {
  ...(globalThis as any).navigator,
  serviceWorker: { getRegistration: vi.fn(async () => undefined) },
}

// Notification global'i — testler permission'ı değiştirir
const setPermission = (p: NotificationPermission) => {
  ;(globalThis as any).window = { Notification: { permission: p } }
  ;(globalThis as any).Notification = { permission: p }
}

// SUT'u mocklar kurulduktan sonra import et
const importService = async () => {
  const mod = await import('../../src/services/pushNotificationService')
  return mod.pushNotificationService
}

describe('unregisterDeviceToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteDoc.mockResolvedValue(undefined)
  })

  it('izin engellenmişse FCM token alınmaya çalışılmaz ama Firestore kaydı silinir', async () => {
    setPermission('denied')
    const svc = await importService()

    await expect(svc.unregisterDeviceToken('user-1')).resolves.toBeUndefined()

    // permission-blocked hatasının kaynağı olan getToken hiç çağrılmamalı
    expect(getFCMToken).not.toHaveBeenCalled()
    expect(deleteToken).not.toHaveBeenCalled()
    // Firestore kaydı yine de silinmeli
    expect(deleteDoc).toHaveBeenCalledTimes(1)
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'deviceTokens', 'user-1')
  })

  it('izin verilmişse token alınır, silinir ve Firestore kaydı temizlenir', async () => {
    setPermission('granted')
    getFCMToken.mockResolvedValue('abc123token')
    deleteToken.mockResolvedValue(true)
    const svc = await importService()

    await svc.unregisterDeviceToken('user-2')

    expect(getFCMToken).toHaveBeenCalledTimes(1)
    expect(deleteToken).toHaveBeenCalledTimes(1)
    expect(deleteDoc).toHaveBeenCalledTimes(1)
  })

  it('getToken beklenmedik şekilde hata fırlatsa bile Firestore kaydı silinir ve hata yutulur', async () => {
    setPermission('granted')
    getFCMToken.mockRejectedValue(
      Object.assign(new Error('permission-blocked'), { code: 'messaging/permission-blocked' })
    )
    const svc = await importService()

    await expect(svc.unregisterDeviceToken('user-3')).resolves.toBeUndefined()

    expect(deleteToken).not.toHaveBeenCalled()
    expect(deleteDoc).toHaveBeenCalledTimes(1)
  })
})
