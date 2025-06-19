<template>
  <div class="student-dashboard">
    <v-container class="py-8">
      <!-- Welcome Section -->
      <div class="welcome-section mb-8">
        <v-row align="center">
          <v-col cols="12" md="12">
            <h1 class="text-h3 font-weight-bold mb-2">
              Tekrar hoş geldin, {{ authStore.user?.firstName }}!
            </h1>
            <p class="text-h6">
              Tenis akademi kontrol paneliniz
            </p>
          </v-col>
        </v-row>
      </div>

      <!-- Quick Stats -->
      <v-row class="mb-8">
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-calendar-clock"
                  size="48"
                  color="primary"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-primary">{{ upcomingReservations }}</h3>
              <p class="text-body-2">Yaklaşan Dersler</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-tennis"
                  size="48"
                  color="success"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-success">{{ lessonsThisMonth }}</h3>
              <p class="text-body-2">Bu Ayki Dersler</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-clock"
                  size="48"
                  color="warning"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-warning">{{ totalHours }}</h3>
              <p class="text-body-2">Toplam Saat</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-trophy"
                  size="48"
                  color="amber"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-amber">{{ getMembershipTitle(currentMembershipType) }}</h3>
              <p class="text-body-2">Üyelik Türü</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mb-8">
        <v-col cols="12">
          <h2 class="text-h4 font-weight-bold text-primary mb-4">Hızlı İşlemler</h2>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'Reservations' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-calendar-plus"
                      size="64"
                      color="primary"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Kort Rezervasyonu</h3>
                  <p class="text-body-2">Bir sonraki oyununuz için kort rezerve edin</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'Dues' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-currency-try"
                      size="64"
                      color="info"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Aidat Takibi</h3>
                  <p class="text-body-2">Ödeme geçmişinizi ve aidat durumunuzu görüntüleyin</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  @click="showProfileDialog = true"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-account-circle"
                      size="64"
                      color="success"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Profil Bilgileri</h3>
                  <p class="text-body-2">Kişisel bilgilerinizi görüntüleyin ve düzenleyin</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'Courts' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-tennis-ball"
                      size="64"
                      color="warning"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Kort Durumu</h3>
                  <p class="text-body-2">Mevcut kort müsaitlik durumunu kontrol edin</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Recent Activity - Now Full Width -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="4">
            <v-card-title class="text-h5 pa-6 bg-primary text-white">
              <v-icon icon="mdi-history" class="mr-2" />
              Yaklaşan Dersler
            </v-card-title>
            <v-card-text class="pa-0">
              <div v-if="loading" class="text-center pa-8">
                <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
                <p class="text-body-2">Dersler yükleniyor...</p>
              </div>

              <v-list v-else-if="recentReservations.length > 0">
                <v-list-item
                    v-for="reservation in recentReservations"
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
                    {{ reservation.courtName || reservation.instructorName || 'Ders Programı' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(reservation.date) }} saat {{ reservation.startTime }}
                    <span v-if="reservation.duration"> - {{ reservation.duration }} dakika</span>
                    <span v-if="reservation.notes" class="text-caption d-block">{{ reservation.notes }}</span>
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="text-right">
                      <v-chip
                          :color="getReservationColor(reservation.status)"
                          size="small"
                          variant="flat"
                          class="mb-1"
                      >
                        {{ getStatusText(reservation.status) }}
                      </v-chip>
                      <div class="text-caption text-grey">
                        {{ reservation.instructorName ? `Eğitmen: ${reservation.instructorName}` : 'Ders Programı' }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center pa-8">
                <v-icon
                    icon="mdi-calendar-blank"
                    size="64"
                    color="grey-lighten-1"
                    class="mb-4"
                />
                <p class="text-h6 text-grey">Yaklaşan ders yok</p>
                <p class="text-body-2 text-grey">Gelecek tarihli hiçbir ders programınız bulunmuyor.</p>

                <!-- Add New Reservation Button when no reservations -->
                <v-btn
                    color="primary"
                    variant="outlined"
                    class="mt-4"
                    :to="{ name: 'Reservations' }"
                    prepend-icon="mdi-calendar-plus"
                >
                  Yeni Rezervasyon Yap
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Profile Dialog -->
    <v-dialog v-model="showProfileDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 pa-6 bg-primary text-white">
          <v-icon icon="mdi-account-circle" class="mr-2" />
          Profil Bilgileri
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="userProfile.firstName"
                  label="Ad"
                  variant="outlined"
                  readonly
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="userProfile.lastName"
                  label="Soyad"
                  variant="outlined"
                  readonly
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                  v-model="userProfile.email"
                  label="E-posta"
                  variant="outlined"
                  readonly
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="userProfile.phone"
                  label="Telefon"
                  variant="outlined"
                  readonly
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="userProfile.membershipType"
                  label="Üyelik Türü"
                  variant="outlined"
                  readonly
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                  v-model="userProfile.joinDate"
                  label="Kayıt Tarihi"
                  variant="outlined"
                  readonly
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn color="primary" @click="showProfileDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase'

console.log('📦 Firebase imports loaded:', { db, collection, query, where })

const authStore = useAuthStore()

// TypeScript interfaces for Firebase data
interface AttendanceStudent {
  id: string
  name: string
}

interface AttendanceRecord {
  id: string
  date: Date
  students?: AttendanceStudent[]
  lessonNumber?: number
  month?: number
  year?: number
  updatedBy?: string
  [key: string]: any // Allow other properties
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'student'
  phone?: string
  address?: string
  emergencyContact?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  membershipType?: string // Add membershipType property
}

// Membership type mappings
const membershipTypeOptions = {
  'private_1_45': 'Özel Ders 1 Kişi (45dk)',
  'private_2_60': 'Özel Ders 2 Kişi (60dk)',
  'private_group_3_8': 'Özel Grup 3 Kişi (8ders)',
  'private_group_4_8': 'Özel Grup 4 Kişi (8ders)',
  'private_package_1_8': 'Özel Paket 1 Kişi (8ders)',
  'private_package_2_8': 'Özel Paket 2 Kişi (8ders)',
  'adult_group': 'Yetişkin Grup',
  'tennis_school_age': 'Tenis Okulu Yaş Grubu',
  'tennis_school_performance': 'Tenis Okulu Performans',
  // Legacy support
  'basic': 'Temel Üyelik',
  'premium': 'Premium Üyelik',
  'vip': 'VIP Üyelik'
} as const

// Dialog state
const showProfileDialog = ref(false)

// Real data from Firebase - set initial values to 0
const upcomingReservations = ref(0)
const lessonsThisMonth = ref(0)
const totalHours = ref(0)
const recentReservations = ref<any[]>([])
const loading = ref(true)

// Firebase listener
let unsubscribe: (() => void) | null = null

// Firebase'den gelen gerçek üyelik tipi
const currentMembershipType = computed(() => {
  const user = authStore.user as User
  return user?.membershipType || 'basic'
})

// Get membership title function
const getMembershipTitle = (type: string): string => {
  return membershipTypeOptions[type as keyof typeof membershipTypeOptions] || type
}

// Computed membership title for v-model
const membershipTitle = computed(() => {
  return getMembershipTitle(currentMembershipType.value)
})

// User profile data
const userProfile = computed(() => {
  const user = authStore.user as User
  return {
    firstName: user?.firstName || 'Bilgi yok',
    lastName: user?.lastName || 'Bilgi yok',
    email: user?.email || 'Bilgi yok',
    phone: user?.phone || '+90 555 123 4567',
    membershipType: membershipTitle.value,
    joinDate: user?.createdAt ?
        new Date(user.createdAt).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : '15 Ocak 2024'
  }
})

// Helper function to calculate duration from startTime and endTime
const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0

  try {
    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes

    // Parse end time
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const endTotalMinutes = endHours * 60 + endMinutes

    // Calculate difference in minutes
    let durationMinutes = endTotalMinutes - startTotalMinutes

    // Handle overnight reservations (if end time is next day)
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60 // Add 24 hours
    }

    return durationMinutes
  } catch (error) {
    console.error('Error calculating duration:', error)
    return 0
  }
}

