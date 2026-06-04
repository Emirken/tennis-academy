// Bir grup öğrencisi pasife (status='inactive') alınınca gruptan otomatik çıkarma
// kararını üreten saf (yan etkisiz) mantık. saveStudentChanges bu kararı kullanarak
// mevcut gruptan-çıkarma dallarını (yoklama arşivi, kendi gelecek rezervasyonlarını
// silme, members[] çıkarma) doğal olarak tetikler.

export interface GroupExitInput {
  oldMembershipType?: string | null
  oldGroupAssignment?: string | null
  formMembershipType?: string | null
  formGroupAssignment?: string | null
  newStatus?: string | null
}

export interface GroupExitDecision {
  /** Gruba dahil bir öğrenci pasife alınıyor mu? */
  goingPassiveFromGroup: boolean
  /** Firestore'a yazılacak üyelik türü (pasife alınınca 'basic'). */
  effectiveMembershipType: string
  /** Firestore'a yazılacak grup ataması (gruptan çıkınca null). */
  effectiveGroupAssignment: string | null
  /** Öğrenci gruptan çıkarılıyor mu? (members[] + rezervasyon temizliği bunu izler) */
  groupBeingRemoved: boolean
}

/**
 * Bir grup öğrencisi pasife alınınca gruptan çıkarma kararını üretir.
 *
 * Pasife alma kuralı: yeni durum 'inactive' VE öğrenci eskiden bir grup türünde
 * VE bir gruba atanmışsa → üyelik 'basic'e çekilir, grup ataması temizlenir.
 * Bu durumda yeni grup seçimi yapılmış olsa bile pasif kazanır (grup atanmaz).
 */
export function resolveGroupExitOnSave(
  input: GroupExitInput,
  isGroupMembership: (t?: string | null) => boolean
): GroupExitDecision {
  const goingInactive = input.newStatus === 'inactive'
  const goingPassiveFromGroup =
    goingInactive &&
    isGroupMembership(input.oldMembershipType) &&
    !!input.oldGroupAssignment

  const effectiveMembershipType = goingPassiveFromGroup
    ? 'basic'
    : (input.formMembershipType || 'basic')

  const isGroup = isGroupMembership(effectiveMembershipType)
  const effectiveGroupAssignment = isGroup
    ? (input.formGroupAssignment || null)
    : null

  const groupBeingRemoved =
    !!input.oldGroupAssignment && !effectiveGroupAssignment

  return {
    goingPassiveFromGroup,
    effectiveMembershipType,
    effectiveGroupAssignment,
    groupBeingRemoved,
  }
}
