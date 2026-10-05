import { describe, it, expect } from 'vitest'
import {
  buildRegistrationProfile,
  buildUserRegistrationDoc,
  emptyRegistrationForm,
  formatPhoneForDisplay,
  isUnder18,
  parseYmd,
  registrationNotificationMessage,
  toYmd,
  validateRegistrationForm,
  validateRegistrationStep,
  type RegistrationFormState,
} from '@/utils/registrationForm'

const TODAY = new Date(2026, 8, 25) // 25 Eylül 2026 (yerel)
const NOW = new Date(2026, 8, 25, 14, 30)

function validAdult(): RegistrationFormState {
  return {
    ...emptyRegistrationForm(),
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone_number: '05551234567',
    email: 'ada@example.com',
    password: 'secret1',
    confirmPassword: 'secret1',
    birthDate: '1990-05-10',
    isMinor: false,
    trainingTypes: ['private_lesson'],
    level: 'orta',
    hasHealthCondition: false,
    referralSource: 'instagram',
    waiverAccepted: true,
    dataConsentAccepted: true,
  }
}

function validMinor(): RegistrationFormState {
  return {
    ...validAdult(),
    birthDate: '2014-03-01',
    isMinor: true,
    parentFirstName: 'Ayşe',
    parentLastName: 'Lovelace',
    parentPhone: '05559876543',
  }
}

describe('parseYmd / toYmd / isUnder18', () => {
  it('YYYY-MM-DD yerel tarihe çevrilir (UTC kayması yok)', () => {
    const d = parseYmd('1990-05-10')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([1990, 4, 10])
    expect(toYmd(d)).toBe('1990-05-10')
  })

  it('geçersiz tarih null döner', () => {
    expect(parseYmd('')).toBeNull()
    expect(parseYmd('2026-02-30')).toBeNull()
    expect(parseYmd('10.05.1990')).toBeNull()
  })

  it('18. doğum gününde reşittir, bir gün öncesinde değil', () => {
    expect(isUnder18('2008-09-25', TODAY)).toBe(false)
    expect(isUnder18('2008-09-26', TODAY)).toBe(true)
    expect(isUnder18('2014-03-01', TODAY)).toBe(true)
    expect(isUnder18('1990-05-10', TODAY)).toBe(false)
    expect(isUnder18('', TODAY)).toBeNull()
  })
})

describe('validateRegistrationStep — adım 1 (hesap)', () => {
  it('boş formda tüm hesap alanları hata verir', () => {
    const e = validateRegistrationStep(1, emptyRegistrationForm(), TODAY)
    expect(Object.keys(e).sort()).toEqual(
      ['confirmPassword', 'email', 'firstName', 'lastName', 'password', 'phone_number'].sort(),
    )
  })

  it('telefon 0 ile başlayan 11 rakam olmalı', () => {
    for (const bad of ['5551234567', '0555 123 45 67', '0555123456a', '15551234567']) {
      expect(validateRegistrationStep(1, { ...validAdult(), phone_number: bad }, TODAY).phone_number).toBeTruthy()
    }
    expect(validateRegistrationStep(1, validAdult(), TODAY)).toEqual({})
  })

  it('şifreler eşleşmeli, en az 6 karakter', () => {
    expect(validateRegistrationStep(1, { ...validAdult(), confirmPassword: 'secret2' }, TODAY).confirmPassword)
      .toBe('Şifreler eşleşmiyor')
    expect(validateRegistrationStep(1, { ...validAdult(), password: '123', confirmPassword: '123' }, TODAY).password)
      .toBe('Şifre en az 6 karakter olmalıdır')
  })

  it('e-posta zorunlu ve geçerli olmalı', () => {
    expect(validateRegistrationStep(1, { ...validAdult(), email: '' }, TODAY).email).toBe('E-posta gereklidir')
    expect(validateRegistrationStep(1, { ...validAdult(), email: 'yanlis' }, TODAY).email)
      .toBe('Geçerli bir e-posta adresi giriniz')
  })
})

