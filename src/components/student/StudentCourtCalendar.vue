<template>
  <div class="student-court-calendar">
    <!-- Header: başlık + görünüm geçişi -->
    <div class="calendar-header mb-4">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="calendar-title">Kort Durumu Takvimi</h2>
          <p class="calendar-subtitle">Kortların dolu/boş durumunu görüntüleyin</p>
        </v-col>
        <v-col cols="12" md="6" class="text-md-right">
          <v-btn-toggle
              v-model="currentView"
              mandatory
              color="primary"
              variant="outlined"
              class="view-toggle"
          >
            <v-btn value="day" size="small">
              <v-icon left>mdi-calendar-today</v-icon>
              Günlük
            </v-btn>
            <v-btn value="week" size="small">
              <v-icon left>mdi-calendar-week</v-icon>
              Haftalık
            </v-btn>
            <v-btn value="month" size="small">
              <v-icon left>mdi-calendar-month</v-icon>
              Aylık
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
    </div>

    <!-- Tarih navigasyonu -->
    <v-card class="modern-card mb-4" elevation="0">
      <v-card-text>
        <v-row align="center">
          <v-col cols="auto">
            <v-btn icon="mdi-chevron-left" variant="text" @click="navigateDate(-1)" />
          </v-col>
          <v-col class="text-center">
            <h3 class="date-display">{{ formattedDate }}</h3>
          </v-col>
          <v-col cols="auto">
            <v-btn icon="mdi-chevron-right" variant="text" @click="navigateDate(1)" />
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" variant="outlined" @click="goToToday">Bugün</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Takvim içeriği -->
    <v-card class="modern-card calendar-content" elevation="0">
      <v-card-text>
        <!-- Yükleniyor -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4 text-grey">Kort durumu yükleniyor...</p>
        </div>

        <!-- Günlük görünüm: saat × kort tablosu (Courts.vue gibi) -->
        <div v-else-if="currentView === 'day'" class="day-view">
          <div class="schedule-table-container">
            <v-table class="schedule-table">
              <thead>
              <tr class="table-header">
                <th class="time-column-head">Saat</th>
                <th v-for="court in courts" :key="court.id" class="court-column-head">
                  {{ court.name }}
                </th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="time in timeSlots" :key="time" class="time-slot-row">
                <td class="time-cell">
                  <div class="time-display">{{ time }}</div>
                </td>
                <td v-for="court in courts" :key="court.id" class="court-cell">
                  <div
                      class="slot-status"
                      :class="cellClass(cellKind(court.id, time))"
                      :style="cellStyle(cellKind(court.id, time))"
                  >
                    <v-icon
                        :icon="cellIcon(cellKind(court.id, time))"
                        :color="cellIconColor(cellKind(court.id, time))"
                        size="20"
                        class="mb-1"
                    />
                    <div class="slot-text">
                      <div class="status-line">{{ cellLabel(cellKind(court.id, time)) }}</div>
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </v-table>
          </div>
          <div class="type-legend mt-3">
            <span class="type-legend-item">
              <span class="type-legend-dot" style="background:#E65100"></span> Grup Dersi
            </span>
            <span class="type-legend-item">
              <span class="type-legend-dot" style="background:#388E3C"></span> Özel Ders
            </span>
            <span class="type-legend-item">
              <span class="type-legend-dot" style="background:#7B1FA2"></span> Rezervasyon
            </span>
            <span class="type-legend-item">
              <span class="type-legend-dot type-legend-dot-free"></span> Müsait
            </span>
          </div>
        </div>

        <!-- Haftalık görünüm: AdminCalendar grid iskeleti, dolu/boş hücreler -->
        <div v-else-if="currentView === 'week'" class="week-view">
          <div class="week-grid">
            <div class="week-header">
              <div class="time-column">Saat</div>
              <div
                  v-for="day in weekDays"
                  :key="day.date.toISOString()"
                  class="day-column"
                  :class="{ 'today': isToday(day.date) }"
              >
                <div class="day-name">{{ day.name }}</div>
                <div class="day-date">{{ formatDayDate(day.date) }}</div>
              </div>
            </div>
            <div class="week-body">
              <div v-for="hour in hours" :key="hour" class="hour-row">
                <div class="time-column">{{ formatHour(hour) }}</div>
                <div
                    v-for="day in weekDays"
                    :key="day.date.toISOString()"
                    class="day-cell"
                >
                  <div class="day-cell-courts">
                    <div
                        v-for="court in courts"
                        :key="court.id"
                        class="week-court-pill"
                        :class="weekCellBusy(day.date, hour, court.id) ? 'busy' : 'free'"
                    >
                      {{ court.id }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="week-legend mt-3">
            <span class="legend-chip busy"></span> Dolu
            <span class="legend-chip free ml-4"></span> Boş
          </div>
        </div>

        <!-- Aylık görünüm: gün başına dolu slot özeti -->
        <div v-else class="month-view">
          <div class="month-grid">
            <div class="month-header">
              <div v-for="dayName in monthDayNames" :key="dayName" class="month-day-header">
                {{ dayName }}
              </div>
            </div>
            <div class="month-body">
              <div
                  v-for="(week, weekIndex) in monthWeeks"
                  :key="weekIndex"
                  class="month-week"
              >
                <div
                    v-for="(day, dayIndex) in week"
                    :key="dayIndex"
                    class="month-day"
                    :class="{ 'other-month': !day.currentMonth, 'today': day.isToday }"
                    @click="selectDate(day.date)"
                >
                  <div class="month-day-number">{{ day.day }}</div>
                  <div class="month-day-summary">
                    <v-chip
                        v-if="monthBusyCount(day.date) > 0"
                        size="x-small"
                        color="error"
                        variant="flat"
                    >
                      {{ monthBusyCount(day.date) }} dolu
                    </v-chip>
                    <v-chip
                        v-else-if="day.currentMonth"
                        size="x-small"
                        color="success"
                        variant="tonal"
                    >
                      Boş
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import {
  getReservationGroupId,
  type RawReservationDoc
} from '@/utils/dailyReservationLimit'
import { buildCourtSchedule } from '@/utils/courtScheduleBuild'
import {
  buildBusyFreeGrid,
  buildCellKindGrid,
  type BusyFree,
  type CellKind,
  countBusyCells,
} from '@/utils/studentBusyFree'
import { RESERVATION_TYPE_COLORS } from '@/utils/reservationTypeColor'
import { useGroupsStore } from '@/store/modules/groups'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'
import { useScheduleSettings } from '@/composables/useScheduleSettings'

const groupsStore = useGroupsStore()
const membershipTypesStore = useMembershipTypesStore()

// State
const currentView = ref<'day' | 'week' | 'month'>('week')
const selectedDate = ref(new Date())
const loading = ref(false)

const courts = [
  { id: 'K1', name: 'Kort 1' },
  { id: 'K2', name: 'Kort 2' },
  { id: 'K3', name: 'Kort 3' }
]
const courtIds = courts.map(c => c.id)

// Saatler ve saat dilimleri ders saatleri config'inden (settings/schedule).
// firstHour dahil, lastHour HARİÇ. Admin değiştirince takvim canlı güncellenir.
const { hours, timeSlots } = useScheduleSettings()
const monthDayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// Tarih (YYYY-MM-DD) -> dolu/boş ızgarası. Görünür aralığın her günü için dolu.
const gridByDate = ref<Record<string, Record<string, Record<string, BusyFree>>>>({})

// Tarih (YYYY-MM-DD) -> tür ızgarası (grup/özel/rezervasyon/boş). Günlük görünüm
// hücrelerini TÜRE göre renklendirmek için (busy/free ızgarasına paralel).
const kindByDate = ref<Record<string, Record<string, Record<string, CellKind>>>>({})

// Okuma optimizasyonu: ileri/geri gezinirken aynı aralığı yeniden okumamak için
// kısa ömürlü bellek-içi önbellek (AdminCalendar paterni). refresh() bypass eder.
const CACHE_TTL_MS = 15_000
const cache = new Map<string, {
  grids: Record<string, Record<string, Record<string, BusyFree>>>
  kinds: Record<string, Record<string, Record<string, CellKind>>>
  ts: number
}>()

// ---- Tarih yardımcıları (AdminCalendar ile aynı) ----
const dateKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const formatHour = (hour: number): string => `${hour.toString().padStart(2, '0')}:00`
const formatDayDate = (date: Date): string =>
  date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

const formattedDate = computed(() => {
  if (currentView.value === 'day') {
    return selectedDate.value.toLocaleDateString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  } else if (currentView.value === 'week') {
    const weekStart = getWeekStart(selectedDate.value)
    const weekEnd = getWeekEnd(selectedDate.value)
    return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }
  return selectedDate.value.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
})

const weekDays = computed(() => {
  const weekStart = getWeekStart(selectedDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push({ date, name: date.toLocaleDateString('tr-TR', { weekday: 'short' }) })
  }
  return days
})

const monthWeeks = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  const day = startDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startDate.setDate(startDate.getDate() + diff)

  const weeks = []
  const currentDate = new Date(startDate)

  while (currentDate <= lastDay || currentDate.getMonth() === month) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const today = new Date()
      week.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        currentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString()
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
    if (weeks.length >= 6) break
  }
  return weeks
})

