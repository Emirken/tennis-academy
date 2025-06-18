<template>
  <div class="reservation-calendar">
    <!-- Header -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-calendar" class="mr-2" />
        Court Reservation Calendar
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="3">
            <v-select
                v-model="selectedCourt"
                label="Select Court"
                :items="courts"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-tennis"
                @update:model-value="loadReservations"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="selectedDate"
                label="Date"
                type="date"
                variant="outlined"
                density="compact"
                :min="today"
                @update:model-value="loadReservations"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="viewType"
                label="View"
                :items="viewTypes"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-view-grid"
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-end">
            <v-btn
                color="success"
                variant="flat"
                block
                @click="showQuickReserveDialog = true"
            >
              <v-icon icon="mdi-plus" class="mr-2" />
              Quick Reserve
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Calendar Grid View -->
    <v-card v-if="viewType === 'grid'" elevation="4">
      <v-card-text class="pa-0">
        <div class="calendar-grid">
          <!-- Time Header -->
          <div class="time-header">
            <div class="court-label">Time</div>
            <div
                v-for="court in filteredCourts"
                :key="court.id"
                class="court-header"
            >
              <div class="court-name">{{ court.name }}</div>
              <div class="court-type">{{ court.type }}</div>
            </div>
          </div>

          <!-- Time Slots -->
          <div
              v-for="timeSlot in timeSlots"
              :key="timeSlot.time"
              class="time-row"
          >
            <div class="time-label">
              <span class="time-text">{{ timeSlot.time }}</span>
              <span class="duration-text">{{ timeSlot.duration }}</span>
            </div>

            <div
                v-for="court in filteredCourts"
                :key="`${court.id}-${timeSlot.time}`"
                class="time-slot"
                :class="getSlotClass(court.id, timeSlot.time)"
                @click="handleSlotClick(court, timeSlot)"
            >
              <div
                  v-if="getReservation(court.id, timeSlot.time)"
                  class="reservation-info"
              >
                <div class="reservation-title">
                  {{ getReservation(court.id, timeSlot.time)?.title }}
                </div>
                <div class="reservation-user">
                  {{ getReservation(court.id, timeSlot.time)?.userName }}
                </div>
              </div>
              <div v-else class="slot-available">
                <v-icon icon="mdi-plus" size="16" />
                Available
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- List View -->
    <v-card v-else-if="viewType === 'list'" elevation="4">
      <v-card-title class="pa-6 bg-success text-white">
        <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
        Reservations List
      </v-card-title>
      <v-card-text class="pa-0">
        <v-data-table
            :headers="listHeaders"
            :items="todayReservations"
            :items-per-page="10"
            class="elevation-0"
        >
          <template #item.court="{ item }">
            <v-chip
                :color="getCourtColor(item.courtType)"
                size="small"
                variant="flat"
            >
              {{ item.courtName }}
            </v-chip>
          </template>

          <template #item.time="{ item }">
            <div>
              <div class="font-weight-medium">{{ item.startTime }} - {{ item.endTime }}</div>
              <div class="text-caption text-grey">{{ item.duration }}</div>
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-tooltip text="View Details">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-eye"
                    size="small"
                    color="info"
                    variant="text"
                    v-bind="props"
                    @click="viewReservation(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Edit Reservation">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-pencil"
                    size="small"
                    color="primary"
                    variant="text"
                    v-bind="props"
                    @click="editReservation(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Cancel Reservation">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-delete"
                    size="small"
                    color="error"
                    variant="text"
                    v-bind="props"
                    @click="cancelReservation(item)"
                />
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Weekly View -->
    <v-card v-else elevation="4">
      <v-card-title class="pa-6 bg-info text-white d-flex justify-space-between">
        <div>
          <v-icon icon="mdi-calendar-week" class="mr-2" />
          Weekly View
        </div>
        <div class="d-flex align-center">
          <v-btn
              icon="mdi-chevron-left"
              size="small"
              color="white"
              variant="text"
              @click="previousWeek"
          />
          <span class="mx-3">{{ weekRange }}</span>
          <v-btn
              icon="mdi-chevron-right"
              size="small"
              color="white"
              variant="text"
              @click="nextWeek"
          />
        </div>
      </v-card-title>
      <v-card-text class="pa-0">
        <div class="weekly-calendar">
          <!-- Day Headers -->
          <div class="week-header">
            <div class="time-column">Time</div>
            <div
                v-for="day in weekDays"
                :key="day.date"
                class="day-header"
                :class="{ 'today': day.isToday }"
            >
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>

          <!-- Time Slots for Week -->
          <div
              v-for="timeSlot in timeSlots"
              :key="timeSlot.time"
              class="week-row"
          >
            <div class="time-column">
              <span class="time-text">{{ timeSlot.time }}</span>
            </div>
            <div
                v-for="day in weekDays"
                :key="`${day.date}-${timeSlot.time}`"
                class="day-slot"
                @click="handleWeekSlotClick(day, timeSlot)"
            >
              <div
                  v-if="getWeeklyReservation(day.date, timeSlot.time)"
                  class="week-reservation"
                  :class="getWeeklyReservationClass(day.date, timeSlot.time)"
              >
                {{ getWeeklyReservation(day.date, timeSlot.time)?.title }}
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Legend -->
    <v-card class="mt-6" elevation="4">
      <v-card-title class="pa-4">
        <v-icon icon="mdi-information" class="mr-2" />
        Legend
      </v-card-title>
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="6" md="3">
            <div class="d-flex align-center mb-2">
              <div class="legend-box available-legend"></div>
              <span class="ml-2">Available</span>
            </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="d-flex align-center mb-2">
              <div class="legend-box reserved-legend"></div>
              <span class="ml-2">Reserved</span>
            </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="d-flex align-center mb-2">
              <div class="legend-box maintenance-legend"></div>
              <span class="ml-2">Maintenance</span>
            </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="d-flex align-center mb-2">
              <div class="legend-box blocked-legend"></div>
              <span class="ml-2">Blocked</span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Quick Reserve Dialog -->
    <v-dialog v-model="showQuickReserveDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 pa-6">
          <v-icon icon="mdi-calendar-plus" class="mr-2" />
          Quick Reservation
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="reservationForm" v-model="reservationValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                    v-model="quickReservation.courtId"
                    label="Court"
                    :items="courts"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    :rules="courtRules"
                    required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                    v-model="quickReservation.date"
                    label="Date"
                    type="date"
                    variant="outlined"
                    :rules="dateRules"
                    :min="today"
                    required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                    v-model="quickReservation.startTime"
                    label="Start Time"
                    :items="availableTimeSlots"
                    variant="outlined"
                    :rules="timeRules"
                    required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                    v-model="quickReservation.duration"
                    label="Duration"
                    :items="durationOptions"
                    variant="outlined"
                    :rules="durationRules"
                    required
                />
              </v-col>
            </v-row>

            <v-text-field
                v-model="quickReservation.title"
                label="Reservation Title"
                variant="outlined"
                :rules="titleRules"
                required
            />

            <v-textarea
                v-model="quickReservation.notes"
                label="Notes (optional)"
                variant="outlined"
                rows="3"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showQuickReserveDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!reservationValid"
              :loading="reservationLoading"
              @click="createQuickReservation"
          >
            Create Reservation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="3000"
        location="top"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// Define interfaces
