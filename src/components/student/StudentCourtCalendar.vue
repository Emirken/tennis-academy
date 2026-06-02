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
                      :class="cellClass(dayGrid[court.id]?.[time])"
                  >
                    <v-icon
                        :icon="cellIcon(dayGrid[court.id]?.[time])"
                        :color="cellIconColor(dayGrid[court.id]?.[time])"
                        size="20"
                        class="mb-1"
                    />
                    <div class="slot-text">
                      <div class="status-line">{{ cellLabel(dayGrid[court.id]?.[time]) }}</div>
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </v-table>
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
import { buildCourtSchedule, type CourtScheduleMap } from '@/utils/courtScheduleBuild'
import { buildBusyFreeGrid, type BusyFree, countBusyCells } from '@/utils/studentBusyFree'
import { useGroupsStore } from '@/store/modules/groups'

const groupsStore = useGroupsStore()

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

const hours = Array.from({ length: 15 }, (_, i) => i + 8)
const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`)
const monthDayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// Tarih (YYYY-MM-DD) -> dolu/boş ızgarası. Görünür aralığın her günü için dolu.
const gridByDate = ref<Record<string, Record<string, Record<string, BusyFree>>>>({})

// Okuma optimizasyonu: ileri/geri gezinirken aynı aralığı yeniden okumamak için
// kısa ömürlü bellek-içi önbellek (AdminCalendar paterni). refresh() bypass eder.
const CACHE_TTL_MS = 15_000
const cache = new Map<string, { grids: Record<string, Record<string, Record<string, BusyFree>>>; ts: number }>()

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

    // Aralıktaki her gün için: snapshot (bakım/kapalı) + canlı → dolu/boş ızgarası.
    const grids: Record<string, Record<string, Record<string, BusyFree>>> = {}
    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    const endDay = new Date(end); endDay.setHours(0, 0, 0, 0)

    while (cursor <= endDay) {
      const key = dateKey(cursor)
      const dayReservations = byDate[key] || []

      let storedSchedule: CourtScheduleMap = {}
      try {
        const scheduleDoc = await getDoc(doc(db, 'courtSchedule', key))
        storedSchedule = scheduleDoc.exists() ? (scheduleDoc.data().schedule || {}) : {}
      } catch {
        storedSchedule = {}
      }

      const built = buildCourtSchedule({
        courtIds,
        timeSlots,
        storedSchedule,
        reservations: dayReservations,
        existingGroupIds,
        mapCourtId,
      })

      grids[key] = buildBusyFreeGrid(built, courtIds, timeSlots)
      cursor.setDate(cursor.getDate() + 1)
    }

    gridByDate.value = grids

    cache.set(cacheKey, { grids, ts: Date.now() })
    if (cache.size > 6) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
  } catch (error) {
    console.error('Öğrenci takvimi yükleme hatası:', error)
    gridByDate.value = {}
  } finally {
    loading.value = false
  }
}

// ---- Hücre yardımcıları (yalnız dolu/boş; isim/grup YOK) ----
const dayGrid = computed(() => gridByDate.value[dateKey(selectedDate.value)] || {})

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

const cellClass = (value: BusyFree | undefined) =>
  value === 'busy' ? 'status-occupied' : 'status-available'
const cellIcon = (value: BusyFree | undefined) =>
  value === 'busy' ? 'mdi-account' : 'mdi-check-circle'
const cellIconColor = (value: BusyFree | undefined) =>
  value === 'busy' ? 'error' : 'success'
const cellLabel = (value: BusyFree | undefined) =>
  value === 'busy' ? 'Dolu' : 'Müsait'

// Görünüm/tarih değişince yeniden yükle.
watch([currentView, selectedDate], () => { fetchSchedule() })

onMounted(() => {
  groupsStore.initialize()
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

/* Dolu/boş renkleri (Courts.vue / main.css ile aynı) */
.status-available {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.3);
  color: #2e7d32;
}
.status-occupied {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid rgba(244, 67, 54, 0.3);
  color: #c62828;
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
</style>