// ---- Navigasyon ----
const navigateDate = (direction: number) => {
  const newDate = new Date(selectedDate.value)
  if (currentView.value === 'day') {
    newDate.setDate(newDate.getDate() + direction)
  } else if (currentView.value === 'week') {
    newDate.setDate(newDate.getDate() + direction * 7)
  } else {
    newDate.setMonth(newDate.getMonth() + direction)
  }
  selectedDate.value = newDate
}

const goToToday = () => { selectedDate.value = new Date() }

const selectDate = (date: Date) => {
  selectedDate.value = new Date(date)
  currentView.value = 'day'
}

const mapCourtId = (reservationCourtId: string): string => {
  const mapping: Record<string, string> = {
    'court-1': 'K1', 'court-2': 'K2', 'court-3': 'K3',
    'court_1': 'K1', 'court_2': 'K2', 'court_3': 'K3'
  }
  return mapping[reservationCourtId] || reservationCourtId
}

// Görünür aralığa ait grup id'lerinden hâlâ var olanların kümesini döndürür
// (silinmiş gruplara ait hayalet rezervasyonları doluluk hesabından çıkarmak için).
const getExistingGroupIds = async (docs: RawReservationDoc[]): Promise<Set<string>> => {
  const groupIds = new Set<string>()
  docs.forEach((d) => {
    const gid = getReservationGroupId(d)
    if (gid) groupIds.add(gid)
  })

  const existing = new Set<string>()
  if (groupsStore.isReady()) {
    groupIds.forEach((gid) => {
      if (groupsStore.existingGroupIds.has(gid)) existing.add(gid)
    })
    return existing
  }

  await Promise.all(
    [...groupIds].map(async (gid) => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', gid))
        if (groupDoc.exists()) existing.add(gid)
      } catch {
        existing.add(gid)
      }
    })
  )
  return existing
}

