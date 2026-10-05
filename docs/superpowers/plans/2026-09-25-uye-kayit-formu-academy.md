# Üye Kayıt Formu — tennis-academy Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Öğrencinin kendi kaydına UTA üye kayıt formunu (4 adımlı sihirbaz) eklemek; verileri
`users/{uid}` belgesinde filtrelenebilir saklamak; admin/boss'a bildirim, detay, düzenleme,
filtre ve CSV sağlamak.

**Architecture:** Tüm form mantığı saf modüllerde (`src/utils/registrationForm.ts`,
`src/utils/studentRegistrationAdmin.ts`, `src/utils/csv.ts`); Vue bileşenleri yalnız bağlar.
Kayıt belgesi tek saf fonksiyonla kurulur; `firestore.rules` beyaz listesi ve tip denetimi
aynı alan kümesini izler (`usersSelfWriteRules.spec` sapmayı yakalar).

**Tech Stack:** Vue 3.5 (script setup, `defineModel`), Vuetify 3.8 (`v-stepper`), Pinia,
Firebase 11 (Auth + Firestore), Vitest 4 (jsdom), `@firebase/rules-unit-testing`.

**Spec:** `docs/superpowers/specs/2026-09-25-uye-kayit-formu-design.md`

## Global Constraints

- Yorumlar ve arayüz metinleri Türkçe; çevredeki yoğunluk ve üslup korunur.
- Seçenek değerleri tenis-project-new ile birebir: eğitim `private_lesson|adult_group|tennis_school|court_rental|other`; kaynak `instagram|facebook|google|website|friend|existing_student|other`; yakınlık `mother|father|other`.
- Alan adları: `heightCm, weightKg, occupation, address, isMinor, parentFirstName, parentLastName, parentPhone, parentEmail, parentRelation, trainingTypes, trainingTypeOther, hasHealthCondition, healthConditionNote, specialCareNote, coachNote, referralSource, referralDetail, waiverAcceptedAt, dataConsentAcceptedAt, marketingConsent, marketingConsentAt`.
- Sınırlar: ad/soyad ≤64, meslek ≤100, adres ≤300, kısa metin ≤200, uzun metin ≤1000, boy 50–250, kilo 10–250 (tam sayı).
- Onay metinleri dokümandan birebir; onaylar kurallarda zorunlu DEĞİL (deploy sırası).
- Testler Node 24 ile: `export PATH="/c/Users/Emircan ADALI/AppData/Local/nvm/v24.13.1:$PATH"`.
- Birim test komutu: `npx vitest run tests/unit --exclude tests/unit/firestore-rules.spec.ts`.
- Kural testleri: `JAVA_HOME` = `C:/Program Files/Android/openjdk/jdk-21.0.8`, PATH'e onun `bin`i,
  `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<scratchpad>`, sonra `npm run test:rules`.
- Commit YALNIZ kullanıcı isterse (harness kuralı); plan sonunda sorulur.

---

### Task 1: Tipler + kayıt formu modülü

**Files:**
- Modify: `src/types/user.ts`
- Create: `src/utils/registrationForm.ts`
- Test: `tests/unit/registrationForm.spec.ts`

**Interfaces:**
- Produces: `TrainingType`, `ReferralSource`, `ParentRelation` (types/user);
  `TRAINING_TYPE_OPTIONS`, `REFERRAL_SOURCE_OPTIONS`, `PARENT_RELATION_OPTIONS`, `LEVEL_OPTIONS`,
  `WAIVER_TEXT`, `DATA_CONSENT_TEXT`, `MARKETING_CONSENT_TEXT`, `LIMITS`, `PHONE_PATTERN`,
  `REGISTRATION_STEPS`, `RegistrationFormState`, `RegistrationStep`, `RegistrationErrors`,
  `RegistrationProfile`, `RegisterInput`, `emptyRegistrationForm()`, `parseYmd(s): Date|null`,
  `toYmd(d): string`, `isUnder18(birthDate, today?): boolean|null`,
  `validateRegistrationStep(step, form, today?)`, `validateRegistrationForm(form, today?)`,
  `buildRegistrationProfile(form, now)`, `buildUserRegistrationDoc(uid, input, now): User`,
  `formatPhoneForDisplay(phone)`, `registrationNotificationMessage(u)`,
  `REGISTRATION_NOTIFICATION_TITLE`.

- [ ] **Step 1: `src/types/user.ts` — tipler ve alanlar**

`PlayerLevel` satırının altına ekle:

```ts
// Üye kayıt formu (UTA dijital form) seçenek değerleri. tenis-project-new ile BİREBİR
// aynı tutulur (Firestore → Postgres taşıması değerleri düz kopyalar).
export type TrainingType = 'private_lesson' | 'adult_group' | 'tennis_school' | 'court_rental' | 'other'
export type ReferralSource = 'instagram' | 'facebook' | 'google' | 'website' | 'friend' | 'existing_student' | 'other'
export type ParentRelation = 'mother' | 'father' | 'other'
```

`User` arayüzünde veli yorumunu ve `mustResetPassword`'ü şu hâle getir:

```ts
    // Veli bilgileri: çocuk/yaş grubu üyelik türlerinde (tennis_school_age, premium,
    // vip, court_rental_equipment) ya da öğrenci 18 yaş altıysa (isMinor) doldurulur.
    parentFirstName?: string
    parentLastName?: string
    parentPhone?: string
    parentEmail?: string
    parentRelation?: ParentRelation | ''
    // Üye kayıt formu (kayıtta öğrenci doldurur; admin detayda görür/düzenler).
    heightCm?: number | null
    weightKg?: number | null
    occupation?: string
    isMinor?: boolean | null
    trainingTypes?: TrainingType[]
    trainingTypeOther?: string
    hasHealthCondition?: boolean | null
    healthConditionNote?: string
    specialCareNote?: string
    coachNote?: string
    referralSource?: ReferralSource | ''
    referralDetail?: string
    // Zorunlu onayların kanıtı (kayıt anı) ve isteğe bağlı pazarlama izni.
    waiverAcceptedAt?: Date
    dataConsentAcceptedAt?: Date
    marketingConsent?: boolean
    marketingConsentAt?: Date | null
```

- [ ] **Step 2: Başarısız testi yaz — `tests/unit/registrationForm.spec.ts`**

```ts
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
```

- [ ] **Step 3: Testi koş, düştüğünü gör**

Run: `npx vitest run tests/unit/registrationForm.spec.ts`
Expected: FAIL — `Failed to resolve import "@/utils/registrationForm"`.

- [ ] **Step 4: `src/utils/registrationForm.ts`**

