<template>
  <div class="student-dashboard">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Tekrar hoş geldin, {{ authStore.user?.firstName }}!
                </h1>
                <p class="welcome-subtitle">
                  Tenis akademi kontrol paneliniz - Bugün harika bir gün!
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
        <!-- Enhanced Stats Cards -->
        <v-row class="mb-8">
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-calendar-clock" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ upcomingReservations }}</h3>
                  <p class="stat-label">Yaklaşan Dersler</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-trending-up</v-icon>
                    <span class="trend-text">Bu hafta</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-tennis" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">{{ lessonsThisMonth }}</h3>
                  <p class="stat-label">Bu Ayki Dersler</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-calendar-check</v-icon>
                    <span class="trend-text">Bu ay</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-clock" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ totalHours }}</h3>
                  <p class="stat-label">Toplam Saat</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="info">mdi-chart-line</v-icon>
                    <span class="trend-text">Toplam</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper amber-gradient">
                  <v-icon icon="mdi-trophy" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number amber--text membership-text">{{ getMembershipTitle(currentMembershipType) }}</h3>
                  <p class="stat-label">Üyelik Türü</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="amber">mdi-star</v-icon>
                    <span class="trend-text">Aktif</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Quick Actions -->
        <v-row class="mb-8">
          <v-col cols="12">
            <div class="section-header mb-6">
              <h2 class="section-title">Hızlı İşlemler</h2>
              <p class="section-subtitle">Size en yakın işlemlere hızlıca erişin</p>
            </div>
            <v-row>
              <v-col cols="12" sm="6" md="3" v-for="(action, index) in quickActions" :key="index">
                <v-card
                    class="action-card modern-action-card"
                    elevation="0"
                    hover
                    :to="action.route ? action.route : undefined"
                    @click="action.action ? action.action() : null"
                >
                  <div class="action-card-overlay"></div>
                  <v-card-text class="action-content">
                    <div class="action-icon-wrapper" :class="action.gradient">
                      <v-icon :icon="action.icon" size="40" color="white" />
                    </div>
                    <div class="action-details">
                      <h3 class="action-title">{{ action.title }}</h3>
                      <p class="action-description">{{ action.description }}</p>
                    </div>
                    <div class="action-arrow">
                      <v-icon icon="mdi-arrow-right" size="20" />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Enhanced Recent Activity -->
        <v-row>
          <v-col cols="12">
            <v-card class="activity-card modern-card" elevation="0">
              <div class="activity-header">
                <div class="activity-header-content">
                  <v-icon icon="mdi-history" class="header-icon" />
                  <div class="header-text">
                    <h3 class="header-title">Yaklaşan Dersler</h3>
                    <p class="header-subtitle">Gelecek derslerin ve programların</p>
                  </div>
                </div>
                <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    :to="{ name: 'Reservations' }"
                    prepend-icon="mdi-plus"
                >
                  Yeni Rezervasyon
                </v-btn>
              </div>

              <v-divider />

              <v-card-text class="activity-content">
                <div v-if="loading" class="loading-state">
                  <v-progress-circular indeterminate color="primary" size="48" />
                  <p class="loading-text">Dersler yükleniyor...</p>
                </div>

                <div v-else-if="recentReservations.length > 0" class="reservations-list">
                  <div
                      v-for="(reservation, index) in recentReservations"
                      :key="reservation.id"
                      class="reservation-item"
                      :class="{ 'last-item': index === recentReservations.length - 1 }"
                  >
                    <div class="reservation-timeline">
                      <div class="timeline-dot" :class="getReservationColor(reservation.status)"></div>
                      <div v-if="index !== recentReservations.length - 1" class="timeline-line"></div>
                    </div>

                    <div class="reservation-content">
                      <div class="reservation-main">
                        <div class="reservation-info">
                          <h4 class="reservation-title">
                            {{ reservation.courtName || reservation.instructorName || 'Ders Programı' }}
                          </h4>
                          <p class="reservation-details">
                            <span class="detail-item">
                              <v-icon size="16" color="grey-darken-1">mdi-calendar</v-icon>
                              {{ formatDate(reservation.date) }}
                            </span>
                            <span class="detail-item">
                              <v-icon size="16" color="grey-darken-1">mdi-clock</v-icon>
                              {{ reservation.startTime }}
                            </span>
                            <span v-if="reservation.duration" class="detail-item">
                              <v-icon size="16" color="grey-darken-1">mdi-timer</v-icon>
                              {{ reservation.duration }} dakika
                            </span>
                          </p>
                          <p v-if="reservation.notes" class="reservation-notes">
                            {{ reservation.notes }}
                          </p>
                        </div>

                        <div class="reservation-meta">
                          <v-chip
                              :color="getReservationColor(reservation.status)"
                              size="small"
                              variant="flat"
                              class="status-chip"
                          >
                            {{ getStatusText(reservation.status) }}
                          </v-chip>
                          <div v-if="reservation.instructorName" class="instructor-info">
                            <v-icon size="16" color="grey">mdi-account</v-icon>
                            <span>{{ reservation.instructorName }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <div class="empty-icon">
                    <v-icon icon="mdi-calendar-blank" size="80" color="grey-lighten-2" />
                  </div>
                  <div class="empty-content">
                    <h3 class="empty-title">Yaklaşan ders yok</h3>
                    <p class="empty-description">Gelecek tarihli hiçbir ders programınız bulunmuyor.</p>
                    <v-btn
                        color="primary"
                        variant="elevated"
                        class="mt-4"
                        :to="{ name: 'Reservations' }"
                        prepend-icon="mdi-calendar-plus"
                        size="large"
                    >
                      Yeni Rezervasyon Yap
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>

    <!-- Enhanced Profile Dialog -->
    <v-dialog v-model="showProfileDialog" max-width="700" persistent>
      <v-card class="profile-dialog">
        <div class="profile-header">
          <div class="profile-header-content">
            <v-icon icon="mdi-account-circle" class="profile-icon" />
            <div class="profile-header-text">
              <h3 class="profile-title">Profil Bilgileri</h3>
              <p class="profile-subtitle">Kişisel bilgilerinizi görüntüleyin</p>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="showProfileDialog = false" />
        </div>

        <v-divider />

        <v-card-text class="profile-content">
          <v-row>
            <v-col cols="12" sm="6">
              <div class="profile-field">
                <label class="field-label">Ad</label>
                <v-text-field
                    v-model="userProfile.firstName"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="profile-field">
                <label class="field-label">Soyad</label>
                <v-text-field
                    v-model="userProfile.lastName"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
            <v-col cols="12">
              <div class="profile-field">
                <label class="field-label">E-posta</label>
                <v-text-field
                    v-model="userProfile.email"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="profile-field">
                <label class="field-label">Telefon</label>
                <v-text-field
                    v-model="userProfile.phone"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="profile-field">
                <label class="field-label">Üyelik Türü</label>
                <v-text-field
                    v-model="userProfile.membershipType"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
            <v-col cols="12">
              <div class="profile-field">
                <label class="field-label">Kayıt Tarihi</label>
                <v-text-field
                    v-model="userProfile.joinDate"
                    variant="outlined"
                    readonly
                    density="comfortable"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="profile-actions">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="showProfileDialog = false">
            Kapat
          </v-btn>
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

// Quick Actions Data
const quickActions = computed(() => [
  {
    title: 'Kort Rezervasyonu',
    description: 'Bir sonraki oyununuz için kort rezerve edin',
    icon: 'mdi-calendar-plus',
    gradient: 'primary-gradient',
    route: { name: 'Reservations' }
  },
  {
    title: 'Aidat Takibi',
    description: 'Ödeme geçmişinizi ve aidat durumunuzu görüntüleyin',
    icon: 'mdi-currency-try',
    gradient: 'info-gradient',
    route: { name: 'Dues' }
  },
  {
    title: 'Profil Bilgileri',
    description: 'Kişisel bilgilerinizi görüntüleyin ve düzenleyin',
    icon: 'mdi-account-circle',
    gradient: 'success-gradient',
    action: () => showProfileDialog.value = true
  },
  {
    title: 'Kort Durumu',
    description: 'Mevcut kort müsaitlik durumunu kontrol edin',
    icon: 'mdi-tennis-ball',
    gradient: 'warning-gradient',
    route: { name: 'Courts' }
  }
])

// Date and Time functions
const getCurrentDate = () => {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCurrentTime = () => {
  return new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

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