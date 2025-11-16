<template>
  <div class="admin-calendar">
    <v-container fluid>
      <!-- Header Section -->
      <div class="calendar-header mb-6">
        <v-row align="center">
          <v-col cols="12" md="4">
            <h2 class="calendar-title">Ders Takvimi</h2>
            <p class="calendar-subtitle">Tüm ders programlarını görüntüleyin</p>
          </v-col>
          <v-col cols="12" md="8" class="text-md-right">
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

      <!-- Date Navigation -->
      <v-card class="modern-card mb-6" elevation="0">
        <v-card-text>
          <v-row align="center">
            <v-col cols="auto">
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click="navigateDate(-1)"
              ></v-btn>
            </v-col>
            <v-col class="text-center">
              <h3 class="date-display">{{ formattedDate }}</h3>
            </v-col>
            <v-col cols="auto">
              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                @click="navigateDate(1)"
              ></v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                variant="outlined"
                @click="goToToday"
              >
                Bugün
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Calendar Views -->
      <v-card class="modern-card calendar-content" elevation="0">
        <v-card-text>
          <!-- Loading Indicator -->
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <p class="mt-4 text-grey">Rezervasyonlar yükleniyor...</p>
          </div>
          <!-- Day View -->
          <div v-if="!loading && currentView === 'day'" class="day-view">
            <v-row>
              <v-col
                v-for="court in courts"
                :key="court.id"
                cols="12"
                md="4"
              >
                <v-card class="court-card" elevation="2">
                  <v-card-title class="court-header">
                    <v-icon left color="primary">mdi-tennis-ball</v-icon>
                    {{ court.name }}
                  </v-card-title>
                  <v-card-text class="time-slots">
                    <div
                      v-for="event in getCourtEvents(court.id, selectedDate)"
                      :key="event.id"
                      class="event-item"
                      :style="{ borderLeftColor: event.color }"
                      @click="showEventDetails(event)"
                    >
                      <div class="event-time">
                        {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
                      </div>
                      <div class="event-title">
                        <v-icon v-if="event.isGroup" size="small" class="mr-1">mdi-account-group</v-icon>
                        <v-icon v-else size="small" class="mr-1">mdi-account</v-icon>
                        {{ event.title }}
                      </div>
                      <div class="event-type">{{ getTypeLabel(event.type) }}</div>
                      <v-chip
                        size="x-small"
                        :color="getStatusColor(event.status)"
                        class="mt-1"
                      >
                        {{ getStatusLabel(event.status) }}
                      </v-chip>
                    </div>
                    <div v-if="getCourtEvents(court.id, selectedDate).length === 0" class="no-events">
                      <v-icon color="grey">mdi-calendar-blank</v-icon>
                      <p>Bugün ders yok</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Week View -->
          <div v-if="!loading && currentView === 'week'" class="week-view">
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
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="hour-row"
                >
                  <div class="time-column">{{ formatHour(hour) }}</div>
                  <div
                    v-for="day in weekDays"
                    :key="day.date.toISOString()"
                    class="day-cell"
                  >
                    <div
                      v-for="event in getHourEvents(day.date, hour)"
                      :key="event.id"
                      class="week-event"
                      :style="{ backgroundColor: event.color }"
                      @click="showEventDetails(event)"
                    >
                      <div class="week-event-content">
                        <strong>{{ event.title }}</strong>
                        <div class="week-event-time">
                          {{ formatTime(event.start) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Month View -->
          <div v-if="!loading && currentView === 'month'" class="month-view">
            <div class="month-grid">
              <div class="month-header">
                <div
                  v-for="dayName in monthDayNames"
                  :key="dayName"
                  class="month-day-header"
                >
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
                    :class="{
                      'other-month': !day.currentMonth,
                      'today': day.isToday
                    }"
                    @click="selectDate(day.date)"
                  >
                    <div class="month-day-number">{{ day.day }}</div>
                    <div class="month-events">
                      <div
                        v-for="event in getDayEvents(day.date).slice(0, 3)"
                        :key="event.id"
                        class="month-event"
                        :style="{ backgroundColor: event.color }"
                        @click="showEventDetails(event)"
                      >
                        <span class="month-event-text">
                          {{ formatTime(event.start) }} - {{ event.title }}
                        </span>
                      </div>
                      <div
                        v-if="getDayEvents(day.date).length > 3"
                        class="more-events"
                      >
                        +{{ getDayEvents(day.date).length - 3 }} daha
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Event Details Dialog -->
      <v-dialog v-model="detailsDialog" max-width="500">
        <v-card v-if="selectedEvent">
          <v-card-title class="d-flex align-center">
            <v-icon left :color="selectedEvent.color">mdi-calendar</v-icon>
            Ders Detayları
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <v-list density="compact">
              <v-list-item v-if="selectedEvent.isGroup">
                <template v-slot:prepend>
                  <v-icon>mdi-account-group</v-icon>
                </template>
                <v-list-item-title>Grup</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.groupName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-else>
                <template v-slot:prepend>
                  <v-icon>mdi-account</v-icon>
                </template>
                <v-list-item-title>Öğrenci</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.studentName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-clock</v-icon>
                </template>
                <v-list-item-title>Saat</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatTime(selectedEvent.start) }} - {{ formatTime(selectedEvent.end) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-tennis-ball</v-icon>
                </template>
                <v-list-item-title>Kort</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.courtName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-tag</v-icon>
                </template>
                <v-list-item-title>Ders Tipi</v-list-item-title>
                <v-list-item-subtitle>{{ getTypeLabel(selectedEvent.type) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-information</v-icon>
                </template>
                <v-list-item-title>Durum</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    size="small"
                    :color="getStatusColor(selectedEvent.status)"
                  >
                    {{ getStatusLabel(selectedEvent.status) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.extendedProps.instructorName">
                <template v-slot:prepend>
                  <v-icon>mdi-account-tie</v-icon>
                </template>
                <v-list-item-title>Eğitmen</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.extendedProps.instructorName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.extendedProps.notes">
                <template v-slot:prepend>
                  <v-icon>mdi-note</v-icon>
                </template>
                <v-list-item-title>Notlar</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.extendedProps.notes }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="detailsDialog = false">
              Kapat
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  courtId: string
  courtName: string
  studentName: string
  groupName?: string
  groupId?: string
  type: string
  status: string
  color: string
  isGroup: boolean
  extendedProps: {
    reservationId: string
    studentId: string
    instructorName?: string
    notes?: string
    contactPhone?: string
  }
}

// State
const currentView = ref<'day' | 'week' | 'month'>('week')
const selectedDate = ref(new Date())
const detailsDialog = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const calendarEvents = ref<CalendarEvent[]>([])
const loading = ref(false)

// Courts data
const courts = ref([
  { id: 'K1', name: 'Kort 1' },
  { id: 'K2', name: 'Kort 2' },
  { id: 'K3', name: 'Kort 3' }
])

// Hours for week view (8 AM to 10 PM)
const hours = Array.from({ length: 14 }, (_, i) => i + 8)

// Month day names
const monthDayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// Computed
const formattedDate = computed(() => {
  if (currentView.value === 'day') {
    return selectedDate.value.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else if (currentView.value === 'week') {
    const weekStart = getWeekStart(selectedDate.value)
    const weekEnd = getWeekEnd(selectedDate.value)
    return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  } else {
    return selectedDate.value.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    })
  }
})

const weekDays = computed(() => {
  const weekStart = getWeekStart(selectedDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push({
      date,
      name: date.toLocaleDateString('tr-TR', { weekday: 'short' })
    })
  }
  return days
})

const monthWeeks = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get the Monday of the week containing the first day
  const startDate = new Date(firstDay)
  const day = startDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startDate.setDate(startDate.getDate() + diff)

  const weeks = []
  let currentDate = new Date(startDate)

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

// Methods
const navigateDate = (direction: number) => {
  const newDate = new Date(selectedDate.value)

  if (currentView.value === 'day') {
    newDate.setDate(newDate.getDate() + direction)
  } else if (currentView.value === 'week') {
    newDate.setDate(newDate.getDate() + (direction * 7))
  } else {
    newDate.setMonth(newDate.getMonth() + direction)
  }

  selectedDate.value = newDate
}

const goToToday = () => {
  selectedDate.value = new Date()
}

const selectDate = (date: Date) => {
  selectedDate.value = date
  currentView.value = 'day'
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

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const formatDayDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

const getCourtName = (courtId: string): string => {
  const court = courts.value.find(c => c.id === courtId)
  return court?.name || courtId
}

const getMembershipDisplayName = (type: string) => {
  const texts: { [key: string]: string } = {
    'private_1_45': 'Özel Ders 1 Kişi (45dk)',
    'private_2_60': 'Özel Ders 2 Kişi (60dk)',
    'private_group_3_8': 'Özel Grup 3 Kişi',
    'private_group_4_8': 'Özel Grup 4 Kişi',
    'private_group_5_8': 'Özel Grup 5 Kişi',
    'private_group_6_8': 'Özel Grup 6 Kişi',
    'private_group_7_8': 'Özel Grup 7 Kişi',
    'private_group_8_8': 'Özel Grup 8 Kişi',
    'private_package_1_8': 'Özel Paket 1 Kişi',
    'private_package_2_8': 'Özel Paket 2 Kişi',
    'adult_group': 'Yetişkin Grup',
    'tennis_school_age': 'Tenis Okulu Yaş Grubu',
    'tennis_school_performance': 'Tenis Okulu Performans'
  }
  return texts[type] || type
}

const fetchReservations = async () => {
  loading.value = true
  try {
    // Get date range based on current view
    let startDate: Date, endDate: Date

    if (currentView.value === 'day') {
      startDate = new Date(selectedDate.value)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate.value)
      endDate.setHours(23, 59, 59, 999)
    } else if (currentView.value === 'week') {
      startDate = getWeekStart(selectedDate.value)
      endDate = getWeekEnd(selectedDate.value)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Month view
      startDate = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
      endDate = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
    }

    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    )

    const querySnapshot = await getDocs(reservationsQuery)

    // First, collect all group IDs
    const groupIds = new Set<string>()
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.groupId) {
        groupIds.add(data.groupId)
      }
      if (data.groupAssignment) {
        groupIds.add(data.groupAssignment)
      }
    })

    // Fetch group names from Firebase
    const groupNames: { [key: string]: string } = {}
    for (const groupId of groupIds) {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId))
        if (groupDoc.exists()) {
          groupNames[groupId] = groupDoc.data().name || groupId
        }
      } catch (error) {
        console.error(`Error fetching group ${groupId}:`, error)
      }
    }

    const events: CalendarEvent[] = []

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data()

      // Parse start and end times
      const [startHour, startMinute] = (data.startTime || '09:00').split(':').map(Number)
      const [endHour, endMinute] = (data.endTime || '10:00').split(':').map(Number)

      const startDateTime = new Date(data.date.toDate())
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(data.date.toDate())
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Determine if it's a group or individual
      const isGroupLesson = data.reservationType === 'group-lesson' ||
          data.membershipType?.includes('_group_') ||
          data.groupAssignment ||
          data.groupId

      const courtName = getCourtName(data.courtId)

      // Create title like in Courts.vue: "Özel Grup 3 Kişi - Grup Adı"
      let title = ''
      let displayName = ''
      let actualGroupName = ''

      if (isGroupLesson) {
        // Get group name from Firebase
        const groupId = data.groupId || data.groupAssignment
        actualGroupName = groupId ? groupNames[groupId] || groupId : ''

        // For group lessons, show membership type and group name
        const membershipLabel = getMembershipDisplayName(data.membershipType)

        if (membershipLabel && actualGroupName) {
          displayName = `${membershipLabel} - ${actualGroupName}`
        } else if (membershipLabel) {
          displayName = membershipLabel
        } else if (actualGroupName) {
          displayName = `Grup Dersi - ${actualGroupName}`
        } else {
          displayName = 'Grup Dersi'
        }
        title = displayName
      } else {
        // For private lessons, show student name
        if (data.studentFirstName && data.studentLastName) {
          displayName = `${data.studentFirstName} ${data.studentLastName}`
        } else if (data.studentFullName) {
          displayName = data.studentFullName
        } else if (data.studentName) {
          displayName = data.studentName
        } else {
          displayName = 'Özel Ders'
        }
        title = displayName
      }

      const event: CalendarEvent = {
        id: docSnap.id,
        title,
        start: startDateTime,
        end: endDateTime,
        courtId: data.courtId,
        courtName,
        studentName: data.studentName || data.studentFullName || '',
        groupName: actualGroupName || data.groupName,
        groupId: data.groupId || data.groupAssignment,
        type: data.type || 'lesson',
        status: data.status || 'confirmed',
        color: getEventColor(data.status, data.type, isGroupLesson),
        isGroup: isGroupLesson,
        extendedProps: {
          reservationId: docSnap.id,
          studentId: data.studentId || '',
          instructorName: data.instructorName,
          notes: data.notes,
          contactPhone: data.contactPhone
        }
      }

      events.push(event)
    }

    calendarEvents.value = events
    console.log(`✅ ${events.length} rezervasyon yüklendi`)
  } catch (error) {
    console.error('❌ Rezervasyonlar yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

const getEventColor = (status: string, type: string, isGroup: boolean): string => {
  // Status-based colors
  if (status === 'cancelled') return '#f44336'
  if (status === 'pending') return '#ff9800'
  if (status === 'completed') return '#9e9e9e'

  // Type and group-based colors
  if (isGroup) return '#9c27b0' // Purple for groups

  const typeColors: Record<string, string> = {
    'lesson': '#4caf50',
    'private_lesson': '#4caf50',
    'group_lesson': '#ff5722',
    'court_rental': '#2196f3',
    'training': '#607d8b',
    'tournament': '#e91e63',
    'practice': '#795548'
  }

  return typeColors[type] || '#2196f3'
}

const getCourtEvents = (courtId: string, date: Date) => {
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    return event.courtId === courtId &&
      eventDate.toDateString() === date.toDateString()
  }).sort((a, b) => a.start.getTime() - b.start.getTime())
}

