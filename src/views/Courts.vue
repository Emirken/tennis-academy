<template>
  <div class="courts-page">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">Kort Durumu</h1>
        <p class="page-subtitle">
          Tenis kortlarımızın güncel doluluk durumunu ve müsaitlik bilgilerini görüntüleyin.
        </p>

        <!-- Admin Controls -->
        <div v-if="authStore.isAdmin" class="admin-controls mt-4">
          <v-btn
              v-if="!editMode"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-pencil"
              @click="enableEditMode"
          >
            Kort Durumlarını Düzenle
          </v-btn>
          <div v-else class="d-flex gap-2 justify-center">
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

      <!-- Court Overview Cards -->
      <v-row class="mb-8">
        <v-col v-for="court in courts" :key="court.id" cols="12" md="4" class="mb-4">
          <v-card class="court-overview-card h-100" elevation="6">
            <v-card-title class="court-title">
              {{ court.name }}
            </v-card-title>

            <v-card-text class="pa-6">
              <!-- Occupancy Rate -->
              <div class="occupancy-section mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1">Doluluk Oranı</span>
                  <span class="occupancy-percentage">{{ court.occupancyRate }}%</span>
                </div>

                <v-progress-linear
                    :model-value="court.occupancyRate"
                    :color="getOccupancyColor(court.occupancyRate)"
                    height="12"
                    rounded
                    class="mb-2"
                />
              </div>

              <!-- Current Status -->
              <div class="status-section mb-4">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-subtitle-1">Durum</span>
                  <v-chip
                      :color="getStatusColor(court.currentStatus)"
                      size="small"
                      variant="flat"
                  >
                    {{ getStatusText(court.currentStatus) }}
                  </v-chip>
                </div>
              </div>

              <!-- Next Available -->
              <div class="next-available-section">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-subtitle-1">Sonraki Müsait</span>
                  <span class="next-time">{{ formatNextAvailable(court.nextAvailable) }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Daily Schedule -->
      <v-card elevation="6" class="schedule-card">
        <v-card-title class="schedule-title">
          <div class="d-flex justify-space-between align-center w-100">
            <span>Günlük Kort Programı</span>
            <div class="d-flex align-center gap-2">
              <v-btn
                  variant="text"
                  icon="mdi-chevron-left"
                  @click="changeDate(-1)"
                  size="small"
              />
              <span class="selected-date">{{ formatSelectedDate() }}</span>
              <v-btn
                  variant="text"
                  icon="mdi-chevron-right"
                  @click="changeDate(1)"
                  size="small"
              />
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-0">
          <div class="schedule-container">
            <!-- Time Header -->
            <div class="schedule-header">
              <div class="time-column-header"></div>
              <div v-for="court in courts" :key="court.id" class="court-column-header">
                {{ court.name }}
              </div>
            </div>

            <!-- Schedule Grid -->
            <div class="schedule-grid">
              <div v-for="timeSlot in timeSlots" :key="timeSlot" class="schedule-row">
                <!-- Time Column -->
                <div class="time-column">
                  {{ timeSlot }}
                </div>

                <!-- Court Columns -->
                <div v-for="court in courts" :key="court.id" class="court-column">
                  <div
                      v-if="!editMode || !authStore.isAdmin"
                      class="schedule-cell"
                      :class="getCellClass(court.id, timeSlot)"
                  >
                    {{ getScheduleText(court.id, timeSlot) }}
                  </div>

                  <!-- Admin Edit Mode -->
                  <div v-else class="schedule-cell-edit">
                    <v-select
                        v-model="editSchedule[court.id][timeSlot]"
                        :items="statusOptions"
                        item-title="text"
                        item-value="value"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="updateCourtOccupancy(court.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Legend -->
      <v-row justify="center" class="mt-6">
        <v-col cols="12" md="8">
          <v-card class="legend-card" elevation="4">
            <v-card-text class="pa-4">
              <h4 class="text-center mb-4">Açıklama</h4>
              <div class="d-flex justify-center flex-wrap gap-4">
                <div class="legend-item">
                  <div class="legend-color available"></div>
                  <span>Müsait</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color occupied"></div>
                  <span>Dolu</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color maintenance"></div>
                  <span>Bakım</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color closed"></div>
                  <span>Kapalı</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Success/Error Messages -->
      <v-snackbar
          v-model="showSuccessMessage"
          color="success"
          timeout="3000"
          location="top"
      >
        <v-icon icon="mdi-check-circle" class="me-2" />
        Kort programı başarıyla güncellendi!
      </v-snackbar>

      <v-snackbar
          v-model="showErrorMessage"
          color="error"
          timeout="4000"
          location="top"
      >
        <v-icon icon="mdi-alert-circle" class="me-2" />
        {{ errorMessage }}
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Store
const authStore = useAuthStore()

// Reactive data
const editMode = ref(false)
const saving = ref(false)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const errorMessage = ref('')
const selectedDate = ref(new Date())

// Time slots (07:00-11:00 and 17:00-23:00)
const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

// Courts data
const courts = ref([
  {
    id: 'K1',
    name: 'K1',
    occupancyRate: 0,
    currentStatus: 'available',
    nextAvailable: null
  },
  {
    id: 'K2',
    name: 'K2',
    occupancyRate: 0,
    currentStatus: 'available',
    nextAvailable: null
  },
  {
    id: 'K3',
    name: 'K3',
    occupancyRate: 0,
    currentStatus: 'available',
    nextAvailable: null
  }
])

// Schedule data
const schedule = reactive<Record<string, Record<string, string>>>({
  K1: {},
  K2: {},
  K3: {}
})

// Edit schedule data
const editSchedule = reactive<Record<string, Record<string, string>>>({
  K1: {},
  K2: {},
  K3: {}
})

// Status options for admin
const statusOptions = [
  { text: 'Müsait', value: 'available' },
  { text: 'Dolu', value: 'occupied' },
  { text: 'Bakım', value: 'maintenance' },
  { text: 'Kapalı', value: 'closed' }
]

// Initialize schedule with default 'available' status
const initializeSchedule = () => {
  courts.value.forEach(court => {
    if (!schedule[court.id]) {
      schedule[court.id] = {}
    }
    if (!editSchedule[court.id]) {
      editSchedule[court.id] = {}
    }

    timeSlots.forEach(timeSlot => {
      // Always default to 'available' if not set
      schedule[court.id][timeSlot] = schedule[court.id][timeSlot] || 'available'
      editSchedule[court.id][timeSlot] = schedule[court.id][timeSlot]
    })
  })
}

// Set default values for all slots
const setDefaultSchedule = () => {
  courts.value.forEach(court => {
    timeSlots.forEach(timeSlot => {
      schedule[court.id][timeSlot] = 'available'
      editSchedule[court.id][timeSlot] = 'available'
    })
  })
}

// Methods
const enableEditMode = () => {
  editMode.value = true
  // Copy current schedule to edit mode
  courts.value.forEach(court => {
    timeSlots.forEach(timeSlot => {
      editSchedule[court.id][timeSlot] = schedule[court.id][timeSlot]
    })
  })
}

const cancelEdit = () => {
  editMode.value = false
  // Reset edit schedule to original values
  courts.value.forEach(court => {
    timeSlots.forEach(timeSlot => {
      editSchedule[court.id][timeSlot] = schedule[court.id][timeSlot]
    })
  })
}

const saveCourtSchedule = async () => {
  if (!authStore.isAdmin) {
    showErrorMessage.value = true
    errorMessage.value = 'Yetkisiz: Sadece yöneticiler kort programını güncelleyebilir'
    return
  }

  saving.value = true

  try {
    const scheduleData = {
      schedule: editSchedule,
      date: selectedDate.value.toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
      updatedBy: authStore.user?.email || 'Bilinmeyen'
    }

    const dateKey = selectedDate.value.toISOString().split('T')[0]
    await setDoc(doc(db, 'courtSchedule', dateKey), scheduleData, { merge: true })

    // Update local schedule
    courts.value.forEach(court => {
      timeSlots.forEach(timeSlot => {
        schedule[court.id][timeSlot] = editSchedule[court.id][timeSlot]
      })
    })

    // Update court occupancy rates
    updateAllCourtOccupancy()

    editMode.value = false
    showSuccessMessage.value = true

    console.log('✅ Kort programı başarıyla güncellendi:', scheduleData)
  } catch (error: any) {
    console.error('❌ Kort programını güncelleme hatası:', error)
    showErrorMessage.value = true
    errorMessage.value = 'Kort programını güncellemede hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    saving.value = false
  }
}

const loadCourtSchedule = async () => {
  try {
    const dateKey = selectedDate.value.toISOString().split('T')[0]
    const scheduleDoc = await getDoc(doc(db, 'courtSchedule', dateKey))

    if (scheduleDoc.exists()) {
      const data = scheduleDoc.data()
      if (data.schedule) {
        // First set defaults, then override with saved data
        setDefaultSchedule()

        // Merge saved data with defaults
        courts.value.forEach(court => {
          timeSlots.forEach(timeSlot => {
            if (data.schedule[court.id] && data.schedule[court.id][timeSlot]) {
              schedule[court.id][timeSlot] = data.schedule[court.id][timeSlot]
              editSchedule[court.id][timeSlot] = data.schedule[court.id][timeSlot]
            }
          })
        })
      } else {
        setDefaultSchedule()
      }
      console.log('✅ Kort programı yüklendi:', data)
    } else {
      console.log('📝 Bu tarih için kort programı bulunamadı, tüm kortlar müsait olarak ayarlandı')
      setDefaultSchedule()
    }

    updateAllCourtOccupancy()
  } catch (error: any) {
    console.error('❌ Kort programını yükleme hatası:', error)
    setDefaultSchedule()
    updateAllCourtOccupancy()
  }
}

const updateCourtOccupancy = (courtId: string) => {
  const court = courts.value.find(c => c.id === courtId)
  if (!court) return

  let occupiedSlots = 0
  let totalSlots = timeSlots.length

  timeSlots.forEach(timeSlot => {
    if (editSchedule[courtId][timeSlot] === 'occupied') {
      occupiedSlots++
    }
  })

  court.occupancyRate = Math.round((occupiedSlots / totalSlots) * 100)

  // Update current status and next available
  updateCourtStatus(court)
}

const updateAllCourtOccupancy = () => {
  courts.value.forEach(court => {
    updateCourtOccupancy(court.id)
  })
}

const updateCourtStatus = (court: any) => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Check current status based on current time
  let currentStatus = 'closed' // Default to closed if outside operating hours

  for (const timeSlot of timeSlots) {
    const slotHour = parseInt(timeSlot.split(':')[0])

    // Check if we're currently in this time slot
    if (slotHour === currentHour) {
      currentStatus = schedule[court.id][timeSlot] || 'available'
      break
    }
  }

  court.currentStatus = currentStatus

  // Find next available slot (first available slot in the schedule)
  court.nextAvailable = null

  for (const timeSlot of timeSlots) {
    const slotHour = parseInt(timeSlot.split(':')[0])
    const slotTime = slotHour * 60 // Convert to minutes for easier comparison
    const currentTime = currentHour * 60 + currentMinute

    // Check if this slot is available and either:
    // 1. In the future today, or
    // 2. It's the first available slot (for next day reference)
    if (schedule[court.id][timeSlot] === 'available') {
      if (slotTime > currentTime) {
        // Future slot today
        court.nextAvailable = timeSlot
        break
      } else if (!court.nextAvailable) {
        // First available slot (could be for reference)
        court.nextAvailable = timeSlot
      }
    }
  }

  // If no future slot found today, find first available slot for tomorrow reference
  if (!court.nextAvailable) {
    for (const timeSlot of timeSlots) {
      if (schedule[court.id][timeSlot] === 'available') {
        court.nextAvailable = timeSlot
        break
      }
    }
  }
}