```ts
import type {
  ParentRelation,
  PlayerLevel,
  ReferralSource,
  TrainingType,
  User,
  UserRole,
} from '@/types/user'

// Üye kayıt formu (UTA dijital form): seçenekler, adım doğrulaması ve users
// belgesine yazılacak alanlar. Register.vue ve auth store buradan beslenir.
// Belgeye yeni alan eklenirse firestore.rules → isValidSelfRegistration beyaz listesi
// de güncellenmeli (tests/unit/usersSelfWriteRules.spec.ts sapmayı yakalar).
// Seçenek DEĞERLERİ tenis-project-new ile birebir aynıdır.

export interface FormOption<T extends string> {
  value: T
  title: string
}

export const TRAINING_TYPE_OPTIONS: ReadonlyArray<FormOption<TrainingType>> = [
  { value: 'private_lesson', title: 'Özel ders' },
  { value: 'adult_group', title: 'Yetişkin grup dersi' },
  { value: 'tennis_school', title: 'Tenis okulu' },
  { value: 'court_rental', title: 'Kort rezervasyonu' },
  { value: 'other', title: 'Diğer' },
]

export const REFERRAL_SOURCE_OPTIONS: ReadonlyArray<FormOption<ReferralSource>> = [
  { value: 'instagram', title: 'Instagram' },
  { value: 'facebook', title: 'Facebook' },
  { value: 'google', title: 'Google' },
  { value: 'website', title: 'Web sitesi' },
  { value: 'friend', title: 'Arkadaş / tanıdık tavsiyesi' },
  { value: 'existing_student', title: 'Mevcut UTA öğrencisi' },
  { value: 'other', title: 'Diğer' },
]

export const PARENT_RELATION_OPTIONS: ReadonlyArray<FormOption<ParentRelation>> = [
  { value: 'mother', title: 'Anne' },
  { value: 'father', title: 'Baba' },
  { value: 'other', title: 'Diğer' },
]

export const LEVEL_OPTIONS: ReadonlyArray<FormOption<PlayerLevel>> = [
  { value: 'temel', title: 'Temel' },
  { value: 'orta', title: 'Orta' },
  { value: 'ileri', title: 'İleri' },
]

// Onay metinleri — dokümandan birebir. Pazarlama izni yeni ve isteğe bağlıdır.
export const WAIVER_TEXT =
  'Kendi iradem ile katıldığım tenis antrenmanlarında doğabilecek her türlü sağlık problemi, maddi ve manevi zararlarda tüm sorumluluğun tarafıma ait olduğunu kabul, beyan ve taahhüt ederim.'
export const DATA_CONSENT_TEXT =
  'Bilgilerimin kayıt işlemlerinin yürütülmesi amacıyla kullanılmasını kabul ediyorum.'
export const MARKETING_CONSENT_TEXT =
  'Kampanya, etkinlik ve duyurulardan SMS, e-posta veya telefonla haberdar olmak istiyorum.'

export const LIMITS = {
  name: 64,
  occupation: 100,
  address: 300,
  shortText: 200,
  longText: 1000,
  heightMin: 50,
  heightMax: 250,
  weightMin: 10,
  weightMax: 250,
} as const

export const PHONE_PATTERN = /^0[0-9]{10}$/
const EMAIL_PATTERN = /.+@.+\..+/
const PHONE_MESSAGE = 'Telefon numarası 0 ile başlayan 11 rakam olmalıdır (05XXXXXXXXX)'

/** Kayıt sihirbazının ham durumu (sayılar da metin tutulur; boş = ''). */
export interface RegistrationFormState {
  // 1. Hesap
  firstName: string
  lastName: string
  phone_number: string
  email: string
  password: string
  confirmPassword: string
  // 2. Kişisel / Veli
  birthDate: string
  heightCm: string
  weightKg: string
  address: string
  occupation: string
  isMinor: boolean | null
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  parentRelation: ParentRelation | ''
  // 3. Başvuru ve Sağlık
  trainingTypes: TrainingType[]
  trainingTypeOther: string
  level: PlayerLevel | ''
  hasHealthCondition: boolean | null
  healthConditionNote: string
  specialCareNote: string
  coachNote: string
  // 4. Kaynak ve Onaylar
  referralSource: ReferralSource | ''
  referralDetail: string
  waiverAccepted: boolean
  dataConsentAccepted: boolean
  marketingConsent: boolean
}

export function emptyRegistrationForm(): RegistrationFormState {
  return {
    firstName: '',
    lastName: '',
    phone_number: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    address: '',
    occupation: '',
    isMinor: null,
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelation: '',
    trainingTypes: [],
    trainingTypeOther: '',
    level: '',
    hasHealthCondition: null,
    healthConditionNote: '',
    specialCareNote: '',
    coachNote: '',
    referralSource: '',
    referralDetail: '',
    waiverAccepted: false,
    dataConsentAccepted: false,
    marketingConsent: false,
  }
}

export type RegistrationStep = 1 | 2 | 3 | 4
export type RegistrationErrors = Partial<Record<keyof RegistrationFormState, string>>

export const REGISTRATION_STEPS: ReadonlyArray<{ step: RegistrationStep; title: string }> = [
  { step: 1, title: 'Hesap' },
  { step: 2, title: 'Kişisel Bilgiler' },
  { step: 3, title: 'Başvuru ve Sağlık' },
  { step: 4, title: 'Onay' },
]

const text = (value: string | null | undefined): string => (value ?? '').trim()

/** 'YYYY-MM-DD' → yerel Date (geçersizse null). `new Date('YYYY-MM-DD')` UTC'dir; gün kayar. */
export function parseYmd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const date = new Date(y, mo, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null
  return date
}

/** Yerel tarih → 'YYYY-MM-DD'. */
export function toYmd(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Doğum tarihine göre 18 yaşından küçük mü? Boş/geçersiz tarih → null. */
export function isUnder18(birthDate: string, today: Date = new Date()): boolean | null {
  const birth = parseYmd(birthDate)
  if (!birth) return null
  const eighteenth = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate())
  return startOfDay(today) < eighteenth
}

/** Boş → null; tam sayı değilse NaN. */
function parseIntField(value: string): number | null {
  const s = text(value)
  if (!s) return null
  return /^\d+$/.test(s) ? Number(s) : NaN
}

function inRange(value: string, min: number, max: number): boolean {
  const n = parseIntField(value)
  return n === null || (Number.isInteger(n) && n >= min && n <= max)
}

function checkMaxLength(
  errors: RegistrationErrors,
  field: keyof RegistrationFormState,
  value: string,
  limit: number,
) {
  if (!errors[field] && text(value).length > limit) errors[field] = `En fazla ${limit} karakter olabilir`
}

function checkName(errors: RegistrationErrors, field: keyof RegistrationFormState, value: string, label: string) {
  const v = text(value)
  if (!v) errors[field] = `${label} gereklidir`
  else if (v.length < 2) errors[field] = `${label} en az 2 karakter olmalıdır`
  checkMaxLength(errors, field, value, LIMITS.name)
}

/** Yalnız verilen adımın alanlarını doğrular; hata yoksa {} döner. */
export function validateRegistrationStep(
  step: RegistrationStep,
  form: RegistrationFormState,
  today: Date = new Date(),
): RegistrationErrors {
  const e: RegistrationErrors = {}

  if (step === 1) {
    checkName(e, 'firstName', form.firstName, 'Ad')
    checkName(e, 'lastName', form.lastName, 'Soyad')
    if (!form.phone_number) e.phone_number = 'Telefon numarası gereklidir'
    else if (!PHONE_PATTERN.test(form.phone_number)) e.phone_number = PHONE_MESSAGE
    const email = text(form.email)
    if (!email) e.email = 'E-posta gereklidir'
    else if (!EMAIL_PATTERN.test(email)) e.email = 'Geçerli bir e-posta adresi giriniz'
    if (!form.password) e.password = 'Şifre gereklidir'
    else if (form.password.length < 6) e.password = 'Şifre en az 6 karakter olmalıdır'
    if (!form.confirmPassword) e.confirmPassword = 'Şifre tekrarı gereklidir'
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Şifreler eşleşmiyor'
  }

  if (step === 2) {
    const birth = parseYmd(form.birthDate)
    if (!form.birthDate) e.birthDate = 'Doğum tarihi gereklidir'
    else if (!birth) e.birthDate = 'Geçerli bir tarih giriniz'
    else if (birth > startOfDay(today)) e.birthDate = 'Doğum tarihi gelecekte olamaz'

    if (!inRange(form.heightCm, LIMITS.heightMin, LIMITS.heightMax)) {
      e.heightCm = `Boy ${LIMITS.heightMin}–${LIMITS.heightMax} cm arasında bir tam sayı olmalıdır`
    }
    if (!inRange(form.weightKg, LIMITS.weightMin, LIMITS.weightMax)) {
      e.weightKg = `Kilo ${LIMITS.weightMin}–${LIMITS.weightMax} kg arasında bir tam sayı olmalıdır`
    }
    checkMaxLength(e, 'address', form.address, LIMITS.address)
    checkMaxLength(e, 'occupation', form.occupation, LIMITS.occupation)

    if (form.isMinor === null) {
      e.isMinor = 'Lütfen seçim yapınız'
    } else if (!e.birthDate) {
      const under = isUnder18(form.birthDate, today)
      if (under === true && form.isMinor === false) e.isMinor = 'Doğum tarihine göre öğrenci 18 yaşından küçük görünüyor'
      if (under === false && form.isMinor === true) e.isMinor = 'Doğum tarihine göre öğrenci 18 yaşından küçük değil'
    }

    if (form.isMinor === true) {
      checkName(e, 'parentFirstName', form.parentFirstName, 'Veli adı')
      checkName(e, 'parentLastName', form.parentLastName, 'Veli soyadı')
      if (!form.parentPhone) e.parentPhone = 'Veli telefonu gereklidir'
      else if (!PHONE_PATTERN.test(form.parentPhone)) e.parentPhone = PHONE_MESSAGE
      const parentEmail = text(form.parentEmail)
      if (parentEmail && !EMAIL_PATTERN.test(parentEmail)) e.parentEmail = 'Geçerli bir e-posta adresi giriniz'
    }
  }

  if (step === 3) {
    if (form.trainingTypes.length === 0) e.trainingTypes = 'En az bir eğitim türü seçiniz'
    if (form.trainingTypes.includes('other') && !text(form.trainingTypeOther)) {
      e.trainingTypeOther = 'Lütfen almak istediğiniz eğitimi yazınız'
    }
    checkMaxLength(e, 'trainingTypeOther', form.trainingTypeOther, LIMITS.shortText)
    if (!form.level) e.level = 'Seviye seçiniz'
    if (form.hasHealthCondition === null) e.hasHealthCondition = 'Lütfen seçim yapınız'
    if (form.hasHealthCondition === true && !text(form.healthConditionNote)) {
      e.healthConditionNote = 'Lütfen durumu kısaca açıklayınız'
    }
    checkMaxLength(e, 'healthConditionNote', form.healthConditionNote, LIMITS.longText)
    checkMaxLength(e, 'specialCareNote', form.specialCareNote, LIMITS.longText)
    checkMaxLength(e, 'coachNote', form.coachNote, LIMITS.longText)
  }

  if (step === 4) {
    if (!form.referralSource) e.referralSource = 'Lütfen bir seçenek işaretleyiniz'
    if (form.referralSource === 'friend' && !text(form.referralDetail)) e.referralDetail = 'Referans ismi gereklidir'
    if (form.referralSource === 'other' && !text(form.referralDetail)) e.referralDetail = 'Lütfen açıklama yazınız'
    checkMaxLength(e, 'referralDetail', form.referralDetail, LIMITS.shortText)
    if (!form.waiverAccepted) e.waiverAccepted = 'Devam etmek için sorumluluk beyanını onaylamalısınız'
    if (!form.dataConsentAccepted) {
      e.dataConsentAccepted = 'Devam etmek için bilgilerinizin kullanılmasını onaylamalısınız'
    }
  }

  return e
}

/** Tüm adımları doğrular; hatalı ilk adımı da döner (yoksa null). */
export function validateRegistrationForm(
  form: RegistrationFormState,
  today: Date = new Date(),
): { errors: RegistrationErrors; firstInvalidStep: RegistrationStep | null } {
  let errors: RegistrationErrors = {}
  let firstInvalidStep: RegistrationStep | null = null
  for (const { step } of REGISTRATION_STEPS) {
    const stepErrors = validateRegistrationStep(step, form, today)
    if (firstInvalidStep === null && Object.keys(stepErrors).length > 0) firstInvalidStep = step
    errors = { ...errors, ...stepErrors }
  }
  return { errors, firstInvalidStep }
}

/** users belgesine yazılan kayıt formu alanları (boş olanlar yazılmaz). */
export interface RegistrationProfile {
  heightCm?: number
  weightKg?: number
  occupation?: string
  address?: string
  isMinor: boolean
  parentFirstName?: string
  parentLastName?: string
  parentPhone?: string
  parentEmail?: string
  parentRelation?: ParentRelation
  trainingTypes: TrainingType[]
  trainingTypeOther?: string
  hasHealthCondition: boolean
  healthConditionNote?: string
  specialCareNote?: string
  coachNote?: string
  referralSource: ReferralSource
  referralDetail?: string
  waiverAcceptedAt: Date
  dataConsentAcceptedAt: Date
  marketingConsent: boolean
  marketingConsentAt?: Date
}

/** Doğrulanmış formdan belge alanları: kırpılır, seçimi kalkmış koşullu metinler atılır. */
export function buildRegistrationProfile(form: RegistrationFormState, now: Date): RegistrationProfile {
  const isMinor = form.isMinor === true
  const hasHealthCondition = form.hasHealthCondition === true
  // Seçenek sırasına göre ve tekrarsız
  const trainingTypes = TRAINING_TYPE_OPTIONS.map((o) => o.value).filter((v) => form.trainingTypes.includes(v))
  const referralSource = form.referralSource as ReferralSource

  const profile: RegistrationProfile = {
    isMinor,
    trainingTypes,
    hasHealthCondition,
    referralSource,
    waiverAcceptedAt: now,
    dataConsentAcceptedAt: now,
    marketingConsent: form.marketingConsent === true,
  }

  const height = parseIntField(form.heightCm)
  if (height !== null && Number.isFinite(height)) profile.heightCm = height
  const weight = parseIntField(form.weightKg)
  if (weight !== null && Number.isFinite(weight)) profile.weightKg = weight
  if (text(form.occupation)) profile.occupation = text(form.occupation)
  if (text(form.address)) profile.address = text(form.address)

  if (isMinor) {
    profile.parentFirstName = text(form.parentFirstName)
    profile.parentLastName = text(form.parentLastName)
    profile.parentPhone = form.parentPhone
    if (text(form.parentEmail)) profile.parentEmail = text(form.parentEmail)
    if (form.parentRelation) profile.parentRelation = form.parentRelation
  }

  if (trainingTypes.includes('other') && text(form.trainingTypeOther)) {
    profile.trainingTypeOther = text(form.trainingTypeOther)
  }
  if (hasHealthCondition && text(form.healthConditionNote)) {
    profile.healthConditionNote = text(form.healthConditionNote)
  }
  if (text(form.specialCareNote)) profile.specialCareNote = text(form.specialCareNote)
  if (text(form.coachNote)) profile.coachNote = text(form.coachNote)
  if ((referralSource === 'friend' || referralSource === 'other') && text(form.referralDetail)) {
    profile.referralDetail = text(form.referralDetail)
  }
  if (profile.marketingConsent) profile.marketingConsentAt = now

  return profile
}

/** auth store `register()` girdisi. `profile` yalnız kayıt formundan gelir. */
export interface RegisterInput {
  phone_number: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  email?: string
  birthDate?: string
  level?: PlayerLevel
  profile?: RegistrationProfile
}

/**
 * Kayıt sırasında yazılan users belgesi — TEK kaynak (normal kayıt ve reddedilmiş
 * kaydın kurtarma yolu aynı belgeyi yazar). Anahtarlar firestore.rules
 * isValidSelfRegistration beyaz listesinin alt kümesidir.
 */
export function buildUserRegistrationDoc(uid: string, input: RegisterInput, now: Date): User {
  return {
    id: uid,
    phone_number: input.phone_number,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: input.role,
    status: input.role === 'admin' ? 'approved' : 'pending',
    ...(input.email ? { email: input.email.trim() } : {}),
    ...(input.birthDate ? { birthDate: input.birthDate } : {}),
    ...(input.level ? { level: input.level } : {}),
    ...(input.profile ?? {}),
    createdAt: now,
    updatedAt: now,
  }
}

/** '05551234567' → '0555 123 45 67'; başka biçimler olduğu gibi döner. */
export function formatPhoneForDisplay(phone: string): string {
  const compact = (phone || '').replace(/\s/g, '')
  if (!/^0\d{10}$/.test(compact)) return phone || ''
  return `${compact.slice(0, 4)} ${compact.slice(4, 7)} ${compact.slice(7, 9)} ${compact.slice(9)}`
}

export const REGISTRATION_NOTIFICATION_TITLE = 'Yeni Öğrenci Kaydı'

/** Admin/boss'a giden kayıt bildirimi: "Ad Soyad (0555 123 45 67) kayıt olmak istiyor." */
export function registrationNotificationMessage(user: {
  firstName?: string
  lastName?: string
  phone_number?: string
}): string {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Yeni öğrenci'
  const phone = formatPhoneForDisplay(user.phone_number || '')
  return phone ? `${name} (${phone}) kayıt olmak istiyor.` : `${name} kayıt olmak istiyor.`
}
```

- [ ] **Step 5: Testi koş, geçtiğini gör**

Run: `npx vitest run tests/unit/registrationForm.spec.ts`
Expected: PASS (tüm testler).

---

### Task 2: Auth store kayıt akışı

**Files:**
- Modify: `src/store/modules/auth.ts` (import satırları 10–13, `register` 132–259)
- Modify: `tests/unit/registerNewFields.spec.ts`
- Rename+rewrite: `tests/unit/registerSoftDeletedBlocked.spec.ts` → `tests/unit/registerExistingAccount.spec.ts`

**Interfaces:**
- Consumes: `buildUserRegistrationDoc`, `registrationNotificationMessage`,
  `REGISTRATION_NOTIFICATION_TITLE`, `RegisterInput` (Task 1).
- Produces: `useAuthStore().register(input: RegisterInput): Promise<boolean>`; yeni
  eylemler `completeRegistration(uid, input)`, `resumeExistingAccount(input)`.

- [ ] **Step 1: Testleri yaz/güncelle**

`tests/unit/registerSoftDeletedBlocked.spec.ts` dosyasını `git mv` ile
`tests/unit/registerExistingAccount.spec.ts` yap ve içeriğini şununla değiştir:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Kayıt girişsiz `users` sorgusu ATMAZ (kurallar girişsiz okumayı reddettiği için
// eskiden her kayıt bu sorguda düşüyordu). Telefonun Auth hesabı zaten varsa
// girilen şifreyle giriş denenir: belge yoksa (reddedilmiş kayıt) yeniden yazılır,
// belge varsa kayıt yapılmaz ve oturum kapatılır.

const setDocMock = vi.fn().mockResolvedValue(undefined)
const getDocMock = vi.fn()
const getDocsMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: (_db: any, coll: string, id: string) => ({ _path: `${coll}/${id}` }),
  setDoc: (...args: any[]) => setDocMock(...args),
  getDoc: (...args: any[]) => getDocMock(...args),
  getDocs: (...args: any[]) => getDocsMock(...args),
  onSnapshot: vi.fn(() => () => {}),
  collection: (_db: any, name: string) => ({ _coll: name }),
  query: (...args: any[]) => ({ _query: args }),
  where: (field: string, op: string, value: any) => ({ _where: { field, op, value } }),
}))

const createUserMock = vi.fn()
const signInMock = vi.fn()
const signOutMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => signInMock(...args),
  createUserWithEmailAndPassword: (...args: any[]) => createUserMock(...args),
  signOut: (...args: any[]) => signOutMock(...args),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({ auth: { currentUser: null }, db: {} }))

const createAdminNotificationMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: (...args: any[]) => createAdminNotificationMock(...args) },
}))

import { useAuthStore } from '@/store/modules/auth'

const input = {
  phone_number: '05551112233',
  password: 'pw123456',
  firstName: 'Yeni',
  lastName: 'Kullanici',
  role: 'student' as const,
}

beforeEach(() => {
  setActivePinia(createPinia())
  setDocMock.mockClear()
  getDocMock.mockReset()
  getDocsMock.mockReset()
  createUserMock.mockReset()
  signInMock.mockReset()
  signOutMock.mockClear()
  createAdminNotificationMock.mockReset().mockResolvedValue(undefined)
})

