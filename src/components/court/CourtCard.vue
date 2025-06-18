<template>
  <v-card
      class="court-card"
      :class="cardClass"
      elevation="6"
      hover
      @click="handleCardClick"
  >
    <!-- Card Header with Status -->
    <div class="court-header" :class="headerClass">
      <div class="d-flex justify-space-between align-center pa-4">
        <div class="d-flex align-center">
          <v-icon
              :icon="courtIcon"
              size="28"
              :color="statusIconColor"
              class="mr-3"
          />
          <div>
            <h3 class="text-h6 font-weight-bold text-white">
              {{ court.name }}
            </h3>
            <p class="text-caption text-white opacity-90 mb-0">
              {{ courtTypeText }} • ${{ court.hourlyRate }}/hour
            </p>
          </div>
        </div>

        <v-chip
            :color="statusChipColor"
            :variant="statusChipVariant"
            size="small"
            class="font-weight-bold"
        >
          <v-icon
              :icon="statusIcon"
              size="16"
              class="mr-1"
          />
          {{ statusText }}
        </v-chip>
      </div>
    </div>

    <!-- Court Visual Representation -->
    <div class="court-visual" :class="visualClass">
      <div class="court-surface">
        <!-- Court Lines -->
        <div class="court-lines">
          <div class="baseline baseline-top"></div>
          <div class="baseline baseline-bottom"></div>
          <div class="sideline sideline-left"></div>
          <div class="sideline sideline-right"></div>
          <div class="net"></div>
          <div class="service-box service-left"></div>
          <div class="service-box service-right"></div>
        </div>

        <!-- Status Overlay -->
        <div v-if="court.status !== 'available'" class="status-overlay">
          <v-icon
              :icon="statusOverlayIcon"
              :color="statusOverlayColor"
              size="48"
              class="status-overlay-icon"
          />
        </div>
      </div>
    </div>

    <!-- Court Information -->
    <v-card-text class="pa-4">
      <!-- Utilization Progress -->
      <div class="utilization-section mb-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 font-weight-medium">Daily Utilization</span>
          <span class="text-body-2 font-weight-bold" :class="utilizationTextColor">
            {{ court.occupancyRate }}%
          </span>
        </div>
        <v-progress-linear
            :model-value="court.occupancyRate"
            :color="utilizationColor"
            height="8"
            rounded
            class="mb-2"
        />
        <div class="d-flex justify-space-between">
          <span class="text-caption text-grey">Low</span>
          <span class="text-caption text-grey">High</span>
        </div>
      </div>

      <!-- Court Details -->
      <div class="court-details">
        <div class="detail-row mb-2">
          <v-icon icon="mdi-clock-outline" size="16" class="mr-2 text-grey" />
          <span class="text-body-2">
            Next Available:
            <strong>{{ nextAvailableText }}</strong>
          </span>
        </div>

        <div class="detail-row mb-2">
          <v-icon icon="mdi-map-marker-outline" size="16" class="mr-2 text-grey" />
          <span class="text-body-2">
            Location:
            <strong>{{ courtLocation }}</strong>
          </span>
        </div>

        <div class="detail-row mb-2">
          <v-icon icon="mdi-weather-sunny" size="16" class="mr-2 text-grey" />
          <span class="text-body-2">
            Surface:
            <strong>{{ surfaceType }}</strong>
          </span>
        </div>

        <div v-if="court.features && court.features.length > 0" class="detail-row">
          <v-icon icon="mdi-star-outline" size="16" class="mr-2 text-grey" />
          <div class="features-list">
            <v-chip
                v-for="feature in court.features"
                :key="feature"
                size="x-small"
                color="primary"
                variant="outlined"
                class="mr-1 mb-1"
            >
              {{ feature }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Action Buttons -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
          v-if="court.status === 'available'"
          color="success"
          variant="flat"
          size="small"
          @click.stop="$emit('reserve', court)"
      >
        <v-icon icon="mdi-calendar-plus" class="mr-1" />
        Reserve
      </v-btn>

      <v-btn
          v-else-if="court.status === 'occupied'"
          color="warning"
          variant="outlined"
          size="small"
          @click.stop="$emit('view-schedule', court)"
      >
        <v-icon icon="mdi-calendar-clock" class="mr-1" />
        View Schedule
      </v-btn>

      <v-btn
          v-else
          color="info"
          variant="outlined"
          size="small"
          @click.stop="$emit('view-maintenance', court)"
      >
        <v-icon icon="mdi-wrench" class="mr-1" />
        Maintenance Info
      </v-btn>

      <v-spacer />

      <!-- More Actions Menu -->
      <v-menu v-if="showActions">
        <template #activator="{ props }">
          <v-btn
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              v-bind="props"
              @click.stop
          />
        </template>

        <v-list density="compact">
          <v-list-item @click="$emit('view-details', court)">
            <v-list-item-title>
              <v-icon icon="mdi-information" class="mr-2" />
              View Details
            </v-list-item-title>
          </v-list-item>

          <v-list-item @click="$emit('view-history', court)">
            <v-list-item-title>
              <v-icon icon="mdi-history" class="mr-2" />
              Usage History
            </v-list-item-title>
          </v-list-item>

          <v-list-item v-if="isAdmin" @click="$emit('edit-court', court)">
            <v-list-item-title>
              <v-icon icon="mdi-pencil" class="mr-2" />
              Edit Court
            </v-list-item-title>
          </v-list-item>

          <v-divider v-if="isAdmin" />

          <v-list-item
              v-if="isAdmin"
              @click="$emit('toggle-status', court)"
              :class="statusToggleClass"
          >
            <v-list-item-title>
              <v-icon :icon="statusToggleIcon" class="mr-2" />
              {{ statusToggleText }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-actions>

    <!-- Live Status Indicator -->
    <div v-if="showLiveIndicator" class="live-indicator">
      <div class="live-dot"></div>
      <span class="live-text">LIVE</span>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Court {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  status: 'available' | 'occupied' | 'maintenance'
  occupancyRate: number
  hourlyRate: number
  nextAvailable: Date | null
  features?: string[]
  description?: string
}

interface Props {
  court: Court
  showActions?: boolean
  isAdmin?: boolean
  clickable?: boolean
  showLiveIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  isAdmin: false,
  clickable: true,
  showLiveIndicator: false
})

// Emits
defineEmits<{
  'reserve': [court: Court]
  'view-schedule': [court: Court]
  'view-maintenance': [court: Court]
  'view-details': [court: Court]
  'view-history': [court: Court]
  'edit-court': [court: Court]
  'toggle-status': [court: Court]
  'click': [court: Court]
}>()

// Computed
const cardClass = computed(() => {
  const classes = ['court-card-component']

  if (props.clickable) classes.push('clickable')
  if (props.court.status === 'available') classes.push('available')
  if (props.court.status === 'occupied') classes.push('occupied')
  if (props.court.status === 'maintenance') classes.push('maintenance')

  return classes
})

const headerClass = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'header-available'
    case 'occupied':
      return 'header-occupied'
    case 'maintenance':
      return 'header-maintenance'
    default:
      return 'header-default'
  }
})