interface Court {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  status: 'available' | 'maintenance' | 'blocked'
  hourlyRate: number
}

interface TimeSlot {
  time: string
  duration: string
  available: boolean
}

interface Reservation {
  id: string
  courtId: string
  courtName: string
  courtType: string
  date: string
  startTime: string
  endTime: string
  duration: string
  title: string
  userName: string
  status: 'confirmed' | 'pending' | 'cancelled'
  notes?: string
}

interface WeekDay {
  name: string
  date: string
  isToday: boolean
}

// Data
const selectedCourt = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const viewType = ref('grid')
const showQuickReserveDialog = ref(false)
const reservationLoading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const reservationValid = ref(false)
const currentWeek = ref(new Date())

const today = new Date().toISOString().split('T')[0]

// Quick reservation form
const quickReservation = reactive({
  courtId: '',
  date: today,
  startTime: '',
  duration: '60',
  title: '',
  notes: ''
})

// View types
const viewTypes = [
  { title: 'Grid View', value: 'grid' },
  { title: 'List View', value: 'list' },
  { title: 'Weekly View', value: 'week' }
]

// Duration options
const durationOptions = [
  { title: '30 minutes', value: '30' },
  { title: '1 hour', value: '60' },
  { title: '1.5 hours', value: '90' },
  { title: '2 hours', value: '120' }
]

// Mock courts data
const courts = ref<Court[]>([
  { id: '1', name: 'Court 1', type: 'indoor', status: 'available', hourlyRate: 25 },
  { id: '2', name: 'Court 2', type: 'outdoor', status: 'available', hourlyRate: 20 },
  { id: '3', name: 'Court 3', type: 'indoor', status: 'maintenance', hourlyRate: 25 },
  { id: '4', name: 'Court 4', type: 'outdoor', status: 'available', hourlyRate: 20 }
])

