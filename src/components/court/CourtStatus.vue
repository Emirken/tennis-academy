<template>
  <div class="court-status-component">
    <!-- Header Section -->
    <div class="status-header mb-6">
      <v-row align="center">
        <v-col cols="12" md="8">
          <h2 class="text-h4 font-weight-bold text-white">
            <v-icon icon="mdi-tennis" class="mr-2" />
            Court Status Overview
          </h2>
          <p class="text-body-1 text-white mt-2 opacity-90">
            Real-time court availability and occupancy information
          </p>
        </v-col>
        <v-col cols="12" md="4" class="text-md-right">
          <v-chip
              color="white"
              variant="flat"
              size="large"
              class="font-weight-bold"
          >
            <v-icon icon="mdi-update" class="mr-2" color="success" />
            <span class="text-success">Live Updates</span>
          </v-chip>
        </v-col>
      </v-row>
    </div>

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col cols="6" sm="3">
        <v-card class="stat-card text-center" elevation="4" color="success">
          <v-card-text class="pa-4">
            <v-icon icon="mdi-check-circle" size="32" class="mb-2" />
            <h3 class="text-h4 font-weight-bold">{{ availableCourts }}</h3>
            <p class="text-body-2">Available</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" sm="3">
        <v-card class="stat-card text-center" elevation="4" color="error">
          <v-card-text class="pa-4">
            <v-icon icon="mdi-account-multiple" size="32" class="mb-2" />
            <h3 class="text-h4 font-weight-bold">{{ occupiedCourts }}</h3>
            <p class="text-body-2">Occupied</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" sm="3">
        <v-card class="stat-card text-center" elevation="4" color="warning">
          <v-card-text class="pa-4">
            <v-icon icon="mdi-wrench" size="32" class="mb-2" />
            <h3 class="text-h4 font-weight-bold">{{ maintenanceCourts }}</h3>
            <p class="text-body-2">Maintenance</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="6" sm="3">
        <v-card class="stat-card text-center" elevation="4" color="info">
          <v-card-text class="pa-4">
            <v-icon icon="mdi-percent" size="32" class="mb-2" />
            <h3 class="text-h4 font-weight-bold">{{ overallUtilization }}%</h3>
            <p class="text-body-2">Utilization</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Court Occupancy Section -->
    <v-card class="occupancy-card mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-chart-bar" class="mr-2" />
        Court Occupancy Levels
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <v-col
              v-for="court in courts"
              :key="court.id"
              cols="12"
              sm="6"
              md="3"
              class="mb-4"
          >
            <div class="occupancy-item">
              <!-- Court Header -->
              <div class="d-flex justify-space-between align-center mb-3">
                <div class="d-flex align-center">
                  <v-icon
                      :icon="getCourtIcon(court.type)"
                      :color="getStatusColor(court.status)"
                      size="20"
                      class="mr-2"
                  />
                  <h4 class="text-h6 font-weight-bold">{{ court.name }}</h4>
                </div>
                <v-chip
                    :color="getStatusColor(court.status)"
                    size="x-small"
                    variant="flat"
                >
                  {{ court.occupancyRate }}%
                </v-chip>
              </div>

              <!-- Progress Bar -->
              <v-progress-linear
                  :model-value="court.occupancyRate"
                  :color="getOccupancyColor(court.occupancyRate)"
                  height="12"
                  rounded
                  class="mb-2"
              />

              <!-- Status and Time -->
              <div class="d-flex justify-space-between align-center">
                <v-chip
                    :color="getStatusColor(court.status)"
                    size="x-small"
                    variant="outlined"
                >
                  {{ getStatusText(court.status) }}
                </v-chip>
                <span class="text-caption text-grey">
                  {{ getNextAvailableText(court.nextAvailable) }}
                </span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Court Availability Table -->
    <v-card elevation="4">
      <v-card-title class="pa-6 bg-success text-white d-flex justify-space-between">
        <div>
          <v-icon icon="mdi-table-clock" class="mr-2" />
          Court Availability Schedule
        </div>
        <v-btn
            color="white"
            variant="text"
            size="small"
            @click="refreshData"
            :loading="refreshing"
        >
          <v-icon icon="mdi-refresh" />
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-data-table
            :headers="tableHeaders"
            :items="tableData"
            :items-per-page="10"
            class="elevation-0"
            :loading="loading"
        >
          <!-- Court Column -->
          <template #item.court="{ item }">
            <div class="d-flex align-center">
              <v-avatar
                  :color="getStatusColor(item.status)"
                  size="32"
                  class="mr-3"
              >
                <v-icon
                    :icon="getCourtIcon(item.type)"
                    color="white"
                    size="16"
                />
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-grey">
                  {{ item.type === 'indoor' ? 'Indoor' : 'Outdoor' }} Court
                </div>
              </div>
            </div>
          </template>

          <!-- Status Column -->
          <template #item.status="{ item }">
            <div class="d-flex align-center">
              <v-icon
                  :icon="getStatusIcon(item.status)"
                  :color="getStatusColor(item.status)"
                  size="16"
                  class="mr-2"
              />
              <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="flat"
              >
                {{ getStatusText(item.status) }}
              </v-chip>
            </div>
          </template>

          <!-- Occupancy Column -->
          <template #item.occupancy="{ item }">
            <div class="occupancy-cell">
              <div class="d-flex align-center mb-1">
                <span class="text-body-2 font-weight-medium mr-2">
                  {{ item.occupancyRate }}%
                </span>
                <v-progress-linear
                    :model-value="item.occupancyRate"
                    :color="getOccupancyColor(item.occupancyRate)"
                    height="4"
                    rounded
                    class="flex-grow-1"
                />
              </div>
            </div>
          </template>

          <!-- Next Available Column -->
          <template #item.nextAvailable="{ item }">
            <div class="text-center">
              <v-chip
                  :color="item.nextAvailable ? 'warning' : 'success'"
                  size="small"
                  variant="outlined"
              >
                <v-icon
                    :icon="item.nextAvailable ? 'mdi-clock' : 'mdi-check'"
                    size="14"
                    class="mr-1"
                />
                {{ getNextAvailableText(item.nextAvailable) }}
              </v-chip>
            </div>
          </template>

          <!-- Current Session Column -->
          <template #item.currentSession="{ item }">
            <div v-if="item.currentSession" class="session-info">
              <div class="text-body-2 font-weight-medium">
                {{ item.currentSession.playerName }}
              </div>
              <div class="text-caption text-grey">
                {{ item.currentSession.startTime }} - {{ item.currentSession.endTime }}
              </div>
              <div class="text-caption text-primary">
                {{ item.currentSession.type }}
              </div>
            </div>
            <div v-else class="text-center">
              <span class="text-grey">No active session</span>
            </div>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip text="View Details">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-eye"
                      size="small"
                      color="info"
                      variant="text"
                      v-bind="props"
                      @click="$emit('view-details', item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-if="item.status === 'available'" text="Reserve Court">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-calendar-plus"
                      size="small"
                      color="success"
                      variant="text"
                      v-bind="props"
                      @click="$emit('reserve', item)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip v-else text="View Schedule">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-calendar-clock"
                      size="small"
                      color="warning"
                      variant="text"
                      v-bind="props"
                      @click="$emit('view-schedule', item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Real-time Updates Footer -->
    <div class="mt-4 text-center">
      <v-chip
          color="success"
          variant="outlined"
          size="small"
          class="mr-2"
      >
        <v-icon icon="mdi-circle" size="8" class="mr-2 blink" />
        Live Data
      </v-chip>
      <span class="text-caption text-grey">
        Last updated: {{ lastUpdated }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Court {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  status: 'available' | 'occupied' | 'maintenance'
  occupancyRate: number
  nextAvailable: Date | null
  currentSession?: {
    playerName: string
    startTime: string
    endTime: string
    type: string
  }
}

interface Props {
  courts?: Court[]
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  courts: () => [],
  autoRefresh: true,
  refreshInterval: 30000 // 30 seconds
})

