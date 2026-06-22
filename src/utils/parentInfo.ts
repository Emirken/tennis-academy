// Veli bilgisi gerektiren üyelik türleri. Bu türlerdeki öğrenciler çocuk/yaş
// grubu olduğu için veli ad/soyad/telefon alanları düzenleme formunda gösterilir
// ve öğrenci listesinde ⓘ ikonuyla erişilir.
export const PARENT_REQUIRED_MEMBERSHIPS = [
  'tennis_school_age',
  'premium',
  'vip',
  'court_rental_equipment',
] as const

/** Verilen üyelik türü veli bilgisi gerektiriyor mu? */
export function needsParentInfo(membershipType?: string | null): boolean {
  return PARENT_REQUIRED_MEMBERSHIPS.includes(
    (membershipType || '') as (typeof PARENT_REQUIRED_MEMBERSHIPS)[number],
  )
}
