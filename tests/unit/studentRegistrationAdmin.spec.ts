import { describe, it, expect } from 'vitest'
import {
  buildRegistrationUpdate,
  effectiveIsMinor,
  emptyRegistrationFilters,
  hasRegistrationAnswers,
  matchesRegistrationFilters,
  readRegistrationInfo,
  referralLabel,
  registrationWipePatch,
  STUDENT_CSV_HEADERS,
  studentCsvRow,
  toRegistrationEditForm,
  trainingTypesLabel,
  validateRegistrationEdit,
  type StudentRegistrationInfo,
} from '@/utils/studentRegistrationAdmin'

const TODAY = new Date(2026, 8, 25)
const CONSENT = new Date(2026, 8, 20, 9, 0)

function info(overrides: Partial<StudentRegistrationInfo> = {}): StudentRegistrationInfo {
  return { ...readRegistrationInfo({}), ...overrides }
}

describe('readRegistrationInfo', () => {
  it('eksik alanlar boş değer olur (form öncesi öğrenci)', () => {
    const i = readRegistrationInfo({ firstName: 'X' })
    expect(i.trainingTypes).toEqual([])
    expect(i.isMinor).toBeNull()
    expect(i.heightCm).toBeNull()
    expect(i.referralSource).toBe('')
    expect(i.marketingConsent).toBe(false)
    expect(i.waiverAcceptedAt).toBeNull()
    expect(hasRegistrationAnswers(i)).toBe(false)
  })

  it('Firestore Timestamp, bilinmeyen seçenek ve bozuk tipler temizlenir', () => {
    const i = readRegistrationInfo({
      trainingTypes: ['other', 'yoga', 'private_lesson'],
      referralSource: 'tiktok',
      parentRelation: 'mother',
      heightCm: '172',
      weightKg: 64,
      isMinor: true,
      waiverAcceptedAt: { toDate: () => CONSENT },
      marketingConsent: true,
    })
    expect(i.trainingTypes).toEqual(['private_lesson', 'other'])
    expect(i.referralSource).toBe('')
    expect(i.parentRelation).toBe('mother')
    expect(i.heightCm).toBeNull()
    expect(i.weightKg).toBe(64)
    expect(i.waiverAcceptedAt).toBe(CONSENT)
    expect(hasRegistrationAnswers(i)).toBe(true)
  })
})

describe('etiketler', () => {
  it('eğitim türleri ve kaynak', () => {
    expect(trainingTypesLabel(['private_lesson', 'other'], 'Padel')).toBe('Özel ders, Diğer: Padel')
    expect(referralLabel('friend', 'Mehmet')).toBe('Arkadaş / tanıdık tavsiyesi — Mehmet')
    expect(referralLabel('instagram', 'yok sayılır')).toBe('Instagram')
    expect(referralLabel('', '')).toBe('')
  })

  it('18 yaş: isMinor varsa o, yoksa doğum tarihi', () => {
    expect(effectiveIsMinor({ isMinor: false, birthDate: '2014-01-01' }, TODAY)).toBe(false)
    expect(effectiveIsMinor({ isMinor: null, birthDate: '2014-01-01' }, TODAY)).toBe(true)
    expect(effectiveIsMinor({ isMinor: null, birthDate: '' }, TODAY)).toBeNull()
  })
})