// Görünür aralığı (gün/hafta/ay) hesaplar.
const getVisibleRange = (): { start: Date; end: Date } => {
  if (currentView.value === 'day') {
    const start = new Date(selectedDate.value); start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate.value); end.setHours(23, 59, 59, 999)
    return { start, end }
  } else if (currentView.value === 'week') {
    const start = getWeekStart(selectedDate.value)
    const end = getWeekEnd(selectedDate.value); end.setHours(23, 59, 59, 999)
    return { start, end }
  } else {
    // Ay görünümü: gösterilen ızgara önceki/sonraki aydan günler içerebilir;
    // monthWeeks aralığını kapsayacak şekilde sorgula.
    const weeks = monthWeeks.value
    const first = weeks[0][0].date
    const last = weeks[weeks.length - 1][6].date
    const start = new Date(first); start.setHours(0, 0, 0, 0)
    const end = new Date(last); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
}

// Canlı `reservations`'tan görünür aralığın dolu/boş ızgaralarını kurar
// (tek motor: buildCourtSchedule → buildBusyFreeGrid). Detay okunmaz/saklanmaz.
const fetchSchedule = async (force = false) => {
  const { start, end } = getVisibleRange()
  const cacheKey = `${currentView.value}|${start.toISOString()}|${end.toISOString()}`

  if (!force) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      gridByDate.value = cached.grids
      kindByDate.value = cached.kinds
      return
    }
  } else {
    cache.clear()
  }

  loading.value = true
  try {
    // Aralık için tek sorgu (Courts/AdminCalendar paterni).
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', start),
      where('date', '<=', end)
    )
    const snapshot = await getDocs(reservationsQuery)
    const allDocs = snapshot.docs.map((d) => d.data() as RawReservationDoc)

    const existingGroupIds = await getExistingGroupIds(allDocs)

    // Rezervasyonları yerel güne göre grupla.
    const byDate: Record<string, RawReservationDoc[]> = {}
    for (const r of allDocs) {
      const raw = (r as any).date
      let d: Date
      if (typeof raw === 'string') d = new Date(raw)
      else if (raw?.toDate) d = raw.toDate()
      else d = new Date(raw)
      const key = dateKey(d)
      ;(byDate[key] ||= []).push(r)
    }

    // Aralıktaki her gün için: YALNIZCA canlı rezervasyon → dolu/boş ızgarası.
    // adminParity=true → AdminCalendar ile birebir: courtSchedule snapshot'ı
    // (bakım/kapalı, grup yedeği) hiç okunmaz, iptal olmayan her rezervasyon
    // dolu sayılır. Böylece öğrenci takvimi admin takvimiyle aynı doluluğu verir.
    const grids: Record<string, Record<string, Record<string, BusyFree>>> = {}
    const kinds: Record<string, Record<string, Record<string, CellKind>>> = {}
    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    const endDay = new Date(end); endDay.setHours(0, 0, 0, 0)

    while (cursor <= endDay) {
      const key = dateKey(cursor)
      const dayReservations = byDate[key] || []

      const built = buildCourtSchedule({
        courtIds,
        timeSlots: timeSlots.value,
        storedSchedule: {},
        reservations: dayReservations,
        existingGroupIds,
        mapCourtId,
        adminParity: true,
        // Tarihi geçmiş kort rezervasyonları (dersler hariç) boş görünsün.
        now: new Date(),
      })

      grids[key] = buildBusyFreeGrid(built, courtIds, timeSlots.value)
      kinds[key] = buildCellKindGrid(built, courtIds, timeSlots.value, membershipTypesStore.isGroupType)
      cursor.setDate(cursor.getDate() + 1)
    }

    gridByDate.value = grids
    kindByDate.value = kinds

    cache.set(cacheKey, { grids, kinds, ts: Date.now() })
    if (cache.size > 6) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
  } catch (error) {
    console.error('Öğrenci takvimi yükleme hatası:', error)
    gridByDate.value = {}
    kindByDate.value = {}
  } finally {
    loading.value = false
  }
}