// Time slots (8 AM to 10 PM)
const timeSlots = ref<TimeSlot[]>([
  { time: '08:00', duration: '1 hour', available: true },
  { time: '09:00', duration: '1 hour', available: true },
  { time: '10:00', duration: '1 hour', available: true },
  { time: '11:00', duration: '1 hour', available: true },
  { time: '12:00', duration: '1 hour', available: true },
  { time: '13:00', duration: '1 hour', available: true },
  { time: '14:00', duration: '1 hour', available: true },
  { time: '15:00', duration: '1 hour', available: true },
  { time: '16:00', duration: '1 hour', available: true },
  { time: '17:00', duration: '1 hour', available: true },
  { time: '18:00', duration: '1 hour', available: true },
  { time: '19:00', duration: '1 hour', available: true },
  { time: '20:00', duration: '1 hour', available: true },
  { time: '21:00', duration: '1 hour', available: true }
])

// Mock reservations data
const reservations = ref<Reservation[]>([
  {
    id: '1',
    courtId: '1',
    courtName: 'Court 1',
    courtType: 'indoor',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    duration: '1 hour',
    title: 'Private Lesson',
    userName: 'Ahmet Yılmaz',
    status: 'confirmed'
  },
  {
    id: '2',
    courtId: '2',
    courtName: 'Court 2',
    courtType: 'outdoor',
    date: today,
    startTime: '14:00',
    endTime: '15:30',
    duration: '1.5 hours',
    title: 'Group Training',
    userName: 'Ayşe Demir',
    status: 'confirmed'
  },
  {
    id: '3',
    courtId: '1',
    courtName: 'Court 1',
    courtType: 'indoor',
    date: today,
    startTime: '18:00',
    endTime: '19:00',
    duration: '1 hour',
    title: 'Match Practice',
    userName: 'Mehmet Kaya',
    status: 'pending'
  }
])

// Table headers for list view
const listHeaders = [
  { title: 'Court', key: 'court', sortable: true },
  { title: 'Time', key: 'time', sortable: true },
  { title: 'Title', key: 'title', sortable: true },
  { title: 'User', key: 'userName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Validation rules
const courtRules = [
  (v: string) => !!v || 'Court is required'
]

const dateRules = [
  (v: string) => !!v || 'Date is required'
]

const timeRules = [
  (v: string) => !!v || 'Start time is required'
]

const durationRules = [
  (v: string) => !!v || 'Duration is required'
]

const titleRules = [
  (v: string) => !!v || 'Title is required',
  (v: string) => v.length >= 3 || 'Title must be at least 3 characters'
]

// Computed
const filteredCourts = computed(() => {
  if (selectedCourt.value) {
    return courts.value.filter(court => court.id === selectedCourt.value)
  }
  return courts.value
})

const todayReservations = computed(() => {
  return reservations.value.filter(r => r.date === selectedDate.value)
})

const availableTimeSlots = computed(() => {
  return timeSlots.value.map(slot => ({
    title: slot.time,
    value: slot.time
  }))
})

const weekRange = computed(() => {
  const start = getWeekStart(currentWeek.value)
  const end = getWeekEnd(currentWeek.value)
  return `${formatDate(start)} - ${formatDate(end)}`
})

const weekDays = computed(() => {
  const days: WeekDay[] = []
  const start = getWeekStart(currentWeek.value)

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)

    days.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().split('T')[0],
      isToday: date.toISOString().split('T')[0] === today
    })
  }

  return days
})

// Methods
const getSlotClass = (courtId: string, time: string) => {
  const reservation = getReservation(courtId, time)
  const court = courts.value.find(c => c.id === courtId)

  if (court?.status === 'maintenance') return 'slot-maintenance'
  if (court?.status === 'blocked') return 'slot-blocked'
  if (reservation) {
    if (reservation.status === 'confirmed') return 'slot-reserved'
    if (reservation.status === 'pending') return 'slot-pending'
    return 'slot-cancelled'
  }
  return 'slot-available'
}

const getReservation = (courtId: string, time: string) => {
  return reservations.value.find(r =>
      r.courtId === courtId &&
      r.date === selectedDate.value &&
      r.startTime === time
  )
}

const getCourtColor = (type: string) => {
  return type === 'indoor' ? 'primary' : 'success'
}

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'confirmed': 'success',
    'pending': 'warning',
    'cancelled': 'error'
  }
  return colors[status] || 'grey'
}

const handleSlotClick = (court: Court, timeSlot: TimeSlot) => {
  if (court.status !== 'available') return

  const reservation = getReservation(court.id, timeSlot.time)
  if (reservation) {
    viewReservation(reservation)
  } else {
    // Create new reservation
    quickReservation.courtId = court.id
    quickReservation.date = selectedDate.value
    quickReservation.startTime = timeSlot.time
    showQuickReserveDialog.value = true
  }
}