describe('matchesRegistrationFilters', () => {
  const s = {
    ...info({ trainingTypes: ['tennis_school'], referralSource: 'google', isMinor: true, hasHealthCondition: true }),
    joinDate: new Date(2026, 8, 10, 15),
  }

  it('boş filtre herkesi geçirir', () => {
    expect(matchesRegistrationFilters(s, emptyRegistrationFilters(), TODAY)).toBe(true)
  })

  it('eğitim türü, kaynak, yaş, pazarlama, sağlık', () => {
    const f = emptyRegistrationFilters()
    expect(matchesRegistrationFilters(s, { ...f, trainingType: 'tennis_school' }, TODAY)).toBe(true)
    expect(matchesRegistrationFilters(s, { ...f, trainingType: 'court_rental' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters(s, { ...f, referralSource: 'instagram' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters(s, { ...f, age: 'minor' }, TODAY)).toBe(true)
    expect(matchesRegistrationFilters(s, { ...f, age: 'adult' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters(s, { ...f, marketing: 'yes' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters(s, { ...f, marketing: 'no' }, TODAY)).toBe(true)
    expect(matchesRegistrationFilters(s, { ...f, healthOnly: true }, TODAY)).toBe(true)
    expect(matchesRegistrationFilters({ ...s, hasHealthCondition: false }, { ...f, healthOnly: true }, TODAY)).toBe(false)
  })

  it('v-select temizlenince gelen null filtre yok sayılır', () => {
    expect(matchesRegistrationFilters(s, { ...emptyRegistrationFilters(), trainingType: null, age: null }, TODAY)).toBe(true)
  })

  it('kayıt tarihi aralığı gün bazında, uçlar dahil', () => {
    const f = emptyRegistrationFilters()
    expect(matchesRegistrationFilters(s, { ...f, joinedFrom: '2026-09-10', joinedTo: '2026-09-10' }, TODAY)).toBe(true)
    expect(matchesRegistrationFilters(s, { ...f, joinedFrom: '2026-09-11' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters(s, { ...f, joinedTo: '2026-09-09' }, TODAY)).toBe(false)
    expect(matchesRegistrationFilters({ ...s, joinDate: null }, { ...f, joinedFrom: '2026-01-01' }, TODAY)).toBe(false)
  })
})

describe('CSV satırı', () => {
  it('başlık sayısıyla uyumlu; sağlık ve boy/kilo girmez; telefon bölünmüş', () => {
    const row = studentCsvRow({
      ...info({
        isMinor: true, parentFirstName: 'Ayşe', parentLastName: 'Y', parentPhone: '05559876543',
        trainingTypes: ['tennis_school'], referralSource: 'friend', referralDetail: 'Mehmet',
        hasHealthCondition: true, healthConditionNote: 'GİZLİ-SAĞLIK', heightCm: 150,
        marketingConsent: true, marketingConsentAt: CONSENT, birthDate: '2014-03-01',
      }),
      firstName: 'Ada', lastName: 'Lovelace', phone_number: '05551234567', email: 'a@b.co',
      address: 'Urla', level: 'temel', joinDate: new Date(2026, 8, 10),
    }, { membership: 'Tenis Okulu', status: 'Aktif' }, TODAY)
    expect(row).toHaveLength(STUDENT_CSV_HEADERS.length)
    expect(row.join('|')).not.toContain('GİZLİ-SAĞLIK')
    expect(row.join('|')).not.toContain('150')
    expect(row[2]).toBe('0555 123 45 67')
    expect(row[5]).toBe('Evet')
    expect(row[STUDENT_CSV_HEADERS.indexOf('Nereden Duydu')]).toBe('Arkadaş / tanıdık tavsiyesi — Mehmet')
    expect(row[STUDENT_CSV_HEADERS.indexOf('Pazarlama İzni')]).toBe('Evet')
  })
})

describe('admin düzenlemesi', () => {
  it('okuma → form → yama gidiş-dönüşü', () => {
    const original = info({
      heightCm: 150, trainingTypes: ['other'], trainingTypeOther: 'Padel', referralSource: 'friend', referralDetail: 'M',
    })
    const form = toRegistrationEditForm(original)
    expect(form.heightCm).toBe('150')
    const patch = buildRegistrationUpdate({ ...form, heightCm: '', trainingTypes: ['court_rental'], referralSource: 'google' }, original)
    expect(patch).toMatchObject({
      heightCm: null,
      trainingTypes: ['court_rental'],
      trainingTypeOther: '',
      referralSource: 'google',
      referralDetail: '',
    })
    expect('marketingConsent' in patch).toBe(false)
  })

  it('pazarlama izni yalnız geri alınabilir, verilemez', () => {
    const withConsent = info({ marketingConsent: true, marketingConsentAt: CONSENT })
    expect(buildRegistrationUpdate({ ...toRegistrationEditForm(withConsent), marketingConsent: false }, withConsent))
      .toMatchObject({ marketingConsent: false, marketingConsentAt: null })
    const without = info({ marketingConsent: false })
    expect('marketingConsent' in buildRegistrationUpdate({ ...toRegistrationEditForm(without), marketingConsent: true }, without))
      .toBe(false)
  })

  it('doğrulama yalnız aralık ve uzunluk denetler (admin zorunlu alan doldurmak zorunda değil)', () => {
    const empty = toRegistrationEditForm(info())
    expect(validateRegistrationEdit(empty)).toEqual({})
    expect(validateRegistrationEdit({ ...empty, heightCm: '20' }).heightCm).toBeTruthy()
    expect(validateRegistrationEdit({ ...empty, coachNote: 'x'.repeat(1001) }).coachNote).toBeTruthy()
  })
})

describe('registrationWipePatch', () => {
  it('veli + kişisel + sağlık alanlarını boşaltır, onay kanıtlarına dokunmaz', () => {
    const p = registrationWipePatch()
    expect(p).toMatchObject({
      parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: '', parentRelation: '',
      healthConditionNote: '', specialCareNote: '', coachNote: '', occupation: '',
      heightCm: null, weightKg: null, trainingTypes: [], referralDetail: '',
      marketingConsent: false, marketingConsentAt: null,
    })
    expect('waiverAcceptedAt' in p).toBe(false)
    expect('dataConsentAcceptedAt' in p).toBe(false)
  })
})