// ---- Hücre yardımcıları (dolu/boş + tür; isim/grup YOK) ----
// Günlük görünüm için tür ızgarası (renklendirme): courtId -> time -> CellKind.
const dayKindGrid = computed(() => kindByDate.value[dateKey(selectedDate.value)] || {})

const weekCellBusy = (date: Date, hour: number, courtId: string): boolean => {
  const grid = gridByDate.value[dateKey(date)]
  const time = formatHour(hour)
  return grid?.[courtId]?.[time] === 'busy'
}

const monthBusyCount = (date: Date): number => {
  const grid = gridByDate.value[dateKey(date)]
  if (!grid) return 0
  return countBusyCells(grid)
}

// Günlük görünüm hücreleri artık TÜRE göre renklenir:
//   grup dersi → turuncu, özel ders → yeşil, rezervasyon → mor, boş → yeşil/müsait.
const KIND_LABELS: Record<CellKind, string> = {
  free: 'Müsait',
  'group-lesson': 'Grup Dersi',
  'private-lesson': 'Özel Ders',
  reservation: 'Rezervasyon',
}
const KIND_ICONS: Record<CellKind, string> = {
  free: 'mdi-check-circle',
  'group-lesson': 'mdi-account-group',
  'private-lesson': 'mdi-account',
  reservation: 'mdi-tennis',
}

const cellKind = (court: string, time: string): CellKind =>
  dayKindGrid.value[court]?.[time] || 'free'

const cellClass = (kind: CellKind) =>
  kind === 'free' ? 'status-available' : 'status-occupied'
const cellIcon = (kind: CellKind) => KIND_ICONS[kind]
// Boş hücre Vuetify yeşili; dolu hücreler türe özgü hex rengiyle.
const cellIconColor = (kind: CellKind) =>
  kind === 'free' ? 'success' : RESERVATION_TYPE_COLORS[kind]
const cellLabel = (kind: CellKind) => KIND_LABELS[kind]
// Dolu hücre arka planı: tür renginin hafif tonu (boşta CSS varsayılanı kalır).
const cellStyle = (kind: CellKind) => {
  if (kind === 'free') return {}
  const color = RESERVATION_TYPE_COLORS[kind]
  return {
    background: `${color}1A`, // ~%10 opaklık (hex alpha)
    border: `2px solid ${color}59`, // ~%35 opaklık
    color,
  }
}

// Görünüm/tarih değişince yeniden yükle.
watch([currentView, selectedDate], () => { fetchSchedule() })

onMounted(async () => {
  groupsStore.initialize()
  // Üyelik türleri yüklenmeden isGroupType herkesi "özel" sanar (boş dizi);
  // bu yüzden grup/özel rengini doğru basmak için fetch'ten ÖNCE bekleriz.
  await membershipTypesStore.initialize()
  fetchSchedule()
})

// Ebeveyn (dashboard) rezervasyon sonrası çağırır → önbelleği bypass edip yenile.
const refresh = () => fetchSchedule(true)
defineExpose({ refresh })
</script>