const getDayEvents = (date: Date) => {
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate.toDateString() === date.toDateString()
  }).sort((a, b) => a.start.getTime() - b.start.getTime())
}

const getHourEvents = (date: Date, hour: number) => {
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    const eventHour = eventDate.getHours()
    return eventDate.toDateString() === date.toDateString() &&
      eventHour === hour
  })
}

const showEventDetails = (event: CalendarEvent) => {
  selectedEvent.value = event
  detailsDialog.value = true
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'court_rental': 'Kort Kiralama',
    'lesson': 'Ders',
    'private_lesson': 'Özel Ders',
    'group_lesson': 'Grup Dersi',
    'group_clinic': 'Grup Klinik',
    'training': 'Antrenman',
    'tournament': 'Turnuva',
    'practice': 'Pratik'
  }
  return labels[type] || type
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'confirmed': 'Onaylandı',
    'active': 'Aktif',
    'pending': 'Beklemede',
    'cancelled': 'İptal',
    'completed': 'Tamamlandı',
    'no_show': 'Gelmedi'
  }
  return labels[status] || status
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'confirmed': 'success',
    'active': 'success',
    'pending': 'warning',
    'cancelled': 'error',
    'completed': 'grey',
    'no_show': 'pink'
  }
  return colors[status] || 'grey'
}

