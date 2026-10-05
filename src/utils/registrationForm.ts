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

// Başlıklar sihirbaz başlığında dar kartta yan yana sığsın diye kısa; adımın içinde
// dokümandaki bölüm adları (Öğrenci Bilgileri, Başvuru Tercihleri…) ayrıca yazılır.
export const REGISTRATION_STEPS: ReadonlyArray<{ step: RegistrationStep; title: string }> = [
  { step: 1, title: 'Hesap' },
  { step: 2, title: 'Kişisel' },
  { step: 3, title: 'Başvuru' },
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
