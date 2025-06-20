<template>
  <div class="reservations-page">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Rezervasyon Yap
                </h1>
                <p class="welcome-subtitle">
                  Kort rezervasyonu yapın ve mevcut rezervasyonlarınızı görüntüleyin
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">Rezervasyon</div>
                <div class="current-time">Sistemi</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <v-row>
          <!-- New Reservation Form -->
          <v-col cols="12" md="6">
            <v-card class="modern-card reservation-form-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <div class="reservation-form-header pa-6">
                <div class="form-header-content">
                  <div class="form-icon-wrapper primary-gradient">
                    <v-icon icon="mdi-plus-circle" size="28" color="white" />
                  </div>
                  <div>
                    <h3 class="form-title">Yeni Rezervasyon</h3>
                    <p class="form-subtitle">Kort rezervasyonu yapmak için formu doldurun</p>
                  </div>
                </div>
              </div>

              <v-card-text class="pa-6 pt-0">
                <v-form v-model="valid" @submit.prevent="submitReservation">
                  <!-- Date Selection -->
                  <v-text-field
                      v-model="reservationData.date"
                      label="Tarih"
                      type="date"
                      variant="outlined"
                      :rules="dateRules"
                      :min="new Date().toISOString().split('T')[0]"
                      @change="onDateChange"
                      required
                      class="mb-4"
                  />

                  <!-- Court Selection -->
                  <v-select
                      v-model="reservationData.courtId"
                      label="Kort Seçimi"
                      :items="availableCourts"
                      item-title="name"
                      item-value="id"
                      variant="outlined"
                      :rules="courtRules"
                      @update:model-value="onCourtChange"
                      required
                      class="mb-4"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #append>
                          <v-chip
                              color="success"
                              size="small"
                              variant="flat"
                          >
                            Müsait
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>

                  <!-- Time and Duration -->
                  <v-row class="mb-4">
                    <v-col cols="6">
                      <v-select
                          v-model="reservationData.startTime"
                          label="Başlangıç Saati"
                          :items="availableTimeSlots"
                          variant="outlined"
                          :rules="timeRules"
                          :disabled="!reservationData.date || !reservationData.courtId"
                          required
                      >
                        <template #item="{ props, item }">
                          <v-list-item v-bind="props" :disabled="!item.raw.available">
                            <template #append>
                              <v-chip
                                  :color="item.raw.available ? 'success' : 'error'"
                                  size="small"
                                  variant="flat"
                              >
                                {{ item.raw.available ? 'Müsait' : 'Dolu' }}
                              </v-chip>
                            </template>
                          </v-list-item>
                        </template>
                      </v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-select
                          v-model="reservationData.duration"
                          label="Süre (saat)"
                          :items="durationOptions"
                          variant="outlined"
                          :rules="durationRules"
                          required
                      />
                    </v-col>
                  </v-row>

                  <!-- Type Selection -->
                  <v-select
                      v-model="reservationData.type"
                      label="Rezervasyon Türü"
                      :items="reservationTypes"
                      variant="outlined"
                      :rules="typeRules"
                      required
                      class="mb-6"
                  />

                  <!-- Submit Button -->
                  <v-btn
                      type="submit"
                      variant="flat"
                      size="large"
                      :loading="loading"
                      :disabled="!valid"
                      block
                      class="view-color reservation-submit-btn"
                  >
                    <v-icon icon="mdi-calendar-plus" class="mr-2" />
                    Rezervasyon Yap
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- My Reservations -->
          <v-col cols="12" md="6">
            <v-card class="modern-card reservations-list-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <div
                  class="reservations-header pa-6 cursor-pointer"
                  @click="toggleReservations"
              >
                <div class="reservations-header-content">
                  <div class="reservations-icon-wrapper success-gradient">
                    <v-icon icon="mdi-history" size="28" color="white" />
                  </div>
                  <div class="reservations-title-section">
                    <h3 class="reservations-title">Rezervasyonlarım</h3>
                    <p class="reservations-subtitle">{{ myReservations.length }} adet rezervasyon</p>
                  </div>
                  <v-icon
                      :icon="showReservations ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      class="toggle-icon"
                  />
                </div>
              </div>

              <v-expand-transition>
                <v-card-text v-show="showReservations" class="pa-0">
                  <!-- Loading State -->
                  <div v-if="loadingReservations" class="loading-state">
                    <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
                    <p class="loading-text">Rezervasyonlar yükleniyor...</p>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="myReservations.length === 0" class="empty-state">
                    <v-icon icon="mdi-calendar-blank" size="64" color="grey" class="empty-icon" />
                    <h3 class="empty-title">Henüz rezervasyonunuz yok</h3>
                    <p class="empty-description">
                      İlk rezervasyonunuzu yapmak için formu kullanın.
                    </p>
                  </div>

                  <!-- Reservations List -->
                  <div v-else class="reservations-list-container">
                    <div
                        v-for="(reservation, index) in myReservations"
                        :key="reservation.id"
                        class="reservation-list-item"
                        :class="{ 'last-item': index === myReservations.length - 1 }"
                    >
                      <div class="reservation-list-timeline">
                        <div
                            class="timeline-dot"
                            :class="getReservationColor(reservation.status)"
                        ></div>
                        <div
                            v-if="index !== myReservations.length - 1"
                            class="timeline-line"
                        ></div>
                      </div>

                      <div class="reservation-list-content">
                        <div class="reservation-list-main">
                          <div class="reservation-list-info">
                            <h4 class="reservation-list-title">
                              {{ reservation.courtName }}
                            </h4>
                            <div class="reservation-list-details">
                              <div class="detail-item">
                                <v-icon icon="mdi-calendar" size="16" />
                                <span>{{ formatReservationDate(reservation.date) }}</span>
                              </div>
                              <div class="detail-item">
                                <v-icon icon="mdi-clock" size="16" />
                                <span>{{ reservation.startTime }}</span>
                              </div>
                              <div class="detail-item">
                                <v-icon icon="mdi-timer" size="16" />
                                <span>{{ reservation.duration }} saat</span>
                              </div>
                              <div class="detail-item">
                                <v-icon icon="mdi-tag" size="16" />
                                <span>{{ getTypeText(reservation.type) }}</span>
                              </div>
                            </div>
                            <div class="reservation-cost">
                              <v-icon icon="mdi-currency-try" size="16" color="success" />
                              <span class="cost-amount">{{ reservation.totalCost }}</span>
                            </div>
                          </div>

                          <div class="reservation-list-meta">
                            <v-chip
                                size="small"
                                :color="getReservationColor(reservation.status)"
                                variant="flat"
                                class="status-chip"
                            >
                              <v-icon
                                  :icon="getReservationIcon(reservation.status)"
                                  size="16"
                                  class="mr-1"
                              />
                              {{ getStatusText(reservation.status) }}
                            </v-chip>

                            <v-menu v-if="canCancel(reservation.date)" offset-y>
                              <template #activator="{ props }">
                                <v-btn
                                    v-bind="props"
                                    icon="mdi-dots-vertical"
                                    variant="text"
                                    size="small"
                                    class="mt-2"
                                />
                              </template>
                              <v-list>
                                <v-list-item @click="cancelReservation(reservation.id)">
                                  <v-list-item-title>
                                    <v-icon icon="mdi-cancel" class="mr-2" />
                                    İptal Et
                                  </v-list-item-title>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

        <!-- Success Dialog -->
        <v-dialog v-model="successDialog" max-width="400">
          <v-card class="modern-dialog">
            <v-card-text class="text-center pa-8">
              <div class="success-icon-wrapper mb-4">
                <v-icon
                    icon="mdi-check-circle"
                    size="64"
                    color="success"
                />
              </div>
              <h3 class="success-title mb-2">Rezervasyon Onaylandı!</h3>
              <p class="success-description">Kortunuz başarıyla rezerve edildi.</p>
            </v-card-text>
            <v-card-actions class="pa-6 pt-0">
              <v-spacer />
              <v-btn color="primary" variant="flat" @click="successDialog = false">Tamam</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Error Snackbar -->
        <v-snackbar
            v-model="errorSnackbar"
            color="error"
            :timeout="4000"
            location="top"
        >
          {{ errorMessage }}
          <template #actions>
            <v-btn variant="text" @click="errorSnackbar = false">Kapat</v-btn>
          </template>
        </v-snackbar>
      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Reservation } from '@/types/reservation'

