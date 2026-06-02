// src/store/modules/groups.ts
//
// Paylaşılan groups önbelleği. Eskiden Courts.vue, Reservations.vue ve
// AdminCalendar.vue her tarih değişiminde / her takvim tıklamasında,
// rezervasyonlardaki her benzersiz grup id'si için ayrı ayrı
// `getDoc(groups/id)` yapıyordu (N+1). `groups` koleksiyonu küçük ve
// admin-yönetimli olduğundan, tek bir tam-koleksiyon canlı aboneliği bu
// dağınık okumaların TAMAMININ yerini alır.
//
// GÜVENLİK: isOrphanGroupReservation, bir grup id'sinin `existingGroupIds`
// içinde olup olmamasına göre slotu boşaltır. Önbellek YÜKLENMEDEN ya da
// yükleme BAŞARISIZ olduğunda (`initialized=false` veya `loadFailed=true`)
// çağıranlar bu store'a GÜVENMEMELİ; eski per-id getDoc mantığına düşmeli.
// Boş bir önbellek "tüm gruplar silinmiş" anlamına GELMEZ.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Group } from '@/types/group'
import { buildExistingGroupIds, getGroupName, findGroup } from '@/utils/groupCache'

// Saf yardımcılar src/utils/groupCache.ts içinde (firebase'siz, unit-test edilebilir).

// ---- Pinia store (membershipTypes.ts modeli) ----

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  // Tam-koleksiyon yüklemesi/aboneliği başarısız olduğunda true. Çağıranlar bunu
  // görünce per-id getDoc fallback'ine düşer (orphan semantiğini bozmamak için).
  const loadFailed = ref(false)
  // İlk snapshot callback'i geldi mi? initialize() aboneliği başlatır ama ilk
  // veri asenkron gelir; o gelene kadar `groups` boştur ve önbelleğe GÜVENİLMEZ
  // (aksi halde tüm gruplar yanlışlıkla "orphan" sayılır).
  const loaded = ref(false)

  let unsubscribe: Unsubscribe | null = null

  const existingGroupIds = computed(() => buildExistingGroupIds(groups.value))

  /**
   * Store'u başlatır: tek bir canlı abonelikle tüm grupları yükler. Zaten
   * başlatılmışsa erken çıkar (idempotent — birden çok bileşen çağırabilir).
   */
  function initialize(): void {
    if (initialized.value) return
    initialized.value = true
    loading.value = true
    startRealtimeSubscription()
  }

  function startRealtimeSubscription(): void {
    if (unsubscribe) unsubscribe()

    unsubscribe = onSnapshot(
      collection(db, 'groups'),
      (snapshot) => {
        groups.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Group))
        loadFailed.value = false
        loaded.value = true
        loading.value = false
      },
      (e) => {
        // Yükleme başarısız: önbelleği yetkili sayma. Çağıranlar fallback yapar.
        error.value = (e as Error).message
        loadFailed.value = true
        loading.value = false
        console.error('❌ Gruplar yüklenemedi (groups store):', e)
      }
    )
  }

  function stopRealtimeSubscription(): void {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  /** Önbelleğe güvenilebilir mi? (ilk veri geldi ve hata yok) */
  function isReady(): boolean {
    return initialized.value && loaded.value && !loadFailed.value
  }

  function getName(id: string): string {
    return getGroupName(groups.value, id)
  }

  function getGroup(id: string): Group | undefined {
    return findGroup(groups.value, id)
  }

  return {
    // State
    groups,
    loading,
    error,
    initialized,
    loadFailed,
    loaded,
    // Getters
    existingGroupIds,
    // Actions
    initialize,
    startRealtimeSubscription,
    stopRealtimeSubscription,
    // Helpers
    isReady,
    getName,
    getGroup,
  }
})
