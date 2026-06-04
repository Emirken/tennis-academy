<template>
  <div class="admin-calendar">
    <v-container fluid>
      <!-- Header Section -->
      <div class="calendar-header mb-6">
        <v-row align="center">
          <v-col cols="12" md="4">
            <h2 class="calendar-title">Ders Takvimi</h2>
            <p class="calendar-subtitle">Tüm ders programlarını görüntüleyin</p>
            <div class="type-legend">
              <span class="type-legend-item">
                <span class="type-legend-dot" style="background:#E65100"></span> Grup Dersi
              </span>
              <span class="type-legend-item">
                <span class="type-legend-dot" style="background:#388E3C"></span> Özel Ders
              </span>
              <span class="type-legend-item">
                <span class="type-legend-dot" style="background:#7B1FA2"></span> Rezervasyon
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="8" class="text-md-right">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mr-3"
              @click="openReservationDialog"
            >
              Kort Rezervasyonu
            </v-btn>
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
                  <v-card-title class="court-header d-flex align-center justify-space-between">
                    <span>
                      <v-icon left color="white">mdi-tennis-ball</v-icon>
                      {{ court.name }}
                    </span>
                    <v-chip
                      v-if="getCourtEvents(court.id, selectedDate).length > 0"
                      size="small"
                      color="white"
                      variant="flat"
                      class="court-badge"
                    >
                      {{ getCourtEvents(court.id, selectedDate).length }}
                    </v-chip>
                  </v-card-title>
                  <v-card-text class="time-slots">
                    <div
                      v-for="event in getCourtEvents(court.id, selectedDate)"
                      :key="event.id"
                      class="event-item"
                      :style="{ backgroundColor: getEventTypeColor(event), borderLeftColor: event.color, color: '#fff' }"
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
                    <div class="day-cell-events">
                      <v-tooltip
                        v-for="event in getHourEvents(day.date, hour).slice(0, 3)"
                        :key="event.id"
                        location="top"
                        :open-delay="300"
                      >
                        <template v-slot:activator="{ props: tooltipProps }">
                          <div
                            class="week-event"
                            :class="{ 'week-event-single': getHourEvents(day.date, hour).length === 1 }"
                            v-bind="tooltipProps"
                            :style="{ backgroundColor: getEventTypeColor(event), borderLeftColor: event.color }"
                            @click="showEventDetails(event)"
                          >
                            <div class="week-event-court-badge">{{ event.courtId }}</div>
                            <div class="week-event-title">{{ event.title }}</div>
                            <div class="week-event-time">{{ formatTime(event.start) }}</div>
                          </div>
                        </template>
                        <div class="week-event-tooltip">
                          <div class="week-event-tooltip-court">
                            <span class="week-event-tooltip-dot" :style="{ backgroundColor: getEventTypeColor(event) }"></span>
                            {{ event.courtName || event.courtId }}
                          </div>
                          <div class="week-event-tooltip-title">{{ event.title }}</div>
                          <div class="week-event-tooltip-time">{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</div>
                          <div v-if="event.groupName" class="week-event-tooltip-group">Grup: {{ event.groupName }}</div>
                          <div v-if="event.studentName" class="week-event-tooltip-student">{{ event.studentName }}</div>
                        </div>
                      </v-tooltip>
                      <div
                        v-if="getHourEvents(day.date, hour).length > 3"
                        class="week-more-events"
                        @click.stop="selectDate(day.date)"
                      >
                        +{{ getHourEvents(day.date, hour).length - 3 }}
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
                  <v-tooltip
                    v-for="(day, dayIndex) in week"
                    :key="dayIndex"
                    location="top"
                    :disabled="getDayEvents(day.date).length === 0"
                    class="month-day-tooltip-wrapper"
                  >
                    <template v-slot:activator="{ props }">
                      <div
                        v-bind="props"
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
                            :style="{ backgroundColor: getEventTypeColor(event), borderLeftColor: event.color }"
                            @click.stop="showEventDetails(event)"
                          >
                            <span class="month-event-badge">{{ event.courtId }}</span>
                            <span class="month-event-text">
                              {{ formatTime(event.start) }} - {{ event.title }}
                            </span>
                          </div>
                          <div
                            v-if="getDayEvents(day.date).length > 3"
                            class="more-events"
                            @click.stop="selectDate(day.date)"
                          >
                            +{{ getDayEvents(day.date).length - 3 }} daha
                          </div>
                        </div>
                      </div>
                    </template>
                    <div class="month-day-tooltip">
                      <div
                        v-for="event in getDayEvents(day.date)"
                        :key="event.id"
                        class="month-day-tooltip-item"
                      >
                        {{ formatTime(event.start) }} - {{ event.title }} ({{ event.courtName }})
                      </div>
                    </div>
                  </v-tooltip>
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
                <v-list-item-title>
                  {{ selectedEvent.title }}
                  <span v-if="selectedEvent.extendedProps.contactPhone" class="text-grey-darken-1 font-weight-regular">
                    ({{ selectedEvent.extendedProps.contactPhone }})
                  </span>
                </v-list-item-title>
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

            <!-- Katılımcılar / Üyeler -->
            <v-divider class="my-2"></v-divider>
            <div class="px-4 pt-2 pb-1 d-flex align-center">
              <v-icon class="mr-2" size="small">mdi-account-multiple</v-icon>
              <span class="text-subtitle-2 font-weight-medium">
                {{ selectedEvent.isGroup ? 'Grup Üyeleri' : 'Katılımcı' }}
                <span v-if="eventParticipants.length" class="text-grey-darken-1">
                  ({{ eventParticipants.length }})
                </span>
              </span>
            </div>
            <div v-if="participantsLoading" class="px-4 py-2 text-caption text-grey">
              Yükleniyor...
            </div>
            <v-list v-else-if="eventParticipants.length" density="compact" class="py-0">
              <v-list-item
                v-for="(p, i) in eventParticipants"
                :key="p.id || i"
              >
                <template v-slot:prepend>
                  <v-icon size="small">mdi-account</v-icon>
                </template>
                <v-list-item-title>{{ p.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="p.phone || p.email">
                  <span v-if="p.phone">{{ p.phone }}</span>
                  <span v-if="p.phone && p.email"> • </span>
                  <span v-if="p.email">{{ p.email }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="px-4 py-2 text-caption text-grey">
              Kayıtlı katılımcı bulunamadı.
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn
              v-if="canCancelEvent(selectedEvent)"
              color="error"
              variant="text"
              prepend-icon="mdi-cancel"
              :loading="isCancelling"
              @click="cancelSelectedReservation"
            >
              {{ selectedEvent.isGroup ? 'Dersi İptal Et' : 'Rezervasyonu İptal Et' }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="detailsDialog = false">
              Kapat
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Court Reservation Dialog -->
      <v-dialog v-model="reservationDialog" max-width="600" persistent>
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between bg-primary">
            <span class="text-white">
              <v-icon left color="white">mdi-tennis-ball</v-icon>
              Kort Rezervasyonu
            </span>
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              @click="closeReservationDialog"
            ></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-6">
            <v-form ref="reservationFormRef" v-model="formValid">
              <v-row>
                <!-- Telefon Numarası -->
                <v-col cols="12">
                  <v-text-field
                    v-model="reservationForm.phone"
                    label="Telefon Numarası"
                    prepend-icon="mdi-phone"
                    :rules="phoneRules"
                    required
                    placeholder="5XX XXX XX XX"
                  ></v-text-field>
                </v-col>

                <!-- Kayıtlı Öğrenci Seçimi -->
                <v-col cols="12">
                  <v-select
                    v-model="reservationForm.studentId"
                    :items="studentsList"
                    item-title="fullName"
                    item-value="id"
                    label="Kayıtlı Öğrenci (Opsiyonel)"
                    prepend-icon="mdi-account"
                    clearable
                    @update:model-value="onStudentSelected"
                  ></v-select>
                </v-col>

                <!-- Kayıtlı Olmayan Kişi -->
                <v-col cols="12">
                  <v-text-field
                    v-model="reservationForm.nonRegisteredName"
                    label="Kayıtlı Olmayan Kişi Adı"
                    prepend-icon="mdi-account-outline"
                    :disabled="!!reservationForm.studentId"
                    :rules="nameRules"
                    placeholder="Ad Soyad"
                  ></v-text-field>
                </v-col>

                <!-- Kort Seçimi -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="reservationForm.courtId"
                    :items="courts"
                    item-title="name"
                    item-value="id"
                    label="Kort"
                    prepend-icon="mdi-tennis-ball"
                    :rules="[v => !!v || 'Kort seçimi zorunludur']"
                    required
                  ></v-select>
                </v-col>

                <!-- Gün -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="reservationForm.date"
                    label="Gün"
                    type="date"
                    prepend-icon="mdi-calendar"
                    :rules="dateRules"
                    required
                  ></v-text-field>
                </v-col>

                <!-- Başlangıç Saati -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="reservationForm.startTime"
                    :items="availableTimeSlots"
                    label="Başlangıç Saati"
                    prepend-icon="mdi-clock-start"
                    :rules="[v => !!v || 'Başlangıç saati zorunludur']"
                    required
                    :disabled="!reservationForm.courtId || !reservationForm.date"
                    :hint="!reservationForm.courtId || !reservationForm.date ? 'Önce kort ve tarih seçiniz' : availableTimeSlots.length === 0 ? 'Bu kortta müsait saat yok' : ''"
                    persistent-hint
                  >
                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>Bu kort ve tarih için müsait saat yok</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <!-- Bitiş Saati -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="reservationForm.endTime"
                    :items="availableEndTimeSlots"
                    label="Bitiş Saati"
                    prepend-icon="mdi-clock-end"
                    :rules="endTimeRules"
                    required
                    :disabled="!reservationForm.startTime"
                    :hint="!reservationForm.startTime ? 'Önce başlangıç saati seçiniz' : ''"
                    persistent-hint
                  >
                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>Müsait bitiş saati yok</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              variant="text"
              @click="closeReservationDialog"
            >
              İptal
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :disabled="!formValid || isSaving"
              :loading="isSaving"
              @click="saveReservation"
            >
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Success/Error Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3000"
      >
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn
            color="white"
            variant="text"
            @click="snackbar.show = false"
          >
            Kapat
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'
import { useGroupsStore } from '@/store/modules/groups'
import { useAuthStore } from '@/store/modules/auth'
import { notificationService } from '@/services/notificationService'
import { getReservationIdsToCancel, type RawReservationDocWithId } from '@/utils/reservationCancel'
import { getReservationTypeColor } from '@/utils/reservationTypeColor'
import { isPastReservationDoc, type RawReservationDoc } from '@/utils/dailyReservationLimit'

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
  membershipType?: string
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
const membershipTypesStore = useMembershipTypesStore()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const currentView = ref<'day' | 'week' | 'month'>('week')
const selectedDate = ref(new Date())
const detailsDialog = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const isCancelling = ref(false)
const calendarEvents = ref<CalendarEvent[]>([])
const loading = ref(false)

// Okuma optimizasyonu: takvimde ileri/geri gezinirken aynı tarih aralığına geri
// dönüldüğünde reservations'ı yeniden okumamak için kısa ömürlü bellek-içi
// önbellek. Anahtar: "view|startISO|endISO". Bayat veri riskini sınırlamak için
// kısa TTL kullanılır ve herhangi bir yazım sonrası fetchReservations(true) ile
// baypas edilir. Doluluk için canlı reservations yine doğru kaynaktır.
const CALENDAR_CACHE_TTL_MS = 15_000
const CALENDAR_CACHE_MAX_ENTRIES = 6
const reservationsCache = new Map<string, { events: CalendarEvent[]; ts: number }>()

const clearReservationsCache = () => reservationsCache.clear()

// Reservation Dialog State
const reservationDialog = ref(false)
const reservationFormRef = ref<any>(null)
const formValid = ref(false)
const isSaving = ref(false)
const studentsList = ref<any[]>([])

// Reservation Form Data
const reservationForm = ref({
  phone: '',
  studentId: '',
  nonRegisteredName: '',
  courtId: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '10:00'
})

// Snackbar State
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Courts data
const courts = ref([
  { id: 'K1', name: 'Kort 1' },
  { id: 'K2', name: 'Kort 2' },
  { id: 'K3', name: 'Kort 3' }
])

// Hours for week view (08:00 to 22:00)
const hours = Array.from({ length: 15 }, (_, i) => i + 8)

// Month day names
const monthDayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// Time slots for reservation form (08:00 - 22:00, son slot 22:00 - 23:00)
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, '0')}:00`
})

// Computed
const endTimeSlots = computed(() => {
  if (!reservationForm.value.startTime) return timeSlots
  const startIndex = timeSlots.indexOf(reservationForm.value.startTime)
  return timeSlots.slice(startIndex + 1)
})

// Get available time slots considering existing reservations
const availableTimeSlots = computed(() => {
  if (!reservationForm.value.courtId || !reservationForm.value.date) {
    return timeSlots
  }

  // Get reservations for selected court and date
  const selectedDate = new Date(reservationForm.value.date)
  const courtReservations = calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    return event.courtId === reservationForm.value.courtId &&
           eventDate.toDateString() === selectedDate.toDateString()
  })

  // Filter out time slots that are already booked
  return timeSlots.filter(timeSlot => {
    const [hour, minute] = timeSlot.split(':').map(Number)
    
    // Check if this time slot conflicts with any existing reservation
    const hasConflict = courtReservations.some(reservation => {
      const reservationStartHour = reservation.start.getHours()
      const reservationEndHour = reservation.end.getHours()
      
      // Check if the time slot falls within an existing reservation
      return hour >= reservationStartHour && hour < reservationEndHour
    })
    
    return !hasConflict
  })
})

const availableEndTimeSlots = computed(() => {
  if (!reservationForm.value.startTime || !reservationForm.value.courtId || !reservationForm.value.date) {
    return endTimeSlots.value
  }

  const selectedDate = new Date(reservationForm.value.date)
  const courtReservations = calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    return event.courtId === reservationForm.value.courtId &&
           eventDate.toDateString() === selectedDate.toDateString()
  })

  const [startHour, startMinute] = reservationForm.value.startTime.split(':').map(Number)

  // Find the earliest conflicting reservation after start time
  let maxEndTime = '23:00' // Default max
  courtReservations.forEach(reservation => {
    const reservationStartHour = reservation.start.getHours()
    const reservationStartMinute = reservation.start.getMinutes()
    
    if (reservationStartHour > startHour || 
        (reservationStartHour === startHour && reservationStartMinute > startMinute)) {
      const nextReservationTime = `${reservationStartHour.toString().padStart(2, '0')}:${reservationStartMinute.toString().padStart(2, '0')}`
      if (nextReservationTime < maxEndTime) {
        maxEndTime = nextReservationTime
      }
    }
  })

  // Filter end time slots
  return endTimeSlots.value.filter(timeSlot => timeSlot <= maxEndTime)
})

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

// Validation Rules
const phoneRules = [
  (v: string) => !!v || 'Telefon numarası zorunludur',
  (v: string) => /^[\+]?[0-9\s\-\(\)]+$/.test(v) || 'Geçerli bir telefon numarası giriniz'
]

const nameRules = [
  (v: string) => {
    if (!reservationForm.value.studentId && !v) {
      return 'Kayıtlı öğrenci seçilmediyse isim zorunludur'
    }
    return true
  }
]

const dateRules = [
  (v: string) => !!v || 'Tarih zorunludur',
  (v: string) => {
    const selectedDate = new Date(v)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today || 'Geçmiş tarih seçilemez'
  }
]

const endTimeRules = [
  (v: string) => !!v || 'Bitiş saati zorunludur',
  (v: string) => {
    if (!reservationForm.value.startTime) return true
    return v > reservationForm.value.startTime || 'Bitiş saati başlangıç saatinden sonra olmalıdır'
  }
]

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

const normalizeCourtId = (courtId: string): string => {
  const mapping: Record<string, string> = {
    'court-1': 'K1',
    'court-2': 'K2',
    'court-3': 'K3',
    'court_1': 'K1',
    'court_2': 'K2',
    'court_3': 'K3',
  }
  return mapping[courtId] || courtId
}

const getCourtName = (courtId: string): string => {
  const normalized = normalizeCourtId(courtId)
  const court = courts.value.find(c => c.id === normalized)
  return court?.name || normalized
}

// Kort görüntüleme sırası için tek kaynak: courts ref (K1→K2→K3). Aynı saatte
// yan yana dolu kortların takvimde K1, K2, K3 sırasıyla görünmesini sağlar.
const courtSortIndex = (courtId: string): number => {
  const i = courts.value.findIndex(c => c.id === normalizeCourtId(courtId))
  return i === -1 ? Number.MAX_SAFE_INTEGER : i
}

// Tür bazlı takvim rengi (TEK kaynak: reservationTypeColor). Grup dersi turuncu,
// özel ders yeşil, kort rezervasyonu mor.
//
// ÖNEMLİ: event.isGroup'a GÜVENME — o da 'group-lesson' damgasından türediği
// için 1/2 kişilik özel paketleri yanlışlıkla grup sayar. Sınıflandırıcıya HAM
// alanları (membershipType dahil) ve store'un isGroupType resolver'ını veririz;
// karar membershipType'a göre verilir (grup üyeliği değilse → özel ders/yeşil).
const getEventTypeColor = (event: CalendarEvent): string => {
  return getReservationTypeColor(
    {
      type: event.type,
      reservationType: event.isGroup ? 'group-lesson' : event.type,
      membershipType: event.membershipType,
      groupId: event.groupId,
      groupAssignment: event.groupId,
    },
    membershipTypesStore.isGroupType,
  )
}

const getMembershipDisplayName = (type: string) => {
  return membershipTypesStore.getDisplayInfo(type)?.name || type
}

const fetchReservations = async (force = false) => {
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

    // Önbellek kontrolü: zorlanmadıysa ve TTL içinde geçerli bir giriş varsa
    // yeniden okuma yapmadan onu kullan.
    const cacheKey = `${currentView.value}|${startDate.toISOString()}|${endDate.toISOString()}`
    if (!force) {
      const cached = reservationsCache.get(cacheKey)
      if (cached && Date.now() - cached.ts < CALENDAR_CACHE_TTL_MS) {
        calendarEvents.value = cached.events
        loading.value = false
        return
      }
    } else {
      // Zorlanan yenilemede (ör. yazım sonrası) bayat girişleri temizle.
      clearReservationsCache()
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

    // Fetch group names and track which groups exist.
    // Okuma optimizasyonu: paylaşılan groups önbelleği hazırsa per-id getDoc
    // yerine onu kullan; aksi halde eski getDoc döngüsüne düş. Etiket fallback'i
    // `|| groupId` aynen korunur (getName boş isimde '' döndürür).
    const groupNames: { [key: string]: string } = {}
    const existingGroupIds = new Set<string>()

    if (groupsStore.isReady()) {
      for (const groupId of groupIds) {
        if (groupsStore.existingGroupIds.has(groupId)) {
          groupNames[groupId] = groupsStore.getName(groupId) || groupId
          existingGroupIds.add(groupId)
        }
      }
    } else {
      for (const groupId of groupIds) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId))
          if (groupDoc.exists()) {
            groupNames[groupId] = groupDoc.data().name || groupId
            existingGroupIds.add(groupId)
          }
        } catch (error) {
          console.error(`Error fetching group ${groupId}:`, error)
        }
      }
    }

    // Collect all studentIds to batch-fetch user names
    const studentIds = new Set<string>()
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.studentId) studentIds.add(data.studentId)
    })

    const studentNames: Record<string, string> = {}
    const studentPhones: Record<string, string> = {}
    for (const studentId of studentIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', studentId))
        if (userDoc.exists()) {
          const u = userDoc.data()
          studentNames[studentId] = `${u.firstName || ''} ${u.lastName || ''}`.trim()
          studentPhones[studentId] = u.phone_number || u.phone || ''
        }
      } catch (e) { /* ignore */ }
    }

    const events: CalendarEvent[] = []
    // Track group events to avoid duplicates (key: groupId-date-startTime-courtId)
    const groupEventKeys = new Set<string>()

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data()

      // İptal edilen rezervasyonları gösterme
      if (data.status === 'cancelled') continue

      // Tarihi geçmiş KORT REZERVASYONLARI (dersler hariç) iptal edilmiş gibi
      // gizle → slot boşalır. Dersler (grup/özel) isPastReservationDoc tarafından
      // korunur ve geçmişte de görünmeye devam eder.
      if (isPastReservationDoc(data as RawReservationDoc, new Date())) continue

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

      // Skip this reservation if it has a specific group ID but the group has been deleted
      // Note: We only skip if there's an explicit groupId/groupAssignment that doesn't exist
      // If there's no groupId (legacy reservations), we still show them
      const groupId = data.groupId || data.groupAssignment
      if (groupId && !existingGroupIds.has(groupId)) {
        console.log(`⏭️ Skipping reservation ${docSnap.id} - group ${groupId} no longer exists`)
        continue
      }

      // For group lessons, deduplicate by groupId + date + time + court
      if (isGroupLesson && groupId) {
        const dateKey = startDateTime.toDateString()
        const groupEventKey = `${groupId}-${dateKey}-${data.startTime}-${normalizeCourtId(data.courtId)}`
        
        if (groupEventKeys.has(groupEventKey)) {
          // Skip duplicate group event
          continue
        }
        groupEventKeys.add(groupEventKey)
      }

      const normalizedCourtId = normalizeCourtId(data.courtId)
      const courtName = getCourtName(data.courtId)

      // Create title like in Courts.vue: "Özel Grup 3 Kişi - Grup Adı"
      let title = ''
      let displayName = ''
      let actualGroupName = ''

      if (isGroupLesson) {
        // Get group name from Firebase
        const groupId = data.groupId || data.groupAssignment
        actualGroupName = groupId ? groupNames[groupId] || groupId : ''

        // For group lessons, show only the group name (fallback to membership label)
        const membershipLabel = getMembershipDisplayName(data.membershipType)

        if (actualGroupName) {
          displayName = actualGroupName
        } else if (membershipLabel) {
          displayName = membershipLabel
        } else {
          displayName = 'Grup Dersi'
        }
        title = displayName
      } else {
        // For private lessons, show student name + phone
        if (data.studentId && studentNames[data.studentId]) {
          displayName = studentNames[data.studentId]
        } else if (data.studentFirstName && data.studentLastName) {
          displayName = `${data.studentFirstName} ${data.studentLastName}`
        } else if (data.studentFullName) {
          displayName = data.studentFullName
        } else if (data.studentName) {
          displayName = data.studentName
        } else {
          displayName = 'Bilinmiyor'
        }
        const phone = (data.studentId && studentPhones[data.studentId])
          || data.contactPhone || ''
        title = phone ? `${displayName} (${phone})` : displayName
      }

      const event: CalendarEvent = {
        id: docSnap.id,
        title,
        start: startDateTime,
        end: endDateTime,
        courtId: normalizedCourtId,
        courtName,
        studentName: data.studentName || data.studentFullName || '',
        groupName: actualGroupName || data.groupName,
        groupId: data.groupId || data.groupAssignment,
        membershipType: data.membershipType || '',
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

    // Sonucu önbelleğe al (kısa TTL). Önbellek büyümesin diye en eski girişi at.
    reservationsCache.set(cacheKey, { events, ts: Date.now() })
    if (reservationsCache.size > CALENDAR_CACHE_MAX_ENTRIES) {
      const oldestKey = reservationsCache.keys().next().value
      if (oldestKey !== undefined) reservationsCache.delete(oldestKey)
    }

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
  }).sort((a, b) =>
    a.start.getTime() - b.start.getTime() ||
    courtSortIndex(a.courtId) - courtSortIndex(b.courtId)
  )
}

const getHourEvents = (date: Date, hour: number) => {
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    const eventHour = eventDate.getHours()
    return eventDate.toDateString() === date.toDateString() &&
      eventHour === hour
  }).sort((a, b) =>
    courtSortIndex(a.courtId) - courtSortIndex(b.courtId) ||
    a.start.getTime() - b.start.getTime()
  )
}

const eventParticipants = ref<Array<{ id?: string; name: string; phone?: string; email?: string }>>([])
const participantsLoading = ref(false)

const showEventDetails = async (event: CalendarEvent) => {
  selectedEvent.value = event
  detailsDialog.value = true
  eventParticipants.value = []

  try {
    if (event.isGroup && event.groupId) {
      participantsLoading.value = true

      // Okuma optimizasyonu: önbellek hazır ve grup orada ise getDoc YAPMA.
      // Aksi halde (hazır değil / grup önbellekte yok) eski getDoc'a düş.
      const mapMembers = (data: any) => {
        const members = Array.isArray(data?.members) ? data.members : []
        eventParticipants.value = members.map((m: any) => ({
          id: m.id,
          name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Bilinmiyor',
          email: m.email,
          phone: m.phone || m.phone_number,
        }))
      }

      const cachedGroup = groupsStore.isReady() ? groupsStore.getGroup(event.groupId) : undefined
      if (cachedGroup) {
        mapMembers(cachedGroup)
      } else {
        const groupSnap = await getDoc(doc(db, 'groups', event.groupId))
        if (groupSnap.exists()) {
          mapMembers(groupSnap.data())
        }
      }
    } else {
      // Özel ders: tek katılımcı (öğrenci)
      const studentName =
        event.studentName ||
        event.title.replace(/\s*\(.*\)\s*$/, '').trim()
      eventParticipants.value = [
        {
          id: event.extendedProps.studentId || undefined,
          name: studentName || 'Bilinmiyor',
          phone: event.extendedProps.contactPhone,
        },
      ]
    }
  } catch (err) {
    console.error('Katılımcılar yüklenirken hata:', err)
  } finally {
    participantsLoading.value = false
  }
}

// Sadece slotu meşgul eden (iptal/tamamlanmamış) etkinlikler iptal edilebilir.
const canCancelEvent = (event: CalendarEvent | null): boolean => {
  if (!event) return false
  return event.status !== 'cancelled' && event.status !== 'completed' && event.status !== 'no_show'
}

// Date'i 'HH:mm' formatına çevirir (eşleştirme/karşılaştırma için).
const toTimeString = (d: Date): string => {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// Admin bir rezervasyonu/dersi iptal eder. Grup dersinde o grup+tarih+saat+kort
// için TÜM üye dokümanları iptal edilir (slotun tamamen boşalması için).
const cancelSelectedReservation = async () => {
  const event = selectedEvent.value
  if (!event || isCancelling.value || !canCancelEvent(event)) return

  const confirmMsg = event.isGroup
    ? 'Bu grup dersinin tüm üye rezervasyonları iptal edilecek. Emin misiniz?'
    : 'Rezervasyonu iptal etmek istediğinize emin misiniz?'
  if (!confirm(confirmMsg)) return

  isCancelling.value = true
  try {
    // O güne ait ham rezervasyon dokümanlarını oku (grup üyelerini bulmak için).
    const dayStart = new Date(event.start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(event.start)
    dayEnd.setHours(23, 59, 59, 999)

    const daySnap = await getDocs(query(
      collection(db, 'reservations'),
      where('date', '>=', dayStart),
      where('date', '<=', dayEnd)
    ))
    const dayDocs: RawReservationDocWithId[] = daySnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const ids = getReservationIdsToCancel(
      {
        reservationId: event.id,
        groupId: event.isGroup ? (event.groupId || null) : null,
        date: event.start,
        startTime: toTimeString(event.start),
        courtId: event.courtId,
      },
      dayDocs
    )

    // Eşleşen tüm dokümanları 'cancelled' yap.
    const cancelData = {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'admin',
      cancelledByUserId: authStore.user?.id || null,
    }
    await Promise.all(
      ids.map(id => updateDoc(doc(db, 'reservations', id), cancelData))
    )

    // İlgili öğrenci(ler)e iptal bildirimi gönder (benzersiz studentId'ler).
    const dateLabel = new Date(event.start).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const timeLabel = toTimeString(event.start)
    const notifiedStudents = new Set<string>()
    const idSet = new Set(ids)
    for (const d of dayDocs) {
      if (!idSet.has(d.id)) continue
      const sid = d.studentId
      if (!sid || notifiedStudents.has(sid)) continue
      notifiedStudents.add(sid)
      try {
        await notificationService.createStudentNotification(
          sid,
          event.isGroup ? 'Dersiniz İptal Edildi' : 'Rezervasyonunuz İptal Edildi',
          `${dateLabel} ${timeLabel} • ${event.courtName} için kaydınız yönetici tarafından iptal edildi.`,
          'reservation_rejected',
          { reservationId: d.id }
        )
      } catch (e) {
        console.error('İptal bildirimi gönderilemedi:', e)
      }
    }

    showSnackbar(
      ids.length > 1 ? `${ids.length} rezervasyon iptal edildi` : 'Rezervasyon iptal edildi',
      'success'
    )
    detailsDialog.value = false
    selectedEvent.value = null

    // Yazım sonrası önbelleği baypas ederek takvimi tazele.
    await fetchReservations(true)
  } catch (error) {
    console.error('Rezervasyon iptal hatası:', error)
    showSnackbar('Rezervasyon iptal edilirken bir hata oluştu', 'error')
  } finally {
    isCancelling.value = false
  }
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

// Reservation Dialog Functions
const openReservationDialog = async () => {
  // Load students from users collection with role filter
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'student'))
    const querySnapshot = await getDocs(q)
    
    studentsList.value = querySnapshot.docs
      .map(doc => {
        const data = doc.data()
        
        // Silinmiş öğrencileri atla
        if (data.deleted === true) {
          return null
        }
        
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone_number: data.phone_number || '',
          phone: data.phone || '',
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim()
        }
      })
      .filter(student => student !== null) // Silinmiş öğrencileri filtrele

    console.log(`✅ ${studentsList.value.length} öğrenci yüklendi`)
  } catch (error) {
    console.error('Error loading students:', error)
    studentsList.value = []
  }

  reservationDialog.value = true
}

const closeReservationDialog = () => {
  reservationDialog.value = false
  resetReservationForm()
}

const resetReservationForm = () => {
  reservationForm.value = {
    phone: '',
    studentId: '',
    nonRegisteredName: '',
    courtId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00'
  }
  formValid.value = false
  if (reservationFormRef.value) {
    reservationFormRef.value.reset()
  }
}

const onStudentSelected = (studentId: string) => {
  if (studentId) {
    const student = studentsList.value.find(s => s.id === studentId)
    if (student && student.phone) {
      reservationForm.value.phone = student.phone
    }
    reservationForm.value.nonRegisteredName = ''
  }
}

// Check if a time slot conflicts with existing reservations
const checkTimeConflict = (courtId: string, date: string, startTime: string, endTime: string): boolean => {
  const selectedDate = new Date(date)
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  // Get reservations for the selected court and date
  const conflictingReservations = calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    if (event.courtId !== courtId || eventDate.toDateString() !== selectedDate.toDateString()) {
      return false
    }

    const eventStartHour = event.start.getHours()
    const eventStartMinute = event.start.getMinutes()
    const eventEndHour = event.end.getHours()
    const eventEndMinute = event.end.getMinutes()

    // Convert to minutes for easier comparison
    const newStartMinutes = startHour * 60 + startMinute
    const newEndMinutes = endHour * 60 + endMinute
    const existingStartMinutes = eventStartHour * 60 + eventStartMinute
    const existingEndMinutes = eventEndHour * 60 + eventEndMinute

    // Check for overlap
    // Two intervals overlap if: start1 < end2 && start2 < end1
    return newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes
  })

  return conflictingReservations.length > 0
}

const saveReservation = async () => {
  if (!formValid.value) {
    showSnackbar('Lütfen tüm zorunlu alanları doldurun', 'error')
    return
  }

  // Check for time conflicts before saving
  const hasConflict = checkTimeConflict(
    reservationForm.value.courtId,
    reservationForm.value.date,
    reservationForm.value.startTime,
    reservationForm.value.endTime
  )

  if (hasConflict) {
    showSnackbar('Bu kort, tarih ve saat aralığında zaten bir rezervasyon mevcut', 'error')
    return
  }

  isSaving.value = true

  try {
    // Determine student name
    let studentName = ''
    let studentFirstName = ''
    let studentLastName = ''
    
    if (reservationForm.value.studentId) {
      const student = studentsList.value.find(s => s.id === reservationForm.value.studentId)
      if (student) {
        studentName = student.fullName
        studentFirstName = student.firstName
        studentLastName = student.lastName
      }
    } else {
      studentName = reservationForm.value.nonRegisteredName
      const nameParts = reservationForm.value.nonRegisteredName.split(' ')
      studentFirstName = nameParts[0] || ''
      studentLastName = nameParts.slice(1).join(' ') || ''
    }

    // Parse date and times
    const reservationDate = new Date(reservationForm.value.date)
    const [startHour, startMinute] = reservationForm.value.startTime.split(':').map(Number)
    const [endHour, endMinute] = reservationForm.value.endTime.split(':').map(Number)

    // Calculate duration
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    const duration = endMinutes - startMinutes

    // Create reservation object
    const reservation = {
      courtId: reservationForm.value.courtId,
      courtName: getCourtName(reservationForm.value.courtId),
      date: Timestamp.fromDate(reservationDate),
      startTime: reservationForm.value.startTime,
      endTime: reservationForm.value.endTime,
      duration,
      type: 'court_rental',
      reservationType: 'court-rental',
      status: 'confirmed',
      contactPhone: reservationForm.value.phone,
      studentId: reservationForm.value.studentId || null,
      studentName,
      studentFirstName,
      studentLastName,
      studentFullName: studentName,
      paymentStatus: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    // Save to Firestore
    await addDoc(collection(db, 'reservations'), reservation)

    showSnackbar('Rezervasyon başarıyla oluşturuldu', 'success')
    closeReservationDialog()

    // Refresh calendar — yazım sonrası önbelleği baypas et (force=true).
    await fetchReservations(true)
  } catch (error) {
    console.error('Error saving reservation:', error)
    showSnackbar('Rezervasyon kaydedilirken bir hata oluştu', 'error')
  } finally {
    isSaving.value = false
  }
}

const showSnackbar = (message: string, color: string = 'success') => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

// Lifecycle
onMounted(async () => {
  await membershipTypesStore.initialize()
  // Paylaşılan groups önbelleğini başlat (grup-adı ve katılımcı okumaları için
  // N+1 getDoc yerine). Hazır olana kadar eski getDoc fallback'i devrede.
  groupsStore.initialize()
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
  width: 100%;
  max-width: 100%;
}

/* Tam genişlik takvim — Vuetify v-container'ın yan padding'ini sıfırla */
.admin-calendar :deep(.v-container) {
  padding-left: 0;
  padding-right: 0;
  max-width: 100%;
}

.calendar-header {
  padding: 0 16px;
}

.calendar-title {
  font-size: 28px;
  font-weight: 700;
  color: #b8642f;
}

.calendar-subtitle {
  color: #666;
  margin-top: 4px;
}

.type-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.type-legend-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #555;
}

.type-legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 5px;
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
  background: linear-gradient(135deg, #b8642f 0%, #d17d45 100%);
  color: white;
  font-weight: 600;
}

.court-badge {
  color: #b8642f !important;
  font-weight: 700;
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
  grid-template-rows: repeat(14, minmax(60px, auto));
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
  padding: 3px;
  position: relative;
  min-width: 100px;
  overflow: hidden;
}

.day-cell-events {
  display: flex;
  flex-direction: row;
  gap: 2px;
  height: 100%;
  align-items: stretch;
}

.week-event {
  flex: 1;
  min-width: 0;
  padding: 4px 5px;
  border-radius: 5px;
  border-left: 4px solid;
  color: white;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.week-event:hover {
  opacity: 0.88;
  transform: scale(1.02);
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.week-event-single {
  max-width: 100%;
}

.week-event-court-badge {
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.3);
  padding: 1px 5px;
  border-radius: 3px;
  margin-bottom: 2px;
  display: inline-block;
  align-self: flex-start;
  letter-spacing: 0.3px;
}

.week-event-title {
  font-weight: 600;
  font-size: 10px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.week-event-time {
  font-size: 9px;
  opacity: 0.85;
  margin-top: 1px;
}

.week-more-events {
  flex-shrink: 0;
  min-width: 24px;
  font-size: 10px;
  color: #1976D2;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 4px;
  text-align: center;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px dashed #ccc;
}

.week-more-events:hover {
  background: #e3f2fd;
  border-color: #1976D2;
}

/* Tooltip styles */
.week-event-tooltip {
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.5;
}

.week-event-tooltip-court {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 4px;
}

.week-event-tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.week-event-tooltip-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.week-event-tooltip-time {
  opacity: 0.9;
  font-size: 12px;
}

.week-event-tooltip-group,
.week-event-tooltip-student {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
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
  background: #b8642f;
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

.month-day-tooltip-wrapper {
  min-height: 100%;
  display: block;
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
  border-left: 3px solid;
  font-size: 11px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.month-event-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.3);
  padding: 1px 4px;
  border-radius: 2px;
}

.month-event-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-events {
  font-size: 10px;
  color: #1976D2;
  font-weight: 600;
  margin-top: 4px;
  cursor: pointer;
  padding: 2px 0;
  transition: opacity 0.2s;
}

.more-events:hover {
  text-decoration: underline;
}

.month-day-tooltip {
  max-width: 280px;
  padding: 4px 0;
}

.month-day-tooltip-item {
  font-size: 12px;
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.month-day-tooltip-item:last-child {
  border-bottom: none;
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

/* --- Telefon: takvim ızgaralarını dokunmatik kaydırılabilir yap --- */
@media (max-width: 600px) {
  /* Hafta görünümü: SADECE dış sarmalayıcı (.week-grid) kaydırılsın; header ve
     body birlikte kaysın. .week-body'ye ayrı overflow VERME — yoksa header ile
     body bağımsız kayar. */
  .week-grid {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Izgara container'larını içeriğe kadar genişlet. Aksi halde blok elemanın
     kutusu yalnızca viewport kadar olur; gri arka plandan gelen ayırıcı çizgiler
     ve kenarlık Perşembeden sonra (taşan kısımda) kaybolur. */
  .week-header,
  .week-body {
    width: max-content;
    min-width: 100%;
  }

  /* Saat sütununu (her satırın ilk hücresi) kaydırırken sabit tut */
  .week-header .time-column,
  .hour-row .time-column {
    position: sticky;
    left: 0;
    z-index: 2;
    background: white;
  }

  /* Ay görünümü: 7 gün 375px'te çok dar — yatay kaydırılabilir min genişlik ver */
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
    padding: 3px;
  }
  .month-day-header {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>
