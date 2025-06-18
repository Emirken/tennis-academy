<!-- Payment Info Dialog -->
<v-dialog v-model="showPaymentInfo" max-width="500">
<v-card>
  <v-card-title class="text-h6 pa-4 bg-primary text-white">
    <v-icon icon="mdi-credit-card" class="mr-2" />
    Ödeme Bilgileri
  </v-card-title>
  <v-card-text class="pa-6">
    <p class="text-body-1 mb-4">
      Gelecek ay için otomatik ödeme bilgileriniz:
    </p>
    <v-list dense>
      <v-list-item>
        <v-list-item-title>Tutar:</v-list-item-title>
        <v-list-item-subtitle>{{ formatCurrency(packageInfo.monthlyPrice) }}</v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>Ödeme Tarihi:</v-list-item-title>
        <v-list-item-subtitle>{{ nextMonthStartDate }}</v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>Ders Sayısı:</v-list-item-title>
        <v-list-item-subtitle>{{ packageInfo.monthlyLessons }} ders</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn color="primary" @click="showPaymentInfo = false">Tamam</v-btn>
  </v-card-actions>
</v-card>
</v-dialog><template>
  <div class="dues-tracking">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">Aidat Takibi</h1>
        <p class="page-subtitle">
          Ders paketinizi ve ödeme durumunuzu takip edin
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
        <p class="text-h6">Verileriniz yükleniyor...</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Current Package Info -->
        <v-row class="mb-8">
          <v-col cols="12">
            <v-card elevation="6" class="package-card">
              <v-card-title class="text-h5 pa-6 bg-primary text-white">
                <v-icon icon="mdi-package-variant" class="mr-2" />
                Mevcut Paketiniz
              </v-card-title>
              <v-card-text class="pa-6">
                <v-row align="center">
                  <v-col cols="12" md="8">
                    <h3 class="text-h4 font-weight-bold text-primary mb-2">
                      {{ packageInfo.name }}
                    </h3>
                    <p class="text-h6 text-success font-weight-medium mb-1">
                      Aylık Ücretiniz: {{ formatCurrency(packageInfo.monthlyPrice) }}
                    </p>
                    <p class="text-body-1 text-grey">
                      {{ packageInfo.description }}
                    </p>
                  </v-col>
                  <v-col cols="12" md="4" class="text-center">
                    <v-icon
                        :icon="packageInfo.icon"
                        size="80"
                        :color="packageInfo.color"
                        class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Current Month Status -->
        <v-row class="mb-8">
          <v-col cols="12" md="6">
            <v-card elevation="4" class="h-100">
              <v-card-title class="text-h6 pa-4 bg-success text-white">
                <v-icon icon="mdi-calendar-month" class="mr-2" />
                Bu Ay ({{ currentMonthName }})
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="mb-4">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-1">Kullanılan Ders:</span>
                    <span class="text-h6 font-weight-bold text-success">
                      {{ currentMonthUsed }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-3">
                    <span class="text-body-1">Kalan Ders:</span>
                    <span class="text-h6 font-weight-bold" :class="remainingLessonsColor">
                      {{ currentMonthRemaining }}
                    </span>
                  </div>
                  <v-progress-linear
                      :model-value="usagePercentage"
                      height="12"
                      rounded
                      :color="progressColor"
                      class="mb-3"
                  />
                  <div class="text-center">
                    <v-chip
                        :color="statusChipColor"
                        variant="flat"
                        size="small"
                    >
                      {{ statusMessage }}
                    </v-chip>
                  </div>
                </div>

                <v-alert
                    v-if="currentMonthRemaining === 0"
                    type="warning"
                    variant="tonal"
                    class="mb-4"
                >
                  <strong>Uyarı:</strong> Bu ayki ders hakkınız tükendi!
                  Gelecek ay {{ packageInfo.monthlyLessons }} yeni ders hakkınız olacak.
                </v-alert>

                <v-alert
                    v-else-if="currentMonthRemaining <= 2"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                >
                  <strong>Bilgi:</strong> Sadece {{ currentMonthRemaining }} ders hakkınız kaldı.
                  Planlarınızı buna göre yapın.
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card elevation="4" class="h-100">
              <v-card-title class="text-h6 pa-4 bg-info text-white">
                <v-icon icon="mdi-chart-line" class="mr-2" />
                Genel İstatistikler
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number text-primary">{{ totalReservations }}</div>
                    <div class="stat-label">Toplam Ders</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number text-success">{{ completedLessons }}</div>
                    <div class="stat-label">Tamamlanan</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number text-warning">{{ cancelledLessons }}</div>
                    <div class="stat-label">İptal Edilen</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number text-info">{{ totalMonths }}</div>
                    <div class="stat-label">Aktif Ay</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Next Month Preview -->
        <v-row class="mb-8">
          <v-col cols="12">
            <v-card elevation="4">
              <v-card-title class="text-h6 pa-4 bg-warning text-white">
                <v-icon icon="mdi-calendar-arrow-right" class="mr-2" />
                Gelecek Ay ({{ nextMonthName }})
              </v-card-title>
              <v-card-text class="pa-6">
                <v-row align="center">
                  <v-col cols="12">
                    <h4 class="text-h6 mb-2">Yenilenecek Haklarınız</h4>
                    <p class="text-body-1 mb-1">
                      <strong>{{ packageInfo.monthlyLessons }} adet</strong> yeni ders hakkı
                    </p>
                    <p class="text-body-1 mb-1">
                      <strong>{{ formatCurrency(packageInfo.monthlyPrice) }}</strong> aylık ücret
                    </p>
                    <p class="text-caption text-grey">
                      {{ nextMonthStartDate }} tarihinde otomatik olarak yenilenecek
                    </p>
                  </v-col>

                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- End of Main Content -->
      </div>

      <!-- Payment Info Dialog -->
      <v-dialog v-model="showPaymentInfo" max-width="500">
        <v-card>
          <v-card-title class="text-h6 pa-4 bg-primary text-white">
            <v-icon icon="mdi-credit-card" class="mr-2" />
            Ödeme Bilgileri
          </v-card-title>
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
              Gelecek ay için otomatik ödeme bilgileriniz:
            </p>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>Tutar:</v-list-item-title>
                <v-list-item-subtitle>{{ formatCurrency(packageInfo.monthlyPrice) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Ödeme Tarihi:</v-list-item-title>
                <v-list-item-subtitle>{{ nextMonthStartDate }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Ders Sayısı:</v-list-item-title>
                <v-list-item-subtitle>{{ packageInfo.monthlyLessons }} ders</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="showPaymentInfo = false">Tamam</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

const authStore = useAuthStore()

// Package pricing and info (2025 Fiyat Listesi'ne göre)
const packagePricing = {
  'private_1_45': {
    name: 'Özel Ders 1 Kişi (45dk)',
    monthlyPrice: 2000,
    monthlyLessons: 8,
    description: 'Kişiye özel 45 dakikalık dersler, ayda 8 ders',
    icon: 'mdi-account',
    color: 'primary'
  },
  'private_2_60': {
    name: 'Özel Ders 2 Kişi (60dk)',
    monthlyPrice: 3500,
    monthlyLessons: 8,
    description: 'İki kişilik özel dersler, 60 dakika, ayda 8 ders',
    icon: 'mdi-account-multiple',
    color: 'success'
  },
  'private_group_3_8': {
    name: 'Özel Grup 3 Kişi (8ders)',
    monthlyPrice: 10000,
    monthlyLessons: 8,
    description: '3 kişilik grup dersleri, ayda 8 ders',
    icon: 'mdi-account-group',
    color: 'info'
  },
  'private_group_4_8': {
    name: 'Özel Grup 4 Kişi (8ders)',
    monthlyPrice: 7500,
    monthlyLessons: 8,
    description: '4 kişilik grup dersleri, ayda 8 ders',
    icon: 'mdi-account-multiple-plus',
    color: 'warning'
  },
  'private_package_1_8': {
    name: 'Özel Paket 1 Kişi (8ders)',
    monthlyPrice: 15000,
    monthlyLessons: 8,
    description: 'Kişiye özel paket, ayda 8 ders (maksimum 45 gün içinde tamamlanmalı)',
    icon: 'mdi-package-variant',
    color: 'purple'
  },
  'private_package_2_8': {
    name: 'Özel Paket 2 Kişi (8ders)',
    monthlyPrice: 25000,
    monthlyLessons: 8,
    description: 'İki kişilik özel paket, ayda 8 ders (maksimum 45 gün içinde tamamlanmalı)',
    icon: 'mdi-package-variant-closed',
    color: 'pink'
  },
  'adult_group': {
    name: 'Yetişkin Grup Dersleri',
    monthlyPrice: 6000,
    monthlyLessons: 8,
    description: 'Başlangıç - Orta - İleri seviye yetişkin grup dersleri, ayda 8 ders',
    icon: 'mdi-human-male-female',
    color: 'teal'
  },
  'tennis_school_age': {
    name: 'Tenis Okulu Yaş Grubu',
    monthlyPrice: 6000,
    monthlyLessons: 8,
    description: '5-7, 8-9, 10-12, 12-14, 15-17 yaş grupları, ayda 8 ders',
    icon: 'mdi-school',
    color: 'orange'
  },
  'tennis_school_performance': {
    name: 'Tenis Okulu Performans',
    monthlyPrice: 10000,
    monthlyLessons: 8,
    description: 'Performans odaklı okul dersleri (4 gün), ayda 8 ders',
    icon: 'mdi-trophy',
    color: 'amber'
  },
  'court_rental_1h': {
    name: 'Kort Kiralama (1 Saat)',
    monthlyPrice: 1000,
    monthlyLessons: 1,
    description: 'Saatlik kort kiralama',
    icon: 'mdi-tennis-ball',
    color: 'blue'
  },
  'court_rental_10h': {
    name: 'Kort Kiralama (10 Saat Paket)',
    monthlyPrice: 7500,
    monthlyLessons: 10,
    description: '10 saatlik kort kiralama paketi',
    icon: 'mdi-package',
    color: 'indigo'
  },
  'court_rental_equipment': {
    name: 'Raket & Top (1 Saat)',
    monthlyPrice: 500,
    monthlyLessons: 1,
    description: 'Raket ve top kiralama (1 saat)',
    icon: 'mdi-tennis',
    color: 'green'
  },
  // Legacy support
  'basic': {
    name: 'Temel Üyelik',
    monthlyPrice: 6000,
    monthlyLessons: 8,
    description: 'Temel üyelik paketi, ayda 8 ders',
    icon: 'mdi-star',
    color: 'grey'
  },
  'premium': {
    name: 'Premium Üyelik',
    monthlyPrice: 10000,
    monthlyLessons: 8,
    description: 'Premium üyelik paketi, ayda 8 ders',
    icon: 'mdi-star-circle',
    color: 'primary'
  },
  'vip': {
    name: 'VIP Üyelik',
    monthlyPrice: 15000,
    monthlyLessons: 8,
    description: 'VIP üyelik paketi, ayda 8 ders',
    icon: 'mdi-crown',
    color: 'amber'
  }
}

// State
const loading = ref(true)
const reservations = ref<any[]>([])
let unsubscribe: (() => void) | null = null

// Computed properties
const packageInfo = computed(() => {
  const membershipType = authStore.user?.membershipType || 'basic'
  return packagePricing[membershipType as keyof typeof packagePricing] || packagePricing.basic
})

const currentDate = new Date()
const currentMonthName = computed(() => {
  return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
})

const nextMonthName = computed(() => {
  const nextMonth = new Date(currentDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
})

const nextMonthStartDate = computed(() => {
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  return nextMonth.toLocaleDateString('tr-TR')
})

const currentMonthReservations = computed(() => {
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  return reservations.value.filter(reservation => {
    const resDate = reservation.date.toDate ? reservation.date.toDate() : new Date(reservation.date)
    return resDate.getMonth() === currentMonth && resDate.getFullYear() === currentYear
  }).sort((a, b) => {
    const aDate = a.date.toDate ? a.date.toDate() : new Date(a.date)
    const bDate = b.date.toDate ? b.date.toDate() : new Date(b.date)
    return bDate.getTime() - aDate.getTime()
  })
})

const currentMonthUsed = computed(() => {
  return currentMonthReservations.value.filter(r =>
      r.status === 'confirmed' || r.status === 'completed'
  ).length
})

const currentMonthRemaining = computed(() => {
  return Math.max(0, packageInfo.value.monthlyLessons - currentMonthUsed.value)
})

const usagePercentage = computed(() => {
  return Math.min(100, (currentMonthUsed.value / packageInfo.value.monthlyLessons) * 100)
})

const progressColor = computed(() => {
  if (usagePercentage.value >= 100) return 'error'
  if (usagePercentage.value >= 75) return 'warning'
  return 'success'
})

const remainingLessonsColor = computed(() => {
  if (currentMonthRemaining.value === 0) return 'text-error'
  if (currentMonthRemaining.value <= 2) return 'text-warning'
  return 'text-success'
})

const statusMessage = computed(() => {
  if (currentMonthRemaining.value === 0) return 'Tükendi'
  if (currentMonthRemaining.value <= 2) return 'Az Kaldı'
  return 'Aktif'
})

const statusChipColor = computed(() => {
  if (currentMonthRemaining.value === 0) return 'error'
  if (currentMonthRemaining.value <= 2) return 'warning'
  return 'success'
})

const totalReservations = computed(() => reservations.value.length)

const completedLessons = computed(() =>
    reservations.value.filter(r => r.status === 'completed').length
)

const cancelledLessons = computed(() =>
    reservations.value.filter(r => r.status === 'cancelled').length
)

const totalMonths = computed(() => {
  if (reservations.value.length === 0) return 0

  const firstReservation = reservations.value
      .map(r => r.date.toDate ? r.date.toDate() : new Date(r.date))
      .sort((a, b) => a.getTime() - b.getTime())[0]

  if (!firstReservation) return 0

  const monthsDiff = (currentDate.getFullYear() - firstReservation.getFullYear()) * 12 +
      (currentDate.getMonth() - firstReservation.getMonth()) + 1

  return Math.max(1, monthsDiff)
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)
}

const formatDate = (date: any): string => {
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'confirmed': return 'mdi-calendar-check'
    case 'pending': return 'mdi-clock'
    case 'cancelled': return 'mdi-close-circle'
    default: return 'mdi-calendar'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'success'
    case 'confirmed': return 'primary'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'grey'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Tamamlandı'
    case 'confirmed': return 'Onaylı'
    case 'pending': return 'Beklemede'
    case 'cancelled': return 'İptal Edildi'
    default: return status
  }
}

const fetchReservations = () => {
  if (!authStore.user?.id) {
    loading.value = false
    return
  }

  console.log('🔍 Fetching reservations for dues tracking:', authStore.user.id)

  const reservationsQuery = query(
      collection(db, 'reservations'),
      where('studentId', '==', authStore.user.id)
  )

  unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
    console.log('📊 Total reservations for dues tracking:', snapshot.size)

    reservations.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    loading.value = false
  }, (error) => {
    console.error('❌ Error fetching reservations for dues:', error)
    loading.value = false
  })
}

// Lifecycle
onMounted(async () => {
  if (authStore.user?.id) {
    fetchReservations()
  } else {
    if (!authStore.initialized) {
      await authStore.waitForAuth()
    }
    if (authStore.user?.id) {
      fetchReservations()
    } else {
      loading.value = false
    }
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.dues-tracking {
  background-color: #fafafa;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2E7D32;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.package-card,
.stats-grid {
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}

@media (max-width: 960px) {
  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-number {
    font-size: 1.3rem;
  }
}
</style>