// Helper function to convert minutes to hours with proper formatting
const minutesToHours = (minutes: number): number => {
  return Math.round((minutes / 60) * 10) / 10 // Round to 1 decimal place
}

// Updated fetchUserReservations function
const fetchUserReservations = () => {
  if (!authStore.user?.id) {
    console.log('❌ User not found')
    loading.value = false
    return
  }

  console.log('🔍 Fetching reservations for student:', authStore.user.id)

  // Current timestamp for filtering future reservations
  const now = new Date()
  console.log('📅 Current time:', now.toISOString())

  // Query reservations collection where studentId matches current user
  const reservationsQuery = query(
      collection(db, 'reservations'),
      where('studentId', '==', authStore.user.id)
  )

  unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
    console.log('📊 Total reservations for user:', snapshot.size)

    const reservationRecords = snapshot.docs
        .map(doc => {
          const data = doc.data()

          // Combine date and startTime to create full datetime
          let reservationDateTime = new Date()

          if (data.date) {
            // If date is a Firestore timestamp
            if (data.date.toDate) {
              reservationDateTime = data.date.toDate()
            } else if (typeof data.date === 'string') {
              // If date is a string
              reservationDateTime = new Date(data.date)
            } else if (data.date instanceof Date) {
              // If date is already a Date object
              reservationDateTime = data.date
            }

            // Add start time to the date
            if (data.startTime) {
              const [hours, minutes] = data.startTime.split(':').map(Number)
              reservationDateTime.setHours(hours, minutes, 0, 0)
            }
          }

          // Calculate actual duration from startTime and endTime
          const actualDurationMinutes = calculateDurationFromTimes(data.startTime, data.endTime)
          const actualDurationHours = minutesToHours(actualDurationMinutes)

          console.log('⏱️ Duration calculation:', {
            id: doc.id,
            startTime: data.startTime,
            endTime: data.endTime,
            durationMinutes: actualDurationMinutes,
            durationHours: actualDurationHours
          })

          return {
            id: doc.id,
            ...data,
            date: reservationDateTime,
            fullDateTime: reservationDateTime,
            calculatedDuration: actualDurationMinutes,
            calculatedHours: actualDurationHours
          }
        })
        .filter((reservation: any) => {
          // Only show future reservations
          const isFuture = reservation.fullDateTime > now
          const isActive = reservation.status === 'confirmed' || reservation.status === 'pending'

          console.log('⏰ Reservation check:', {
            id: reservation.id,
            reservationTime: reservation.fullDateTime.toISOString(),
            currentTime: now.toISOString(),
            isFuture: isFuture,
            status: reservation.status,
            isActive: isActive,
            courtName: reservation.courtName,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            calculatedHours: reservation.calculatedHours
          })

          return isFuture && isActive
        })
        .sort((a, b) => a.fullDateTime.getTime() - b.fullDateTime.getTime()) // Sort by earliest first

    console.log('🚀 Future reservations count:', reservationRecords.length)

    // Map to component format
    recentReservations.value = reservationRecords.map((reservation: any) => ({
      id: reservation.id,
      courtName: reservation.courtName || `Kort ${reservation.courtId}`,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      type: reservation.type || 'court-rental',
      duration: reservation.calculatedDuration, // Use calculated duration in minutes
      instructorName: reservation.instructorName || null,
      totalCost: reservation.totalCost || 0,
      actualHours: reservation.calculatedHours // Store actual hours for calculations
    }))

    // Update stats
    upcomingReservations.value = reservationRecords.length

    // Calculate lessons this month - sadece bu ay olanları say
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()

    // Tüm rezervasyonları (sadece gelecek olanlar değil) bu ay için filtrele
    const thisMonthReservations = snapshot.docs
        .map(doc => {
          const data = doc.data()
          let reservationDate = new Date()

          if (data.date) {
            if (data.date.toDate) {
              reservationDate = data.date.toDate()
            } else if (typeof data.date === 'string') {
              reservationDate = new Date(data.date)
            } else if (data.date instanceof Date) {
              reservationDate = data.date
            }
          }

          return {
            ...data,
            date: reservationDate
          }
        })
        .filter((reservation:any) => {
          const resMonth = reservation.date.getMonth()
          const resYear = reservation.date.getFullYear()
          const isThisMonth = resMonth === thisMonth && resYear === thisYear
          const isValidStatus = reservation.status === 'confirmed' ||
              reservation.status === 'completed' ||
              reservation.status === 'pending'

          console.log('📅 Bu ay ders kontrolü:', {
            reservationDate: reservation.date.toISOString(),
            resMonth,
            resYear,
            thisMonth,
            thisYear,
            isThisMonth,
            status: reservation.status,
            isValidStatus
          })

          return isThisMonth && isValidStatus
        })

    lessonsThisMonth.value = thisMonthReservations.length

    console.log('📊 Bu ayki ders sayısı:', {
      thisMonthReservations: thisMonthReservations.length,
      totalReservationsThisMonth: thisMonthReservations.map((r:any) => ({
        date: r.date.toLocaleDateString('tr-TR'),
        status: r.status,
        courtName: r.courtName
      }))
    })

    // Calculate total hours using actual startTime and endTime
    totalHours.value = reservationRecords.reduce((total, reservation: any) => {
      return total + (reservation.calculatedHours || 0)
    }, 0)

    // Round to 1 decimal place
    totalHours.value = Math.round(totalHours.value * 10) / 10

    console.log('📈 Final stats:', {
      upcomingReservations: upcomingReservations.value,
      lessonsThisMonth: lessonsThisMonth.value,
      totalHours: totalHours.value,
      reservationDetails: recentReservations.value.map(r => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        duration: r.duration,
        actualHours: r.actualHours
      }))
    })

    loading.value = false
  }, (error) => {
    console.error('❌ Error fetching reservations:', error)
    loading.value = false
    recentReservations.value = []
    upcomingReservations.value = 0
    lessonsThisMonth.value = 0
    totalHours.value = 0
  })
}

