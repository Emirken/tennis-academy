<template>
  <div class="attendance-management">
    <!-- Header Section -->
    <div class="management-header mb-6">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="text-h4 font-weight-bold text-primary">
            <v-icon icon="mdi-clipboard-check" class="mr-2" />
            Attendance Management
          </h2>
          <p class="text-body-1 text-grey-darken-1 mt-2">
            Track and manage student attendance efficiently
          </p>
        </v-col>
        <v-col cols="12" md="6" class="text-md-right">
          <v-btn
              color="primary"
              variant="flat"
              size="large"
              @click="showBulkAttendanceDialog = true"
          >
            <v-icon icon="mdi-plus" class="mr-2" />
            Bulk Attendance
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="success">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-check</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.presentToday }}</h3>
            <p class="text-body-1">Present Today</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="error">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-remove</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.absentToday }}</h3>
            <p class="text-body-1">Absent Today</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="warning">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-percent</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ attendanceRate }}%</h3>
            <p class="text-body-1">Attendance Rate</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="info">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-calendar-today</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.classesToday }}</h3>
            <p class="text-body-1">Classes Today</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-lightning-bolt" class="mr-2" />
        Quick Actions
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="success"
                variant="flat"
                block
                size="large"
                @click="markAllPresent"
            >
              <v-icon icon="mdi-check-all" class="mr-2" />
              Mark All Present
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="warning"
                variant="flat"
                block
                size="large"
                @click="showAddRecordDialog = true"
            >
              <v-icon icon="mdi-plus" class="mr-2" />
              Add Record
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="info"
                variant="flat"
                block
                size="large"
                @click="exportAttendance"
            >
              <v-icon icon="mdi-download" class="mr-2" />
              Export Report
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="purple"
                variant="flat"
                block
                size="large"
                @click="showAnalyticsDialog = true"
            >
              <v-icon icon="mdi-chart-line" class="mr-2" />
              View Analytics
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Filters -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-grey-lighten-4">
        <v-icon icon="mdi-filter" class="mr-2" />
        Filters
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
                v-model="filters.date"
                label="Date"
                type="date"
                variant="outlined"
                density="compact"
                :max="today"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.lesson"
                label="Lesson Type"
                :items="lessonTypes"
                variant="outlined"
                density="compact"
                clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
                v-model="filters.status"
                label="Status"
                :items="statusOptions"
                variant="outlined"
                density="compact"
                clearable
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-end">
            <v-btn
                color="primary"
                variant="flat"
                class="mr-2"
                @click="applyFilters"
            >
              Apply
            </v-btn>
            <v-btn
                color="grey"
                variant="outlined"
                @click="clearFilters"
            >
              Clear
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Attendance Table -->
    <v-card elevation="4">
      <v-card-title class="pa-6 bg-success text-white d-flex justify-space-between">
        <div>
          <v-icon icon="mdi-table" class="mr-2" />
          Attendance Records
        </div>
        <v-chip color="white" variant="flat">
          {{ filteredRecords.length }} records
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-data-table
            :headers="headers"
            :items="filteredRecords"
            :items-per-page="itemsPerPage"
            :loading="loading"
            class="elevation-0"
        >
          <template #item.student="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-3" :color="getStudentColor(item.student.id)">
                <span class="text-white font-weight-bold">
                  {{ getInitials(item.student.name) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.student.name }}</div>
                <div class="text-caption text-grey">{{ item.student.email }}</div>
              </div>
            </div>
          </template>

          <template #item.present="{ item }">
            <v-switch
                v-model="item.present"
                color="success"
                :disabled="!canEdit(item)"
                @update:model-value="updateAttendance(item)"
            />
          </template>

          <template #item.date="{ item }">
            <div>
              <div class="font-weight-medium">{{ formatDate(item.date) }}</div>
              <div class="text-caption text-grey">{{ item.time }}</div>
            </div>
          </template>

          <template #item.lessonType="{ item }">
            <v-chip
                :color="getLessonColor(item.lessonType)"
                size="small"
                variant="flat"
            >
              {{ item.lessonType }}
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip
                :color="item.present ? 'success' : 'error'"
                size="small"
                variant="flat"
            >
              {{ item.present ? 'Present' : 'Absent' }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-tooltip text="Edit Record">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-pencil"
                    size="small"
                    color="primary"
                    variant="text"
                    v-bind="props"
                    @click="editRecord(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Delete Record">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-delete"
                    size="small"
                    color="error"
                    variant="text"
                    v-bind="props"
                    @click="deleteRecord(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Add Note">
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-note-plus"
                    size="small"
                    color="info"
                    variant="text"
                    v-bind="props"
                    @click="addNote(item)"
                />
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Bulk Attendance Dialog -->
    <v-dialog v-model="showBulkAttendanceDialog" max-width="800">
      <v-card>
        <v-card-title class="text-h5 pa-6">
          <v-icon icon="mdi-account-multiple-check" class="mr-2" />
          Bulk Attendance Entry
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                  v-model="bulkForm.date"
                  label="Date"
                  type="date"
                  variant="outlined"
                  :max="today"
                  required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                  v-model="bulkForm.lessonType"
                  label="Lesson Type"
                  :items="lessonTypes"
                  variant="outlined"
                  required
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <h3 class="text-h6 mb-4">Students</h3>
          <div class="student-list">
            <v-row>
              <v-col
                  v-for="student in students"
                  :key="student.id"
                  cols="12"
                  sm="6"
                  md="4"
              >
                <v-card
                    :color="bulkForm.selectedStudents.includes(student.id) ? 'primary' : 'grey-lighten-5'"
                    :variant="bulkForm.selectedStudents.includes(student.id) ? 'flat' : 'outlined'"
                    class="student-card"
                    @click="toggleStudent(student.id)"
                >
                  <v-card-text class="text-center pa-4">
                    <v-avatar
                        size="40"
                        :color="bulkForm.selectedStudents.includes(student.id) ? 'white' : 'primary'"
                        class="mb-2"
                    >
                      <span
                          :class="bulkForm.selectedStudents.includes(student.id) ? 'text-primary' : 'text-white'"
                          class="font-weight-bold"
                      >
                        {{ getInitials(student.name) }}
                      </span>
                    </v-avatar>
                    <div
                        :class="bulkForm.selectedStudents.includes(student.id) ? 'text-white' : 'text-primary'"
                        class="font-weight-medium"
                    >
                      {{ student.name }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-btn @click="selectAllStudents">Select All</v-btn>
          <v-btn @click="clearStudentSelection">Clear All</v-btn>
          <v-spacer />
          <v-btn @click="showBulkAttendanceDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="bulkForm.selectedStudents.length === 0"
              :loading="bulkLoading"
              @click="saveBulkAttendance"
          >
            Save Attendance
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

// Props & Emits
defineEmits(['edit-record', 'delete-record', 'add-note'])

// Data
const loading = ref(false)
const bulkLoading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const showBulkAttendanceDialog = ref(false)
const showAddRecordDialog = ref(false)
const showAnalyticsDialog = ref(false)
const itemsPerPage = ref(15)

const today = new Date().toISOString().split('T')[0]

// Stats
const stats = ref({
  presentToday: 18,
  absentToday: 3,
  classesToday: 5
})

// Filters
const filters = reactive({
  date: today,
  lesson: '',
  status: ''
})

// Bulk form
const bulkForm = reactive({
  date: today,
  lessonType: '',
  selectedStudents: [] as string[]
})

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
  { title: 'Absent', value: 'absent' }
]

// Mock data
const students = ref([
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com' },
  { id: '2', name: 'Ayşe Demir', email: 'ayse@example.com' },
  { id: '3', name: 'Mehmet Kaya', email: 'mehmet@example.com' },
  { id: '4', name: 'Fatma Özkan', email: 'fatma@example.com' },
  { id: '5', name: 'Can Aslan', email: 'can@example.com' }
])

const attendanceRecords = ref([
  {
    id: '1',
    student: { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com' },
    date: new Date(),
    time: '09:00',
    lessonType: 'Private Lesson',
    present: true,
    notes: ''
  },
  {
    id: '2',
    student: { id: '2', name: 'Ayşe Demir', email: 'ayse@example.com' },
    date: new Date(),
    time: '10:00',
    lessonType: 'Group Lesson',
    present: false,
    notes: 'Sick'
  },
  {
    id: '3',
    student: { id: '3', name: 'Mehmet Kaya', email: 'mehmet@example.com' },
    date: new Date(),
    time: '11:00',
    lessonType: 'Tennis Clinic',
    present: true,
    notes: ''
  }
])

// Table headers
const headers = [
  { title: 'Student', key: 'student', sortable: true },
  { title: 'Date & Time', key: 'date', sortable: true },
  { title: 'Lesson Type', key: 'lessonType', sortable: true },
  { title: 'Present', key: 'present', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed
const attendanceRate = computed(() => {
  const total = stats.value.presentToday + stats.value.absentToday
  return total > 0 ? Math.round((stats.value.presentToday / total) * 100) : 0
})

const filteredRecords = computed(() => {
  let filtered = attendanceRecords.value

  if (filters.date) {
    filtered = filtered.filter(record =>
        record.date.toISOString().split('T')[0] === filters.date
    )
  }

  if (filters.lesson) {
    filtered = filtered.filter(record => record.lessonType === filters.lesson)
  }

  if (filters.status) {
    const isPresent = filters.status === 'present'
    filtered = filtered.filter(record => record.present === isPresent)
  }

  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
})

// Methods
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getStudentColor = (studentId: string): string => {
  const colors = ['primary', 'success', 'warning', 'info', 'error']
  const index = parseInt(studentId) % colors.length
  return colors[index]
}

const getLessonColor = (lessonType: string): string => {
  const colors: { [key: string]: string } = {
    'Private Lesson': 'primary',
    'Group Lesson': 'success',
    'Tennis Clinic': 'warning',
    'Training Session': 'info',
    'Match Practice': 'error'
  }
  return colors[lessonType] || 'grey'
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const canEdit = (record: any): boolean => {
  const recordDate = record.date
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff <= 7
}

const applyFilters = () => {
  successMessage.value = 'Filters applied successfully'
  successSnackbar.value = true
}

const clearFilters = () => {
  filters.date = today
  filters.lesson = ''
  filters.status = ''
  successMessage.value = 'Filters cleared'
  successSnackbar.value = true
}

const markAllPresent = async () => {
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    filteredRecords.value.forEach(record => {
      if (canEdit(record)) {
        record.present = true
      }
    })

    successMessage.value = 'All eligible students marked as present'
    successSnackbar.value = true

  } finally {
    loading.value = false
  }
}

const updateAttendance = async (record: any) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    successMessage.value = 'Attendance updated successfully'
    successSnackbar.value = true
  } catch (error) {
    record.present = !record.present
  }
}

const editRecord = (record: any) => {
  console.log('Edit record:', record)
}

const deleteRecord = (record: any) => {
  console.log('Delete record:', record)
}

const addNote = (record: any) => {
  console.log('Add note to record:', record)
}

const exportAttendance = () => {
  console.log('Exporting attendance data...')
  successMessage.value = 'Attendance report exported successfully'
  successSnackbar.value = true
}

const toggleStudent = (studentId: string) => {
  const index = bulkForm.selectedStudents.indexOf(studentId)
  if (index > -1) {
    bulkForm.selectedStudents.splice(index, 1)
  } else {
    bulkForm.selectedStudents.push(studentId)
  }
}

const selectAllStudents = () => {
  bulkForm.selectedStudents = students.value.map(s => s.id)
}

const clearStudentSelection = () => {
  bulkForm.selectedStudents = []
}

const saveBulkAttendance = async () => {
  bulkLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    successMessage.value = `Attendance saved for ${bulkForm.selectedStudents.length} students`
    successSnackbar.value = true
    showBulkAttendanceDialog.value = false

    // Reset form
    bulkForm.selectedStudents = []
    bulkForm.lessonType = ''

  } finally {
    bulkLoading.value = false
  }
}

onMounted(() => {
  // Initialize component
})
</script>

<style scoped>
.attendance-management {
  padding: 0;
}

.management-header {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
}

.management-header h2,
.management-header p {
  color: white;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.student-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.student-list {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.v-data-table) {
  border-radius: 0;
}

:deep(.v-switch) {
  flex: none;
}

@media (max-width: 600px) {
  .management-header {
    padding: 16px;
  }

  .stat-card .text-h4 {
    font-size: 1.5rem;
  }
}
</style>