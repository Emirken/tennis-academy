// Paylaşılan groups önbelleğinin SAF yardımcıları (Firestore/Pinia bağımlılığı
// YOK). Hem `src/store/modules/groups.ts` hem de unit testler bunları kullanır;
// böylece test, firebase init'i (ve messaging yan etkilerini) tetiklemeden
// çalışır.

import type { Group } from '@/types/group'

/** Verilen grup listesinden var olan id kümesini üretir. */
export function buildExistingGroupIds(groups: Group[]): Set<string> {
  const set = new Set<string>()
  for (const g of groups) {
    if (g.id) set.add(g.id)
  }
  return set
}

/**
 * Grup adını döndürür. ÖNEMLİ: fallback UYGULAMAZ — ham `name` (veya bulunamazsa
 * boş string) döner. Her çağıran kendi fallback'ını uygular: Courts `|| ''`,
 * AdminCalendar `|| id`. Böylece mevcut etiketler birebir korunur.
 */
export function getGroupName(groups: Group[], id: string): string {
  const g = groups.find((x) => x.id === id)
  return g?.name || ''
}

/** Tam grup dokümanını döndürür (showEventDetails'in `members` ihtiyacı için). */
export function findGroup(groups: Group[], id: string): Group | undefined {
  return groups.find((x) => x.id === id)
}