// Emits
defineEmits<{
  'view-details': [court: Court]
  'reserve': [court: Court]
  'view-schedule': [court: Court]
  'refresh': []
}>()

// Data
const loading = ref(false)
const refreshing = ref(false)
const lastUpdated = ref('')
const refreshTimer = ref<number | null>(null)

// Mock data if no courts provided
const defaultCourts: Court[] = [
  {
    id: '1',
    name: 'Court 1',
    type: 'indoor',
    status: 'occupied',
    occupancyRate: 75,
    nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000),
    currentSession: {
      playerName: 'John Doe',
      startTime: '14:00',
      endTime: '16:00',
      type: 'Private Lesson'
    }
  },
  {
    id: '2',
    name: 'Court 2',
    type: 'outdoor',
    status: 'available',
    occupancyRate: 25,
    nextAvailable: null
  },
  {
    id: '3',
    name: 'Court 3',
    type: 'indoor',
    status: 'occupied',
    occupancyRate: 90,
    nextAvailable: new Date(Date.now() + 1 * 60 * 60 * 1000),
    currentSession: {
      playerName: 'Sarah Wilson',
      startTime: '15:00',
      endTime: '16:30',
      type: 'Group Clinic'
    }
  },
  {
    id: '4',
    name: 'Court 4',
    type: 'outdoor',
    status: 'maintenance',
    occupancyRate: 0,
    nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
]

