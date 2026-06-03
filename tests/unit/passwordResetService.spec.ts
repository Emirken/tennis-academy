import { describe, it, expect, beforeEach, vi } from 'vitest'

// Firestore mock
const updateDocMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => ({
  doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}`, _coll: coll, _id: id }),
  updateDoc: (...args: any[]) => updateDocMock(...args),
  serverTimestamp: () => '__SERVER_TS__',
}))

// Cloud Functions mock
const callableMock = vi.fn().mockResolvedValue({ data: { success: true } })
const httpsCallableMock = vi.fn((..._args: any[]) => callableMock)

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => httpsCallableMock(...args),
}))

vi.mock('@/services/firebase', () => ({ db: {}, functions: {} }))

import {
  assignTempPassword,
  clearMustResetPassword,
  generateTempPassword,
} from '@/services/passwordResetService'

describe('passwordResetService', () => {
  beforeEach(() => {
    updateDocMock.mockClear()
    callableMock.mockClear()
    callableMock.mockResolvedValue({ data: { success: true } })
    httpsCallableMock.mockClear()
  })

  describe('generateTempPassword', () => {
    it('verilen uzunlukta şifre üretir', () => {
      expect(generateTempPassword(8)).toHaveLength(8)
      expect(generateTempPassword(12)).toHaveLength(12)
    })

    it('karıştırılabilir karakter içermez (0, O, 1, l, I)', () => {
      const pw = generateTempPassword(50)
      expect(pw).not.toMatch(/[0O1lI]/)
    })
  })

  describe('assignTempPassword', () => {
    it('setTempPassword callable function\'ı userId + tempPassword ile çağırır', async () => {
      await assignTempPassword('uid-1', '05551112233', 'Gecici12')

      // doğru fonksiyon adıyla callable oluşturuldu
      expect(httpsCallableMock).toHaveBeenCalledTimes(1)
      expect(httpsCallableMock.mock.calls[0][1]).toBe('setTempPassword')

      // doğru payload ile çağrıldı
      expect(callableMock).toHaveBeenCalledTimes(1)
      expect(callableMock).toHaveBeenCalledWith({ userId: 'uid-1', tempPassword: 'Gecici12' })
    })

    it('6 karakterden kısa şifreyi (callable\'a gitmeden) reddeder', async () => {
      await expect(assignTempPassword('uid-1', '05551112233', '123')).rejects.toThrow()
      expect(callableMock).not.toHaveBeenCalled()
    })

    it('userId yoksa reddeder', async () => {
      await expect(assignTempPassword('', '05551112233', 'Gecici12')).rejects.toThrow()
      expect(callableMock).not.toHaveBeenCalled()
    })

    it('callable hatasını anlamlı mesajla yeniden fırlatır', async () => {
      callableMock.mockRejectedValueOnce(new Error('Bu işlemi yalnızca yönetici yapabilir.'))
      await expect(assignTempPassword('uid-1', '05551112233', 'Gecici12')).rejects.toThrow(
        'Bu işlemi yalnızca yönetici yapabilir.'
      )
    })
  })

  describe('clearMustResetPassword', () => {
    it('mustResetPassword=false yapar', async () => {
      await clearMustResetPassword('uid-1')

      expect(updateDocMock).toHaveBeenCalledTimes(1)
      const [ref, payload] = updateDocMock.mock.calls[0]
      expect(ref._coll).toBe('users')
      expect(ref._id).toBe('uid-1')
      expect(payload.mustResetPassword).toBe(false)
    })
  })
})
