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
                <ReservationForm @success="onFormSuccess" />
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
        <v-dialog v-model="successDialog" max-width="480" persistent>
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
              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-4 text-left"
              >
                <strong>Rezervasyonunuz 30 dk içinde onaylanmaz ise lütfen 0551 850 84 86 numaralı telefondan rezervasyonunuzu onaylatın.</strong>
              </v-alert>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { notificationService } from '@/services/notificationService'
import type { Reservation } from '@/types/reservation'
import {
  isLessonDoc,
  type RawReservationDoc
} from '@/utils/dailyReservationLimit'
import ReservationForm from '@/components/reservations/ReservationForm.vue'

const authStore = useAuthStore()

// Liste/iptal durumları (form mantığı ReservationForm bileşenine taşındı)
const loadingReservations = ref(false)
const successDialog = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const showReservations = ref(true)
const myReservations = ref<Reservation[]>([])

// Form başarıyla gönderildiğinde: başarı dialogunu aç ve listeyi yenile.
const onFormSuccess = async () => {
  successDialog.value = true
  await loadUserReservations()
}

// Dersler (grup VE özel) StudentDashboard'daki "Derslerim" kartında gösterilir;
// bu sayfadaki "Rezervasyonlarım" listesi yalnızca öğrencinin kendi yaptığı
// kort rezervasyonlarını içerir. Ders ile rezervasyon farklı şeylerdir.
const personalReservations = computed(() =>
  myReservations.value.filter(r => !r.isLesson)
)

// Available options (liste için kort adı çözümünde kullanılır)
const availableCourts = ref([
  { id: 'court-1', name: 'Kort 1' },
  { id: 'court-2', name: 'Kort 2' },
  { id: 'court-3', name: 'Kort 3' }
])


// Methods
const toggleReservations = () => {
  showReservations.value = !showReservations.value
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
      // Ders (grup VEYA özel) tespiti — "Rezervasyonlarım" listesinden çıkarmak için.
      const isLesson = isLessonDoc(data as RawReservationDoc)

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
        isLesson,
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

// Initialize — yalnızca kullanıcının rezervasyon listesini yükle (form mantığı
// ve groups önbelleği başlatması ReservationForm bileşenine taşındı).
onMounted(async () => {
  await authStore.waitForAuth()
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