// Lifecycle
onMounted(async () => {
  await fetchReservations()
})

// Watch for view or date changes and refetch
watch([currentView, selectedDate], async () => {
  await fetchReservations()
})
</script>

<style scoped>
.admin-calendar {
  padding: 20px 0;
}

.calendar-header {
  padding: 0 16px;
}

.calendar-title {
  font-size: 28px;
  font-weight: 700;
  color: #2E7D32;
}

.calendar-subtitle {
  color: #666;
  margin-top: 4px;
}

.view-toggle {
  border-radius: 8px;
}

.date-display {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.modern-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

/* Day View */
.day-view .court-card {
  border-radius: 8px;
  height: 100%;
}

.court-header {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
  color: white;
  font-weight: 600;
}

.time-slots {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.event-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-item:hover {
  background: #eeeeee;
  transform: translateX(4px);
}

.event-time {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.event-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-top: 4px;
}

.event-type {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.no-events {
  text-align: center;
  padding: 40px;
  color: #999;
}

.no-events p {
  margin-top: 8px;
}

/* Week View */
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
  grid-template-rows: repeat(14, 60px);
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
  position: relative;
  min-width: 100px;
}

.week-event {
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 11px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: opacity 0.2s;
}

.week-event:hover {
  opacity: 0.85;
}

.week-event-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.week-event-time {
  font-size: 10px;
  opacity: 0.9;
}

/* Month View */
.month-grid {
  width: 100%;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
}

.month-day-header {
  background: #2E7D32;
  color: white;
  padding: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.month-body {
  display: grid;
  gap: 1px;
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
  border-top: none;
}

.month-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.month-day {
  background: white;
  min-height: 100px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.month-day:hover {
  background: #f5f5f5;
}

.month-day.other-month {
  background: #fafafa;
  opacity: 0.6;
}

.month-day.today {
  background: #e8f5e9;
}

.month-day-number {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.month-events {
  margin-top: 4px;
}

.month-event {
  padding: 2px 6px;
  margin-bottom: 2px;
  border-radius: 3px;
  font-size: 11px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-event-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-events {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  margin-top: 2px;
}

/* Responsive */
@media (max-width: 960px) {
  .view-toggle {
    width: 100%;
    margin-top: 16px;
  }

  .week-header,
  .hour-row {
    grid-template-columns: 60px repeat(7, 100px);
  }

  .month-day {
    min-height: 80px;
    padding: 4px;
  }
}
</style>