const handleWeekSlotClick = (day: WeekDay, timeSlot: TimeSlot) => {
  quickReservation.date = day.date
  quickReservation.startTime = timeSlot.time
  showQuickReserveDialog.value = true
}

const getWeeklyReservation = (date: string, time: string) => {
  return reservations.value.find(r =>
      r.date === date && r.startTime === time
  )
}

const getWeeklyReservationClass = (date: string, time: string) => {
  const reservation = getWeeklyReservation(date, time)
  if (!reservation) return ''

  if (reservation.status === 'confirmed') return 'week-confirmed'
  if (reservation.status === 'pending') return 'week-pending'
  return 'week-cancelled'
}

const getWeekStart = (date: Date) => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  return start
}

const getWeekEnd = (date: Date) => {
  const end = getWeekStart(date)
  end.setDate(end.getDate() + 6)
  return end
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short'
  })
}

const previousWeek = () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() - 7)
  currentWeek.value = newWeek
}

const nextWeek = () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() + 7)
  currentWeek.value = newWeek
}

const loadReservations = () => {
  // Simulate loading reservations for selected court/date
  console.log('Loading reservations for:', selectedCourt.value, selectedDate.value)
}

const viewReservation = (reservation: Reservation) => {
  console.log('View reservation:', reservation)
}

const editReservation = (reservation: Reservation) => {
  console.log('Edit reservation:', reservation)
}

const cancelReservation = (reservation: Reservation) => {
  const index = reservations.value.findIndex(r => r.id === reservation.id)
  if (index > -1) {
    reservations.value[index].status = 'cancelled'
    successMessage.value = 'Reservation cancelled successfully'
    successSnackbar.value = true
  }
}

const createQuickReservation = async () => {
  if (!reservationValid.value) return

  reservationLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const court = courts.value.find(c => c.id === quickReservation.courtId)
    const endTime = calculateEndTime(quickReservation.startTime, parseInt(quickReservation.duration))

    const newReservation: Reservation = {
      id: Date.now().toString(),
      courtId: quickReservation.courtId,
      courtName: court?.name || '',
      courtType: court?.type || 'indoor',
      date: quickReservation.date,
      startTime: quickReservation.startTime,
      endTime: endTime,
      duration: `${parseInt(quickReservation.duration) / 60} hour${parseInt(quickReservation.duration) > 60 ? 's' : ''}`,
      title: quickReservation.title,
      userName: 'Current User',
      status: 'confirmed',
      notes: quickReservation.notes
    }

    reservations.value.push(newReservation)

    // Reset form
    Object.assign(quickReservation, {
      courtId: '',
      date: today,
      startTime: '',
      duration: '60',
      title: '',
      notes: ''
    })

    showQuickReserveDialog.value = false
    successMessage.value = 'Reservation created successfully'
    successSnackbar.value = true

  } finally {
    reservationLoading.value = false
  }
}

const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.reservation-calendar {
  padding: 0;
}

/* Grid Calendar Styles */
.calendar-grid {
  display: flex;
  flex-direction: column;
  min-width: 800px;
  overflow-x: auto;
}

