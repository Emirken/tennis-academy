<template>
  <div class="reservations-page">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">Kort Rezervasyonları</h1>
        <p class="page-subtitle">
          Bir sonraki tenis seansınız için kort rezervasyonu yapın
        </p>
      </div>

      <v-row>
        <!-- Reservation Form -->
        <v-col cols="12" md="6">
          <v-card class="reservation-form-card" elevation="4">
            <v-card-title class="text-h5 pa-6 bg-primary text-white">
              <v-icon icon="mdi-calendar-plus" class="mr-2" />
              Yeni Rezervasyon
            </v-card-title>

            <v-card-text class="pa-6">
              <v-form
                  ref="reservationForm"
                  v-model="valid"
                  @submit.prevent="submitReservation"
              >
                <!-- Date Selection -->
                <v-text-field
                    v-model="reservationData.date"
                    label="Tarih"
                    type="date"
                    variant="outlined"
                    :rules="dateRules"
                    :min="minDate"
                    class="mb-4"
                    required
                    @update:model-value="onDateChange"
                />

                <!-- Court Selection -->
                <v-select
                    v-model="reservationData.courtId"
                    label="Kort Seçin"
                    :items="availableCourts"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    :rules="courtRules"
                    class="mb-4"
                    required
                    @update:model-value="onCourtChange"
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

                <!-- Time Selection -->
                <v-row>
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
                </v-row>
                <!-- Submit Button -->
                <v-btn
                    type="submit"
                    color="primary"
                    variant="flat"
                    size="large"
                    :loading="loading"
                    :disabled="!valid"
                    block
                >
                  Rezervasyon Yap
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- My Reservations -->
        <v-col cols="12" md="6">
          <v-card elevation="4">
            <v-card-title
                class="text-h5 pa-6 bg-success text-white d-flex align-center cursor-pointer"
                @click="toggleReservations"
            >
              <v-icon icon="mdi-history" class="mr-2" />
              Rezervasyonlarım ({{ myReservations.length }})
              <v-spacer />
              <v-icon
                  :icon="showReservations ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  class="ml-2"
              />
            </v-card-title>

            <v-expand-transition>
              <v-card-text v-show="showReservations" class="pa-0">
                <!-- Loading State -->
                <div v-if="loadingReservations" class="text-center pa-8">
                  <v-progress-circular indeterminate color="primary" class="mb-4" />
                  <p class="text-body-2">Rezervasyonlar yükleniyor...</p>
                </div>

                <!-- Reservations List -->
                <v-list v-else-if="myReservations.length > 0">
                  <v-list-item
                      v-for="reservation in myReservations"
                      :key="reservation.id"
                      class="px-6 py-4"
                  >
                    <template #prepend>
                      <v-icon
                          :icon="getReservationIcon(reservation.status)"
                          :color="getReservationColor(reservation.status)"
                      />
                    </template>

                    <v-list-item-title class="font-weight-medium">
                      {{ reservation.courtName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatReservationDate(reservation.date) }} saat {{ reservation.startTime }}
                      <br>
                      {{ getTypeText(reservation.type) }} • {{ reservation.duration }} saat • ₺{{ reservation.totalCost }}
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex flex-column align-end">
                        <v-chip
                            :color="getReservationColor(reservation.status)"
                            size="small"
                            variant="flat"
                            class="mb-2"
                        >
                          {{ getStatusText(reservation.status) }}
                        </v-chip>

                        <v-btn
                            v-if="reservation.status === 'confirmed' && canCancel(reservation.date)"
                            icon="mdi-close"
                            size="small"
                            color="error"
                            variant="text"
                            @click="cancelReservation(reservation.id)"
                        />
                      </div>
                    </template>
                  </v-list-item>
                </v-list>

                <!-- Empty State -->
                <div
                    v-else
                    class="text-center pa-8"
                >
                  <v-icon
                      icon="mdi-calendar-blank"
                      size="64"
                      color="grey-lighten-1"
                      class="mb-4"
                  />
                  <p class="text-h6 text-grey">Henüz rezervasyon yok</p>
                  <p class="text-body-2 text-grey">Başlamak için ilk kort rezervasyonunuzu yapın!</p>
                </div>
              </v-card-text>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="400">
      <v-card>
        <v-card-text class="text-center pa-8">
          <v-icon
              icon="mdi-check-circle"
              size="64"
              color="success"
              class="mb-4"
          />
          <h3 class="text-h5 font-weight-bold mb-2">Rezervasyon Onaylandı!</h3>
          <p class="text-body-2">Kortunuz başarıyla rezerve edildi.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="successDialog = false">Tamam</v-btn>
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

// Court schedule data from Firebase
const courtSchedule = reactive<Record<string, Record<string, string>>>({
  K1: {},
  K2: {},
  K3: {}
})

// Available courts (3 courts as requested)
const availableCourts = ref([
  { id: 'K1', name: 'K1 (Kapalı)', hourlyRate: 50 },
  { id: 'K2', name: 'K2 (Açık)', hourlyRate: 40 },
  { id: 'K3', name: 'K3 (Kapalı)', hourlyRate: 50 }
])

// Time slots (matching courts.vue)
const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

const myReservations = ref<Reservation[]>([])

// Computed
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const calculatedCost = computed(() => {
  if (!reservationData.courtId || !reservationData.duration || !reservationData.type) {
    return 0
  }

  const court = availableCourts.value.find(c => c.id === reservationData.courtId)
  if (!court) return 0

  let rate = court.hourlyRate
  if (reservationData.type === 'private-lesson') rate = 100
  if (reservationData.type === 'group-clinic') rate = 60

  return rate * reservationData.duration
})

