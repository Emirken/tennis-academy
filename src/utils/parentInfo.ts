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