const visualClass = computed(() => {
  const classes = []

  if (props.court.type === 'indoor') classes.push('indoor-court')
  else classes.push('outdoor-court')

  if (props.court.status !== 'available') classes.push('disabled-court')

  return classes
})

const courtIcon = computed(() => {
  return props.court.type === 'indoor' ? 'mdi-home-variant' : 'mdi-weather-sunny'
})

const courtTypeText = computed(() => {
  return props.court.type === 'indoor' ? 'Indoor Court' : 'Outdoor Court'
})

const statusIconColor = computed(() => {
  return 'white'
})

const statusIcon = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'mdi-check-circle'
    case 'occupied':
      return 'mdi-account-multiple'
    case 'maintenance':
      return 'mdi-wrench'
    default:
      return 'mdi-help-circle'
  }
})

const statusText = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'Available'
    case 'occupied':
      return 'Occupied'
    case 'maintenance':
      return 'Maintenance'
    default:
      return 'Unknown'
  }
})

const statusChipColor = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'success'
    case 'occupied':
      return 'error'
    case 'maintenance':
      return 'warning'
    default:
      return 'grey'
  }
})

const statusChipVariant = computed((): 'flat' | 'outlined' => {
  return 'flat'
})

const statusOverlayIcon = computed(() => {
  switch (props.court.status) {
    case 'occupied':
      return 'mdi-account-multiple'
    case 'maintenance':
      return 'mdi-wrench'
    default:
      return 'mdi-help'
  }
})

const statusOverlayColor = computed(() => {
  switch (props.court.status) {
    case 'occupied':
      return 'error'
    case 'maintenance':
      return 'warning'
    default:
      return 'grey'
  }
})

const utilizationColor = computed(() => {
  if (props.court.occupancyRate >= 80) return 'error'
  if (props.court.occupancyRate >= 60) return 'warning'
  return 'success'
})

const utilizationTextColor = computed(() => {
  if (props.court.occupancyRate >= 80) return 'text-error'
  if (props.court.occupancyRate >= 60) return 'text-warning'
  return 'text-success'
})

