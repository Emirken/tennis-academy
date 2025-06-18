<template>
  <div class="attendance-table">
    <!-- Header Section -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-calendar-check" class="mr-2" />
        My Attendance Record
      </v-card-title>
      <v-card-text class="pa-6">
        <!-- Filters -->
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="filters.dateFrom"
                label="From Date"
                type="date"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="filters.dateTo"
                label="To Date"
                type="date"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.lessonType"
                label="Lesson Type"
                :items="lessonTypes"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-school"
                clearable
                @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.status"
                label="Status"
                :items="statusOptions"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-filter"
                clearable
                @update:model-value="applyFilters"
            />
          </v-col>
        </v-row>

        <!-- Quick Stats -->
        <v-row class="mt-4">
          <v-col cols="6" md="3">
            <v-card class="stat-card" color="success" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-check-circle" size="32" color="success" class="mb-2" />
                <div class="text-h6 font-weight-bold text-success">{{ stats.present }}</div>
                <div class="text-caption">Present</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="stat-card" color="error" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-close-circle" size="32" color="error" class="mb-2" />
                <div class="text-h6 font-weight-bold text-error">{{ stats.absent }}</div>
                <div class="text-caption">Absent</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="stat-card" color="warning" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-clock-alert" size="32" color="warning" class="mb-2" />
                <div class="text-h6 font-weight-bold text-warning">{{ stats.late }}</div>
                <div class="text-caption">Late</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="stat-card" color="info" variant="tonal">
              <v-card-text class="text-center pa-4">
                <v-icon icon="mdi-percent" size="32" color="info" class="mb-2" />
                <div class="text-h6 font-weight-bold text-info">{{ attendanceRate }}%</div>
                <div class="text-caption">Attendance Rate</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Attendance Table -->
    <v-card elevation="4">
      <v-card-title class="pa-6 bg-success text-white d-flex justify-space-between align-center">
        <div>
          <v-icon icon="mdi-table" class="mr-2" />
          Attendance History
        </div>
        <div class="d-flex align-center">
          <v-chip color="white" variant="flat" class="mr-3">
            {{ filteredAttendance.length }} records
          </v-chip>
          <v-btn
              color="white"
              variant="text"
              size="small"
              prepend-icon="mdi-download"
              @click="exportAttendance"
          >
            Export
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Desktop Table -->
        <v-data-table
            :headers="headers"
            :items="filteredAttendance"
            :items-per-page="itemsPerPage"
            :loading="loading"
            class="elevation-0 d-none d-md-table"
            :sort-by="sortBy"
        >
          <template #item.date="{ item }">
            <div class="date-cell">
              <div class="font-weight-medium">{{ formatDate(item.date) }}</div>
              <div class="text-caption text-grey">{{ formatWeekday(item.date) }}</div>
            </div>
          </template>

          <template #item.time="{ item }">
            <div class="time-cell">
              <div class="font-weight-medium">{{ item.startTime }} - {{ item.endTime }}</div>
              <div class="text-caption text-grey">{{ calculateDuration(item.startTime, item.endTime) }}</div>
            </div>
          </template>

          <template #item.lessonType="{ item }">
            <v-chip
                :color="getLessonTypeColor(item.lessonType)"
                size="small"
                variant="flat"
            >
              <v-icon :icon="getLessonTypeIcon(item.lessonType)" size="16" class="mr-1" />
              {{ item.lessonType }}
            </v-chip>
          </template>

          <template #item.instructor="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" :color="getInstructorColor(item.instructor)" class="mr-2">
                <span class="text-white text-caption font-weight-bold">
                  {{ getInitials(item.instructor) }}
                </span>
              </v-avatar>
              <span>{{ item.instructor }}</span>
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
                :prepend-icon="getStatusIcon(item.status)"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #item.checkedInAt="{ item }">
            <div v-if="item.checkedInAt" class="check-in-cell">
              <div class="font-weight-medium">{{ formatTime(item.checkedInAt) }}</div>
              <div class="text-caption" :class="getCheckInStatusClass(item)">
                {{ getCheckInStatus(item) }}
              </div>
            </div>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.notes="{ item }">
            <div v-if="item.notes" class="notes-cell">
              <v-tooltip :text="item.notes" location="top">
                <template #activator="{ props }">
                  <v-chip
                      size="small"
                      variant="outlined"
                      v-bind="props"
                  >
                    <v-icon icon="mdi-note-text" size="16" />
                  </v-chip>
                </template>
              </v-tooltip>
            </div>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex">
              <v-tooltip text="View Details">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-eye"
                      size="small"
                      color="info"
                      variant="text"
                      v-bind="props"
                      @click="viewDetails(item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="canRequestExcuse(item)" text="Request Excuse">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-account-question"
                      size="small"
                      color="warning"
                      variant="text"
                      v-bind="props"
                      @click="requestExcuse(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>

        <!-- Mobile Cards -->
        <div class="d-md-none mobile-attendance">
          <v-card
              v-for="record in filteredAttendance"
              :key="record.id"
              class="mb-3 mx-4"
              elevation="2"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-start mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">{{ formatDate(record.date) }}</div>
                  <div class="text-caption text-grey">{{ formatWeekday(record.date) }}</div>
                </div>
                <v-chip
                    :color="getStatusColor(record.status)"
                    size="small"
                    variant="flat"
                    :prepend-icon="getStatusIcon(record.status)"
                >
                  {{ getStatusText(record.status) }}
                </v-chip>
              </div>

              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-grey">Time</div>
                  <div class="font-weight-medium">{{ record.startTime }} - {{ record.endTime }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Duration</div>
                  <div class="font-weight-medium">{{ calculateDuration(record.startTime, record.endTime) }}</div>
                </v-col>
              </v-row>

              <v-row dense class="mt-2">
                <v-col cols="12">
                  <div class="text-caption text-grey">Lesson Type</div>
                  <v-chip
                      :color="getLessonTypeColor(record.lessonType)"
                      size="small"
                      variant="flat"
                      class="mt-1"
                  >
                    <v-icon :icon="getLessonTypeIcon(record.lessonType)" size="16" class="mr-1" />
                    {{ record.lessonType }}
                  </v-chip>
                </v-col>
              </v-row>

              <v-row dense class="mt-2">
                <v-col cols="6">
                  <div class="text-caption text-grey">Instructor</div>
                  <div class="d-flex align-center mt-1">
                    <v-avatar size="24" :color="getInstructorColor(record.instructor)" class="mr-2">
                      <span class="text-white text-caption font-weight-bold">
                        {{ getInitials(record.instructor) }}
                      </span>
                    </v-avatar>
                    <span class="text-body-2">{{ record.instructor }}</span>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey">Check-in</div>
                  <div v-if="record.checkedInAt" class="mt-1">
                    <div class="text-body-2 font-weight-medium">{{ formatTime(record.checkedInAt) }}</div>
                    <div class="text-caption" :class="getCheckInStatusClass(record)">
                      {{ getCheckInStatus(record) }}
                    </div>
                  </div>
                  <span v-else class="text-grey text-body-2">-</span>
                </v-col>
              </v-row>

              <div v-if="record.notes" class="mt-3">
                <div class="text-caption text-grey">Notes</div>
                <div class="text-body-2 mt-1">{{ record.notes }}</div>
              </div>

              <v-card-actions class="pa-0 mt-3">
                <v-btn
                    color="info"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-eye"
                    @click="viewDetails(record)"
                >
                  View Details
                </v-btn>
                <v-spacer />
                <v-btn
                    v-if="canRequestExcuse(record)"
                    color="warning"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-account-question"
                    @click="requestExcuse(record)"
                >
                  Request Excuse
                </v-btn>
              </v-card-actions>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty State -->
        <div v-if="filteredAttendance.length === 0" class="empty-state pa-8 text-center">
          <v-icon icon="mdi-calendar-remove" size="64" color="grey-lighten-2" class="mb-4" />
          <h3 class="text-h6 text-grey mb-2">No Attendance Records</h3>
          <p class="text-body-2 text-grey">
            No attendance records found for the selected filters.
          </p>
          <v-btn color="primary" variant="outlined" @click="clearFilters">
            Clear Filters
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="600">
      <v-card v-if="selectedRecord">
        <v-card-title class="pa-6 bg-info text-white">
          <v-icon icon="mdi-information" class="mr-2" />
          Attendance Details
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-h6 mb-3">Lesson Information</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Date:</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedRecord.date) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Time:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedRecord.startTime }} - {{ selectedRecord.endTime }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Duration:</v-list-item-title>
                  <v-list-item-subtitle>{{ calculateDuration(selectedRecord.startTime, selectedRecord.endTime) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Lesson Type:</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                        :color="getLessonTypeColor(selectedRecord.lessonType)"
                        size="small"
                        variant="flat"
                    >
                      {{ selectedRecord.lessonType }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Instructor:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedRecord.instructor }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <h4 class="text-h6 mb-3">Attendance Status</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Status:</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                        :color="getStatusColor(selectedRecord.status)"
                        size="small"
                        variant="flat"
                        :prepend-icon="getStatusIcon(selectedRecord.status)"
                    >
                      {{ getStatusText(selectedRecord.status) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedRecord.checkedInAt">
                  <v-list-item-title>Check-in Time:</v-list-item-title>
                  <v-list-item-subtitle>{{ formatTime(selectedRecord.checkedInAt) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedRecord.checkedInAt">
                  <v-list-item-title>Check-in Status:</v-list-item-title>
                  <v-list-item-subtitle>
                    <span :class="getCheckInStatusClass(selectedRecord)">
                      {{ getCheckInStatus(selectedRecord) }}
                    </span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedRecord.notes">
                  <v-list-item-title>Notes:</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedRecord.notes }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showDetailsDialog = false">Close</v-btn>
          <v-btn
              v-if="canRequestExcuse(selectedRecord)"
              color="warning"
              variant="outlined"
              @click="requestExcuse(selectedRecord)"
          >
            Request Excuse
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
interface AttendanceRecord {
  id: string
  date: Date
  startTime: string
  endTime: string
  lessonType: string
  instructor: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checkedInAt?: Date
  notes?: string
  court?: string
}

// Data
const loading = ref(false)
const showDetailsDialog = ref(false)
const selectedRecord = ref<AttendanceRecord | null>(null)
const successSnackbar = ref(false)
const successMessage = ref('')
const itemsPerPage = ref(10)

// Filters
const filters = reactive({
  dateFrom: '',
  dateTo: '',
  lessonType: '',
  status: ''
})

// Sort options
const sortBy:any = ref([{ key: 'date', order: 'desc' }])

// Options
const lessonTypes = [
  'Private Lesson',
  'Group Lesson',
  'Tennis Clinic',
  'Training Session',
  'Match Practice'
]

const statusOptions = [
  { title: 'Present', value: 'present' },
  { title: 'Absent', value: 'absent' },
  { title: 'Late', value: 'late' },
  { title: 'Excused', value: 'excused' }
]

// Table headers
const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Time', key: 'time', sortable: false },
  { title: 'Lesson Type', key: 'lessonType', sortable: true },
  { title: 'Instructor', key: 'instructor', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Check-in', key: 'checkedInAt', sortable: true },
  { title: 'Notes', key: 'notes', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Mock attendance data
const attendanceRecords = ref<AttendanceRecord[]>([
  {
    id: '1',
    date: new Date('2025-06-01'),
    startTime: '09:00',
    endTime: '10:00',
    lessonType: 'Private Lesson',
    instructor: 'Coach Smith',
    status: 'present',
    checkedInAt: new Date('2025-06-01T08:55:00'),
    notes: 'Great progress on backhand technique',
    court: 'Court 1'
  },
  {
    id: '2',
    date: new Date('2025-05-30'),
    startTime: '14:00',
    endTime: '15:30',
    lessonType: 'Group Lesson',
    instructor: 'Coach Johnson',
    status: 'late',
    checkedInAt: new Date('2025-05-30T14:10:00'),
    notes: 'Arrived 10 minutes late',
    court: 'Court 2'
  },
  {
    id: '3',
    date: new Date('2025-05-28'),
    startTime: '16:00',
    endTime: '17:00',
    lessonType: 'Tennis Clinic',
    instructor: 'Coach Wilson',
    status: 'absent',
    notes: 'Sick - doctor appointment'
  },
  {
    id: '4',
    date: new Date('2025-05-25'),
    startTime: '10:00',
    endTime: '11:00',
    lessonType: 'Private Lesson',
    instructor: 'Coach Smith',
    status: 'present',
    checkedInAt: new Date('2025-05-25T09:58:00'),
    court: 'Court 1'
  },
  {
    id: '5',
    date: new Date('2025-05-23'),
    startTime: '18:00',
    endTime: '19:00',
    lessonType: 'Training Session',
    instructor: 'Coach Davis',
    status: 'excused',
    notes: 'Family emergency - pre-approved absence'
  }
])

// Computed
const filteredAttendance = computed(() => {
  let filtered = attendanceRecords.value

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    filtered = filtered.filter(record => record.date >= fromDate)
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    filtered = filtered.filter(record => record.date <= toDate)
  }

  if (filters.lessonType) {
    filtered = filtered.filter(record => record.lessonType === filters.lessonType)
  }

  if (filters.status) {
    filtered = filtered.filter(record => record.status === filters.status)
  }

  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
})

const stats = computed(() => {
  const records = filteredAttendance.value
  return {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length
  }
})

const attendanceRate = computed(() => {
  const totalSessions = filteredAttendance.value.length
  const attendedSessions = stats.value.present + stats.value.late
  return totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0
})

// Methods
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatWeekday = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', { weekday: 'long' })
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateDuration = (startTime: string, endTime: string): string => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const durationMinutes = endMinutes - startMinutes

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  } else if (minutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${minutes}m`
  }
}

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getLessonTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'Private Lesson': 'primary',
    'Group Lesson': 'success',
    'Tennis Clinic': 'warning',
    'Training Session': 'info',
    'Match Practice': 'error'
  }
  return colors[type] || 'grey'
}

const getLessonTypeIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    'Private Lesson': 'mdi-account',
    'Group Lesson': 'mdi-account-group',
    'Tennis Clinic': 'mdi-school',
    'Training Session': 'mdi-dumbbell',
    'Match Practice': 'mdi-trophy'
  }
  return icons[type] || 'mdi-tennis'
}

const getInstructorColor = (instructor: string): string => {
  const colors = ['primary', 'success', 'warning', 'info', 'error']
  const index = instructor.length % colors.length
  return colors[index]
}

const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    'present': 'success',
    'absent': 'error',
    'late': 'warning',
    'excused': 'info'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status: string): string => {
  const icons: { [key: string]: string } = {
    'present': 'mdi-check-circle',
    'absent': 'mdi-close-circle',
    'late': 'mdi-clock-alert',
    'excused': 'mdi-account-check'
  }
  return icons[status] || 'mdi-help-circle'
}

const getStatusText = (status: string): string => {
  const texts: { [key: string]: string } = {
    'present': 'Present',
    'absent': 'Absent',
    'late': 'Late',
    'excused': 'Excused'
  }
  return texts[status] || status
}

const getCheckInStatus = (record: AttendanceRecord): string => {
  if (!record.checkedInAt) return '-'

  const lessonStart = new Date(record.date)
  const [hours, minutes] = record.startTime.split(':').map(Number)
  lessonStart.setHours(hours, minutes, 0, 0)

  const diffMinutes = Math.floor((record.checkedInAt.getTime() - lessonStart.getTime()) / (1000 * 60))

  if (diffMinutes <= -5) return 'Early'
  if (diffMinutes <= 5) return 'On Time'
  return `${diffMinutes} min late`
}

const getCheckInStatusClass = (record: AttendanceRecord): string => {
  if (!record.checkedInAt) return ''

  const lessonStart = new Date(record.date)
  const [hours, minutes] = record.startTime.split(':').map(Number)
  lessonStart.setHours(hours, minutes, 0, 0)

  const diffMinutes = Math.floor((record.checkedInAt.getTime() - lessonStart.getTime()) / (1000 * 60))

  if (diffMinutes <= 5) return 'text-success'
  if (diffMinutes <= 15) return 'text-warning'
  return 'text-error'
}

const canRequestExcuse = (record: AttendanceRecord): boolean => {
  return record.status === 'absent' && !record.notes?.includes('pre-approved')
}

const applyFilters = () => {
  // Filters are applied reactively through computed property
}

const clearFilters = () => {
  Object.assign(filters, {
    dateFrom: '',
    dateTo: '',
    lessonType: '',
    status: ''
  })
}

const viewDetails = (record: AttendanceRecord) => {
  selectedRecord.value = record
  showDetailsDialog.value = true
}

const requestExcuse = (record: AttendanceRecord) => {
  // In a real app, this would open a form or send a request
  console.log('Requesting excuse for:', record)
  successMessage.value = 'Excuse request submitted successfully'
  successSnackbar.value = true
}

const exportAttendance = () => {
  // In a real app, this would generate and download a file
  console.log('Exporting attendance data:', filteredAttendance.value)
  successMessage.value = 'Attendance data exported successfully'
  successSnackbar.value = true
}

onMounted(() => {
  // Set default date range to last 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0]
  filters.dateTo = today.toISOString().split('T')[0]
})
</script>

<style scoped>
.attendance-table {
  padding: 0;
}

/* Stats Cards */
.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

/* Table Styling */
:deep(.v-data-table) {
  border-radius: 0;
}

.date-cell,
.time-cell,
.check-in-cell {
  min-width: 100px;
}

.notes-cell {
  max-width: 60px;
}

/* Mobile Cards */
.mobile-attendance {
  padding-bottom: 16px;
}

.mobile-attendance .v-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.mobile-attendance .v-card:hover {
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Status Colors */
.text-success {
  color: #4CAF50;
}

.text-warning {
  color: #FF9800;
}

.text-error {
  color: #F44336;
}

.text-info {
  color: #2196F3;
}

/* Responsive Design */
@media (max-width: 960px) {
  .stat-card .text-h6 {
    font-size: 1.25rem;
  }
}

@media (max-width: 600px) {
  .mobile-attendance {
    margin: 0 8px;
  }

  .mobile-attendance .v-card {
    margin: 0 0 12px 0;
  }

  .stat-card .text-h6 {
    font-size: 1.125rem;
  }
}

/* Loading Animation */
.v-data-table--loading {
  position: relative;
}

/* Chip Styling */
:deep(.v-chip) {
  font-weight: 500;
}

:deep(.v-chip--size-small) {
  height: 24px;
  font-size: 0.75rem;
}

/* Avatar Styling */
:deep(.v-avatar) {
  font-size: 0.75rem;
}

/* List Styling in Dialog */
:deep(.v-list-item) {
  min-height: 40px;
}

:deep(.v-list-item-title) {
  font-weight: 500;
  color: #666;
}

:deep(.v-list-item-subtitle) {
  font-weight: 600;
  color: #333;
}

/* Card Actions */
:deep(.v-card-actions) {
  padding: 16px 0 0 0;
}

/* Tooltip Styling */
:deep(.v-tooltip .v-overlay__content) {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  font-size: 0.875rem;
  max-width: 300px;
}

/* Snackbar Styling */
:deep(.v-snackbar) {
  border-radius: 8px;
}

/* Filter Section */
.filters-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

/* Table Header */
:deep(.v-data-table-header th) {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
}

/* Table Rows */
:deep(.v-data-table tbody tr:hover) {
  background-color: #f8f9fa;
}

/* Status Chip Icons */
:deep(.v-chip .v-icon) {
  margin-right: 4px;
}

/* Progress Indicators */
.attendance-progress {
  margin: 16px 0;
}

.progress-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  min-width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-bar {
  flex-grow: 1;
  margin: 0 12px;
}

.progress-value {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Dark Theme Support */
@media (prefers-color-scheme: dark) {
  .filters-section {
    background: #2d2d2d;
  }

  :deep(.v-data-table-header th) {
    background-color: #2d2d2d;
    color: #fff;
  }

  :deep(.v-data-table tbody tr:hover) {
    background-color: #333;
  }

  .empty-state {
    color: #fff;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: more) {
  .stat-card,
  .mobile-attendance .v-card {
    border: 2px solid #000;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
  }

  :deep(.v-data-table) {
    border: 1px solid #000;
  }
}

/* Print Styles */
@media print {
  .attendance-table {
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .mobile-attendance {
    display: none;
  }

  :deep(.v-btn),
  .v-card-actions {
    display: none;
  }

  :deep(.v-data-table) {
    border: 1px solid #000;
  }

  :deep(.v-chip) {
    border: 1px solid #000;
    background-color: #f0f0f0 !important;
    color: #000 !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .mobile-attendance .v-card {
    transition: none;
  }

  .stat-card:hover,
  .mobile-attendance .v-card:hover {
    transform: none;
  }
}

/* Focus Styles */
:deep(.v-btn:focus),
:deep(.v-text-field:focus-within),
:deep(.v-select:focus-within) {
  outline: 2px solid #2E7D32;
  outline-offset: 2px;
}

/* Custom Scrollbar */
.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Loading Skeleton */
.loading-skeleton {
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

/* Error States */
.error-state {
  padding: 32px;
  text-align: center;
  color: #F44336;
}

.error-state .v-icon {
  margin-bottom: 16px;
}

/* Success States */
.success-state {
  padding: 32px;
  text-align: center;
  color: #4CAF50;
}

/* Info Callouts */
.info-callout {
  background: #E3F2FD;
  border-left: 4px solid #2196F3;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 16px 0;
}

.info-callout .v-icon {
  color: #2196F3;
  margin-right: 8px;
}

/* Warning Callouts */
.warning-callout {
  background: #FFF8E1;
  border-left: 4px solid #FF9800;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 16px 0;
}

.warning-callout .v-icon {
  color: #FF9800;
  margin-right: 8px;
}
</style>