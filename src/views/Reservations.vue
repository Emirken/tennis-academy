<template>
  <div class="reservations-page">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Enhanced Welcome Section -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
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
        </div>
        <v-row>
          <!-- New Reservation Form -->
          <v-col cols="12" md="6">
            <v-card class="modern-card reservation-form-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <div class="reservation-form-header pa-4">
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

              <v-card-text class="pa-4 pt-0">
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

                  <!-- Time Selection -->
                  <v-select
                      v-model="reservationData.startTime"
                      label="Rezervasyon Saati"
                      :items="availableTimeSlots"
                      variant="outlined"
                      :rules="timeRules"
                      :disabled="!reservationData.date || !reservationData.courtId"
                      required
                      class="mb-6"
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
                  class="reservations-header pa-4 cursor-pointer"
                  @click="toggleReservations"
              >
                <div class="reservations-header-content">
                  <div class="reservations-icon-wrapper success-gradient">
                    <v-icon icon="mdi-history" size="28" color="white" />
                  </div>
                  <div class="reservations-title-section">
                    <h3 class="reservations-title">Rezervasyonlarım</h3>
                    <p class="reservations-subtitle">{{ personalReservations.length }} adet rezervasyon</p>
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
                  <div v-else-if="personalReservations.length === 0" class="empty-state">
                    <v-icon icon="mdi-calendar-blank" size="64" color="grey" class="empty-icon" />
                    <h3 class="empty-title">Henüz rezervasyonunuz yok</h3>
                    <p class="empty-description">
                      İlk rezervasyonunuzu yapmak için formu kullanın.
                    </p>
                  </div>

                  <!-- Reservations List -->
                  <div v-else class="reservations-list-container">
                    <div
                        v-for="(reservation, index) in personalReservations"
                        :key="reservation.id"
                        class="reservation-list-item"
                        :class="{ 'last-item': index === personalReservations.length - 1 }"
                    >
                      <div class="reservation-list-timeline">
                        <div
                            class="timeline-dot"
                            :class="getReservationColor(reservation.status)"
                        ></div>
                        <div
                            v-if="index !== personalReservations.length - 1"
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

                            <v-menu v-if="canCancel(reservation)" offset-y>
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
                                <v-list-item @click="cancelReservation(reservation)">
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
            <v-card-text class="text-center pa-5">
              <div class="success-icon-wrapper mb-4">
                <v-icon
                    icon="mdi-clock-check-outline"
                    size="64"
                    color="warning"
                />
              </div>
              <h3 class="success-title mb-2">Rezervasyon Talebi Alındı!</h3>
              <p class="success-description">Rezervasyonunuz admin onayına gönderildi. Onaylandığında bilgilendirileceksiniz.</p>
              <p class="success-description mt-3">
                Rezervasyonunuz onaylandıktan sonra, rezervasyonunuzu en geç 6 saat kala iptal edebilirsiniz.
                6 saatten az kalan rezervasyonların ücretleri iade edilmeyecektir.
              </p>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { notificationService } from '@/services/notificationService'
import type { Reservation } from '@/types/reservation'

const authStore = useAuthStore()