describe('register — girişsiz sorgu yok', () => {
  it('normal kayıt users koleksiyonunu sorgulamadan belgeyi yazar', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })
    const ok = await useAuthStore().register(input)
    expect(ok).toBe(true)
    expect(getDocsMock).not.toHaveBeenCalled()
    expect(setDocMock).toHaveBeenCalledTimes(1)
  })

  it('bildirim yazılamasa da kayıt başarılı sayılır', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-new' } })
    createAdminNotificationMock.mockRejectedValueOnce(new Error('permission-denied'))
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(true)
    expect(store.error).toBeNull()
    expect(store.user?.id).toBe('uid-new')
  })
})

describe('register — telefonun Auth hesabı zaten var', () => {
  beforeEach(() => {
    createUserMock.mockRejectedValue({ code: 'auth/email-already-in-use' })
  })

  it('belge yoksa (reddedilmiş kayıt) belge yeniden yazılır', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-old' } })
    getDocMock.mockResolvedValueOnce({ exists: () => false })
    const ok = await useAuthStore().register(input)
    expect(ok).toBe(true)
    const [ref, payload] = setDocMock.mock.calls[0]
    expect(ref._path).toBe('users/uid-old')
    expect(payload).toMatchObject({ id: 'uid-old', status: 'pending' })
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('belge silinmişse kayıt yapılmaz, oturum kapanır, yöneticiye yönlendirilir', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-del' } })
    getDocMock.mockResolvedValueOnce({ exists: () => true, data: () => ({ deleted: true, status: 'deleted' }) })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(signOutMock).toHaveBeenCalled()
    expect(store.error).toMatch(/silinmiş/i)
    expect(store.error).toMatch(/yöneticiyle iletişime geçin/i)
  })

  it('belge etkinse kayıt yapılmaz, oturum kapanır, "zaten kayıtlı" denir', async () => {
    signInMock.mockResolvedValueOnce({ user: { uid: 'uid-act' } })
    getDocMock.mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'active' }) })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(signOutMock).toHaveBeenCalled()
    expect(store.error).toMatch(/zaten kayıtlı/i)
  })

  it('şifre tutmazsa "zaten kayıtlı" denir, belge yazılmaz', async () => {
    signInMock.mockRejectedValueOnce({ code: 'auth/wrong-password' })
    const store = useAuthStore()
    const ok = await store.register(input)
    expect(ok).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()
    expect(store.error).toMatch(/zaten kayıtlı/i)
  })
})
```

`tests/unit/registerNewFields.spec.ts` içinde:
1. `vi.mock('@/services/notificationService', …)` bloğunu yakalanabilir mock ile değiştir:

```ts
const createAdminNotificationMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/notificationService', () => ({
  notificationService: { createAdminNotification: (...args: any[]) => createAdminNotificationMock(...args) },
}))
```

2. İlk `describe` bloğunun sonuna (ikinci `it`'ten sonra) ekle:

```ts
  it('kayıt formu profili belgeye yazılır ve bildirim "Ad Soyad (telefon)" biçimindedir', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-3' } })
    createAdminNotificationMock.mockClear()
    const now = new Date(2026, 8, 25, 10, 0)

    const store = useAuthStore()
    const ok = await store.register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '2014-03-01',
      level: 'temel',
      profile: {
        isMinor: true,
        parentFirstName: 'Ayşe',
        parentLastName: 'Lovelace',
        parentPhone: '05559876543',
        trainingTypes: ['tennis_school'],
        hasHealthCondition: false,
        referralSource: 'friend',
        referralDetail: 'Mehmet Kaya',
        waiverAcceptedAt: now,
        dataConsentAcceptedAt: now,
        marketingConsent: false,
      },
    })

    expect(ok).toBe(true)
    const [, payload] = setDocMock.mock.calls[0]
    expect(payload).toMatchObject({
      isMinor: true,
      parentPhone: '05559876543',
      trainingTypes: ['tennis_school'],
      referralSource: 'friend',
      referralDetail: 'Mehmet Kaya',
      waiverAcceptedAt: now,
      status: 'pending',
    })
    expect(createAdminNotificationMock).toHaveBeenCalledWith(
      'Yeni Öğrenci Kaydı',
      'Ada Lovelace (0555 123 45 67) kayıt olmak istiyor.',
      'approval_pending',
      'uid-3',
    )
  })
```

3. `describe('Form validasyon kuralları', …)` bloğunu SİL — Register.vue kuralların
kopyasıydı; aynı iddialar artık gerçek fonksiyonu sınayan `registrationForm.spec.ts`'te
(e-posta zorunlu/geçerli, doğum tarihi zorunlu/gelecek olamaz, seviye zorunlu).

- [ ] **Step 2: Testleri koş, düştüğünü gör**

Run: `npx vitest run tests/unit/registerExistingAccount.spec.ts tests/unit/registerNewFields.spec.ts`
Expected: FAIL — `getDocsMock` çağrıldı (girişsiz sorgu), bildirim metni eski, silinmiş/etkin
hesap senaryolarında `signOut` çağrılmıyor.

- [ ] **Step 3: `src/store/modules/auth.ts` değişiklikleri**

Import satırları:

```ts
import { doc, setDoc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import type { User } from '@/types/user'
import { notificationService } from '@/services/notificationService'
import { pushNotificationService } from '@/services/pushNotificationService'
import {
    buildUserRegistrationDoc,
    registrationNotificationMessage,
    REGISTRATION_NOTIFICATION_TITLE,
    type RegisterInput
} from '@/utils/registrationForm'
```

(`PlayerLevel`/`UserRole` başka yerde kullanılmıyorsa import'tan çıkar; `tsc` söyler.)

`async register(userData: { … }) { … }` eyleminin TAMAMINI şu üç eylemle değiştir:

```ts
        async register(userData: RegisterInput) {
            this.loading = true
            this.error = null

            try {
                // NOT: Eskiden burada GİRİŞ YAPMADAN users koleksiyonu sorgulanıyordu
                // ("bu telefon daha önce silinmiş mi?"). Kurallar girişsiz okumaya izin
                // vermediği için sorgu reddediliyor ve kayıt her seferinde hata veriyordu.
                // Silme akışı Auth kaydını siler ve telefonu temizler; Auth kaydı hâlâ
                // duruyorsa email-already-in-use yolu (resumeExistingAccount) durumu ele alır.
                const dummyEmail = phoneToEmail(userData.phone_number)
                console.log('📝 Kullanıcı kaydediliyor:', userData.phone_number)
                const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, userData.password)
                await this.completeRegistration(userCredential.user.uid, userData)
                return true
            } catch (error: any) {
                if (error?.code === 'auth/email-already-in-use') {
                    return await this.resumeExistingAccount(userData)
                }
                console.error('❌ Kayıt hatası:', error)
                this.error = this.getErrorMessage(error)
                return false
            } finally {
                this.loading = false
            }
        },

        // Kayıt belgesini yazar, admin/boss'a bildirim gönderir; oturum açık kalır
        // (öğrenci panelde "Hesap Onayı Bekleniyor" uyarısını görür).
        async completeRegistration(uid: string, userData: RegisterInput) {
            const user = buildUserRegistrationDoc(uid, userData, new Date())
            console.log('💾 Firestore\'a kullanıcı verisi yazılıyor...')
            await setDoc(doc(db, 'users', uid), user)

            if (user.role === 'student' && user.status === 'pending') {
                // Bildirim yazılamasa da kayıt geçerlidir: admin bekleyen öğrencileri
                // users koleksiyonundan da görür (Notifications.vue sentetik kayıtları).
                try {
                    await notificationService.createAdminNotification(
                        REGISTRATION_NOTIFICATION_TITLE,
                        registrationNotificationMessage(user),
                        'approval_pending',
                        uid
                    )
                } catch (notifyError) {
                    console.warn('Kayıt bildirimi yazılamadı:', notifyError)
                }
            }

            this.user = user
            this.isAuthenticated = true
            // Canlı dinleyici belge yazılmadan önce "belge yok" görüp hata yazmış olabilir.
            this.error = null
            console.log('✅ Kayıt başarılı:', uid)
        },

        // Telefonun Auth hesabı zaten var. Girilen şifreyle giriş yapılabilirse: belge
        // yoksa (kayıt reddedilmiş) yeniden yazılır; belge varsa kayıt yapılmaz, oturum
        // kapatılır ve kullanıcı yönlendirilir.
        async resumeExistingAccount(userData: RegisterInput): Promise<boolean> {
            const alreadyRegistered = 'Bu telefon numarası zaten kayıtlı. Giriş sayfasından giriş yapabilirsiniz.'
            let uid: string
            try {
                const credential = await signInWithEmailAndPassword(auth, phoneToEmail(userData.phone_number), userData.password)
                uid = credential.user.uid
            } catch (signInError) {
                console.warn('Mevcut hesaba girilen şifreyle girilemedi:', signInError)
                this.error = alreadyRegistered
                return false
            }

            try {
                const existing = await getDoc(doc(db, 'users', uid))
                if (!existing.exists()) {
                    console.log('📝 Belge yok (kayıt reddedilmiş) — yeniden oluşturuluyor')
                    await this.completeRegistration(uid, userData)
                    return true
                }
                const data = existing.data() as Partial<User>
                await this.logout()
                this.error = (data.deleted === true || data.status === 'deleted')
                    ? 'Bu telefon numarasıyla açılmış hesap silinmiş. Yeniden kayıt için lütfen yöneticiyle iletişime geçin.'
                    : alreadyRegistered
                return false
            } catch (error: any) {
                console.error('❌ Kayıt kurtarma hatası:', error)
                this.error = this.getErrorMessage(error)
                return false
            }
        },
```

- [ ] **Step 4: Testleri koş, geçtiğini gör**

Run: `npx vitest run tests/unit/registerExistingAccount.spec.ts tests/unit/registerNewFields.spec.ts tests/unit/usersSelfWriteRules.spec.ts tests/unit/bossAdminParity.spec.ts tests/unit/authUserLiveUpdate.spec.ts`
Expected: PASS.

---

### Task 3: Firestore kuralları

**Files:**
- Modify: `firestore.rules` (`isValidSelfRegistration`, satır ~44–53)
- Modify: `tests/unit/usersSelfWriteRules.spec.ts`
- Modify: `tests/unit/firestore-rules.spec.ts` (`describe('kayıt')`)

**Interfaces:**
- Consumes: `buildRegistrationProfile`, `emptyRegistrationForm` (Task 1).

- [ ] **Step 1: `usersSelfWriteRules.spec.ts` — başarısız test**

Import'lara ekle:

```ts
import { buildRegistrationProfile, emptyRegistrationForm } from '@/utils/registrationForm'
```

`describe('istemcinin kendi belgesine yazdıkları kurala uyar', …)` içine, ilk `it`'ten sonra:

```ts
  it('kayıt (auth store register) — kayıt formunun TÜM alanlarıyla', async () => {
    createUserMock.mockResolvedValueOnce({ user: { uid: 'uid-form' } })
    const now = new Date()
    // Her isteğe bağlı alan dolu: profil anahtarlarının tamamı beyaz listede olmalı.
    const profile = buildRegistrationProfile({
      ...emptyRegistrationForm(),
      heightCm: '150', weightKg: '40', address: 'Urla', occupation: 'Öğrenci',
      isMinor: true, parentFirstName: 'Ayşe', parentLastName: 'Y', parentPhone: '05559876543',
      parentEmail: 'veli@example.com', parentRelation: 'mother',
      trainingTypes: ['tennis_school', 'other'], trainingTypeOther: 'Kondisyon',
      hasHealthCondition: true, healthConditionNote: 'Astım', specialCareNote: 'Sprey',
      coachNote: 'Utangaç', referralSource: 'friend', referralDetail: 'Mehmet',
      marketingConsent: true,
    }, now)

    const ok = await useAuthStore().register({
      phone_number: '05551234567',
      password: 'secret123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student',
      email: 'ada@example.com',
      birthDate: '2014-03-01',
      level: 'temel',
      profile,
    })

    expect(ok).toBe(true)
    const [, payload] = setDocMock.mock.calls[0]
    expect(Object.keys(payload)).toEqual(expect.arrayContaining(Object.keys(profile)))
    expectKeysWithin(payload, REGISTRATION_FIELDS)
  })