// Lifecycle hooks
onMounted(async () => {
  console.log('🚀 Component mounted, user:', authStore.user)
  console.log('🔐 Auth initialized:', authStore.initialized)

  // If user is already available, fetch immediately
  if (authStore.user?.id) {
    console.log('✅ User found immediately, fetching attendance...')
    fetchUserReservations()
    return
  }

  // If not initialized, wait for auth
  if (!authStore.initialized) {
    console.log('⏳ Waiting for auth to initialize...')
    await authStore.waitForAuth()
  }

  // Check again after waiting
  if (authStore.user?.id) {
    console.log('✅ User found after auth wait, fetching attendance...')
    fetchUserReservations()
  } else {
    console.log('❌ No authenticated user found after waiting')
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const formatDate = (date: Date) => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Tamamlandı'
    case 'confirmed': return 'Onaylı'
    case 'pending': return 'Beklemde'
    case 'cancelled': return 'İptal Edildi'
    default: return status
  }
}

const getReservationIcon = (status: string): string => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'confirmed': return 'mdi-calendar-check'
    case 'pending': return 'mdi-clock'
    case 'cancelled': return 'mdi-close-circle'
    default: return 'mdi-calendar'
  }
}

const getReservationColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'success'
    case 'confirmed': return 'primary'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'grey'
  }
}
</script>

<style scoped>

</style>