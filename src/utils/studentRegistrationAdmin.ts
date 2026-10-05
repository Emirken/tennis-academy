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