describe('validateRegistrationStep — adım 2 (kişisel / veli)', () => {
  it('doğum tarihi zorunlu, geçerli ve geçmişte olmalı', () => {
    expect(validateRegistrationStep(2, { ...validAdult(), birthDate: '' }, TODAY).birthDate).toBe('Doğum tarihi gereklidir')
    expect(validateRegistrationStep(2, { ...validAdult(), birthDate: '2026-02-30' }, TODAY).birthDate)
      .toBe('Geçerli bir tarih giriniz')
    expect(validateRegistrationStep(2, { ...validAdult(), birthDate: '2026-09-26' }, TODAY).birthDate)
      .toBe('Doğum tarihi gelecekte olamaz')
  })

  it('18 yaş sorusu zorunlu ve doğum tarihiyle çelişemez', () => {
    expect(validateRegistrationStep(2, { ...validAdult(), isMinor: null }, TODAY).isMinor).toBe('Lütfen seçim yapınız')
    expect(validateRegistrationStep(2, { ...validAdult(), isMinor: true }, TODAY).isMinor)
      .toBe('Doğum tarihine göre öğrenci 18 yaşından küçük değil')
    expect(validateRegistrationStep(2, { ...validMinor(), isMinor: false }, TODAY).isMinor)
      .toBe('Doğum tarihine göre öğrenci 18 yaşından küçük görünüyor')
  })

  it('reşit değilse veli adı, soyadı ve telefonu zorunlu; e-posta isteğe bağlı ama geçerli', () => {
    const e = validateRegistrationStep(2, { ...validMinor(), parentFirstName: '', parentLastName: '', parentPhone: '' }, TODAY)
    expect(e.parentFirstName).toBe('Veli adı gereklidir')
    expect(e.parentLastName).toBe('Veli soyadı gereklidir')
    expect(e.parentPhone).toBe('Veli telefonu gereklidir')
    expect(validateRegistrationStep(2, validMinor(), TODAY)).toEqual({})
    expect(validateRegistrationStep(2, { ...validMinor(), parentEmail: 'yok' }, TODAY).parentEmail)
      .toBe('Geçerli bir e-posta adresi giriniz')
  })

  it('yetişkinde veli alanları denetlenmez', () => {
    expect(validateRegistrationStep(2, { ...validAdult(), parentPhone: 'bozuk' }, TODAY)).toEqual({})
  })

  it('boy/kilo boş olabilir; doluysa aralıkta tam sayı olmalı', () => {
    expect(validateRegistrationStep(2, { ...validAdult(), heightCm: '172', weightKg: '64' }, TODAY)).toEqual({})
    for (const bad of ['17', '172.5', 'abc', '300']) {
      expect(validateRegistrationStep(2, { ...validAdult(), heightCm: bad }, TODAY).heightCm).toBeTruthy()
    }
    expect(validateRegistrationStep(2, { ...validAdult(), weightKg: '5' }, TODAY).weightKg).toBeTruthy()
  })

  it('adres ve meslek uzunluk sınırı', () => {
    const e = validateRegistrationStep(2, { ...validAdult(), address: 'x'.repeat(301), occupation: 'y'.repeat(101) }, TODAY)
    expect(e.address).toBe('En fazla 300 karakter olabilir')
    expect(e.occupation).toBe('En fazla 100 karakter olabilir')
  })
})