<style scoped>
.calendar-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}
.calendar-subtitle {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 4px 0 0 0;
}
.date-display {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

/* Günlük tablo */
.schedule-table-container {
  overflow-x: auto;
}
.schedule-table .time-column-head,
.schedule-table .court-column-head {
  font-weight: 700;
  text-align: center;
}
.time-cell {
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
}
.court-cell {
  padding: 6px !important;
}
.slot-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 8px 4px;
  min-height: 56px;
  text-align: center;
}
.slot-text .status-line {
  font-size: 0.8rem;
  font-weight: 600;
}

/* Boş hücre (müsait): nötr yeşil tonu. Dolu hücrelerin arka planı artık türe
   göre inline style ile gelir (grup=turuncu, özel=yeşil, rezervasyon=mor). */
.status-available {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.3);
  color: #2e7d32;
}
/* Dolu hücrelerin renkleri inline cellStyle'dan gelir; bu yalnızca yedek. */
.status-occupied {
  background: rgba(123, 31, 162, 0.1);
  border: 2px solid rgba(123, 31, 162, 0.3);
  color: #6a1b9a;
}

/* Tür açıklaması (legend) */
.type-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: #555;
}
.type-legend-item {
  display: inline-flex;
  align-items: center;
}
.type-legend-dot {
  display: inline-block;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  margin-right: 6px;
}
.type-legend-dot-free {
  background: rgba(76, 175, 80, 0.15);
  border: 2px solid rgba(76, 175, 80, 0.4);
}

/* Haftalık grid (AdminCalendar iskeleti) */
.week-grid {
  overflow-x: auto;
}
.week-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 1px;
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
}
.time-column {
  background: white;
  padding: 12px 8px;
  font-weight: 600;
  text-align: center;
  font-size: 13px;
}
.day-column {
  background: white;
  padding: 12px;
  text-align: center;
  min-width: 100px;
}
.day-column.today {
  background: #e8f5e9;
}
.day-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}
.day-date {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}
.week-body {
  display: grid;
  gap: 1px;
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
  border-top: none;
}
.hour-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 1px;
}
.day-cell {
  background: white;
  padding: 4px;
  min-width: 100px;
}
.day-cell-courts {
  display: flex;
  flex-direction: row;
  gap: 3px;
  justify-content: center;
}
.week-court-pill {
  flex: 1;
  min-width: 0;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  border-radius: 4px;
  padding: 4px 0;
}
.week-court-pill.busy {
  background: rgba(244, 67, 54, 0.85);
  color: #fff;
}
.week-court-pill.free {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}
.week-legend {
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
}
.legend-chip {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.legend-chip.busy { background: rgba(244, 67, 54, 0.85); }
.legend-chip.free { background: rgba(76, 175, 80, 0.45); }

/* Aylık grid */
.month-grid {
  border: 1px solid #e0e0e0;
}
.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
}
.month-day-header {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  border-right: 1px solid #e0e0e0;
}
.month-body {
  display: flex;
  flex-direction: column;
}
.month-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.month-day {
  min-height: 84px;
  padding: 6px;
  border-right: 1px solid #e0e0e0;
  border-top: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background 0.15s ease;
}
.month-day:hover {
  background: #f9f9f9;
}
.month-day.other-month {
  background: #fafafa;
  color: #bbb;
}
.month-day.today {
  background: #e8f5e9;
}
.month-day-number {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
}
.month-day-summary {
  display: flex;
  justify-content: center;
}

/* --- Mobil: takvim ızgaraları (AdminCalendar ile parite) --- */
@media (max-width: 960px) {
  .week-header,
  .hour-row {
    grid-template-columns: 60px repeat(7, 100px);
  }
}

@media (max-width: 600px) {
  /* Hafta görünümü: SADECE dış sarmalayıcı kaydırılsın (header+body birlikte) */
  .week-grid {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  /* Izgara container'larını içeriğe kadar genişlet; aksi halde gri arka plandan
     gelen ayırıcı çizgiler taşan günlerde (Perşembe ötesi) kaybolur. */
  .week-header,
  .week-body {
    width: max-content;
    min-width: 100%;
  }
  .week-header .time-column,
  .hour-row .time-column {
    position: sticky;
    left: 0;
    z-index: 2;
    background: white;
  }

  /* Ay görünümü: 7 gün için yatay kaydırılabilir min genişlik */
  .month-grid {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .month-header,
  .month-week {
    grid-template-columns: repeat(7, minmax(48px, 1fr));
    min-width: 360px;
  }
  .month-day {
    min-height: 64px;
    padding: 4px;
  }
  .month-day-header {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>