const courts = computed(() => {
  return props.courts.length > 0 ? props.courts : defaultCourts
})

// Table configuration
const tableHeaders = [
  { title: 'Court', key: 'court', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Occupancy', key: 'occupancy', sortable: true },
  { title: 'Next Available', key: 'nextAvailable', sortable: true },
  { title: 'Current Session', key: 'currentSession', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

const tableData = computed(() => {
  return courts.value.map(court => ({
    ...court,
    court: court.name
  }))
})

// Computed stats
const availableCourts = computed(() => {
  return courts.value.filter(court => court.status === 'available').length
})

const occupiedCourts = computed(() => {
  return courts.value.filter(court => court.status === 'occupied').length
})

const maintenanceCourts = computed(() => {
  return courts.value.filter(court => court.status === 'maintenance').length
})

const overallUtilization = computed(() => {
  const total = courts.value.reduce((sum, court) => sum + court.occupancyRate, 0)
  return Math.round(total / courts.value.length)
})

// Methods
const getCourtIcon = (type: string): string => {
  return type === 'indoor' ? 'mdi-home-variant' : 'mdi-weather-sunny'
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
    case 'available': return 'mdi-check-circle'
    case 'occupied': return 'mdi-account-multiple'
    case 'maintenance': return 'mdi-wrench'
    default: return 'mdi-help-circle'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'available': return 'Available'
    case 'occupied': return 'Occupied'
    case 'maintenance': return 'Maintenance'
    default: return 'Unknown'
  }
}

const getOccupancyColor = (rate: number): string => {
  if (rate >= 80) return 'error'
  if (rate >= 60) return 'warning'
  return 'success'
}

const getNextAvailableText = (date: Date | null): string => {
  if (!date) return 'Now'

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours < 1) {
    return `${diffMins}m`
  } else if (diffHours < 24) {
    return `${diffHours}h ${diffMins}m`
  } else {
    return date.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const updateLastUpdated = () => {
  lastUpdated.value = new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const refreshData = async () => {
  refreshing.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Emit refresh event
    emit('refresh')

    updateLastUpdated()

  } finally {
    refreshing.value = false
  }
}

const startAutoRefresh = () => {
  if (props.autoRefresh) {
    refreshTimer.value = window.setInterval(() => {
      refreshData()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Setup emits
const emit = defineEmits<{
  'view-details': [court: Court]
  'reserve': [court: Court]
  'view-schedule': [court: Court]
  'refresh': []
}>()

// Lifecycle
onMounted(() => {
  updateLastUpdated()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.court-status-component {
  padding: 0;
}

.status-header {
  background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
  color: white;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.occupancy-card {
  border-radius: 12px;
}

.occupancy-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.occupancy-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.occupancy-cell {
  min-width: 120px;
}

.session-info {
  min-width: 150px;
}

.gap-1 > * {
  margin-right: 4px;
}

.gap-1 > *:last-child {
  margin-right: 0;
}

.blink {
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

:deep(.v-data-table) {
  border-radius: 0;
}

:deep(.v-progress-linear) {
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 600px) {
  .status-header {
    padding: 16px;
  }

  .stat-card .text-h4 {
    font-size: 1.5rem;
  }

  .occupancy-item {
    margin-bottom: 12px;
  }

  .session-info,
  .occupancy-cell {
    min-width: auto;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .occupancy-item {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>