```

Run: `npx vitest run tests/unit/usersSelfWriteRules.spec.ts`
Expected: FAIL — `kuralda izin verilmeyen alanlar: heightCm, weightKg, …`.

- [ ] **Step 2: `firestore.rules` — beyaz liste + tip denetimi**

`isValidSelfRegistration` fonksiyonunu şununla değiştir (ilk `hasOnly` listesi bu fonksiyonda
KALMALI — `usersSelfWriteRules.spec` onu okur):

```
    // Kayıt (store register + AuthService.createUserDocument): yalnız
    // onay bekleyen öğrenci. `id` alanı yazılırsa belge kimliğiyle aynı olmalı
    // (alanın doküman kimliğini gölgelemesi tuzağı). Üye kayıt formu alanları
    // (src/utils/registrationForm.ts) tip/uzunluk/seçenek denetiminden geçer.
    function isValidSelfRegistration(userId) {
      let d = request.resource.data;
      return d.keys().hasOnly(['id', 'phone_number', 'firstName', 'lastName',
                               'role', 'status', 'email', 'birthDate', 'level',
                               'phone', 'address', 'emergencyContact',
                               'createdAt', 'updatedAt', 'lastLoginAt',
                               'heightCm', 'weightKg', 'occupation', 'isMinor',
                               'parentFirstName', 'parentLastName', 'parentPhone',
                               'parentEmail', 'parentRelation',
                               'trainingTypes', 'trainingTypeOther',
                               'hasHealthCondition', 'healthConditionNote',
                               'specialCareNote', 'coachNote',
                               'referralSource', 'referralDetail',
                               'waiverAcceptedAt', 'dataConsentAcceptedAt',
                               'marketingConsent', 'marketingConsentAt']) &&
        d.get('role', null) == 'student' &&
        d.get('status', null) == 'pending' &&
        d.get('id', userId) == userId &&
        isValidRegistrationForm(d);
    }

    // Kayıt formu alanlarının tip/uzunluk denetimi (alan yoksa geçer). Onaylar burada
    // ZORUNLU tutulmaz: kurallar uygulamadan önce yayınlanırsa eski istemcinin kaydı
    // kırılmasın — zorunluluk kayıt formunda (Register.vue).
    function optStr(d, key, maxLen) {
      return !(key in d) || (d[key] is string && d[key].size() <= maxLen);
    }
    function optInt(d, key, lo, hi) {
      return !(key in d) || (d[key] is int && d[key] >= lo && d[key] <= hi);
    }
    function optBool(d, key) {
      return !(key in d) || d[key] is bool;
    }
    function optTime(d, key) {
      return !(key in d) || d[key] is timestamp;
    }
    function optOneOf(d, key, values) {
      return !(key in d) || d[key] in values;
    }
    function optPhone(d, key) {
      return !(key in d) || (d[key] is string && d[key].matches('^0[0-9]{10}$'));
    }
    function isValidRegistrationForm(d) {
      return optInt(d, 'heightCm', 50, 250) && optInt(d, 'weightKg', 10, 250) &&
        optStr(d, 'occupation', 100) && optStr(d, 'address', 300) &&
        optBool(d, 'isMinor') &&
        optStr(d, 'parentFirstName', 64) && optStr(d, 'parentLastName', 64) &&
        optPhone(d, 'parentPhone') && optStr(d, 'parentEmail', 254) &&
        optOneOf(d, 'parentRelation', ['mother', 'father', 'other']) &&
        (!('trainingTypes' in d) ||
          (d.trainingTypes is list && d.trainingTypes.size() <= 5 &&
           d.trainingTypes.hasOnly(['private_lesson', 'adult_group', 'tennis_school',
                                    'court_rental', 'other']))) &&
        optStr(d, 'trainingTypeOther', 200) &&
        optBool(d, 'hasHealthCondition') && optStr(d, 'healthConditionNote', 1000) &&
        optStr(d, 'specialCareNote', 1000) && optStr(d, 'coachNote', 1000) &&
        optOneOf(d, 'referralSource', ['instagram', 'facebook', 'google', 'website',
                                       'friend', 'existing_student', 'other']) &&
        optStr(d, 'referralDetail', 200) &&
        optTime(d, 'waiverAcceptedAt') && optTime(d, 'dataConsentAcceptedAt') &&
        optBool(d, 'marketingConsent') && optTime(d, 'marketingConsentAt');
    }
```

Run: `npx vitest run tests/unit/usersSelfWriteRules.spec.ts`
Expected: PASS.

- [ ] **Step 3: Emülatör kural testleri — `firestore-rules.spec.ts`**

`describe('kayıt', …)` içine, `'AuthService.createUserDocument biçimi kabul edilir'`
testinden sonra ekle:

```ts
        const formFields = {
            heightCm: 150, weightKg: 40, occupation: 'Öğrenci', address: 'Urla',
            isMinor: true, parentFirstName: 'Ayşe', parentLastName: 'Yılmaz',
            parentPhone: '05559876543', parentEmail: 'ayse@example.com', parentRelation: 'mother',
            trainingTypes: ['tennis_school', 'other'], trainingTypeOther: 'Kondisyon',
            hasHealthCondition: true, healthConditionNote: 'Astım', specialCareNote: 'Sprey yanında',
            coachNote: 'Utangaç', referralSource: 'friend', referralDetail: 'Mehmet Kaya',
            waiverAcceptedAt: new Date(), dataConsentAcceptedAt: new Date(),
            marketingConsent: true, marketingConsentAt: new Date()
        }

        it('üye kayıt formunun tüm alanlarıyla kayıt olur', async () => {
            await assertSucceeds(dbAs(NEW_USER).doc(`users/${NEW_USER}`).set(storeRegistration(NEW_USER, formFields)))
        })

        it('kayıt formu alanlarında tip/seçenek/uzunluk ihlali reddedilir', async () => {
            const ref = dbAs(NEW_USER).doc(`users/${NEW_USER}`)
            const bad: Record<string, unknown>[] = [
                { heightCm: '150' }, { heightCm: 20 }, { heightCm: 150.5 }, { weightKg: 400 },
                { isMinor: 'evet' }, { parentPhone: '5559876543' }, { parentRelation: 'dayi' },
                { trainingTypes: ['yoga'] }, { trainingTypes: 'tennis_school' },
                { hasHealthCondition: 'hayir' }, { healthConditionNote: 'x'.repeat(1001) },
                { referralSource: 'tiktok' }, { referralDetail: 'x'.repeat(201) },
                { waiverAcceptedAt: 'dün' }, { marketingConsent: 'evet' }
            ]
            for (const override of bad) {
                await assertFails(ref.set(storeRegistration(NEW_USER, { ...formFields, ...override })))
            }
        })

        it('girişsiz kullanıcı users koleksiyonunu sorgulayamaz (eski kayıt ön kontrolü bu yüzden düşüyordu)', async () => {
            const anon = testEnv.unauthenticatedContext().firestore()
            await assertFails(anon.collection('users')
                .where('phone_number', '==', '05551112233')
                .where('deleted', '==', true).get())
        })