const nextAvailableText = computed(() => {
  if (!props.court.nextAvailable) return 'Now'

  const time = props.court.nextAvailable.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (props.court.nextAvailable.toDateString() === today.toDateString()) {
    return `Today ${time}`
  } else if (props.court.nextAvailable.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${time}`
  } else {
    return props.court.nextAvailable.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric'
    }) + ` ${time}`
  }
})

const courtLocation = computed(() => {
  return props.court.type === 'indoor' ? 'Main Building' : 'Outdoor Area'
})

const surfaceType = computed(() => {
  return props.court.type === 'indoor' ? 'Hard Court' : 'Clay Court'
})

const statusToggleIcon = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'mdi-pause'
    case 'occupied':
      return 'mdi-play'
    case 'maintenance':
      return 'mdi-check'
    default:
      return 'mdi-refresh'
  }
})

const statusToggleText = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'Mark as Occupied'
    case 'occupied':
      return 'Mark as Available'
    case 'maintenance':
      return 'End Maintenance'
    default:
      return 'Update Status'
  }
})

const statusToggleClass = computed(() => {
  switch (props.court.status) {
    case 'available':
      return 'text-warning'
    case 'occupied':
      return 'text-success'
    case 'maintenance':
      return 'text-success'
    default:
      return ''
  }
})

// Methods
const handleCardClick = () => {
  if (props.clickable) {
    emit('click', props.court)
  }
}

const emit = defineEmits<{
  'reserve': [court: Court]
  'view-schedule': [court: Court]
  'view-maintenance': [court: Court]
  'view-details': [court: Court]
  'view-history': [court: Court]
  'edit-court': [court: Court]
  'toggle-status': [court: Court]
  'click': [court: Court]
}>()
</script>

<style scoped>
.court-card-component {
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  max-width: 350px;
  border-left: 4px solid transparent;
}

.court-card-component.clickable {
  cursor: pointer;
}

.court-card-component:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
}

.court-card-component.available {
  border-left-color: #4CAF50;
}

.court-card-component.occupied {
  border-left-color: #F44336;
}

.court-card-component.maintenance {
  border-left-color: #FF9800;
}

/* Header Styles */
.court-header {
  position: relative;
}

.header-available {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
}

.header-occupied {
  background: linear-gradient(135deg, #F44336 0%, #EF5350 100%);
}

.header-maintenance {
  background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
}

.header-default {
  background: linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%);
}

/* Court Visual */
.court-visual {
  height: 120px;
  position: relative;
  background: linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%);
  overflow: hidden;
}

.court-visual.indoor-court {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFF8E1 100%);
}

.court-visual.outdoor-court {
  background: linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%);
}

.court-visual.disabled-court {
  background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
}

.court-surface {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px;
}

/* Court Lines */
.court-lines {
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid #2E7D32;
  border-radius: 4px;
}

.baseline,
.sideline,
.service-box {
  position: absolute;
  background-color: #2E7D32;
}

.baseline {
  height: 2px;
  left: 0;
  right: 0;
}

.baseline-top {
  top: 20%;
}

.baseline-bottom {
  bottom: 20%;
}

.sideline {
  width: 2px;
  top: 0;
  bottom: 0;
}

.sideline-left {
  left: 20%;
}

.sideline-right {
  right: 20%;
}

.net {
  position: absolute;
  top: 45%;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #1B5E20;
  transform: translateY(-50%);
}

.service-box {
  top: 30%;
  bottom: 30%;
  width: 1px;
}

.service-left {
  left: 35%;
}

.service-right {
  right: 35%;
}

/* Status Overlay */
.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.status-overlay-icon {
  opacity: 0.7;
}

/* Live Indicator */
.live-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  background-color: #F44336;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 2;
}

.live-dot {
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 50%;
  margin-right: 4px;
  animation: livePulse 2s infinite;
}

.live-text {
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Utilization Section */
.utilization-section {
  background-color: #F8F9FA;
  border-radius: 8px;
  padding: 12px;
}

/* Court Details */
.detail-row {
  display: flex;
  align-items: flex-start;
}

.features-list {
  flex: 1;
  margin-left: 20px;
}

/* Responsive Design */
@media (max-width: 600px) {
  .court-card-component {
    max-width: none;
  }

  .court-visual {
    height: 100px;
  }

  .court-surface {
    padding: 12px;
  }

  .live-indicator {
    top: 8px;
    right: 8px;
    padding: 2px 6px;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .utilization-section {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .status-overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
}
</style>