describe('validateRegistrationStep — adım 3 (başvuru ve sağlık)', () => {
  it('en az bir eğitim türü; "Diğer" seçilirse açıklama zorunlu', () => {
    expect(validateRegistrationStep(3, { ...validAdult(), trainingTypes: [] }, TODAY).trainingTypes)
      .toBe('En az bir eğitim türü seçiniz')
    expect(validateRegistrationStep(3, { ...validAdult(), trainingTypes: ['other'] }, TODAY).trainingTypeOther)
      .toBe('Lütfen almak istediğiniz eğitimi yazınız')
    expect(validateRegistrationStep(3, { ...validAdult(), trainingTypes: ['other'], trainingTypeOther: 'Padel' }, TODAY))
      .toEqual({})
  })

  it('seviye zorunlu', () => {
    expect(validateRegistrationStep(3, { ...validAdult(), level: '' }, TODAY).level).toBe('Seviye seçiniz')
  })

  it('sağlık sorusu zorunlu; "Evet" ise açıklama zorunlu', () => {
    expect(validateRegistrationStep(3, { ...validAdult(), hasHealthCondition: null }, TODAY).hasHealthCondition)
      .toBe('Lütfen seçim yapınız')
    expect(validateRegistrationStep(3, { ...validAdult(), hasHealthCondition: true }, TODAY).healthConditionNote)
      .toBe('Lütfen durumu kısaca açıklayınız')
  })

  it('uzun metinler 1000 karakteri aşamaz', () => {
    const e = validateRegistrationStep(3, { ...validAdult(), coachNote: 'x'.repeat(1001) }, TODAY)
    expect(e.coachNote).toBe('En fazla 1000 karakter olabilir')
  })
})

describe('validateRegistrationStep — adım 4 (kaynak ve onaylar)', () => {
  it('kaynak zorunlu; arkadaş → referans ismi, diğer → açıklama zorunlu', () => {
    expect(validateRegistrationStep(4, { ...validAdult(), referralSource: '' }, TODAY).referralSource)
      .toBe('Lütfen bir seçenek işaretleyiniz')
    expect(validateRegistrationStep(4, { ...validAdult(), referralSource: 'friend' }, TODAY).referralDetail)
      .toBe('Referans ismi gereklidir')
    expect(validateRegistrationStep(4, { ...validAdult(), referralSource: 'other' }, TODAY).referralDetail)
      .toBe('Lütfen açıklama yazınız')
    expect(validateRegistrationStep(4, { ...validAdult(), referralSource: 'existing_student' }, TODAY)).toEqual({})
  })

  it('iki zorunlu onay; pazarlama izni isteğe bağlı', () => {
    const e = validateRegistrationStep(4, { ...validAdult(), waiverAccepted: false, dataConsentAccepted: false }, TODAY)
    expect(e.waiverAccepted).toBeTruthy()
    expect(e.dataConsentAccepted).toBeTruthy()
    expect(validateRegistrationStep(4, { ...validAdult(), marketingConsent: false }, TODAY)).toEqual({})
  })
})

describe('validateRegistrationForm', () => {
  it('geçerli formda hata yok', () => {
    expect(validateRegistrationForm(validMinor(), TODAY)).toEqual({ errors: {}, firstInvalidStep: null })
  })

  it('ilk hatalı adımı döner', () => {
    expect(validateRegistrationForm({ ...validAdult(), level: '' }, TODAY).firstInvalidStep).toBe(3)
    expect(validateRegistrationForm({ ...validAdult(), level: '', email: '' }, TODAY).firstInvalidStep).toBe(1)
  })
})