```

- [ ] **Step 4: Kural testlerini emülatörde koş**

Run (Bash):
```bash
export PATH="/c/Program Files/Android/openjdk/jdk-21.0.8/bin:/c/Users/Emircan ADALI/AppData/Local/nvm/v24.13.1:$PATH"
export JAVA_HOME="C:/Program Files/Android/openjdk/jdk-21.0.8"
export JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=<scratchpad>"
npm run test:rules
```
Expected: tüm kural testleri PASS (önceki 59 + yeni 3; Defi testleri bu dalda yok).

---

### Task 4: Boss bildirim görünürlüğü + bildirim metni

**Files:**
- Create: `src/utils/notificationAudience.ts`
- Modify: `src/services/notificationService.ts:40-58,85`
- Modify: `src/views/Notifications.vue` (sentetik mesaj ~199, rol kontrolleri ~187/470/497)
- Modify: `src/components/common/AppHeader.vue:541`
- Test: `tests/unit/notificationAudience.spec.ts`

**Interfaces:**
- Consumes: `registrationNotificationMessage`, `REGISTRATION_NOTIFICATION_TITLE` (Task 1).
- Produces: `isAdminAudience(role?: string | null): boolean`.

- [ ] **Step 1: Başarısız test — `tests/unit/notificationAudience.spec.ts`**

```ts
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
```

Run: `npx vitest run tests/unit/notificationAudience.spec.ts`
Expected: FAIL — `@/utils/notificationAudience` yok.

- [ ] **Step 2: `src/utils/notificationAudience.ts`**

```ts
// Admin bildirim kitlesi. Boss admin-eşidir (bkz. CLAUDE.md): admin'e giden
// bildirimleri (kayıt onayı, rezervasyon onayı) o da görür ve işler.
export function isAdminAudience(role?: string | null): boolean {
  const normalized = (role || '').toLowerCase()
  return normalized === 'admin' || normalized === 'boss'
}
```

- [ ] **Step 3: `notificationService.ts`**

Import ekle: `import { isAdminAudience } from '@/utils/notificationAudience'`

`subscribeToNotifications` içinde:

```ts
        let q;
        const adminAudience = isAdminAudience(userRole)
        if (adminAudience) {
```

(önceki `const normalizedRole = …` satırı ve `if (normalizedRole === 'admin') {` kalkar), ve
tarayıcı bildiriminde:

```ts
                                        clickAction: adminAudience ? '/admin/notifications' : '/student/notifications'
```

- [ ] **Step 4: `Notifications.vue`**

Script import'larına ekle:

```ts
import { registrationNotificationMessage, REGISTRATION_NOTIFICATION_TITLE } from '@/utils/registrationForm'
```

`displayedNotifications` içinde `if (authStore.user?.role !== 'admin') {` →
`if (!authStore.isAdmin) {`; sentetik öğede:

```ts
      title: REGISTRATION_NOTIFICATION_TITLE,
      message: registrationNotificationMessage(s),
```

`loadPendingStudents` içinde `if (authStore.user?.role !== 'admin') return` →
`if (!authStore.isAdmin) return`; `onMounted` içinde `if (authStore.user?.role === 'admin') {`
→ `if (authStore.isAdmin) {`. Yorum: `// Firestore bildirimleri + users'dan bekleyen öğrenciler (admin ve boss için)`.

- [ ] **Step 5: `AppHeader.vue`**

`if (authStore.user.role === 'admin') {` → `if (authStore.isAdmin) {` ve üstüne yorum:
`// Boss admin-eşidir: bekleyen kayıt rozetini o da görür.`

- [ ] **Step 6: Testleri koş**

Run: `npx vitest run tests/unit/notificationAudience.spec.ts tests/unit/headerRegisterHidden.spec.ts`
Expected: PASS.

---

### Task 5: Veli bilgisi görünürlüğü (üyelik VEYA 18 yaş altı)

**Files:**
- Modify: `src/utils/parentInfo.ts`
- Modify: `tests/unit/parentInfo.spec.ts`

**Interfaces:**
- Produces: `needsParentInfo(membershipType?: string | null, isMinor?: boolean | null): boolean`.

- [ ] **Step 1: Başarısız test — `parentInfo.spec.ts` sonuna**

```ts
  it('öğrenci 18 yaş altıysa üyelik türünden bağımsız olarak true döner', () => {
    expect(needsParentInfo('basic', true)).toBe(true)
    expect(needsParentInfo(undefined, true)).toBe(true)
    expect(needsParentInfo('basic', false)).toBe(false)
    expect(needsParentInfo('basic', null)).toBe(false)
    expect(needsParentInfo('premium', false)).toBe(true)
  })
```

Run: `npx vitest run tests/unit/parentInfo.spec.ts` → FAIL.

- [ ] **Step 2: `parentInfo.ts`**

```ts
// Veli bilgisi gerektiren üyelik türleri. Bu türlerdeki öğrenciler çocuk/yaş
// grubu olduğu için veli ad/soyad/telefon alanları düzenleme formunda gösterilir
// ve öğrenci listesinde ⓘ ikonuyla erişilir. Kayıt formunda "18 yaşından küçük"
// işaretlenen öğrenci de (isMinor) üyelik türünden bağımsız olarak veli bilgisi taşır.
export const PARENT_REQUIRED_MEMBERSHIPS = [
  'tennis_school_age',
  'premium',
  'vip',
  'court_rental_equipment',
] as const

/** Veli bilgisi gösterilmeli/saklanmalı mı? (üyelik türü VEYA 18 yaş altı) */
export function needsParentInfo(membershipType?: string | null, isMinor?: boolean | null): boolean {
  if (isMinor === true) return true
  return PARENT_REQUIRED_MEMBERSHIPS.includes(
    (membershipType || '') as (typeof PARENT_REQUIRED_MEMBERSHIPS)[number],
  )
}
```

Run: `npx vitest run tests/unit/parentInfo.spec.ts` → PASS.

---

### Task 6: Admin yardımcıları + CSV

**Files:**
- Create: `src/utils/csv.ts`, `src/utils/studentRegistrationAdmin.ts`
- Test: `tests/unit/csv.spec.ts`, `tests/unit/studentRegistrationAdmin.spec.ts`

**Interfaces:**
- Consumes: Task 1 seçenekleri, `LIMITS`, `parseYmd`, `isUnder18`, `formatPhoneForDisplay`.
- Produces: `csvCell`, `buildCsv(headers, rows)`, `downloadCsv(fileName, csv)`;
  `StudentRegistrationInfo`, `readRegistrationInfo(data)`, `toDateOrNull(v)`,
  `effectiveIsMinor(info, today?)`, `hasRegistrationAnswers(info)`, `trainingTypesLabel`,
  `referralLabel`, `parentRelationLabel`, `levelLabel`, `yesNoLabel`, `formatDateTr`,
  `formatYmdTr`, `RegistrationFilters`, `AGE_FILTER_OPTIONS`, `MARKETING_FILTER_OPTIONS`,
  `emptyRegistrationFilters()`, `matchesRegistrationFilters(s, f, today?)`,
  `STUDENT_CSV_HEADERS`, `StudentCsvSource`, `studentCsvRow(s, labels, today?)`,
  `registrationWipePatch()`, `RegistrationEditForm`, `RegistrationEditErrors`,
  `toRegistrationEditForm(info)`, `validateRegistrationEdit(form)`,
  `buildRegistrationUpdate(form, original)`.

- [ ] **Step 1: Başarısız testler**

`tests/unit/csv.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildCsv, csvCell } from '@/utils/csv'

describe('csv', () => {
  it('BOM + ; ayraç + CRLF', () => {
    expect(buildCsv(['A', 'B'], [['1', '2']])).toBe('\uFEFFA;B\r\n1;2\r\n')
  })

  it('; " ve satır sonu içeren hücre tırnaklanır', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('çift "tırnak"')).toBe('"çift ""tırnak"""')
    expect(csvCell('iki\nsatır')).toBe('"iki\nsatır"')
  })

  it('formül enjeksiyonuna karşı korunur, boşlar boş yazılır', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+90')).toBe("'+90")
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
})
```

`tests/unit/studentRegistrationAdmin.spec.ts`:

```ts
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
  const s = { ...info({ trainingTypes: ['tennis_school'], referralSource: 'google', isMinor: true, hasHealthCondition: true }), joinDate: new Date(2026, 8, 10, 15) }

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
      ...info({ isMinor: true, parentFirstName: 'Ayşe', parentLastName: 'Y', parentPhone: '05559876543',
        trainingTypes: ['tennis_school'], referralSource: 'friend', referralDetail: 'Mehmet',
        hasHealthCondition: true, healthConditionNote: 'GİZLİ-SAĞLIK', heightCm: 150,
        marketingConsent: true, marketingConsentAt: CONSENT, birthDate: '2014-03-01' }),
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
    const original = info({ heightCm: 150, trainingTypes: ['other'], trainingTypeOther: 'Padel', referralSource: 'friend', referralDetail: 'M' })
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
```

Run: `npx vitest run tests/unit/csv.spec.ts tests/unit/studentRegistrationAdmin.spec.ts` → FAIL (modüller yok).

- [ ] **Step 2: `src/utils/csv.ts`**

```ts
// Excel (tr-TR) uyumlu CSV: UTF-8 BOM + ';' ayraç + CRLF. Hücreler formül
// enjeksiyonuna karşı korunur (=, +, -, @ ile başlayan metin tek tırnakla başlar).

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function buildCsv(headers: readonly string[], rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

/** Tarayıcıda CSV indirir. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: `src/utils/studentRegistrationAdmin.ts`**

```ts
import type { ParentRelation, ReferralSource, TrainingType } from '@/types/user'
import {
  LEVEL_OPTIONS,
  LIMITS,
  PARENT_RELATION_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  TRAINING_TYPE_OPTIONS,
  formatPhoneForDisplay,
  isUnder18,
  parseYmd,
  type FormOption,
} from '@/utils/registrationForm'

// Admin öğrenci yönetimi için kayıt formu yardımcıları: belgeden okuma, etiketler,
// liste filtreleri, CSV satırı, admin düzenleme yaması ve silmede anonimleştirme.
// StudentManagement.vue, StudentRegistrationSection.vue ve AdminDashboard.vue kullanır.

export interface StudentRegistrationInfo {
  birthDate: string
  heightCm: number | null
  weightKg: number | null
  occupation: string
  isMinor: boolean | null
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  parentRelation: ParentRelation | ''
  trainingTypes: TrainingType[]
  trainingTypeOther: string
  hasHealthCondition: boolean | null
  healthConditionNote: string
  specialCareNote: string
  coachNote: string
  referralSource: ReferralSource | ''
  referralDetail: string
  waiverAcceptedAt: Date | null
  dataConsentAcceptedAt: Date | null
  marketingConsent: boolean
  marketingConsentAt: Date | null
}

const TRAINING_VALUES = TRAINING_TYPE_OPTIONS.map((o) => o.value)
const REFERRAL_VALUES: string[] = REFERRAL_SOURCE_OPTIONS.map((o) => o.value)
const RELATION_VALUES: string[] = PARENT_RELATION_OPTIONS.map((o) => o.value)

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null)
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Firestore Timestamp | Date | ISO metin → Date (yoksa/bozuksa null). */
export function toDateOrNull(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const maybe = value as { toDate?: () => Date }
  if (typeof maybe.toDate === 'function') return maybe.toDate()
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/** users belgesinden kayıt formu + veli alanları (eksik/bozuk alan → boş değer). */
export function readRegistrationInfo(data: Record<string, unknown>): StudentRegistrationInfo {
  const rawTypes = Array.isArray(data.trainingTypes) ? (data.trainingTypes as unknown[]) : []
  const referral = str(data.referralSource)
  const relation = str(data.parentRelation)
  return {
    birthDate: str(data.birthDate),
    heightCm: int(data.heightCm),
    weightKg: int(data.weightKg),
    occupation: str(data.occupation),
    isMinor: bool(data.isMinor),
    parentFirstName: str(data.parentFirstName),
    parentLastName: str(data.parentLastName),
    parentPhone: str(data.parentPhone),
    parentEmail: str(data.parentEmail),
    parentRelation: RELATION_VALUES.includes(relation) ? (relation as ParentRelation) : '',
    trainingTypes: TRAINING_VALUES.filter((v) => rawTypes.includes(v)),
    trainingTypeOther: str(data.trainingTypeOther),
    hasHealthCondition: bool(data.hasHealthCondition),
    healthConditionNote: str(data.healthConditionNote),
    specialCareNote: str(data.specialCareNote),
    coachNote: str(data.coachNote),
    referralSource: REFERRAL_VALUES.includes(referral) ? (referral as ReferralSource) : '',
    referralDetail: str(data.referralDetail),
    waiverAcceptedAt: toDateOrNull(data.waiverAcceptedAt),
    dataConsentAcceptedAt: toDateOrNull(data.dataConsentAcceptedAt),
    marketingConsent: data.marketingConsent === true,
    marketingConsentAt: toDateOrNull(data.marketingConsentAt),
  }
}

/** Öğrenci kayıt formunu doldurmuş mu? (form öncesi kayıtlarda hepsi boş) */
export function hasRegistrationAnswers(info: StudentRegistrationInfo): boolean {
  return info.trainingTypes.length > 0 || info.referralSource !== '' ||
    info.hasHealthCondition !== null || info.isMinor !== null || info.waiverAcceptedAt !== null
}

/** `isMinor` işaretliyse o; yoksa (form öncesi kayıt) doğum tarihinden hesaplanır. */
export function effectiveIsMinor(
  info: Pick<StudentRegistrationInfo, 'isMinor' | 'birthDate'>,
  today: Date = new Date(),
): boolean | null {
  return info.isMinor ?? isUnder18(info.birthDate, today)
}

const titleOf = (options: ReadonlyArray<FormOption<string>>, value: string): string =>
  options.find((o) => o.value === value)?.title ?? ''

export function trainingTypesLabel(types: TrainingType[], other: string): string {
  return types
    .map((t) => (t === 'other' && other.trim() ? `Diğer: ${other.trim()}` : titleOf(TRAINING_TYPE_OPTIONS, t)))
    .join(', ')
}

export function referralLabel(source: ReferralSource | '', detail: string): string {
  if (!source) return ''
  const title = titleOf(REFERRAL_SOURCE_OPTIONS, source)
  return (source === 'friend' || source === 'other') && detail.trim() ? `${title} — ${detail.trim()}` : title
}

export function parentRelationLabel(relation: ParentRelation | ''): string {
  return relation ? titleOf(PARENT_RELATION_OPTIONS, relation) : ''
}

export function levelLabel(level: string): string {
  return titleOf(LEVEL_OPTIONS, level) || level
}

export function yesNoLabel(value: boolean | null): string {
  if (value === true) return 'Evet'
  if (value === false) return 'Hayır'
  return '—'
}

export function formatDateTr(date: Date | null): string {
  return date ? date.toLocaleDateString('tr-TR') : ''
}

/** 'YYYY-MM-DD' → 'GG.AA.YYYY' (geçersizse boş). */
export function formatYmdTr(ymd: string): string {
  return formatDateTr(parseYmd(ymd))
}

// --- Liste filtreleri ----------------------------------------------------------

export interface RegistrationFilters {
  trainingType: TrainingType | '' | null
  referralSource: ReferralSource | '' | null
  age: 'minor' | 'adult' | '' | null
  marketing: 'yes' | 'no' | '' | null
  healthOnly: boolean
  joinedFrom: string
  joinedTo: string
}

export const AGE_FILTER_OPTIONS = [
  { value: 'minor', title: '18 yaş altı' },
  { value: 'adult', title: 'Yetişkin' },
] as const

export const MARKETING_FILTER_OPTIONS = [
  { value: 'yes', title: 'İzin var' },
  { value: 'no', title: 'İzin yok' },
] as const

export function emptyRegistrationFilters(): RegistrationFilters {
  return { trainingType: '', referralSource: '', age: '', marketing: '', healthOnly: false, joinedFrom: '', joinedTo: '' }
}

/** Kayıt formu filtreleri (v-select temizlenince gelen null = filtre yok). */
export function matchesRegistrationFilters(
  student: StudentRegistrationInfo & { joinDate: Date | null },
  f: RegistrationFilters,
  today: Date = new Date(),
): boolean {
  if (f.trainingType && !student.trainingTypes.includes(f.trainingType)) return false
  if (f.referralSource && student.referralSource !== f.referralSource) return false
  if (f.age) {
    const minor = effectiveIsMinor(student, today)
    if (f.age === 'minor' && minor !== true) return false
    if (f.age === 'adult' && minor !== false) return false
  }
  if (f.marketing === 'yes' && !student.marketingConsent) return false
  if (f.marketing === 'no' && student.marketingConsent) return false
  if (f.healthOnly && student.hasHealthCondition !== true) return false

  const from = parseYmd(f.joinedFrom || '')
  const to = parseYmd(f.joinedTo || '')
  if (from || to) {
    if (!student.joinDate) return false
    const day = new Date(student.joinDate.getFullYear(), student.joinDate.getMonth(), student.joinDate.getDate())
    if (from && day < from) return false
    if (to && day > to) return false
  }
  return true
}

// --- CSV -----------------------------------------------------------------------

// Pazarlama/iletişim listesi içindir: sağlık notları ve boy/kilo BİLEREK yok.
export const STUDENT_CSV_HEADERS = [
  'Ad', 'Soyad', 'Telefon', 'E-posta', 'Doğum Tarihi', '18 Yaş Altı',
  'Veli Adı Soyadı', 'Veli Telefonu', 'Veli E-posta', 'Yakınlık',
  'Adres', 'Meslek', 'Eğitim Türleri', 'Seviye', 'Üyelik', 'Durum',
  'Nereden Duydu', 'Pazarlama İzni', 'Pazarlama İzni Tarihi', 'Kayıt Tarihi',
] as const

export interface StudentCsvSource extends StudentRegistrationInfo {
  firstName: string
  lastName: string
  phone_number: string
  email: string
  address: string
  level?: string
  joinDate: Date | null
}

export function studentCsvRow(
  s: StudentCsvSource,
  labels: { membership: string; status: string },
  today: Date = new Date(),
): string[] {
  const minor = effectiveIsMinor(s, today)
  return [
    s.firstName,
    s.lastName,
    formatPhoneForDisplay(s.phone_number),
    s.email,
    formatYmdTr(s.birthDate),
    minor === null ? '' : minor ? 'Evet' : 'Hayır',
    `${s.parentFirstName} ${s.parentLastName}`.trim(),
    formatPhoneForDisplay(s.parentPhone),
    s.parentEmail,
    parentRelationLabel(s.parentRelation),
    s.address,
    s.occupation,
    trainingTypesLabel(s.trainingTypes, s.trainingTypeOther),
    levelLabel(s.level || ''),
    labels.membership,
    labels.status,
    referralLabel(s.referralSource, s.referralDetail),
    s.marketingConsent ? 'Evet' : 'Hayır',
    formatDateTr(s.marketingConsentAt),
    formatDateTr(s.joinDate),
  ]
}

// --- Silme ---------------------------------------------------------------------

/**
 * Silinen öğrencinin veli + kayıt formu alanlarını boşaltan yama. Onay zaman
 * damgaları (waiverAcceptedAt, dataConsentAcceptedAt) kişisel veri değil, onayın
 * kanıtıdır; bilerek bırakılır.
 */
export function registrationWipePatch(): Record<string, unknown> {
  return {
    heightCm: null,
    weightKg: null,
    occupation: '',
    isMinor: null,
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelation: '',
    trainingTypes: [],
    trainingTypeOther: '',
    hasHealthCondition: null,
    healthConditionNote: '',
    specialCareNote: '',
    coachNote: '',
    referralSource: '',
    referralDetail: '',
    marketingConsent: false,
    marketingConsentAt: null,
  }
}

// --- Admin düzenlemesi -----------------------------------------------------------

export interface RegistrationEditForm {
  heightCm: string
  weightKg: string
  occupation: string
  isMinor: boolean | null
  trainingTypes: TrainingType[]
  trainingTypeOther: string
  hasHealthCondition: boolean | null
  healthConditionNote: string
  specialCareNote: string
  coachNote: string
  referralSource: ReferralSource | '' | null
  referralDetail: string
  marketingConsent: boolean
}

export type RegistrationEditErrors = Partial<Record<keyof RegistrationEditForm, string>>

export function toRegistrationEditForm(info: StudentRegistrationInfo): RegistrationEditForm {
  return {
    heightCm: info.heightCm === null ? '' : String(info.heightCm),
    weightKg: info.weightKg === null ? '' : String(info.weightKg),
    occupation: info.occupation,
    isMinor: info.isMinor,
    trainingTypes: [...info.trainingTypes],
    trainingTypeOther: info.trainingTypeOther,
    hasHealthCondition: info.hasHealthCondition,
    healthConditionNote: info.healthConditionNote,
    specialCareNote: info.specialCareNote,
    coachNote: info.coachNote,
    referralSource: info.referralSource,
    referralDetail: info.referralDetail,
    marketingConsent: info.marketingConsent,
  }
}

/** Admin düzenlemesi: yalnız aralık/uzunluk (eski öğrencide zorunlu alan dayatılmaz). */
export function validateRegistrationEdit(form: RegistrationEditForm): RegistrationEditErrors {
  const e: RegistrationEditErrors = {}
  const intOk = (value: string, min: number, max: number) => {
    const s = value.trim()
    return !s || (/^\d+$/.test(s) && Number(s) >= min && Number(s) <= max)
  }
  if (!intOk(form.heightCm, LIMITS.heightMin, LIMITS.heightMax)) {
    e.heightCm = `Boy ${LIMITS.heightMin}–${LIMITS.heightMax} cm arasında bir tam sayı olmalıdır`
  }
  if (!intOk(form.weightKg, LIMITS.weightMin, LIMITS.weightMax)) {
    e.weightKg = `Kilo ${LIMITS.weightMin}–${LIMITS.weightMax} kg arasında bir tam sayı olmalıdır`
  }
  const maxLength = (field: keyof RegistrationEditForm, value: string, limit: number) => {
    if (value.trim().length > limit) e[field] = `En fazla ${limit} karakter olabilir`
  }
  maxLength('occupation', form.occupation, LIMITS.occupation)
  maxLength('trainingTypeOther', form.trainingTypeOther, LIMITS.shortText)
  maxLength('healthConditionNote', form.healthConditionNote, LIMITS.longText)
  maxLength('specialCareNote', form.specialCareNote, LIMITS.longText)
  maxLength('coachNote', form.coachNote, LIMITS.longText)
  maxLength('referralDetail', form.referralDetail, LIMITS.shortText)
  return e
}

/** Admin düzenlemesinin users belgesine yazılacak kayıt formu yaması. */
export function buildRegistrationUpdate(
  form: RegistrationEditForm,
  original: Pick<StudentRegistrationInfo, 'marketingConsent'>,
): Record<string, unknown> {
  const t = (v: string) => v.trim()
  const num = (v: string) => (t(v) ? Number(t(v)) : null)
  const trainingTypes = TRAINING_VALUES.filter((v) => form.trainingTypes.includes(v))
  const source = form.referralSource || ''
  const patch: Record<string, unknown> = {
    heightCm: num(form.heightCm),
    weightKg: num(form.weightKg),
    occupation: t(form.occupation),
    isMinor: form.isMinor,
    trainingTypes,
    trainingTypeOther: trainingTypes.includes('other') ? t(form.trainingTypeOther) : '',
    hasHealthCondition: form.hasHealthCondition,
    healthConditionNote: form.hasHealthCondition === true ? t(form.healthConditionNote) : '',
    specialCareNote: t(form.specialCareNote),
    coachNote: t(form.coachNote),
    referralSource: source,
    referralDetail: source === 'friend' || source === 'other' ? t(form.referralDetail) : '',
  }
  // Pazarlama izni yalnız öğrencinin kendi beyanıyla verilir; admin yalnız geri alabilir.
  if (original.marketingConsent && !form.marketingConsent) {
    patch.marketingConsent = false
    patch.marketingConsentAt = null
  }
  return patch
}
```

- [ ] **Step 4: Testleri koş** → `npx vitest run tests/unit/csv.spec.ts tests/unit/studentRegistrationAdmin.spec.ts` PASS.

---

### Task 7: Kayıt sihirbazı — `Register.vue`

**Files:**
- Modify: `src/views/Register.vue` (form bölümü 29–203 ve script/style tamamen)

**Interfaces:**
- Consumes: Task 1 (seçenekler, metinler, `validateRegistrationStep`,
  `validateRegistrationForm`, `buildRegistrationProfile`, `isUnder18`, `toYmd`,
  `REGISTRATION_STEPS`), `useAuthStore().register` (Task 2).

- [ ] **Step 1: Şablon** — karşılama bölümü (4–27) ve avantajlar bölümü aynen kalır.
  `<v-col cols="12" sm="8" md="6" lg="5">` → `<v-col cols="12" sm="10" md="8" lg="6">`.
  Kart gövdesi:

```vue
              <v-card-text class="pa-4 pa-sm-6">
                <!-- Form Header -->
                <div class="auth-form-header mb-4">
                  <div class="auth-form-icon-wrapper success-gradient">
                    <v-icon icon="mdi-account-plus" size="28" color="white" />
                  </div>
                  <div class="auth-form-content">
                    <h2 class="auth-form-title">Üye Kayıt Formu</h2>
                    <p class="auth-form-subtitle">Bilgilerinizi 4 kısa adımda doldurun</p>
                  </div>
                </div>

                <v-stepper
                    v-model="step"
                    :items="stepTitles"
                    alt-labels
                    flat
                    hide-actions
                    mobile-breakpoint="sm"
                    class="register-stepper"
                >
                  <!-- 1. Hesap -->
                  <template #item.1>
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-text-field v-model="form.firstName" label="Ad *" variant="outlined"
                            prepend-inner-icon="mdi-account" autocomplete="given-name"
                            class="auth-input" :error-messages="err('firstName')" />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field v-model="form.lastName" label="Soyad *" variant="outlined"
                            autocomplete="family-name" class="auth-input" :error-messages="err('lastName')" />
                      </v-col>
                    </v-row>
                    <v-text-field v-model="form.phone_number" label="Telefon Numarası *" type="tel"
                        inputmode="numeric" maxlength="11" placeholder="05XXXXXXXXX" variant="outlined"
                        prepend-inner-icon="mdi-phone" autocomplete="tel" class="mb-1 auth-input"
                        hint="Giriş yaparken bu numarayı kullanacaksınız" persistent-hint
                        :error-messages="err('phone_number')" />
                    <v-text-field v-model="form.email" label="E-posta *" type="email" variant="outlined"
                        prepend-inner-icon="mdi-email" placeholder="ornek@mail.com" autocomplete="email"
                        class="mt-2 auth-input" :error-messages="err('email')" />
                    <v-text-field v-model="form.password" label="Şifre *"
                        :type="showPassword ? 'text' : 'password'" variant="outlined"
                        prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        autocomplete="new-password" class="auth-input" :error-messages="err('password')"
                        @click:append-inner="showPassword = !showPassword" />
                    <v-text-field v-model="form.confirmPassword" label="Şifre Tekrar *"
                        :type="showConfirmPassword ? 'text' : 'password'" variant="outlined"
                        prepend-inner-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        autocomplete="new-password" class="auth-input" :error-messages="err('confirmPassword')"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword" />
                  </template>

                  <!-- 2. Kişisel / Veli -->
                  <template #item.2>
                    <v-text-field v-model="form.birthDate" label="Doğum Tarihi *" type="date" :max="todayYmd"
                        variant="outlined" prepend-inner-icon="mdi-cake-variant" class="auth-input"
                        :error-messages="err('birthDate')" />
                    <v-row dense>
                      <v-col cols="6">
                        <v-text-field v-model="form.heightCm" label="Boy (cm)" type="number" inputmode="numeric"
                            variant="outlined" prepend-inner-icon="mdi-human-male-height" class="auth-input"
                            :error-messages="err('heightCm')" />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field v-model="form.weightKg" label="Kilo (kg)" type="number" inputmode="numeric"
                            variant="outlined" prepend-inner-icon="mdi-weight-kilogram" class="auth-input"
                            :error-messages="err('weightKg')" />
                      </v-col>
                    </v-row>
                    <v-textarea v-model="form.address" label="Adres" rows="2" auto-grow counter="300"
                        variant="outlined" prepend-inner-icon="mdi-map-marker" autocomplete="street-address"
                        class="auth-input" :error-messages="err('address')" />
                    <v-text-field v-model="form.occupation" label="Meslek" variant="outlined"
                        prepend-inner-icon="mdi-briefcase" class="auth-input" :error-messages="err('occupation')" />

                    <div class="register-question__label">Öğrenci 18 yaşından küçük mü? *</div>
                    <v-radio-group v-model="form.isMinor" inline :error-messages="err('isMinor')"
                        @update:model-value="isMinorTouched = true">
                      <v-radio label="Evet" :value="true" />
                      <v-radio label="Hayır" :value="false" />
                    </v-radio-group>

                    <v-expand-transition>
                      <div v-if="form.isMinor === true" class="register-subsection">
                        <div class="register-subsection__title">
                          <v-icon icon="mdi-account-child" size="20" />
                          Veli Bilgileri
                        </div>
                        <v-row dense>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="form.parentFirstName" label="Veli Adı *" variant="outlined"
                                class="auth-input" :error-messages="err('parentFirstName')" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="form.parentLastName" label="Veli Soyadı *" variant="outlined"
                                class="auth-input" :error-messages="err('parentLastName')" />
                          </v-col>
                        </v-row>
                        <v-text-field v-model="form.parentPhone" label="Veli Telefon *" type="tel" inputmode="numeric"
                            maxlength="11" placeholder="05XXXXXXXXX" variant="outlined" prepend-inner-icon="mdi-phone"
                            class="auth-input" :error-messages="err('parentPhone')" />
                        <v-text-field v-model="form.parentEmail" label="Veli E-posta" type="email" variant="outlined"
                            prepend-inner-icon="mdi-email" class="auth-input" :error-messages="err('parentEmail')" />
                        <div class="register-question__label">Öğrenci ile yakınlık derecesi</div>
                        <v-radio-group v-model="form.parentRelation" inline hide-details class="mb-2">
                          <v-radio v-for="opt in PARENT_RELATION_OPTIONS" :key="opt.value"
                              :label="opt.title" :value="opt.value" />
                        </v-radio-group>
                      </div>
                    </v-expand-transition>
                  </template>

                  <!-- 3. Başvuru ve Sağlık -->
                  <template #item.3>
                    <div class="register-question__label">
                      Almak istediğiniz eğitim türü *
                      <span class="register-question__hint">(birden fazla seçebilirsiniz)</span>
                    </div>
                    <div class="register-options">
                      <v-checkbox v-for="opt in TRAINING_TYPE_OPTIONS" :key="opt.value"
                          v-model="form.trainingTypes" :value="opt.value" :label="opt.title"
                          density="compact" hide-details />
                    </div>
                    <div v-if="errors.trainingTypes" class="register-error">{{ errors.trainingTypes }}</div>
                    <v-expand-transition>
                      <v-text-field v-if="form.trainingTypes.includes('other')" v-model="form.trainingTypeOther"
                          label="Diğer eğitim türü *" variant="outlined" class="mt-2 auth-input"
                          :error-messages="err('trainingTypeOther')" />
                    </v-expand-transition>
                    <v-select v-model="form.level" label="Seviye *" :items="LEVEL_OPTIONS" item-title="title"
                        item-value="value" variant="outlined" prepend-inner-icon="mdi-tennis-ball"
                        class="mt-3 auth-input" :error-messages="err('level')" />

                    <v-divider class="my-4" />

                    <div class="register-question__label">
                      Derslere katılımı etkileyebilecek bir sağlık durumu / fiziksel kısıtlılık var mı? *
                    </div>
                    <v-radio-group v-model="form.hasHealthCondition" inline :error-messages="err('hasHealthCondition')">
                      <v-radio label="Hayır" :value="false" />
                      <v-radio label="Evet" :value="true" />
                    </v-radio-group>
                    <v-expand-transition>
                      <v-textarea v-if="form.hasHealthCondition === true" v-model="form.healthConditionNote"
                          label="Açıklama *" rows="2" auto-grow counter="1000" variant="outlined"
                          class="auth-input" :error-messages="err('healthConditionNote')" />
                    </v-expand-transition>
                    <v-textarea v-model="form.specialCareNote"
                        label="Düzenli dikkat edilmesi gereken bir durum var mı? (açıklama)"
                        rows="2" auto-grow counter="1000" variant="outlined" class="auth-input"
                        :error-messages="err('specialCareNote')" />
                    <v-textarea v-model="form.coachNote"
                        label="Antrenörün bilmesini istediğiniz özel bir bilgi var mı? (açıklama)"
                        rows="2" auto-grow counter="1000" variant="outlined" class="auth-input"
                        :error-messages="err('coachNote')" />
                  </template>

                  <!-- 4. Nereden duydunuz + Onaylar -->
                  <template #item.4>
                    <div class="register-question__label">Urla Tenis Akademisi'ne nasıl ulaştınız? *</div>
                    <v-radio-group v-model="form.referralSource" :error-messages="err('referralSource')">
                      <v-radio v-for="opt in REFERRAL_SOURCE_OPTIONS" :key="opt.value"
                          :label="opt.title" :value="opt.value" />
                    </v-radio-group>
                    <v-expand-transition>
                      <v-text-field v-if="needsReferralDetail" v-model="form.referralDetail"
                          :label="referralDetailLabel" variant="outlined" class="auth-input"
                          :error-messages="err('referralDetail')" />
                    </v-expand-transition>

                    <v-divider class="my-4" />

                    <div class="consent-box" :class="{ 'consent-box--error': !!errors.waiverAccepted }">
                      <p class="consent-box__text">{{ WAIVER_TEXT }}</p>
                      <v-checkbox v-model="form.waiverAccepted" label="Okudum, kabul ediyorum *"
                          density="compact" :error-messages="err('waiverAccepted')" />
                    </div>
                    <div class="consent-box" :class="{ 'consent-box--error': !!errors.dataConsentAccepted }">
                      <p class="consent-box__text">{{ DATA_CONSENT_TEXT }}</p>
                      <v-checkbox v-model="form.dataConsentAccepted" label="Okudum, kabul ediyorum *"
                          density="compact" :error-messages="err('dataConsentAccepted')" />
                    </div>
                    <div class="consent-box consent-box--optional">
                      <v-checkbox v-model="form.marketingConsent" :label="MARKETING_CONSENT_TEXT"
                          density="compact" hide-details />
                      <p class="consent-box__hint">İsteğe bağlıdır; kaydınızı etkilemez.</p>
                    </div>
                  </template>
                </v-stepper>

                <!-- Error Alert -->
                <v-alert
                    v-if="authStore.error"
                    type="error"
                    variant="tonal"
                    class="mb-4 auth-alert"
                    :text="authStore.error"
                />

                <!-- Adım gezinme -->
                <div class="register-nav mb-4">
                  <v-btn v-if="step > 1" variant="outlined" size="large" :disabled="authStore.loading" @click="goBack">
                    <v-icon icon="mdi-chevron-left" class="mr-1" />
                    Geri
                  </v-btn>
                  <v-spacer />
                  <v-btn v-if="step < lastStep" color="primary" variant="flat" size="large" @click="goNext">
                    İleri
                    <v-icon icon="mdi-chevron-right" class="ml-1" />
                  </v-btn>
                  <v-btn v-else color="success" variant="flat" size="large" :loading="authStore.loading"
                      class="auth-submit-btn register-submit-btn" @click="handleRegister">
                    <v-icon icon="mdi-account-plus" class="mr-2" />
                    Kayıt Ol
                  </v-btn>
                </div>

                <!-- Auth Links (aynen) -->
```

- [ ] **Step 2: Script (tamamı)**

```vue
<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import type { PlayerLevel } from '@/types/user'
import {
  DATA_CONSENT_TEXT,
  LEVEL_OPTIONS,
  MARKETING_CONSENT_TEXT,
  PARENT_RELATION_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  REGISTRATION_STEPS,
  TRAINING_TYPE_OPTIONS,
  WAIVER_TEXT,
  buildRegistrationProfile,
  emptyRegistrationForm,
  isUnder18,
  toYmd,
  validateRegistrationForm,
  validateRegistrationStep,
  type RegistrationErrors,
  type RegistrationFormState,
  type RegistrationStep,
} from '@/utils/registrationForm'

const router = useRouter()
const authStore = useAuthStore()

// Formun tamamı tek nesnede; adımlar arası geçişte değerler korunur.
const form = reactive<RegistrationFormState>(emptyRegistrationForm())
const step = ref<RegistrationStep>(1)
const stepTitles = REGISTRATION_STEPS.map((s) => s.title)
const lastStep = REGISTRATION_STEPS[REGISTRATION_STEPS.length - 1].step
const todayYmd = toYmd(new Date())

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Hatalar, kullanıcı o adımda "İleri"ye ya da "Kayıt Ol"a bastıktan sonra görünür;
// boş form açılır açılmaz kırmızıya boyanmaz.
const attemptedSteps = ref<RegistrationStep[]>([])
const errors = computed<RegistrationErrors>(() =>
  attemptedSteps.value.reduce<RegistrationErrors>(
    (all, s) => ({ ...all, ...validateRegistrationStep(s, form) }),
    {},
  ),
)
const err = (field: keyof RegistrationFormState): string | string[] => errors.value[field] ?? []
const markAttempted = (...steps: RegistrationStep[]) => {
  attemptedSteps.value = Array.from(new Set([...attemptedSteps.value, ...steps]))
}

// Doğum tarihi girilince "18 yaşından küçük mü?" sorusu, kullanıcı elle seçmediyse
// otomatik işaretlenir; çelişki yine de 2. adım doğrulamasında yakalanır.
const isMinorTouched = ref(false)
watch(
  () => form.birthDate,
  (value) => {
    if (isMinorTouched.value) return
    const under = isUnder18(value)
    if (under !== null) form.isMinor = under
  },
)

const needsReferralDetail = computed(() => form.referralSource === 'friend' || form.referralSource === 'other')
const referralDetailLabel = computed(() => (form.referralSource === 'friend' ? 'Referans ismi *' : 'Açıklama *'))

const scrollToStepper = () => {
  document.querySelector('.register-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const scrollToFirstError = async () => {
  await nextTick()
  document
    .querySelector('.register-page .v-input--error, .register-page .register-error')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const goNext = async () => {
  markAttempted(step.value)
  if (Object.keys(validateRegistrationStep(step.value, form)).length > 0) {
    await scrollToFirstError()
    return
  }
  authStore.clearError()
  step.value = (step.value + 1) as RegistrationStep
  scrollToStepper()
}

const goBack = () => {
  if (step.value === 1) return
  step.value = (step.value - 1) as RegistrationStep
  scrollToStepper()
}

const handleRegister = async () => {
  markAttempted(...REGISTRATION_STEPS.map((s) => s.step))
  const { firstInvalidStep } = validateRegistrationForm(form)
  if (firstInvalidStep !== null) {
    step.value = firstInvalidStep
    await scrollToFirstError()
    return
  }

  const success = await authStore.register({
    phone_number: form.phone_number,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    role: 'student',
    email: form.email.trim(),
    birthDate: form.birthDate,
    level: form.level as PlayerLevel,
    profile: buildRegistrationProfile(form, new Date()),
  })

  // Kayıt oturumu açık bırakır; öğrenci panelde "Hesap Onayı Bekleniyor" uyarısını görür.
  if (success) {
    router.push({ name: 'StudentDashboard' })
    return
  }
  // Telefonla ilgili hata (zaten kayıtlı / silinmiş hesap) 1. adımda düzeltilir.
  if (authStore.error && /telefon/i.test(authStore.error)) {
    step.value = 1
    scrollToStepper()
  }
}

// Benefits data
const benefits = [ /* mevcut dört öğe aynen */ ]
</script>
```

(`showPendingOverlay`, `registrationSteps`, `goToHome` ölü kodu ve `.pending-*` stilleri kalkar.)

- [ ] **Step 3: Stil**

```vue
<style scoped>
.register-stepper {
  background: transparent;
}
.register-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}
.register-stepper :deep(.v-stepper-window) {
  margin: 16px 0 8px;
}
.register-question__label {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 4px 0;
  color: rgba(var(--v-theme-on-surface), 0.87);
}
.register-question__hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.register-subsection {
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  border-radius: 12px;
  padding: 16px 16px 4px;
  margin-bottom: 16px;
  background: rgba(var(--v-theme-primary), 0.04);
}
.register-subsection__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}
.register-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  column-gap: 8px;
}
.register-error {
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
  margin: 4px 0 8px 16px;
}
.consent-box {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 14px 16px 0;
  margin-bottom: 12px;
}
.consent-box--error {
  border-color: rgb(var(--v-theme-error));
}
.consent-box--optional {
  background: rgba(var(--v-theme-on-surface), 0.02);
  padding-bottom: 12px;
}
.consent-box__text {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 4px;
}
.consent-box__hint {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 0 40px;
}
.register-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
```

- [ ] **Step 4: Derleme doğrulaması** — `npm run build` hatasız (ts/vue).

---

### Task 8: Admin arayüzü — Kayıt Formu bölümü, filtreler, CSV, silme

**Files:**
- Create: `src/components/admin/students/StudentRegistrationSection.vue`
- Modify: `src/components/admin/StudentManagement.vue`
- Modify: `src/views/AdminDashboard.vue` (`deleteAllStudents` ~379)

**Interfaces:**
- Consumes: Task 5 `needsParentInfo(m, isMinor)`, Task 6 yardımcıları, Task 1 seçenekleri.

- [ ] **Step 1: `StudentRegistrationSection.vue`**

```vue
<template>
  <v-card class="modern-card mb-4" elevation="2">
    <v-card-title class="pa-4 bg-info text-white d-flex align-center">
      <v-icon icon="mdi-clipboard-account-outline" class="mr-2" />
      Kayıt Formu
    </v-card-title>
    <v-card-text class="pa-4">
      <template v-if="!editMode">
        <v-alert v-if="!hasAnswers" type="info" variant="tonal" density="compact" class="mb-3">
          Bu öğrenci kayıt formu kullanılmaya başlanmadan önce kaydolmuş; form alanları boş.
        </v-alert>
        <v-row dense>
          <v-col v-for="(column, index) in columns" :key="index" cols="12" sm="6">
            <div v-for="row in column" :key="row.label" class="info-item mb-3">
              <label class="info-label">{{ row.label }}:</label>
              <span class="info-value">{{ row.value }}</span>
            </div>
          </v-col>
        </v-row>
      </template>

      <template v-else>
        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="form.heightCm" label="Boy (cm)" type="number" variant="outlined"
                density="compact" :error-messages="err('heightCm')" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.weightKg" label="Kilo (kg)" type="number" variant="outlined"
                density="compact" :error-messages="err('weightKg')" />
          </v-col>
        </v-row>
        <v-text-field v-model="form.occupation" label="Meslek" variant="outlined" density="compact"
            class="mb-2" :error-messages="err('occupation')" />

        <div class="text-subtitle-2 font-weight-bold">Öğrenci 18 yaşından küçük mü?</div>
        <v-radio-group v-model="form.isMinor" inline density="compact" hide-details class="mb-3">
          <v-radio label="Evet" :value="true" />
          <v-radio label="Hayır" :value="false" />
        </v-radio-group>

        <div class="text-subtitle-2 font-weight-bold">Eğitim Türü</div>
        <div class="registration-options mb-2">
          <v-checkbox v-for="opt in TRAINING_TYPE_OPTIONS" :key="opt.value" v-model="form.trainingTypes"
              :value="opt.value" :label="opt.title" density="compact" hide-details />
        </div>
        <v-text-field v-if="form.trainingTypes.includes('other')" v-model="form.trainingTypeOther"
            label="Diğer eğitim türü" variant="outlined" density="compact" class="mb-2"
            :error-messages="err('trainingTypeOther')" />

        <div class="text-subtitle-2 font-weight-bold">Sağlık durumu / fiziksel kısıtlılık</div>
        <v-radio-group v-model="form.hasHealthCondition" inline density="compact" hide-details class="mb-2">
          <v-radio label="Hayır" :value="false" />
          <v-radio label="Evet" :value="true" />
        </v-radio-group>
        <v-textarea v-if="form.hasHealthCondition === true" v-model="form.healthConditionNote"
            label="Sağlık durumu açıklaması" rows="2" auto-grow variant="outlined" density="compact"
            class="mb-2" :error-messages="err('healthConditionNote')" />
        <v-textarea v-model="form.specialCareNote" label="Düzenli dikkat edilmesi gereken durum" rows="2"
            auto-grow variant="outlined" density="compact" class="mb-2" :error-messages="err('specialCareNote')" />
        <v-textarea v-model="form.coachNote" label="Antrenöre not" rows="2" auto-grow variant="outlined"
            density="compact" class="mb-2" :error-messages="err('coachNote')" />

        <v-select v-model="form.referralSource" label="Nereden Duydu" :items="REFERRAL_SOURCE_OPTIONS"
            item-title="title" item-value="value" variant="outlined" density="compact" clearable class="mb-2" />
        <v-text-field v-if="form.referralSource === 'friend' || form.referralSource === 'other'"
            v-model="form.referralDetail" :label="form.referralSource === 'friend' ? 'Referans ismi' : 'Açıklama'"
            variant="outlined" density="compact" class="mb-2" :error-messages="err('referralDetail')" />

        <v-checkbox v-model="form.marketingConsent" :disabled="!info.marketingConsent" label="Pazarlama izni"
            density="compact" persistent-hint
            :hint="info.marketingConsent
              ? 'İzni kaldırabilirsiniz; izin yalnız öğrencinin kendi beyanıyla verilir.'
              : 'İzin yalnız öğrencinin kendi beyanıyla verilir.'" />
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { REFERRAL_SOURCE_OPTIONS, TRAINING_TYPE_OPTIONS } from '@/utils/registrationForm'
import {
  effectiveIsMinor,
  formatDateTr,
  formatYmdTr,
  hasRegistrationAnswers,
  referralLabel,
  trainingTypesLabel,
  yesNoLabel,
  type RegistrationEditErrors,
  type RegistrationEditForm,
  type StudentRegistrationInfo,
} from '@/utils/studentRegistrationAdmin'

// Öğrenci detayındaki "Kayıt Formu" bölümü: okuma modunda formun cevapları,
// düzenleme modunda admin'in değiştirebileceği alanlar. Onay zamanları salt okunur;
// pazarlama izni yalnız geri alınabilir (öğrencinin beyanı olmadan verilemez).
const props = defineProps<{
  info: StudentRegistrationInfo
  editMode: boolean
  errors?: RegistrationEditErrors
}>()
const form = defineModel<RegistrationEditForm>('form', { required: true })

const dash = (value: string) => value || '—'
const err = (field: keyof RegistrationEditForm): string | string[] => props.errors?.[field] ?? []
const hasAnswers = computed(() => hasRegistrationAnswers(props.info))

const heightWeight = computed(() => {
  const h = props.info.heightCm === null ? '' : `${props.info.heightCm} cm`
  const w = props.info.weightKg === null ? '' : `${props.info.weightKg} kg`
  return [h, w].filter(Boolean).join(' / ') || '—'
})

const health = computed(() => {
  if (props.info.hasHealthCondition === true) return `Var — ${props.info.healthConditionNote || 'açıklama yok'}`
  if (props.info.hasHealthCondition === false) return 'Yok'
  return '—'
})

const consent = (date: Date | null) => (date ? `Onaylandı (${formatDateTr(date)})` : '—')

const columns = computed(() => [
  [
    { label: 'Doğum Tarihi', value: dash(formatYmdTr(props.info.birthDate)) },
    { label: 'Boy / Kilo', value: heightWeight.value },
    { label: 'Meslek', value: dash(props.info.occupation) },
    { label: '18 Yaş Altı', value: yesNoLabel(effectiveIsMinor(props.info)) },
    { label: 'Eğitim Türü', value: dash(trainingTypesLabel(props.info.trainingTypes, props.info.trainingTypeOther)) },
    { label: 'Nereden Duydu', value: dash(referralLabel(props.info.referralSource, props.info.referralDetail)) },
  ],
  [
    { label: 'Sağlık Durumu', value: health.value },
    { label: 'Dikkat Edilecek Durum', value: dash(props.info.specialCareNote) },
    { label: 'Antrenöre Not', value: dash(props.info.coachNote) },
    { label: 'Sorumluluk Beyanı', value: consent(props.info.waiverAcceptedAt) },
    { label: 'Veri Kullanım Onayı', value: consent(props.info.dataConsentAcceptedAt) },
    {
      label: 'Pazarlama İzni',
      value: props.info.marketingConsent
        ? `Evet (${formatDateTr(props.info.marketingConsentAt) || 'tarih yok'})`
        : 'Hayır',
    },
  ],
])
</script>

<style scoped>
.registration-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
</style>
```

- [ ] **Step 2: `StudentManagement.vue` — script**

1. Import'lar (`import { needsParentInfo } …` satırından sonra):

```ts
import StudentRegistrationSection from '@/components/admin/students/StudentRegistrationSection.vue'
import { PARENT_RELATION_OPTIONS, REFERRAL_SOURCE_OPTIONS, TRAINING_TYPE_OPTIONS } from '@/utils/registrationForm'
import {
  AGE_FILTER_OPTIONS,
  MARKETING_FILTER_OPTIONS,
  STUDENT_CSV_HEADERS,
  buildRegistrationUpdate,
  emptyRegistrationFilters,
  matchesRegistrationFilters,
  parentRelationLabel,
  readRegistrationInfo,
  registrationWipePatch,
  studentCsvRow,
  toRegistrationEditForm,
  validateRegistrationEdit,
  type RegistrationEditErrors,
  type RegistrationEditForm,
  type StudentRegistrationInfo,
} from '@/utils/studentRegistrationAdmin'
import { buildCsv, downloadCsv } from '@/utils/csv'
import { toYmd } from '@/utils/registrationForm'
import type { ParentRelation } from '@/types/user'
```

(İki `@/utils/registrationForm` import'u tek satırda birleştirilir.)

2. `interface Student {` → `interface Student extends StudentRegistrationInfo {`; içindeki
`parentFirstName?/parentLastName?/parentPhone?` üç satırı ve yorumu SİL; `email: string`
satırının altına `level: string` ekle.

3. `filters` reactive'inin altına:

```ts
// Kayıt formu filtreleri (eğitim türü, kaynak, yaş, pazarlama izni, sağlık, kayıt tarihi)
const registrationFilters = reactive(emptyRegistrationFilters())
const resetRegistrationFilters = () => Object.assign(registrationFilters, emptyRegistrationFilters())
```

4. `editForm` başlangıcına `parentEmail: ''`, `parentRelation: '' as ParentRelation | ''`
ekle (parentPhone'dan sonra). Altına:

```ts
// Detaydaki "Kayıt Formu" bölümünün düzenleme durumu
const editRegistration = ref<RegistrationEditForm>(toRegistrationEditForm(readRegistrationInfo({})))
const registrationEditErrors = ref<RegistrationEditErrors>({})
```

5. `filteredStudents` içinde `return filtered` öncesi:

```ts
  filtered = filtered.filter(student => matchesRegistrationFilters(student, registrationFilters))
```

6. `fetchStudents` eşlemesi: `const student: Student = {` satırından hemen sonra
`...readRegistrationInfo(data),` ekle; `email: actualEmail,` altına `level: data.level || '',`.

7. `toggleEditMode`: editForm'a `parentEmail: selectedStudent.value.parentEmail || '',` ve
`parentRelation: selectedStudent.value.parentRelation || '',`; `editForm.value = {…}` sonrası:

```ts
    editRegistration.value = toRegistrationEditForm(selectedStudent.value)
    registrationEditErrors.value = {}
```

8. `cancelEdit`: sıfırlamaya `parentEmail: '', parentRelation: ''` ve sonra:

```ts
  editRegistration.value = toRegistrationEditForm(readRegistrationInfo({}))
  registrationEditErrors.value = {}
```

9. `saveStudentChanges` başında (`if (!selectedStudent.value) return` sonrası):

```ts
  // Kayıt formu alanları (boy/kilo aralığı, metin uzunlukları)
  const registrationErrors = validateRegistrationEdit(editRegistration.value)
  registrationEditErrors.value = registrationErrors
  if (Object.keys(registrationErrors).length > 0) {
    successMessage.value = 'Kayıt formu alanlarında hata var; lütfen kontrol edin.'
    successSnackbar.value = true
    return
  }
```

`const userDocRef = doc(db, 'users', studentId)` satırından ÖNCE:

```ts
    // Veli bilgileri: üyelik türü gerektiriyorsa YA DA öğrenci 18 yaş altıysa saklanır,
    // aksi hâlde temizlenir (eskiden yalnız üyelik türüne bakılıyordu; reşit olmayan
    // öğrencinin kayıtta girilen veli bilgisi admin düzenlemesinde siliniyordu).
    const keepParent = needsParentInfo(effectiveMembershipType, editRegistration.value.isMinor)
    const parentPatch = {
      parentFirstName: keepParent ? (editForm.value.parentFirstName || '').trim() : '',
      parentLastName: keepParent ? (editForm.value.parentLastName || '').trim() : '',
      parentPhone: keepParent ? (editForm.value.parentPhone || '').trim() : '',
      parentEmail: keepParent ? (editForm.value.parentEmail || '').trim() : '',
      parentRelation: keepParent ? editForm.value.parentRelation : '',
    }
    const registrationPatch = buildRegistrationUpdate(editRegistration.value, oldStudent)
```

`updateDoc(userDocRef, {…})` içindeki üç `parent…: needsParentInfo(effectiveMembershipType) ? …`
satırını ve yorumunu `...parentPatch,` ve `...registrationPatch,` ile değiştir.
Local `updatedStudent` içindeki üç parent satırını
`...readRegistrationInfo({ ...oldStudent, ...parentPatch, ...registrationPatch }),` ile değiştir.

10. `performStudentDelete` içindeki `updateDoc(userDocRef, {…})` nesnesine
`status: 'deleted',` satırından sonra `...registrationWipePatch(),` ekle; üstteki
anonimleştirme yorumuna "veli ve kayıt formu alanları da boşaltılır" cümlesini ekle.

11. CSV (script sonuna yakın, `formatDate` yakınına):

```ts
// Filtrelenmiş öğrenci listesini CSV indir (sağlık notları ve boy/kilo hariç).
const exportFilteredStudentsCsv = () => {
  const rows = filteredStudents.value.map(student =>
    studentCsvRow(student, {
      membership: getMembershipDisplayName(student.membershipType),
      status: getStatusDisplayName(student.status),
    }),
  )
  downloadCsv(`ogrenciler_${toYmd(new Date())}.csv`, buildCsv(STUDENT_CSV_HEADERS, rows))
}
```

- [ ] **Step 3: `StudentManagement.vue` — şablon**

a) Filtre kartında mevcut `</v-row>`'dan (üç filtre) sonra, `</v-card-text>`'ten önce:

```vue
            <v-row dense class="mt-1">
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="registrationFilters.trainingType" label="Eğitim Türü"
                    :items="TRAINING_TYPE_OPTIONS" item-title="title" item-value="value"
                    variant="outlined" density="compact" clearable prepend-inner-icon="mdi-tennis" />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="registrationFilters.referralSource" label="Nereden Duydu"
                    :items="REFERRAL_SOURCE_OPTIONS" item-title="title" item-value="value"
                    variant="outlined" density="compact" clearable prepend-inner-icon="mdi-bullhorn" />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="registrationFilters.age" label="Yaş" :items="AGE_FILTER_OPTIONS"
                    item-title="title" item-value="value" variant="outlined" density="compact" clearable
                    prepend-inner-icon="mdi-account-child" />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="registrationFilters.marketing" label="Pazarlama İzni"
                    :items="MARKETING_FILTER_OPTIONS" item-title="title" item-value="value"
                    variant="outlined" density="compact" clearable prepend-inner-icon="mdi-email-check" />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="registrationFilters.joinedFrom" label="Kayıt tarihi (başlangıç)" type="date"
                    variant="outlined" density="compact" clearable />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="registrationFilters.joinedTo" label="Kayıt tarihi (bitiş)" type="date"
                    variant="outlined" density="compact" clearable />
              </v-col>
              <v-col cols="12" sm="6" md="3" class="d-flex align-center">
                <v-checkbox v-model="registrationFilters.healthOnly" label="Sağlık durumu bildirenler"
                    density="compact" hide-details />
              </v-col>
              <v-col cols="12" sm="6" md="3" class="d-flex align-center justify-end">
                <v-btn variant="text" prepend-icon="mdi-filter-remove" @click="resetRegistrationFilters">
                  Form Filtrelerini Temizle
                </v-btn>
              </v-col>
            </v-row>
```

(`clearable` metin alanı `null` yazar; `parseYmd(f.joinedFrom || '')` bunu karşılar.)

b) Tablo başlığında "Öğrenci Ekle" düğmesinden ÖNCE:

```vue
              <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-file-delimited-outline"
                  class="mr-2"
                  :disabled="filteredStudents.length === 0"
                  @click="exportFilteredStudentsCsv"
              >
                CSV İndir
              </v-btn>
```

c) Liste ⓘ: `needsParentInfo(item.membershipType)` → `needsParentInfo(item.membershipType, item.isMinor)`.

d) Kişisel Bilgiler okuma modu: iki `needsParentInfo(selectedStudent?.membershipType)` →
`needsParentInfo(selectedStudent?.membershipType, selectedStudent?.isMinor)`; "Veli Telefon"
satırının `class="info-item"`'ını `class="info-item mb-3"` yapıp ardına:

```vue
                        <div class="info-item mb-3">
                          <label class="info-label">Veli E-posta:</label>
                          <span class="info-value">{{ selectedStudent?.parentEmail || '—' }}</span>
                        </div>
                        <div class="info-item">
                          <label class="info-label">Yakınlık:</label>
                          <span class="info-value">{{ parentRelationLabel(selectedStudent?.parentRelation || '') || '—' }}</span>
                        </div>
```

e) Kişisel Bilgiler düzenleme modu: iki `needsParentInfo(editForm.membershipType)` →
`needsParentInfo(editForm.membershipType, editRegistration.isMinor)`; "Veli Telefon"
alanına `class="mb-3"` ver ve ardına:

```vue
                        <v-text-field
                            v-model="editForm.parentEmail"
                            label="Veli E-posta"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                        />
                        <v-select
                            v-model="editForm.parentRelation"
                            label="Yakınlık"
                            :items="PARENT_RELATION_OPTIONS"
                            item-title="title"
                            item-value="value"
                            variant="outlined"
                            density="compact"
                            clearable
                        />
```

f) Üyelik kartının `</v-col>`'undan sonra, "Şifre Sıfırlama" `v-col`'undan önce:

```vue
              <!-- Kayıt Formu (UTA dijital form) -->
              <v-col v-if="selectedStudent" cols="12">
                <StudentRegistrationSection
                    v-model:form="editRegistration"
                    :info="selectedStudent"
                    :edit-mode="isEditMode"
                    :errors="registrationEditErrors"
                />
              </v-col>
```

- [ ] **Step 4: `AdminDashboard.vue` — toplu silme**

Import: `import { registrationWipePatch } from '@/utils/studentRegistrationAdmin'`;
`deleteAllStudents` içindeki `updateDoc(doc(db, 'users', id), {…})` nesnesinde
`status: 'deleted',` sonrasına `...registrationWipePatch(),`.

- [ ] **Step 5: Derleme** — `npm run build` hatasız.

---

### Task 9: Doğrulama

- [ ] **Step 1:** Tüm birim testleri: `npx vitest run tests/unit --exclude tests/unit/firestore-rules.spec.ts`
  → yeni testler dahil yeşil (bilinen "3 eski ilgisiz hata" hariç; önceki sayımla karşılaştır).
- [ ] **Step 2:** Kural testleri (Task 3 Step 4 komutu) → yeşil.
- [ ] **Step 3:** `npm run build` → temiz.
- [ ] **Step 4: Emülatörde uçtan uca (tarayıcı)** — `academy-emulators` + `academy-web`
  (parent `.claude/launch.json`); admin + boss tohumu (`.claude/academy-registration-seed.cjs`,
  yalnız emülatör). Senaryo:
  1. `/register`: 1. adımda boş "İleri" → hatalar görünür; 4 adımı reşit olmayan öğrenciyle
     doldur (veli, çoklu eğitim + Diğer, sağlık Evet + açıklama, arkadaş + referans ismi,
     iki onay, pazarlama izni) → "Kayıt Ol" → öğrenci paneli "Hesap Onayı Bekleniyor".
  2. Admin girişi → Bildirimler: "Ad Soyad (0555 … ) kayıt olmak istiyor." + Kayıt Onayla.
  3. Öğrenciler: Eğitim Türü/Yaş/Pazarlama filtreleri öğrenciyi bulur; CSV İndir çalışır;
     detayda Kayıt Formu bölümü; Düzenle → Kaydet sonrası veli bilgisi KORUNUR.
  4. Boss girişi → Bildirimler'de aynı kayıt görünür → Kayıt Onayla.
  5. Öğrenci oturumu → kilit anında kalkar (canlı dinleyici).
  6. Konsolda hata yok; ekran görüntüleri (sihirbaz, bildirim, detay).
- [ ] **Step 5:** `tasks/todo.md` İnceleme bölümü + gerekiyorsa `tasks/lessons.md`.
- [ ] **Step 6:** Kullanıcıya özet + commit sorusu (commit yalnız onayla).