.time-header {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.court-label {
  width: 100px;
  padding: 16px 12px;
  font-weight: bold;
  text-align: center;
  border-right: 1px solid #ddd;
}

.court-header {
  flex: 1;
  min-width: 150px;
  padding: 12px;
  text-align: center;
  border-right: 1px solid #ddd;
}

.court-name {
  font-weight: bold;
  color: #2E7D32;
}

.court-type {
  font-size: 0.75rem;
  color: #666;
  text-transform: capitalize;
}

.time-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.time-label {
  width: 100px;
  padding: 16px 12px;
  background-color: #fafafa;
  border-right: 1px solid #ddd;
  text-align: center;
}

.time-text {
  font-weight: bold;
  display: block;
}

.duration-text {
  font-size: 0.75rem;
  color: #666;
}

.time-slot {
  flex: 1;
  min-width: 150px;
  min-height: 60px;
  padding: 8px;
  border-right: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-available {
  background-color: #e8f5e8;
  color: #2E7D32;
  text-align: center;
}

.slot-available:hover {
  background-color: #c8e6c9;
  transform: scale(1.02);
}

.slot-reserved {
  background-color: #ffcdd2;
  color: #c62828;
}

.slot-pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.slot-maintenance {
  background-color: #f3e5f5;
  color: #7b1fa2;
  cursor: not-allowed;
}

.slot-blocked {
  background-color: #fafafa;
  color: #9e9e9e;
  cursor: not-allowed;
}

.slot-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
  text-decoration: line-through;
}

.reservation-info {
  text-align: center;
}

.reservation-title {
  font-weight: bold;
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.reservation-user {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Weekly Calendar Styles */
.weekly-calendar {
  display: flex;
  flex-direction: column;
  min-width: 900px;
  overflow-x: auto;
}

.week-header {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-column {
  width: 80px;
  padding: 12px 8px;
  background-color: #fafafa;
  border-right: 1px solid #ddd;
  text-align: center;
  font-weight: bold;
}

.day-header {
  flex: 1;
  min-width: 120px;
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid #ddd;
}

.day-header.today {
  background-color: #e3f2fd;
  color: #1976d2;
}

.day-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.day-date {
  font-size: 0.875rem;
  color: #666;
}

.week-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.day-slot {
  flex: 1;
  min-width: 120px;
  min-height: 50px;
  border-right: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
  padding: 4px;
}

.day-slot:hover {
  background-color: #f5f5f5;
}

.week-reservation {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 0.75rem;
  font-weight: bold;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-confirmed {
  background-color: #4caf50;
  color: white;
}

.week-pending {
  background-color: #ff9800;
  color: white;
}

.week-cancelled {
  background-color: #f44336;
  color: white;
  text-decoration: line-through;
}

/* Legend Styles */
.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: inline-block;
}

.available-legend {
  background-color: #e8f5e8;
  border: 1px solid #4caf50;
}

.reserved-legend {
  background-color: #ffcdd2;
  border: 1px solid #f44336;
}

.maintenance-legend {
  background-color: #f3e5f5;
  border: 1px solid #9c27b0;
}

.blocked-legend {
  background-color: #fafafa;
  border: 1px solid #9e9e9e;
}

/* Data Table Overrides */
:deep(.v-data-table) {
  border-radius: 0;
}

:deep(.v-data-table-header) {
  background-color: #f5f5f5;
}

/* Dialog Styles */
:deep(.v-dialog .v-card) {
  border-radius: 12px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .calendar-grid,
  .weekly-calendar {
    min-width: 700px;
  }

  .court-header,
  .time-slot {
    min-width: 120px;
  }

  .day-header,
  .day-slot {
    min-width: 100px;
  }
}

@media (max-width: 900px) {
  .calendar-grid,
  .weekly-calendar {
    min-width: 600px;
  }

  .court-header,
  .time-slot {
    min-width: 100px;
  }

  .day-header,
  .day-slot {
    min-width: 80px;
  }

  .reservation-title {
    font-size: 0.75rem;
  }

  .reservation-user {
    font-size: 0.7rem;
  }
}

@media (max-width: 600px) {
  .time-label,
  .time-column {
    width: 60px;
    padding: 8px 4px;
  }

  .court-header,
  .time-slot,
  .day-header,
  .day-slot {
    min-width: 80px;
    padding: 6px;
  }

  .time-slot {
    min-height: 50px;
  }

  .court-name {
    font-size: 0.875rem;
  }

  .court-type {
    font-size: 0.7rem;
  }

  .reservation-title {
    font-size: 0.7rem;
  }

  .reservation-user {
    font-size: 0.65rem;
  }

  .week-reservation {
    font-size: 0.7rem;
    padding: 2px 4px;
  }
}

/* Loading and Animation Styles */
.slot-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Hover Effects */
.time-slot:not(.slot-maintenance):not(.slot-blocked):hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 5;
  position: relative;
}

.day-slot:hover .week-reservation {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Print Styles */
@media print {
  .reservation-calendar {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .time-slot,
  .week-reservation {
    border: 1px solid #000 !important;
  }

  .slot-available {
    background-color: #e8f5e8 !important;
  }

  .slot-reserved {
    background-color: #ffcdd2 !important;
  }

  .slot-maintenance {
    background-color: #f3e5f5 !important;
  }
}

/* Accessibility Improvements */
.time-slot:focus,
.day-slot:focus {
  outline: 2px solid #2E7D32;
  outline-offset: 2px;
}

.time-slot[aria-selected="true"] {
  border: 2px solid #2E7D32;
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .time-slot,
  .day-slot {
    border: 2px solid #000;
  }

  .slot-available {
    background-color: #fff;
    border-color: #0f0;
  }

  .slot-reserved {
    background-color: #fff;
    border-color: #f00;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .time-slot,
  .day-slot,
  .week-reservation {
    transition: none;
  }

  .slot-loading {
    animation: none;
    background: #f0f0f0;
  }
}
</style>