describe('buildRegistrationProfile', () => {
  it('yetişkin: veli alanı yok, boş metin yok, onay zamanları = şimdi', () => {
    const p = buildRegistrationProfile({ ...validAdult(), parentFirstName: 'Unutulmuş' }, NOW)
    expect(p).toEqual({
      isMinor: false,
      trainingTypes: ['private_lesson'],
      hasHealthCondition: false,
      referralSource: 'instagram',
      waiverAcceptedAt: NOW,
      dataConsentAcceptedAt: NOW,
      marketingConsent: false,
    })
  })

  it('reşit olmayan: veli alanları kırpılarak yazılır; isteğe bağlılar yalnız doluysa', () => {
    const p = buildRegistrationProfile({ ...validMinor(), parentFirstName: ' Ayşe ' }, NOW)
    expect(p.parentFirstName).toBe('Ayşe')
    expect(p.parentLastName).toBe('Lovelace')
    expect(p.parentPhone).toBe('05559876543')
    expect('parentEmail' in p).toBe(false)
    expect('parentRelation' in p).toBe(false)
    const full = buildRegistrationProfile({ ...validMinor(), parentEmail: 'veli@example.com', parentRelation: 'mother' }, NOW)
    expect(full.parentEmail).toBe('veli@example.com')
    expect(full.parentRelation).toBe('mother')
  })

  it('sayılar, koşullu metinler ve pazarlama izni', () => {
    const p = buildRegistrationProfile({
      ...validAdult(),
      heightCm: '172',
      weightKg: '64',
      occupation: ' Mühendis ',
      address: 'Urla',
      trainingTypes: ['other', 'court_rental', 'other'],
      trainingTypeOther: 'Padel',
      hasHealthCondition: true,
      healthConditionNote: 'Astım',
      specialCareNote: 'Sprey yanında',
      coachNote: 'Sol elini kullanır',
      referralSource: 'friend',
      referralDetail: 'Mehmet Kaya',
      marketingConsent: true,
    }, NOW)
    expect(p).toMatchObject({
      heightCm: 172,
      weightKg: 64,
      occupation: 'Mühendis',
      address: 'Urla',
      trainingTypes: ['court_rental', 'other'],
      trainingTypeOther: 'Padel',
      healthConditionNote: 'Astım',
      specialCareNote: 'Sprey yanında',
      coachNote: 'Sol elini kullanır',
      referralDetail: 'Mehmet Kaya',
      marketingConsent: true,
      marketingConsentAt: NOW,
    })
  })

  it('seçimi kaldırılmış koşullu metinler yazılmaz', () => {
    const p = buildRegistrationProfile({
      ...validAdult(),
      trainingTypeOther: 'Padel',
      healthConditionNote: 'eski not',
      referralDetail: 'eski',
    }, NOW)
    expect('trainingTypeOther' in p).toBe(false)
    expect('healthConditionNote' in p).toBe(false)
    expect('referralDetail' in p).toBe(false)
  })
})

describe('buildUserRegistrationDoc', () => {
  it('bekleyen öğrenci belgesi; ad kırpılır, profil eklenir, boş alanlar yok', () => {
    const profile = buildRegistrationProfile(validAdult(), NOW)
    const doc = buildUserRegistrationDoc('uid-1', {
      phone_number: '05551234567',
      password: 'secret1',
      firstName: ' Ada ',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '1990-05-10',
      level: 'orta',
      profile,
    }, NOW)
    expect(doc).toMatchObject({
      id: 'uid-1',
      firstName: 'Ada',
      role: 'student',
      status: 'pending',
      email: 'ada@example.com',
      birthDate: '1990-05-10',
      level: 'orta',
      referralSource: 'instagram',
      createdAt: NOW,
      updatedAt: NOW,
    })
    expect('password' in doc).toBe(false)
    const minimal = buildUserRegistrationDoc('uid-2', {
      phone_number: '05551234567', password: 'x', firstName: 'A', lastName: 'B', role: 'student',
    }, NOW)
    expect('email' in minimal).toBe(false)
    expect('trainingTypes' in minimal).toBe(false)
  })
})

describe('bildirim metni', () => {
  it('"Ad Soyad (0555 123 45 67) kayıt olmak istiyor."', () => {
    expect(registrationNotificationMessage({ firstName: 'Ada', lastName: 'Lovelace', phone_number: '05551234567' }))
      .toBe('Ada Lovelace (0555 123 45 67) kayıt olmak istiyor.')
    expect(registrationNotificationMessage({ firstName: 'Ada', lastName: 'Lovelace', phone_number: '' }))
      .toBe('Ada Lovelace kayıt olmak istiyor.')
  })

  it('formatPhoneForDisplay yalnız 0XXXXXXXXXX biçimini böler', () => {
    expect(formatPhoneForDisplay('05551234567')).toBe('0555 123 45 67')
    expect(formatPhoneForDisplay('123')).toBe('123')
    expect(formatPhoneForDisplay('')).toBe('')
  })
})
