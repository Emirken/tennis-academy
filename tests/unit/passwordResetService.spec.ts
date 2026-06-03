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
  updateStudentPhone,
  deleteStudentAuth,
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

  describe('updateStudentPhone', () => {
    it('updateUserPhone callable\'ını userId + newPhone ile çağırır', async () => {
      await updateStudentPhone('uid-1', '05559876543')

      expect(httpsCallableMock).toHaveBeenCalledTimes(1)
      expect(httpsCallableMock.mock.calls[0][1]).toBe('updateUserPhone')
      expect(callableMock).toHaveBeenCalledWith({ userId: 'uid-1', newPhone: '05559876543' })
    })

    it('geçersiz numarayı (callable\'a gitmeden) reddeder', async () => {
      await expect(updateStudentPhone('uid-1', '123')).rejects.toThrow()
      await expect(updateStudentPhone('uid-1', '5559876543')).rejects.toThrow() // 0 ile başlamıyor
      await expect(updateStudentPhone('uid-1', '055598765431')).rejects.toThrow() // 12 hane
      expect(callableMock).not.toHaveBeenCalled()
    })

    it('userId yoksa reddeder', async () => {
      await expect(updateStudentPhone('', '05559876543')).rejects.toThrow()
      expect(callableMock).not.toHaveBeenCalled()
    })

    it('numara çakışması hatasını anlamlı mesajla fırlatır', async () => {
      callableMock.mockRejectedValueOnce(new Error('Bu telefon numarası başka bir kullanıcıya ait.'))
      await expect(updateStudentPhone('uid-1', '05559876543')).rejects.toThrow(
        'Bu telefon numarası başka bir kullanıcıya ait.'
      )
    })
  })

  describe('deleteStudentAuth', () => {
    it('deleteUserAccount callable\'ını userId ile çağırır', async () => {
      await deleteStudentAuth('uid-1')

      expect(httpsCallableMock).toHaveBeenCalledTimes(1)
      expect(httpsCallableMock.mock.calls[0][1]).toBe('deleteUserAccount')
      expect(callableMock).toHaveBeenCalledWith({ userId: 'uid-1' })
    })

    it('userId yoksa reddeder', async () => {
      await expect(deleteStudentAuth('')).rejects.toThrow()
      expect(callableMock).not.toHaveBeenCalled()
    })

    it('callable hatasını anlamlı mesajla fırlatır', async () => {
      callableMock.mockRejectedValueOnce(new Error('Auth kaydı silinemedi: boom'))
      await expect(deleteStudentAuth('uid-1')).rejects.toThrow('Auth kaydı silinemedi: boom')
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
