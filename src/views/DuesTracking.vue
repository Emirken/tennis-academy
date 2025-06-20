<template>
  <div class="dues-tracking">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Aidat Takibi
                </h1>
                <p class="welcome-subtitle">
                  Ders paketinizi ve ödeme durumunuzu takip edin
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ currentMonthName }}</div>
                <div class="current-time">{{ statusMessage }}</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
          <p class="loading-text">Verileriniz yükleniyor...</p>
        </div>

        <!-- Main Content -->
        <div v-else>
          <!-- Current Package Stats -->
          <v-row class="mb-8">
            <v-col cols="12" sm="6" md="3">
              <v-card class="stat-card modern-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="stat-content">
                  <div class="stat-icon-wrapper primary-gradient">
                    <v-icon icon="mdi-calendar-clock" size="32" color="white" />
                  </div>
                  <div class="stat-details">
                    <h3 class="stat-number primary--text">{{ currentMonthUsed }}</h3>
                    <p class="stat-label">Kullanılan Ders</p>
                    <div class="stat-trend">
                      <v-icon size="16" color="primary">mdi-trending-up</v-icon>
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
                  <div class="stat-icon-wrapper success-gradient">
                    <v-icon icon="mdi-calendar-check" size="32" color="white" />
                  </div>
                  <div class="stat-details">
                    <h3 class="stat-number success--text">{{ currentMonthRemaining }}</h3>
                    <p class="stat-label">Kalan Ders</p>
                    <div class="stat-trend">
                      <v-chip
                          size="small"
                          :color="statusChipColor"
                          variant="flat"
                      >
                        {{ statusMessage }}
                      </v-chip>
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
                    <v-icon icon="mdi-currency-try" size="32" color="white" />
                  </div>
                  <div class="stat-details">
                    <h3 class="stat-number warning--text">{{ formatCurrency(packageInfo.monthlyPrice) }}</h3>
                    <p class="stat-label">Aylık Ücret</p>
                    <div class="stat-trend">
                      <v-icon size="16" color="warning">mdi-credit-card</v-icon>
                      <span class="trend-text">Otomatik</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card class="stat-card modern-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="stat-content">
                  <div class="stat-icon-wrapper info-gradient">
                    <v-icon icon="mdi-package-variant" size="32" color="white" />
                  </div>
                  <div class="stat-details">
                    <h3 class="stat-number info--text">{{ packageInfo.monthlyLessons }}</h3>
                    <p class="stat-label">Aylık Ders</p>
                    <div class="stat-trend">
                      <v-icon size="16" color="info">mdi-calendar-month</v-icon>
                      <span class="trend-text">Toplam</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Current Package Info -->
          <v-row class="mb-8">
            <v-col cols="12">
              <div class="section-header mb-6">
                <h2 class="section-title">Mevcut Paketiniz</h2>
                <p class="section-subtitle">Paket detayları ve özellikleri</p>
              </div>
              <v-card class="modern-card package-info-card" elevation="0">
                <div class="stat-card-overlay package-overlay"></div>
                <v-card-text class="pa-6">
                  <v-row align="center">
                    <v-col cols="12" md="8">
                      <div class="package-content">
                        <h3 class="package-title mb-3">{{ packageInfo.name }}</h3>
                        <p class="package-description mb-4">{{ packageInfo.description }}</p>
                        <div class="package-details">
                          <div class="detail-item">
                            <v-icon icon="mdi-currency-try" color="success" class="mr-2" />
                            <span class="detail-text">Aylık Ücret: <strong>{{ formatCurrency(packageInfo.monthlyPrice) }}</strong></span>
                          </div>
                          <div class="detail-item">
                            <v-icon icon="mdi-calendar-month" color="primary" class="mr-2" />
                            <span class="detail-text">Ders Sayısı: <strong>{{ packageInfo.monthlyLessons }} ders/ay</strong></span>
                          </div>
                          <div class="detail-item">
                            <v-icon icon="mdi-calendar-clock" color="info" class="mr-2" />
                            <span class="detail-text">Yenileme: <strong>{{ nextMonthStartDate }}</strong></span>
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="12" md="4" class="text-center">
                      <div class="package-icon-wrapper">
                        <v-icon
                            :icon="packageInfo.icon"
                            size="80"
                            :color="packageInfo.color"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Monthly Usage Progress -->
          <v-row class="mb-8">
            <v-col cols="12" md="6">
              <v-card class="modern-card usage-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="pa-6">
                  <div class="usage-header mb-4">
                    <h3 class="usage-title">Bu Ay Kullanım</h3>
                    <v-chip
                        size="large"
                        :color="progressColor"
                        variant="flat"
                        class="usage-chip"
                    >
                      {{ Math.round(usagePercentage) }}%
                    </v-chip>
                  </div>

                  <v-progress-linear
                      :model-value="usagePercentage"
                      :color="progressColor"
                      height="12"
                      rounded
                      class="mb-4"
                  ></v-progress-linear>

                  <div class="usage-stats">
                    <div class="usage-stat-item">
                      <span class="usage-stat-number">{{ currentMonthUsed }}</span>
                      <span class="usage-stat-label">Kullanılan</span>
                    </div>
                    <div class="usage-stat-item">
                      <span class="usage-stat-number">{{ currentMonthRemaining }}</span>
                      <span class="usage-stat-label">Kalan</span>
                    </div>
                    <div class="usage-stat-item">
                      <span class="usage-stat-number">{{ packageInfo.monthlyLessons }}</span>
                      <span class="usage-stat-label">Toplam</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="modern-card payment-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="pa-6">
                  <div class="payment-header mb-4">
                    <h3 class="payment-title">Gelecek Ödeme</h3>
                    <v-btn
                        color="primary"
                        variant="outlined"
                        size="small"
                        @click="showPaymentInfo = true"
                        class="payment-info-btn"
                    >
                      <v-icon icon="mdi-information" class="mr-1" />
                      Detay
                    </v-btn>
                  </div>

                  <div class="payment-details">
                    <div class="payment-detail-item">
                      <v-icon icon="mdi-calendar" color="info" class="mr-3" />
                      <div>
                        <p class="payment-detail-title">Tarih</p>
                        <p class="payment-detail-value">{{ nextMonthStartDate }}</p>
                      </div>
                    </div>

                    <div class="payment-detail-item">
                      <v-icon icon="mdi-currency-try" color="success" class="mr-3" />
                      <div>
                        <p class="payment-detail-title">Tutar</p>
                        <p class="payment-detail-value">{{ formatCurrency(packageInfo.monthlyPrice) }}</p>
                      </div>
                    </div>

                    <div class="payment-detail-item">
                      <v-icon icon="mdi-book-open-page-variant" color="warning" class="mr-3" />
                      <div>
                        <p class="payment-detail-title">Ders Sayısı</p>
                        <p class="payment-detail-value">{{ packageInfo.monthlyLessons }} ders</p>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Current Month Reservations -->
          <v-row class="mb-8">
            <v-col cols="12">
              <div class="section-header mb-6">
                <h2 class="section-title">Bu Ayki Dersleriniz</h2>
                <p class="section-subtitle">{{ currentMonthName }} dönemi ders kayıtlarınız</p>
              </div>
              <v-card class="modern-card reservations-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="pa-6">
                  <div v-if="currentMonthReservations.length === 0" class="empty-state">
                    <v-icon icon="mdi-calendar-blank" size="64" color="grey" class="empty-icon" />
                    <h3 class="empty-title">Bu ay henüz ders kaydınız yok</h3>
                    <p class="empty-description">
                      Yeni ders rezervasyonu yapmak için rezervasyon sayfasını ziyaret edin.
                    </p>
                  </div>

                  <div v-else class="reservations-list">
                    <div
                        v-for="(reservation, index) in currentMonthReservations"
                        :key="reservation.id"
                        class="reservation-item"
                        :class="{ 'last-item': index === currentMonthReservations.length - 1 }"
                    >
                      <div class="reservation-timeline">
                        <div
                            class="timeline-dot"
                            :class="getStatusColor(reservation.status)"
                        ></div>
                        <div
                            v-if="index !== currentMonthReservations.length - 1"
                            class="timeline-line"
                        ></div>
                      </div>

                      <div class="reservation-content">
                        <div class="reservation-main">
                          <div class="reservation-info">
                            <h4 class="reservation-title">
                              {{ reservation.courtName || `Kort ${reservation.courtId}` }}
                            </h4>
                            <div class="reservation-details">
                              <div class="detail-item">
                                <v-icon icon="mdi-calendar" size="16" />
                                <span>{{ formatDate(reservation.date) }}</span>
                              </div>
                              <div class="detail-item">
                                <v-icon icon="mdi-clock" size="16" />
                                <span>{{ reservation.startTime }} - {{ reservation.endTime }}</span>
                              </div>
                              <div v-if="reservation.instructorName" class="detail-item">
                                <v-icon icon="mdi-account-tie" size="16" />
                                <span>{{ reservation.instructorName }}</span>
                              </div>
                            </div>
                          </div>

                          <div class="reservation-meta">
                            <v-chip
                                size="small"
                                :color="getStatusColor(reservation.status)"
                                variant="flat"
                                class="status-chip"
                            >
                              <v-icon
                                  :icon="getStatusIcon(reservation.status)"
                                  size="16"
                                  class="mr-1"
                              />
                              {{ getStatusText(reservation.status) }}
                            </v-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Overall Statistics -->
          <v-row>
            <v-col cols="12">
              <div class="section-header mb-6">
                <h2 class="section-title">Genel İstatistikler</h2>
                <p class="section-subtitle">Tüm zamanlar ders istatistikleriniz</p>
              </div>
              <v-card class="modern-card statistics-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="pa-6">
                  <v-row>
                    <v-col cols="12" sm="6" md="3">
                      <div class="statistic-item">
                        <div class="statistic-icon-wrapper primary-gradient">
                          <v-icon icon="mdi-calendar-multiple" size="24" color="white" />
                        </div>
                        <div class="statistic-content">
                          <h4 class="statistic-number">{{ totalReservations }}</h4>
                          <p class="statistic-label">Toplam Rezervasyon</p>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                      <div class="statistic-item">
                        <div class="statistic-icon-wrapper success-gradient">
                          <v-icon icon="mdi-check-circle" size="24" color="white" />
                        </div>
                        <div class="statistic-content">
                          <h4 class="statistic-number">{{ completedLessons }}</h4>
                          <p class="statistic-label">Tamamlanan Ders</p>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                      <div class="statistic-item">
                        <div class="statistic-icon-wrapper warning-gradient">
                          <v-icon icon="mdi-close-circle" size="24" color="white" />
                        </div>
                        <div class="statistic-content">
                          <h4 class="statistic-number">{{ cancelledLessons }}</h4>
                          <p class="statistic-label">İptal Edilen</p>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                      <div class="statistic-item">
                        <div class="statistic-icon-wrapper info-gradient">
                          <v-icon icon="mdi-calendar-month-outline" size="24" color="white" />
                        </div>
                        <div class="statistic-content">
                          <h4 class="statistic-number">{{ totalMonths }}</h4>
                          <p class="statistic-label">Aktif Ay</p>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Payment Info Dialog -->
        <v-dialog v-model="showPaymentInfo" max-width="500">
          <v-card class="modern-dialog">
            <v-card-title class="dialog-title pa-6">
              <v-icon icon="mdi-credit-card" class="mr-2" />
              Ödeme Bilgileri
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="dialog-description mb-4">
                Gelecek ay için otomatik ödeme bilgileriniz:
              </p>
              <div class="payment-info-list">
                <div class="payment-info-item">
                  <span class="info-label">Tutar:</span>
                  <span class="info-value">{{ formatCurrency(packageInfo.monthlyPrice) }}</span>
                </div>
                <div class="payment-info-item">
                  <span class="info-label">Ödeme Tarihi:</span>
                  <span class="info-value">{{ nextMonthStartDate }}</span>
                </div>
                <div class="payment-info-item">
                  <span class="info-label">Ders Sayısı:</span>
                  <span class="info-value">{{ packageInfo.monthlyLessons }} ders</span>
                </div>
              </div>
            </v-card-text>
            <v-card-actions class="pa-6 pt-0">
              <v-spacer />
              <v-btn color="primary" variant="flat" @click="showPaymentInfo = false">Tamam</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
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
const showPaymentInfo = ref(false)
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
/* Styles are handled in main.css */
</style>