const authStore = useAuthStore()

// Form data
const reservationData = reactive({
  date: '',
  courtId: '',
  startTime: '',
  duration: 1,
  type: 'court-rental'
})

// Form validation
const valid = ref(false)
const loading = ref(false)
const loadingReservations = ref(false)
const successDialog = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const showReservations = ref(true)
const myReservations = ref<Reservation[]>([])

// Court schedule state
const courtSchedule = reactive<Record<string, Record<string, string>>>({
  'court-1': {},
  'court-2': {},
  'court-3': {}
})

// Available options
const availableCourts = ref([
  { id: 'court-1', name: 'Kort 1' },
  { id: 'court-2', name: 'Kort 2' },
  { id: 'court-3', name: 'Kort 3' }
])

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
]

const durationOptions = [
  { title: '1 Saat', value: 1 },
  { title: '1.5 Saat', value: 1.5 },
  { title: '2 Saat', value: 2 }
]

const reservationTypes = [
  { title: 'Kort Kiralama', value: 'court-rental' },
  { title: 'Özel Ders', value: 'private-lesson' },
  { title: 'Grup Kursu', value: 'group-clinic' }
]

// Computed properties
const availableTimeSlots = computed(() => {
  if (!reservationData.date || !reservationData.courtId) return []

  return timeSlots.map(time => ({
    title: time,
    value: time,
    available: courtSchedule[reservationData.courtId]?.[time] === 'available'
  }))
})

