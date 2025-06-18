<template>
  <div class="court-management">
    <!-- Header Section -->
    <div class="management-header mb-6">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="text-h4 font-weight-bold text-white">
            <v-icon icon="mdi-tennis" class="mr-2" />
            Court Management
          </h2>
          <p class="text-body-1 text-white mt-2 opacity-90">
            Monitor and manage tennis court status and availability
          </p>
        </v-col>
        <v-col cols="12" md="6" class="text-md-right">
          <v-btn
              color="white"
              variant="flat"
              size="large"
              @click="showAddCourtDialog = true"
          >
            <v-icon icon="mdi-plus" class="mr-2" color="primary" />
            <span class="text-primary font-weight-bold">Add Court</span>
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="success">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-check-circle</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.availableCourts }}</h3>
            <p class="text-body-1">Available Courts</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="error">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-multiple</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.occupiedCourts }}</h3>
            <p class="text-body-1">Occupied Courts</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="warning">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-wrench</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.maintenanceCourts }}</h3>
            <p class="text-body-1">Under Maintenance</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="4" color="info">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-percent</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ averageUtilization }}%</h3>
            <p class="text-body-1">Average Utilization</p>
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
                @click="markAllAvailable"
            >
              <v-icon icon="mdi-check-all" class="mr-2" />
              Mark All Available
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="warning"
                variant="flat"
                block
                size="large"
                @click="scheduleMaintenance"
            >
              <v-icon icon="mdi-calendar-clock" class="mr-2" />
              Schedule Maintenance
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="info"
                variant="flat"
                block
                size="large"
                @click="viewReservations"
            >
              <v-icon icon="mdi-calendar-multiple" class="mr-2" />
              View Reservations
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
                color="purple"
                variant="flat"
                block
                size="large"
                @click="generateUtilizationReport"
            >
              <v-icon icon="mdi-chart-bar" class="mr-2" />
              Utilization Report
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Court Grid -->
    <v-row class="mb-6">
      <v-col
          v-for="court in courts"
          :key="court.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <v-card
            class="court-card"
            elevation="4"
            :class="getCourtCardClass(court.status)"
        >
          <v-card-title class="pa-4 d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-icon
                  :icon="getCourtIcon(court.type)"
                  :color="getStatusColor(court.status)"
                  class="mr-2"
                  size="24"
              />
              <span class="font-weight-bold">{{ court.name }}</span>
            </div>
            <v-chip
                :color="getStatusColor(court.status)"
                size="small"
                variant="flat"
            >
              {{ court.status }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-4">
            <div class="court-info mb-4">
              <div class="info-row mb-2">
                <span class="info-label">Type:</span>
                <v-chip size="small" variant="outlined" class="ml-2">
                  {{ court.type }}
                </v-chip>
              </div>

              <div class="info-row mb-2">
                <span class="info-label">Utilization:</span>
                <span class="info-value ml-2">{{ court.occupancyRate }}%</span>
              </div>

              <div class="info-row mb-2">
                <span class="info-label">Hourly Rate:</span>
                <span class="info-value ml-2">${{ court.hourlyRate }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Next Available:</span>
                <span class="info-value ml-2">
                  {{ court.nextAvailable ? formatTime(court.nextAvailable) : 'Now' }}
                </span>
              </div>
            </div>

            <!-- Utilization Progress -->
            <div class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-caption">Daily Utilization</span>
                <span class="text-caption font-weight-bold">{{ court.occupancyRate }}%</span>
              </div>
              <v-progress-linear
                  :model-value="court.occupancyRate"
                  :color="getUtilizationColor(court.occupancyRate)"
                  height="8"
                  rounded
              />
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
                :color="getStatusColor(court.status)"
                variant="outlined"
                size="small"
                @click="toggleCourtStatus(court)"
            >
              <v-icon :icon="getStatusIcon(court.status)" class="mr-1" />
              {{ getStatusAction(court.status) }}
            </v-btn>

            <v-spacer />

            <v-menu>
              <template #activator="{ props }">
                <v-btn
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    v-bind="props"
                />
              </template>

              <v-list>
                <v-list-item @click="editCourt(court)">
                  <v-list-item-title>
                    <v-icon icon="mdi-pencil" class="mr-2" />
                    Edit Court
                  </v-list-item-title>
                </v-list-item>

                <v-list-item @click="viewCourtDetails(court)">
                  <v-list-item-title>
                    <v-icon icon="mdi-information" class="mr-2" />
                    View Details
                  </v-list-item-title>
                </v-list-item>

                <v-list-item @click="scheduleCourtMaintenance(court)">
                  <v-list-item-title>
                    <v-icon icon="mdi-wrench" class="mr-2" />
                    Schedule Maintenance
                  </v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click="deleteCourt(court)" class="text-error">
                  <v-list-item-title>
                    <v-icon icon="mdi-delete" class="mr-2" />
                    Delete Court
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Real-time Status Updates -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-info text-white">
        <v-icon icon="mdi-update" class="mr-2" />
        Real-time Updates
      </v-card-title>
      <v-card-text class="pa-6">
        <div class="updates-container">
          <div
              v-for="update in recentUpdates"
              :key="update.id"
              class="update-item d-flex align-center mb-3"
          >
            <v-avatar :color="update.color" size="32" class="mr-3">
              <v-icon :icon="update.icon" size="18" />
            </v-avatar>
            <div class="flex-grow-1">
              <div class="font-weight-medium">{{ update.title }}</div>
              <div class="text-caption text-grey">{{ formatTime(update.time) }}</div>
            </div>
            <v-chip
                :color="update.type"
                size="small"
                variant="outlined"
            >
              {{ update.courtName }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Add Court Dialog -->
    <v-dialog v-model="showAddCourtDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 pa-6">
          <v-icon icon="mdi-tennis" class="mr-2" />
          Add New Court
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="courtForm" v-model="formValid">
            <v-text-field
                v-model="newCourt.name"
                label="Court Name"
                variant="outlined"
                :rules="nameRules"
                class="mb-4"
                required
            />

            <v-select
                v-model="newCourt.type"
                label="Court Type"
                :items="courtTypes"
                variant="outlined"
                :rules="typeRules"
                class="mb-4"
                required
            />

            <v-text-field
                v-model="newCourt.hourlyRate"
                label="Hourly Rate ($)"
                type="number"
                variant="outlined"
                :rules="rateRules"
                class="mb-4"
                required
            />

            <v-textarea
                v-model="newCourt.description"
                label="Description (optional)"
                variant="outlined"
                rows="3"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showAddCourtDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!formValid"
              :loading="addingCourt"
              @click="addNewCourt"
          >
            Add Court
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
import { ref, reactive, computed } from 'vue'

// Define court interface
interface Court {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  status: 'available' | 'occupied' | 'maintenance'
  occupancyRate: number
  hourlyRate: number
  nextAvailable: Date | null
  description?: string
}

// Data
const showAddCourtDialog = ref(false)
const addingCourt = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const formValid = ref(false)

// Stats
const stats = ref({
  availableCourts: 2,
  occupiedCourts: 1,
  maintenanceCourts: 1
})

// New court form
const newCourt = reactive({
  name: '',
  type: '',
  hourlyRate: 20,
  description: ''
})

// Court types
const courtTypes = [
  { title: 'Indoor Court', value: 'indoor' },
  { title: 'Outdoor Court', value: 'outdoor' }
]

// Validation rules
const nameRules = [
  (v: string) => !!v || 'Court name is required',
  (v: string) => v.length >= 3 || 'Name must be at least 3 characters'
]

const typeRules = [
  (v: string) => !!v || 'Court type is required'
]

const rateRules = [
  (v: number) => !!v || 'Hourly rate is required',
  (v: number) => v > 0 || 'Rate must be greater than 0'
]

// Mock court data
const courts = ref<Court[]>([
  {
    id: '1',
    name: 'Court 1',
    type: 'indoor',
    status: 'occupied',
    occupancyRate: 75,
    hourlyRate: 25,
    nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000),
    description: 'Premium indoor court with climate control'
  },
  {
    id: '2',
    name: 'Court 2',
    type: 'outdoor',
    status: 'available',
    occupancyRate: 45,
    hourlyRate: 20,
    nextAvailable: null,
    description: 'Outdoor court with natural lighting'
  },
  {
    id: '3',
    name: 'Court 3',
    type: 'indoor',
    status: 'maintenance',
    occupancyRate: 0,
    hourlyRate: 25,
    nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000),
    description: 'Indoor court under maintenance'
  },
  {
    id: '4',
    name: 'Court 4',
    type: 'outdoor',
    status: 'available',
    occupancyRate: 60,
    hourlyRate: 20,
    nextAvailable: null,
    description: 'Outdoor court with evening lights'
  }
])

// Recent updates
const recentUpdates = ref([
  {
    id: '1',
    title: 'Court 1 marked as occupied',
    time: new Date(Date.now() - 15 * 60 * 1000),
    courtName: 'Court 1',
    icon: 'mdi-account-multiple',
    color: 'error',
    type: 'error'
  },
  {
    id: '2',
    title: 'Court 2 became available',
    time: new Date(Date.now() - 30 * 60 * 1000),
    courtName: 'Court 2',
    icon: 'mdi-check-circle',
    color: 'success',
    type: 'success'
  },
  {
    id: '3',
    title: 'Maintenance scheduled for Court 3',
    time: new Date(Date.now() - 45 * 60 * 1000),
    courtName: 'Court 3',
    icon: 'mdi-wrench',
    color: 'warning',
    type: 'warning'
  }
])

// Computed
const averageUtilization = computed(() => {
  const total = courts.value.reduce((sum, court) => sum + court.occupancyRate, 0)
  return Math.round(total / courts.value.length)
})

// Methods
const getCourtIcon = (type: string): string => {
  return type === 'indoor' ? 'mdi-home' : 'mdi-weather-sunny'
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available': return 'success'
    case 'occupied': return 'error'
    case 'maintenance': return 'warning'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'available': return 'mdi-play'
    case 'occupied': return 'mdi-stop'
    case 'maintenance': return 'mdi-wrench'
    default: return 'mdi-help'
  }
}

