<template>
  <div class="courts-page">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Kort Durumu
                </h1>
                <p class="welcome-subtitle">
                  Tenis kortlarımızın güncel doluluk durumunu ve müsaitlik bilgilerini görüntüleyin.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ getCurrentDate() }}</div>
                <div class="current-time">{{ getCurrentTime() }}</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <!-- Admin Controls -->
        <v-row v-if="authStore.isAdmin" class="mb-6">
          <v-col cols="12">
            <v-card class="modern-card admin-controls-card" elevation="0">
              <v-card-text class="pa-6">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h3 class="text-h6 font-weight-bold mb-2">Yönetici Kontrolleri</h3>
                    <p class="text-body-2 text-grey-darken-1">Kort durumlarını düzenleyin ve güncelleyin</p>
                  </div>
                  <div class="admin-action-buttons">
                    <v-btn
                        v-if="!editMode"
                        variant="flat"
                        prepend-icon="mdi-pencil"
                        @click="enableEditMode"
                        class="text-white view-color mr-2"
                    >
                      Kort Durumlarını Düzenle
                    </v-btn>
                    <div v-else class="d-flex gap-2">
                      <v-btn
                          color="success"
                          variant="flat"
                          prepend-icon="mdi-check"
                          @click="saveCourtSchedule"
                          :loading="saving"
                      >
                        Değişiklikleri Kaydet
                      </v-btn>
                      <v-btn
                          color="error"
                          variant="outlined"
                          prepend-icon="mdi-close"
                          @click="cancelEdit"
                      >
                        İptal
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Court Overview Cards -->
        <v-row class="mb-8">
          <v-col v-for="court in courts" :key="court.id" cols="12" md="4" class="mb-4">
            <v-card class="stat-card modern-card court-overview-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-title class="court-title pa-6">
                <div class="d-flex align-center">
                  <div class="stat-icon-wrapper court-gradient mr-4">
                    <v-icon icon="mdi-tennis" size="24" color="white" />
                  </div>
                  <div>
                    <h3 class="text-h6 font-weight-bold">{{ court.name }}</h3>
                    <p class="text-caption text-grey-darken-1">Tenis Kortu</p>
                  </div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6 pt-0">
                <!-- Occupancy Rate -->
                <div class="occupancy-section mb-4">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span class="text-subtitle-2 font-weight-medium">Doluluk Oranı</span>
                    <span class="occupancy-percentage text-h6 font-weight-bold"
                          :class="getOccupancyColor(court.occupancyRate)">
                      {{ court.occupancyRate }}%
                    </span>
                  </div>

                  <v-progress-linear
                      :model-value="court.occupancyRate"
                      :color="getOccupancyProgressColor(court.occupancyRate)"
                      height="8"
                      rounded
                      class="mb-3"
                  />

                  <div class="d-flex justify-space-between text-caption text-grey-darken-1">
                    <span>{{ court.availableSlots }} müsait slot</span>
                    <span>{{ court.totalSlots }} toplam slot</span>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                  <v-row no-gutters>
                    <v-col cols="6">
                      <div class="text-center py-2">
                        <div class="stat-number text-success font-weight-bold">{{ court.availableSlots }}</div>
                        <div class="stat-label text-caption">Müsait</div>
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-center py-2">
                        <div class="stat-number text-error font-weight-bold">{{ court.occupiedSlots }}</div>
                        <div class="stat-label text-caption">Dolu</div>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Date Selection -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card class="modern-card date-selection-card" elevation="0">
              <v-card-text class="pa-6">
                <div class="d-flex align-center justify-space-between flex-wrap">
                  <div class="date-selector-content">
                    <h3 class="text-h6 font-weight-bold mb-2">Tarih Seçimi</h3>
                    <p class="text-body-2 text-grey-darken-1">Görüntülemek istediğiniz tarihi seçin</p>
                  </div>
                  <div class="date-controls">
                    <v-menu v-model="datePickerMenu" :close-on-content-click="false">
                      <template v-slot:activator="{ props }">
                        <v-btn
                            color="primary"
                            variant="outlined"
                            prepend-icon="mdi-calendar"
                            v-bind="props"
                        >
                          {{ formatSelectedDate() }}
                        </v-btn>
                      </template>
                      <v-date-picker
                          v-model="selectedDate"
                          @update:model-value="onDateChange"
                          color="primary"
                      />
                    </v-menu>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Court Schedule -->
        <v-row>
          <v-col cols="12">
            <v-card class="modern-card schedule-card" elevation="0">
              <v-card-title class="pa-6 bg-primary text-white">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-clock" class="mr-3" />
                  <div>
                    <h3 class="text-h6 font-weight-bold">Kort Programı</h3>
                    <p class="text-body-2 opacity-90">{{ formatSelectedDate() }} tarihli kort durumu</p>
                  </div>
                </div>
              </v-card-title>

              <v-card-text class="pa-0">
                <div v-if="loading" class="text-center py-8">
                  <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                      class="mb-4"
                  />
                  <p class="text-body-1">Kort durumu yükleniyor...</p>
                </div>

                <div v-else-if="!schedule || Object.keys(schedule).length === 0" class="text-center py-8">
                  <v-icon icon="mdi-calendar-blank" size="64" color="grey" class="mb-4" />
                  <h3 class="text-h6 mb-2">Bu tarih için kort programı bulunamadı</h3>
                  <p class="text-body-2 text-grey-darken-1">Seçilen tarih için henüz program oluşturulmamış.</p>
                </div>

                <div v-else class="schedule-table-container">
                  <v-table class="schedule-table">
                    <thead>
                    <tr class="table-header">
                      <th class="time-column">Saat</th>
                      <th v-for="court in courts" :key="court.id" class="court-column">
                        {{ court.name }}
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="timeSlot in timeSlots" :key="timeSlot" class="time-slot-row">
                      <td class="time-cell">
                        <div class="time-display">{{ timeSlot }}</div>
                      </td>
                      <td v-for="court in courts" :key="court.id" class="court-cell">
                        <div
                            class="slot-status"
                            :class="getSlotStatusClass(schedule[court.id]?.[timeSlot])"
                            @click="editMode && toggleSlotStatus(court.id, timeSlot)"
                            :style="{ cursor: editMode ? 'pointer' : 'default' }"
                        >
                          <v-icon
                              :icon="getSlotIcon(schedule[court.id]?.[timeSlot])"
                              :color="getSlotIconColor(schedule[court.id]?.[timeSlot])"
                              size="20"
                              class="mb-1"
                          />
                          <div class="slot-text">
                            {{ getSlotText(schedule[court.id]?.[timeSlot]) }}
                          </div>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Legend -->
        <v-row class="mt-6">
          <v-col cols="12">
            <v-card class="modern-card legend-card" elevation="0">
              <v-card-text class="pa-6">
                <h3 class="text-h6 font-weight-bold mb-4">Durum Açıklaması</h3>
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                      <span>Müsait</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-account" color="error" class="mr-2" />
                      <span>Dolu</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-tools" color="warning" class="mr-2" />
                      <span>Bakım</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="legend-item">
                      <v-icon icon="mdi-close-circle" color="grey" class="mr-2" />
                      <span>Kapalı</span>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