// Available time slots based on court schedule
const availableTimeSlots = computed(() => {
  if (!reservationData.date || !reservationData.courtId) {
    return timeSlots.map(time => ({ title: time, value: time, available: true }))
  }

  return timeSlots.map(time => {
    const isAvailable = courtSchedule[reservationData.courtId]?.[time] !== 'occupied'
    return {
      title: time,
      value: time,
      available: isAvailable
    }
  }).filter(slot => slot.available)
})

// Validation rules
const dateRules = [
  (v: string) => !!v || 'Tarih gereklidir'
]

const courtRules = [
  (v: string) => !!v || 'Kort seçimi gereklidir'
]

const timeRules = [
  (v: string) => !!v || 'Başlangıç saati gereklidir'
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

  const isStillAvailable = courtSchedule[reservationData.courtId]?.[reservationData.startTime] !== 'occupied'

  if (!isStillAvailable) {
    errorMessage.value = 'Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.'
    errorSnackbar.value = true
    return
  }

  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newReservation: Reservation = {
      id: `res_${Date.now()}`,
      courtId: reservationData.courtId,
      studentId: authStore.user?.id || '',
      courtName: availableCourts.value.find(c => c.id === reservationData.courtId)?.name || '',
      date: new Date(reservationData.date),
      startTime: reservationData.startTime,
      endTime: calculateEndTime(reservationData.startTime, reservationData.duration),
      duration: reservationData.duration,
      type: reservationData.type as 'court-rental' | 'private-lesson' | 'group-clinic',
      status: 'confirmed',
      totalCost: calculatedCost.value,
      createdAt: new Date()
    }

    // Firebase'e kaydet
    await setDoc(doc(db, 'reservations', newReservation.id), {
      ...newReservation,
      date: newReservation.date.toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Kort programını güncelle
    const dateKey = reservationData.date
    const existingScheduleDoc = await getDoc(doc(db, 'courtSchedule', dateKey))
    let existingSchedule = {}

    if (existingScheduleDoc.exists()) {
      existingSchedule = existingScheduleDoc.data().schedule || {}
    }

    const updatedSchedule = {
      ...existingSchedule,
      [reservationData.courtId]: {
        ...existingSchedule[reservationData.courtId],
        [reservationData.startTime]: 'occupied'
      }
    }

    const scheduleData = {
      schedule: updatedSchedule,
      date: reservationData.date,
      updatedAt: serverTimestamp(),
      updatedBy: authStore.user?.email || 'Bilinmeyen',
      lastReservation: {
        reservationId: newReservation.id,
        studentName: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
        type: reservationData.type
      }
    }

    await setDoc(doc(db, 'courtSchedule', dateKey), scheduleData, { merge: true })

    // Yerel verileri güncelle
    courtSchedule[reservationData.courtId][reservationData.startTime] = 'occupied'
    myReservations.value.unshift(newReservation)

    successDialog.value = true
    showReservations.value = true

    // Form'u temizle
    Object.assign(reservationData, {
      date: '',
      courtId: '',
      startTime: '',
      duration: 1,
      type: 'court-rental'
    })

    console.log('✅ Rezervasyon başarıyla oluşturuldu:', newReservation)

  } catch (error: any) {
    console.error('❌ Rezervasyon oluşturma hatası:', error)
    errorMessage.value = 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.'
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const cancelReservation = async (reservationId: string) => {
  try {
    loading.value = true

    const reservationIndex = myReservations.value.findIndex(r => r.id === reservationId)
    if (reservationIndex === -1) {
      throw new Error('Rezervasyon bulunamadı')
    }

    const reservation = myReservations.value[reservationIndex]

    // Firebase'de rezervasyonu iptal et
    await setDoc(doc(db, 'reservations', reservationId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: authStore.user?.email || 'Bilinmeyen',
      updatedAt: serverTimestamp()
    }, { merge: true })

    // Gelecek tarihse kort programını güncelle
    if (reservation.date >= new Date()) {
      const dateKey = reservation.date.toISOString().split('T')[0]
      const existingScheduleDoc = await getDoc(doc(db, 'courtSchedule', dateKey))

      if (existingScheduleDoc.exists()) {
        const existingSchedule = existingScheduleDoc.data().schedule || {}

        const updatedSchedule = {
          ...existingSchedule,
          [reservation.courtId]: {
            ...existingSchedule[reservation.courtId],
            [reservation.startTime]: 'available'
          }
        }

        const scheduleData = {
          schedule: updatedSchedule,
          date: dateKey,
          updatedAt: serverTimestamp(),
          updatedBy: authStore.user?.email || 'Bilinmeyen',
          lastCancellation: {
            reservationId: reservationId,
            studentName: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
            cancelledAt: new Date().toISOString()
          }
        }

        await setDoc(doc(db, 'courtSchedule', dateKey), scheduleData, { merge: true })
        courtSchedule[reservation.courtId][reservation.startTime] = 'available'
      }
    }

    // Yerel rezervasyon durumunu güncelle
    myReservations.value[reservationIndex].status = 'cancelled'

    console.log('✅ Rezervasyon başarıyla iptal edildi:', reservationId)

  } catch (error: any) {
    console.error('❌ Rezervasyon iptal etme hatası:', error)
    errorMessage.value = 'Rezervasyon iptal edilemedi. Lütfen tekrar deneyin.'
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

</style>