const getStatusAction = (status: string): string => {
  switch (status) {
    case 'available': return 'Mark Occupied'
    case 'occupied': return 'Mark Available'
    case 'maintenance': return 'End Maintenance'
    default: return 'Update Status'
  }
}

const getCourtCardClass = (status: string): string => {
  switch (status) {
    case 'available': return 'court-available'
    case 'occupied': return 'court-occupied'
    case 'maintenance': return 'court-maintenance'
    default: return ''
  }
}

const getUtilizationColor = (rate: number): string => {
  if (rate >= 80) return 'error'
  if (rate >= 60) return 'warning'
  return 'success'
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleCourtStatus = (court: Court) => {
  const statusCycle: { [key: string]: 'available' | 'occupied' | 'maintenance' } = {
    'available': 'occupied',
    'occupied': 'available',
    'maintenance': 'available'
  }

  court.status = statusCycle[court.status]
  successMessage.value = `${court.name} status updated to ${court.status}`
  successSnackbar.value = true
}

const markAllAvailable = () => {
  courts.value.forEach(court => {
    if (court.status !== 'maintenance') {
      court.status = 'available'
    }
  })
  successMessage.value = 'All courts marked as available'
  successSnackbar.value = true
}

const scheduleMaintenance = () => {
  console.log('Schedule maintenance dialog')
}

const viewReservations = () => {
  console.log('View reservations')
}

const generateUtilizationReport = () => {
  console.log('Generate utilization report')
  successMessage.value = 'Utilization report generated successfully'
  successSnackbar.value = true
}

const editCourt = (court: Court) => {
  console.log('Edit court:', court)
}

const viewCourtDetails = (court: Court) => {
  console.log('View court details:', court)
}

const scheduleCourtMaintenance = (court: Court) => {
  court.status = 'maintenance'
  successMessage.value = `Maintenance scheduled for ${court.name}`
  successSnackbar.value = true
}

const deleteCourt = (court: Court) => {
  const index = courts.value.findIndex(c => c.id === court.id)
  if (index > -1) {
    courts.value.splice(index, 1)
    successMessage.value = `${court.name} deleted successfully`
    successSnackbar.value = true
  }
}

const addNewCourt = async () => {
  if (!formValid.value) return

  addingCourt.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newCourtData: Court = {
      id: Date.now().toString(),
      name: newCourt.name,
      type: newCourt.type as 'indoor' | 'outdoor',
      status: 'available',
      occupancyRate: 0,
      hourlyRate: newCourt.hourlyRate,
      nextAvailable: null,
      description: newCourt.description
    }

    courts.value.push(newCourtData)

    // Reset form
    Object.assign(newCourt, {
      name: '',
      type: '',
      hourlyRate: 20,
      description: ''
    })

    showAddCourtDialog.value = false
    successMessage.value = 'New court added successfully'
    successSnackbar.value = true

  } finally {
    addingCourt.value = false
  }
}
</script>

<style scoped>
.court-management {
  padding: 0;
}

.management-header {
  background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.court-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.court-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.court-available {
  border-left-color: #4CAF50;
}

.court-occupied {
  border-left-color: #F44336;
}

.court-maintenance {
  border-left-color: #FF9800;
}

.court-info {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.updates-container {
  max-height: 300px;
  overflow-y: auto;
}

.update-item:last-child {
  margin-bottom: 0 !important;
}

:deep(.v-progress-linear) {
  border-radius: 4px;
}

@media (max-width: 600px) {
  .management-header {
    padding: 16px;
  }

  .stat-card .text-h4 {
    font-size: 1.5rem;
  }

  .court-card {
    margin-bottom: 16px;
  }
}
</style>