// Form data
const reservationData = reactive({
  date: '',
  courtId: '',
  startTime: ''
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

// Grup dersleri StudentDashboard'daki "Derslerim" kartında gösterilir;
// bu sayfadaki "Rezervasyonlarım" listesi yalnızca kişisel rezervasyonları içerir.
const personalReservations = computed(() =>
  myReservations.value.filter(r => !r.isGroupLesson)
)

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
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
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


// Methods
const toggleReservations = () => {
  showReservations.value = !showReservations.value
}

// Firestore'daki K1/K2/K3 ID'lerini form'daki court-1/2/3 formatına eşler
const firestoreToFormCourtId = (firestoreId: string): string => {
  const mapping: Record<string, string> = {
    'K1': 'court-1',
    'K2': 'court-2',
    'K3': 'court-3'
  }
  return mapping[firestoreId] || firestoreId
}

// Slot verisinden durum stringini çıkarır (string veya nesne olabilir)
const getSlotStatusValue = (slotData: any): string => {
  if (!slotData) return 'available'
  if (typeof slotData === 'string') return slotData
  if (typeof slotData === 'object') return slotData.status || 'available'
  return 'available'
}

const loadCourtSchedule = async (date: string) => {
  try {
    setDefaultSchedule()

    // Sadece aktif (pending/confirmed) rezervasyonlara göre dolu/müsait hesapla
    const activeQ = query(
      collection(db, 'reservations'),
      where('status', 'in', ['pending', 'confirmed'])
    )
    const snapshot = await getDocs(activeQ)

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()

      // Tarihi normalize et
      let docDateStr: string
      if (typeof data.date === 'string') {
        docDateStr = data.date
      } else if (data.date?.toDate) {
        docDateStr = data.date.toDate().toISOString().split('T')[0]
      } else {
        docDateStr = new Date(data.date).toISOString().split('T')[0]
      }

      if (docDateStr !== date) return

      // courtId K1/K2/K3 veya court-1/2/3 formatında olabilir — form formatına normalize et
      const courtId = firestoreToFormCourtId(data.courtId)
      if (!courtSchedule[courtId]) return

      // Grup dersleri özel olarak işaretle; normal rezervasyonlar 'occupied'
      const isGroupLesson = data.reservationType === 'group-lesson' ||
        data.groupId || data.groupAssignment || data.groupSchedule === true
      const slotStatus = isGroupLesson ? 'group_lesson' : 'occupied'

      // Rezervasyonun kapladığı tüm slotları dolu işaretle
      const slots = getTimeSlotsInRange(data.startTime, data.endTime)
      slots.forEach(slot => {
        courtSchedule[courtId][slot] = slotStatus
      })
    })

    // Grup dersleri için courtSchedule koleksiyonuna da bak (rezervasyonlarda olmayanlar için yedek)
    const scheduleDoc = await getDoc(doc(db, 'courtSchedule', date))
    if (scheduleDoc.exists()) {
      const data = scheduleDoc.data()
      if (data.schedule) {
        Object.keys(data.schedule).forEach(firestoreCourtId => {
          const formCourtId = firestoreToFormCourtId(firestoreCourtId)
          if (!courtSchedule[formCourtId]) return
          timeSlots.forEach(timeSlot => {
            const slotData = data.schedule[firestoreCourtId]?.[timeSlot]
            if (!slotData) return
            const status = getSlotStatusValue(slotData)
            const isGroup = status === 'group_lesson' ||
              (typeof slotData === 'object' && slotData.reservationType === 'group-lesson')
            // Hali hazırda müsait görünen slotları grup dersi ile işaretle
            if (isGroup && courtSchedule[formCourtId][timeSlot] === 'available') {
              courtSchedule[formCourtId][timeSlot] = 'group_lesson'
            }
          })
        })
      }
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

      const isGroupLesson = data.reservationType === 'group-lesson' ||
        !!data.groupId || !!data.groupAssignment || data.groupSchedule === true

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
        createdAt: data.createdAt?.toDate() || new Date(),
        isGroupLesson,
        groupId: data.groupId
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

  // Rezervasyon süresi sabit 1 saat
  const endTime = calculateEndTime(reservationData.startTime, 1)
  const slotsNeeded = getTimeSlotsInRange(reservationData.startTime, endTime)

  loading.value = true

  try {
    // 0. Aynı öğrencinin aynı gün için zaten aktif (pending/confirmed) rezervasyonu var mı kontrol et
    if (authStore.user?.id) {
      const sameDayQuery = query(
        collection(db, 'reservations'),
        where('studentId', '==', authStore.user.id)
      )
      const sameDaySnapshot = await getDocs(sameDayQuery)

      const hasSameDayReservation = sameDaySnapshot.docs.some((docSnap) => {
        const docData = docSnap.data()
        if (!['pending', 'confirmed'].includes(docData.status)) return false

        let docDateStr: string
        if (typeof docData.date === 'string') {
          docDateStr = docData.date
        } else if (docData.date?.toDate) {
          docDateStr = docData.date.toDate().toISOString().split('T')[0]
        } else {
          docDateStr = new Date(docData.date).toISOString().split('T')[0]
        }

        return docDateStr === reservationData.date
      })

      if (hasSameDayReservation) {
        errorMessage.value = 'Aynı gün içinde yalnızca bir rezervasyon yapabilirsiniz. Lütfen farklı bir tarih seçin.'
        errorSnackbar.value = true
        loading.value = false
        return
      }
    }

    // 1. Yerel courtSchedule'da grup dersi veya dolu slot kontrolü (K1/K2/K3 → court-1/2/3 eşlemesi yapılmış)
    const occupiedBySchedule = slotsNeeded.filter(slot => {
      const status = courtSchedule[reservationData.courtId]?.[slot]
      return status !== 'available'
    })

    if (occupiedBySchedule.length > 0) {
      errorMessage.value = `Seçilen saatlerde dolu veya grup dersi olan slotlar mevcut (${occupiedBySchedule.join(', ')}). Lütfen başka bir saat seçin.`
      errorSnackbar.value = true
      loading.value = false
      return
    }

    // 2. Firebase'den aynı kort için çakışan onaylı/bekleyen rezervasyon var mı kontrol et
    // Grup rezervasyonları K1/K2/K3, kort rezervasyonları court-1/2/3 formatında
    // olduğundan her iki formatta da sorgula.
    const courtIdKFormat: Record<string, string> = {
      'court-1': 'K1',
      'court-2': 'K2',
      'court-3': 'K3'
    }
    const courtIdVariants = [
      reservationData.courtId,
      courtIdKFormat[reservationData.courtId]
    ].filter(Boolean) as string[]

    const conflictSnapshots = await Promise.all(
      courtIdVariants.map(cid =>
        getDocs(query(collection(db, 'reservations'), where('courtId', '==', cid)))
      )
    )

    const selectedDateStr = reservationData.date

    let hasConflict = false
    conflictSnapshots.forEach((conflictSnapshot) => {
      conflictSnapshot.forEach((docSnap) => {
        const docData = docSnap.data()
        if (!['pending', 'confirmed'].includes(docData.status)) return

        // date alanı Timestamp veya Date olabilir, string karşılaştırması için normalize et
        let docDateStr: string
        if (typeof docData.date === 'string') {
          docDateStr = docData.date
        } else if (docData.date?.toDate) {
          docDateStr = docData.date.toDate().toISOString().split('T')[0]
        } else {
          docDateStr = new Date(docData.date).toISOString().split('T')[0]
        }

        if (docDateStr !== selectedDateStr) return

        const existingStart = docData.startTime
        const existingEnd = docData.endTime
        const newStart = reservationData.startTime
        const newEnd = endTime

        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          hasConflict = true
        }
      })
    })

    if (hasConflict) {
      errorMessage.value = 'Bu kort ve saat aralığı için zaten bir rezervasyon mevcut. Lütfen başka bir saat seçin.'
      errorSnackbar.value = true
      loading.value = false
      return
    }

    const reservationDoc = {
      studentId: authStore.user?.id,
      courtId: reservationData.courtId,
      courtName: getCourtnameById(reservationData.courtId),
      date: new Date(reservationData.date),
      startTime: reservationData.startTime,
      endTime: endTime,
      duration: 1,
      type: 'court-rental',
      status: 'pending',
      totalCost: 1000,
      createdAt: serverTimestamp()
    }

    // Save reservation
    const reservationRef = doc(collection(db, 'reservations'))
    await setDoc(reservationRef, reservationDoc)

    // Admin'e rezervasyon onay bildirimi gönder
    const studentName = `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim()
    const studentPhone = authStore.user?.phone_number || authStore.user?.phone || ''
    const studentNameWithPhone = studentPhone ? `${studentName} (${studentPhone})` : studentName
    const courtName = getCourtnameById(reservationData.courtId)
    const formattedDate = new Date(reservationData.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    await notificationService.createAdminNotification(
      'Yeni Rezervasyon Talebi',
      `${studentNameWithPhone}, ${formattedDate} tarihinde ${courtName} için ${reservationData.startTime} saatinde rezervasyon talebinde bulundu.`,
      'reservation_pending',
      { reservationId: reservationRef.id, studentId: authStore.user?.id, studentName }
    )

    // Reset form
    Object.assign(reservationData, {
      date: '',
      courtId: '',
      startTime: ''
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

// Başlangıç ve bitiş saati arasındaki tüm saat dilimlerini döndürür
const getTimeSlotsInRange = (startTime: string, endTime: string): string[] => {
  const slots: string[] = []
  const [startH] = startTime.split(':').map(Number)
  const [endH] = endTime.split(':').map(Number)

  for (const slot of timeSlots) {
    const [slotH] = slot.split(':').map(Number)
    if (slotH >= startH && slotH < endH) {
      slots.push(slot)
    }
  }
  return slots
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

// Rezervasyonun başlangıç zamanını (tarih + saat) Date objesine çevirir.
const getReservationStartDateTime = (reservation: Reservation): Date => {
  const base = new Date(reservation.date)
  const [h, m] = (reservation.startTime || '00:00').split(':').map(Number)
  base.setHours(h || 0, m || 0, 0, 0)
  return base
}

const canCancel = (reservation: Reservation): boolean => {
  if (!['pending', 'confirmed'].includes(reservation.status)) return false

  const now = new Date()
  const start = getReservationStartDateTime(reservation)
  const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 3600)

  return hoursDiff >= 6
}

const cancelReservation = async (reservation: Reservation) => {
  if (!canCancel(reservation)) {
    errorMessage.value = 'Bu rezervasyon artık iptal edilemez. Rezervasyona en az 6 saat kala iptal edebilirsiniz.'
    errorSnackbar.value = true
    return
  }

  if (!confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) return

  try {
    await updateDoc(doc(db, 'reservations', reservation.id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'student'
    })

    // Admin'e iptal bildirimi gönder
    const studentName = `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim()
    const formattedDate = new Date(reservation.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    await notificationService.createAdminNotification(
      'Rezervasyon İptal Edildi',
      `${studentName}, ${formattedDate} tarihinde ${reservation.courtName} için ${reservation.startTime} saatindeki rezervasyonunu iptal etti.`,
      'reservation_rejected',
      { reservationId: reservation.id, studentId: authStore.user?.id, studentName }
    )

    await loadUserReservations()
  } catch (error) {
    console.error('Rezervasyon iptal hatası:', error)
    errorMessage.value = 'Rezervasyon iptal edilirken hata oluştu.'
    errorSnackbar.value = true
  }
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