const authStore = useAuthStore()

// Reactive data
const selectedDate = ref(new Date())
const datePickerMenu = ref(false)
const schedule = ref<any>({})
const loading = ref(false)
const editMode = ref(false)
const saving = ref(false)

// Time slots (9:00 - 21:00)
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

// Courts data
const courts = ref([
  {
    id: 'K1',
    name: 'Kort 1',
    availableSlots: 8,
    occupiedSlots: 5,
    totalSlots: 13,
    occupancyRate: 38
  },
  {
    id: 'K2',
    name: 'Kort 2',
    availableSlots: 6,
    occupiedSlots: 7,
    totalSlots: 13,
    occupancyRate: 54
  },
  {
    id: 'K3',
    name: 'Kort 3',
    availableSlots: 10,
    occupiedSlots: 3,
    totalSlots: 13,
    occupancyRate: 23
  }
])

// Methods
const getCurrentDate = () => {
  const today = new Date()
  return today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSelectedDate = () => {
  return selectedDate.value.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getOccupancyColor = (rate: number) => {
  if (rate < 30) return 'text-success'
  if (rate < 70) return 'text-warning'
  return 'text-error'
}

const getOccupancyProgressColor = (rate: number) => {
  if (rate < 30) return 'success'
  if (rate < 70) return 'warning'
  return 'error'
}

const getSlotStatusClass = (status: string) => {
  switch (status) {
    case 'available': return 'status-available'
    case 'occupied': return 'status-occupied'
    case 'maintenance': return 'status-maintenance'
    case 'closed': return 'status-closed'
    default: return 'status-available'
  }
}

const getSlotIcon = (status: string) => {
  switch (status) {
    case 'available': return 'mdi-check-circle'
    case 'occupied': return 'mdi-account'
    case 'maintenance': return 'mdi-tools'
    case 'closed': return 'mdi-close-circle'
    default: return 'mdi-check-circle'
  }
}

const getSlotIconColor = (status: string) => {
  switch (status) {
    case 'available': return 'success'
    case 'occupied': return 'error'
    case 'maintenance': return 'warning'
    case 'closed': return 'grey'
    default: return 'success'
  }
}

const getSlotText = (status: string) => {
  switch (status) {
    case 'available': return 'Müsait'
    case 'occupied': return 'Dolu'
    case 'maintenance': return 'Bakım'
    case 'closed': return 'Kapalı'
    default: return 'Müsait'
  }
}

// Firebase operations
const fetchCourtSchedule = async (date: Date) => {
  loading.value = true
  try {
    const dateString = date.toISOString().split('T')[0]
    const docRef = doc(db, 'courtSchedule', dateString)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      schedule.value = docSnap.data().schedule || {}
    } else {
      // Create default schedule
      const defaultSchedule: any = {}
      courts.value.forEach(court => {
        defaultSchedule[court.id] = {}
        timeSlots.forEach(time => {
          defaultSchedule[court.id][time] = 'available'
        })
      })
      schedule.value = defaultSchedule
    }

    updateCourtStats()
  } catch (error) {
    console.error('Error fetching court schedule:', error)
    schedule.value = {}
  } finally {
    loading.value = false
  }
}

const updateCourtStats = () => {
  courts.value.forEach(court => {
    const courtSchedule = schedule.value[court.id] || {}
    let occupied = 0
    let available = 0

    timeSlots.forEach(time => {
      const status = courtSchedule[time] || 'available'
      if (status === 'occupied') occupied++
      else if (status === 'available') available++
    })

    court.occupiedSlots = occupied
    court.availableSlots = available
    court.occupancyRate = Math.round((occupied / timeSlots.length) * 100)
  })
}

const saveCourtSchedule = async () => {
  saving.value = true
  try {
    const dateString = selectedDate.value.toISOString().split('T')[0]
    const docRef = doc(db, 'courtSchedule', dateString)

    await setDoc(docRef, {
      schedule: schedule.value,
      lastUpdated: new Date(),
      updatedBy: authStore.user?.id
    })

    editMode.value = false
    console.log('✅ Court schedule saved successfully')
  } catch (error) {
    console.error('❌ Error saving court schedule:', error)
  } finally {
    saving.value = false
  }
}

const enableEditMode = () => {
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  fetchCourtSchedule(selectedDate.value)
}

const toggleSlotStatus = (courtId: string, timeSlot: string) => {
  if (!editMode.value) return

  const currentStatus = schedule.value[courtId]?.[timeSlot] || 'available'
  const statuses = ['available', 'occupied', 'maintenance', 'closed']
  const currentIndex = statuses.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % statuses.length

  if (!schedule.value[courtId]) {
    schedule.value[courtId] = {}
  }

  schedule.value[courtId][timeSlot] = statuses[nextIndex]
  updateCourtStats()
}

const onDateChange = () => {
  datePickerMenu.value = false
  fetchCourtSchedule(selectedDate.value)
}

// Watchers
watch(selectedDate, (newDate) => {
  fetchCourtSchedule(newDate)
})

// Lifecycle
onMounted(() => {
  fetchCourtSchedule(selectedDate.value)
})
</script>

<style scoped>


.welcome-section {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);  backdrop-filter: blur(20px);
  border-radius: 32px;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.date-time-widget {
  text-align: center;
  color: white;
}

.current-date {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.current-time {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.modern-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.modern-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  pointer-events: none;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.court-gradient {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
}

.admin-controls-card {
  border-left: 4px solid #667eea;
}

.court-overview-card .court-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.occupancy-percentage {
  font-size: 1.2rem;
}

.quick-stats {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  margin-top: 16px;
}

.stat-number {
  font-size: 1.5rem;
  line-height: 1.2;
}

.stat-label {
  color: rgba(0, 0, 0, 0.6);
}

.date-selection-card {
  border-left: 4px solid #4CAF50;
}

.schedule-card .v-card-title {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.schedule-table-container {
  overflow-x: auto;
}

.schedule-table {
  min-width: 600px;
}

.table-header th {
  background: rgba(102, 126, 234, 0.1);
  font-weight: 600;
  padding: 16px 12px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.time-column {
  width: 100px;
  min-width: 100px;
}

.court-column {
  width: 150px;
  min-width: 150px;
  text-align: center;
}

.time-slot-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

.time-cell {
  padding: 16px 12px;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.05);
}

.time-display {
  font-size: 0.9rem;
  color: #667eea;
}

.court-cell {
  padding: 8px;
  text-align: center;
}

.slot-status {
  padding: 12px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.slot-status:hover {
  transform: scale(1.05);
}

.slot-text {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-available {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.3);
  color: #2E7D32;
}

.status-occupied {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid rgba(244, 67, 54, 0.3);
  color: #C62828;
}

.status-maintenance {
  background: rgba(255, 152, 0, 0.1);
  border: 2px solid rgba(255, 152, 0, 0.3);
  color: #E65100;
}

.status-closed {
  background: rgba(158, 158, 158, 0.1);
  border: 2px solid rgba(158, 158, 158, 0.3);
  color: #424242;
}

.legend-card {
  border-left: 4px solid #FF9800;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-weight: 500;
}

.admin-action-buttons .v-btn {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.admin-action-buttons .v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* Responsive design */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .current-time {
    font-size: 1.5rem;
  }

  .admin-action-buttons {
    margin-top: 16px;
  }

  .admin-action-buttons .d-flex {
    flex-direction: column;
    gap: 8px;
  }

  .admin-action-buttons .v-btn {
    width: 100%;
  }
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-card {
  animation: fadeInUp 0.6s ease-out;
}

.modern-card:nth-child(2) {
  animation-delay: 0.1s;
}

.modern-card:nth-child(3) {
  animation-delay: 0.2s;
}

.modern-card:nth-child(4) {
  animation-delay: 0.3s;
}
</style>