import { computed, ref } from 'vue'
import { FirestoreService } from '@/services/firestore'
import { DateHelpers } from '@/services/helpers'

// Ders saatleri için TEK config kaynağı.
//
// Firestore'da `settings/schedule` dokümanı `{ firstHour, lastHour }` tutar.
// firstHour = ilk dersin başlangıç saati (varsayılan 7 → 07:00).
// lastHour  = son slot bitişi (EXCLUSIVE). Yani lastHour=23 iken son ders
//             22:00'de başlar, 23:00'te biter. Slot üretiminde döngü
//             `hour < lastHour` olduğu için lastHour listede YER ALMAZ.
//
// Kort doluluğunu/takvimi/slot üretimini etkileyen her yer bu composable'dan
// okur; admin değeri değiştirdiğinde onSnapshot ile her görünüm canlı güncellenir.

const SETTINGS_COLLECTION = 'settings'
const SCHEDULE_DOC_ID = 'schedule'

// Varsayılan: ilk ders 07:00, son slot bitişi 23:00 (son ders 22:00 başlar).
export const DEFAULT_FIRST_HOUR = 7
export const DEFAULT_LAST_HOUR = 23

interface ScheduleSettingsDoc {
  firstHour?: number
  lastHour?: number
}

// Modül seviyesinde tekil (singleton) state: onSnapshot bir kez kurulur ve
// tüm tüketiciler aynı reactive ref'leri paylaşır. Böylece admin değeri
// değiştirdiğinde takvim/kort/form aynı anda güncellenir.
const firstHour = ref<number>(DEFAULT_FIRST_HOUR)
const lastHour = ref<number>(DEFAULT_LAST_HOUR)
let subscribed = false
let unsubscribe: (() => void) | null = null

// 0..24 aralığında geçerli bir tamsayı saat mi?
const isValidHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 24

// Gelen doc değerlerini normalize et: geçersizse / firstHour >= lastHour ise
// varsayılana dön. Geçerli {first, last} döner.
const normalize = (doc: ScheduleSettingsDoc | null): { first: number; last: number } => {
  const first = isValidHour(doc?.firstHour) ? Math.floor(doc!.firstHour!) : DEFAULT_FIRST_HOUR
  const last = isValidHour(doc?.lastHour) ? Math.floor(doc!.lastHour!) : DEFAULT_LAST_HOUR
  if (first >= last) {
    return { first: DEFAULT_FIRST_HOUR, last: DEFAULT_LAST_HOUR }
  }
  return { first, last }
}

// Firestore'a canlı dinleyici kur (yalnızca bir kez).
const ensureSubscribed = (): void => {
  if (subscribed) return
  subscribed = true
  unsubscribe = FirestoreService.subscribeToDocument<ScheduleSettingsDoc>(
    SETTINGS_COLLECTION,
    SCHEDULE_DOC_ID,
    (data) => {
      const { first, last } = normalize(data)
      firstHour.value = first
      lastHour.value = last
    },
  )
}

export function useScheduleSettings() {
  ensureSubscribed()

  // Gösterilecek saat dilimleri (ör. '07:00' ... '22:00'). firstHour dahil,
  // lastHour HARİÇ (getTimeSlots döngüsü `hour < endHour`).
  const timeSlots = computed<string[]>(() =>
    DateHelpers.getTimeSlots(firstHour.value, lastHour.value, 60),
  )

  // Saat dilimi sayısı = doluluk paydası (ör. 7..23 → 16 slot).
  const hourCount = computed<number>(() => lastHour.value - firstHour.value)

  // Takvim ızgaralarının satır başlıkları için sayısal saatler
  // (ör. [7, 8, ..., 22]). firstHour dahil, lastHour hariç.
  const hours = computed<number[]>(() =>
    Array.from({ length: hourCount.value }, (_, i) => firstHour.value + i),
  )

  // Admin: ders saatlerini kaydet (setDoc merge). Değerler normalize edilir.
  const updateSchedule = async (newFirstHour: number, newLastHour: number): Promise<void> => {
    const { first, last } = normalize({ firstHour: newFirstHour, lastHour: newLastHour })
    await FirestoreService.setDocument<ScheduleSettingsDoc>(
      SETTINGS_COLLECTION,
      SCHEDULE_DOC_ID,
      { firstHour: first, lastHour: last },
      true,
    )
  }

  return {
    firstHour,
    lastHour,
    timeSlots,
    hourCount,
    hours,
    updateSchedule,
    // Test/teardown için (normalde gerek yok — singleton). Aboneliği kapatır
    // VE değerleri varsayılana sıfırlar (testlerin izole başlaması için).
    _unsubscribe: () => {
      if (unsubscribe) unsubscribe()
      unsubscribe = null
      subscribed = false
      firstHour.value = DEFAULT_FIRST_HOUR
      lastHour.value = DEFAULT_LAST_HOUR
    },
  }
}