const getOccupancyColor = (rate: number): string => {
  if (rate <= 30) return 'success'
  if (rate <= 70) return 'warning'
  return 'error'
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'success'
    case 'occupied':
      return 'error'
    case 'maintenance':
      return 'warning'
    case 'closed':
      return 'grey'
    default:
      return 'grey'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'available':
      return 'Müsait'
    case 'occupied':
      return 'Dolu'
    case 'maintenance':
      return 'Bakım'
    case 'closed':
      return 'Kapalı'
    default:
      return 'Bilinmiyor'
  }
}

const formatNextAvailable = (time: string | null): string => {
  if (!time) return 'Müsait değil'

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const slotHour = parseInt(time.split(':')[0])
  const currentTime = currentHour * 60 + currentMinute
  const slotTime = slotHour * 60

  if (slotTime > currentTime) {
    return time // Future time today
  } else {
    return `${time} (Yarın)` // Next day
  }
}

const formatSelectedDate = (): string => {
  return selectedDate.value.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const changeDate = (days: number) => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + days)
  selectedDate.value = newDate
  loadCourtSchedule()
}

const getCellClass = (courtId: string, timeSlot: string): string => {
  const status = schedule[courtId]?.[timeSlot] || 'available'
  return `cell-${status}`
}

const getScheduleText = (courtId: string, timeSlot: string): string => {
  const status = schedule[courtId]?.[timeSlot] || 'available'
  switch (status) {
    case 'occupied':
      return 'DOLU'
    case 'maintenance':
      return 'BAKIM'
    case 'closed':
      return 'KAPALI'
    default:
      return 'MÜSAİT'
  }
}

// Lifecycle
onMounted(() => {
  // Initialize with default 'available' status
  setDefaultSchedule()
  loadCourtSchedule()
})
</script>

<style scoped>

</style>