// Validation rules
const dateRules = [
  (v: string) => !!v || 'Tarih gereklidir',
  (v: string) => {
    const selectedDate = new Date(v)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today || 'Geçmiş tarih seçilemez'
  }
]

const courtRules = [
  (v: string) => !!v || 'Kort seçimi gereklidir'
]

const timeRules = [
  (v: string) => !!v || 'Saat seçimi gereklidir'
]

const durationRules = [
  (v: number) => !!v || 'Süre gereklidir'
]

const typeRules = [
  (v: string) => !!v || 'Rezervasyon türü gereklidir'
]

// Methods
const toggleReservations = () => {
  showReservations.value = !showReservations.value
}

const loadCourtSchedule = async (date: string) => {
  try {
    const scheduleDoc = await getDoc(doc(db, 'courtSchedule', date))

    if (scheduleDoc.exists()) {
      const data = scheduleDoc.data()
      if (data.schedule) {
        Object.keys(courtSchedule).forEach(courtId => {
          timeSlots.forEach(timeSlot => {
            courtSchedule[courtId][timeSlot] = data.schedule[courtId]?.[timeSlot] || 'available'
          })
        })
      } else {
        setDefaultSchedule()
      }
    } else {
      setDefaultSchedule()
    }
  } catch (error) {
    console.error('Kort programını yükleme hatası:', error)
    setDefaultSchedule()
  }
}

const setDefaultSchedule = () => {
  Object.keys(courtSchedule).forEach(courtId => {
    timeSlots.forEach(timeSlot => {
      courtSchedule[courtId][timeSlot] = 'available'
    })
  })
}

const onDateChange = () => {
  if (reservationData.date) {
    loadCourtSchedule(reservationData.date)
  }
  reservationData.startTime = ''
}

const onCourtChange = () => {
  reservationData.startTime = ''
}

// Load user's existing reservations from Firebase
const loadUserReservations = async () => {
  if (!authStore.user?.id) {
    console.log('❌ Kullanıcı ID bulunamadı')
    return
  }

  loadingReservations.value = true

  try {
    console.log('📚 Kullanıcı rezervasyonları yükleniyor, User ID:', authStore.user.id)

    // Firebase'den kullanıcının rezervasyonlarını çek (index olmadan)
    const q = query(
        collection(db, 'reservations'),
        where('studentId', '==', authStore.user.id)
    )

    const querySnapshot = await getDocs(q)
    const reservations: Reservation[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('📄 Rezervasyon verisi:', data)

      // Firebase timestamp'ini Date objesine çevir
      let reservationDate: Date
      if (typeof data.date === 'string') {
        reservationDate = new Date(data.date)
      } else if (data.date?.toDate) {
        reservationDate = data.date.toDate()
      } else {
        reservationDate = new Date(data.date)
      }

      reservations.push({
        id: doc.id,
        courtId: data.courtId,
        courtName: data.courtName || getCourtnameById(data.courtId),
        studentId: data.studentId,
        date: reservationDate,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        type: data.type,
        status: data.status,
        totalCost: data.totalCost,
        createdAt: data.createdAt?.toDate() || new Date()
      })
    })

    // Client-side'da tarihe göre sırala (en yeni önce)
    reservations.sort((a, b) => b.date.getTime() - a.date.getTime())

    myReservations.value = reservations
    console.log('✅ Rezervasyonlar yüklendi:', reservations.length, 'adet')

  } catch (error) {
    console.error('❌ Rezervasyonları yükleme hatası:', error)
    errorMessage.value = 'Rezervasyonlar yüklenirken hata oluştu'
    errorSnackbar.value = true
  } finally {
    loadingReservations.value = false
  }
}

// Helper function to get court name by ID
const getCourtnameById = (courtId: string): string => {
  const court = availableCourts.value.find(c => c.id === courtId)
  return court?.name || courtId
}

const submitReservation = async () => {
  if (!valid.value) return

  const isStillAvailable = courtSchedule[reservationData.courtId]?.[reservationData.startTime] === 'available'

  if (!isStillAvailable) {
    errorMessage.value = 'Seçilen saat artık müsait değil. Lütfen başka bir saat seçin.'
    errorSnackbar.value = true
    return
  }

  loading.value = true

  try {
    const endTime = calculateEndTime(reservationData.startTime, reservationData.duration)
    const reservationDoc = {
      studentId: authStore.user?.id,
      courtId: reservationData.courtId,
      courtName: getCourtnameById(reservationData.courtId),
      date: new Date(reservationData.date),
      startTime: reservationData.startTime,
      endTime: endTime,
      duration: reservationData.duration,
      type: reservationData.type,
      status: 'confirmed',
      totalCost: reservationData.duration * 1000, // 1000 TL per hour
      createdAt: serverTimestamp()
    }

    // Save reservation
    const reservationRef = doc(collection(db, 'reservations'))
    await setDoc(reservationRef, reservationDoc)

    // Update court schedule
    const scheduleRef = doc(db, 'courtSchedule', reservationData.date)
    const scheduleDoc = await getDoc(scheduleRef)

    let scheduleData = { schedule: {} }
    if (scheduleDoc.exists()) {
      scheduleData = scheduleDoc.data() as any
    }

    if (!scheduleData.schedule[reservationData.courtId]) {
      scheduleData.schedule[reservationData.courtId] = {}
    }

    scheduleData.schedule[reservationData.courtId][reservationData.startTime] = 'occupied'
    await setDoc(scheduleRef, scheduleData)

    // Update local state
    courtSchedule[reservationData.courtId][reservationData.startTime] = 'occupied'

    // Reset form
    Object.assign(reservationData, {
      date: '',
      courtId: '',
      startTime: '',
      duration: 1,
      type: 'court-rental'
    })

    // Show success dialog
    successDialog.value = true

    // Reload reservations
    await loadUserReservations()

  } catch (error) {
    console.error('Rezervasyon hatası:', error)
    errorMessage.value = 'Rezervasyon oluşturulurken hata oluştu. Lütfen tekrar deneyin.'
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + Math.floor(duration)
  const endMinutes = minutes + (duration % 1) * 60

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

// Helper functions
const getStatusText = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'Onaylı'
    case 'completed': return 'Tamamlandı'
    case 'cancelled': return 'İptal Edildi'
    case 'pending': return 'Beklemede'
    default: return status
  }
}

const getTypeText = (type: string): string => {
  switch (type) {
    case 'court-rental': return 'Kort Kiralama'
    case 'private-lesson': return 'Özel Ders'
    case 'group-clinic': return 'Grup Kursu'
    default: return type
  }
}

const getReservationIcon = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'mdi-check-circle'
    case 'completed': return 'mdi-check-all'
    case 'cancelled': return 'mdi-close-circle'
    default: return 'mdi-clock'
  }
}

const getReservationColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'success'
    case 'completed': return 'primary'
    case 'cancelled': return 'error'
    default: return 'warning'
  }
}

const formatReservationDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const canCancel = (date: Date): boolean => {
  const now = new Date()
  const reservationDate = new Date(date)
  const timeDiff = reservationDate.getTime() - now.getTime()
  const hoursDiff = timeDiff / (1000 * 3600)

  return hoursDiff > 24
}

const cancelReservation = async (reservationId: string) => {
  // Cancel reservation logic would go here
  console.log('Cancel reservation:', reservationId)
}

// Initialize
onMounted(async () => {
  setDefaultSchedule()
  console.log('🚀 Component mount edildi')

  await authStore.waitForAuth()
  console.log('✅ Auth hazır, rezervasyonlar yükleniyor...')
  await loadUserReservations()
})

// Auth user değişikliklerini dinle
watch(() => authStore.user, async (newUser, oldUser) => {
  console.log('👤 Auth user değişti:', {
    old: oldUser?.firstName || 'Yok',
    new: newUser?.firstName || 'Yok'
  })

  if (newUser?.id && authStore.initialized) {
    console.log('🔄 Yeni kullanıcı ile rezervasyonları yeniden yükleniyor...')
    await loadUserReservations()
  }
}, { deep: true })
</script>

<style scoped>
/* Styles are handled in main.css */
</style>