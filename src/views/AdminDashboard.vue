<template>
  <div class="admin-dashboard">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  Yönetici Paneli
                </h1>
                <p class="welcome-subtitle">
                  Hoş geldiniz, {{ authStore.user?.firstName }}! Tenis akademinizi yönetin.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="admin-badge-widget">
                <div class="admin-badge">
                  <v-icon icon="mdi-shield-crown" class="mr-2" />
                  <span>Yönetici</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <!-- Enhanced Stats Cards -->
        <v-row class="mb-8">
          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-account-group" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ totalStudents }}</h3>
                  <p class="stat-label">Toplam Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="primary">mdi-trending-up</v-icon>
                    <span class="trend-text">Aktif Üyeler</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-tennis" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">3</h3>
                  <p class="stat-label">Aktif Kort</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-check-circle</v-icon>
                    <span class="trend-text">Müsait</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-calendar-check" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ todayReservations }}</h3>
                  <p class="stat-label">Bugünkü Rezervasyonlar</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="warning">mdi-calendar-today</v-icon>
                    <span class="trend-text">Bugün</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Management Actions -->
        <v-row class="mb-8">
          <v-col cols="12">
            <div class="section-header mb-6">
              <h2 class="section-title">Yönetim İşlemleri</h2>
              <p class="section-subtitle">Akademi yönetimi için hızlı erişim</p>
            </div>
            <v-row>
              <v-col cols="12" sm="6" md="4" v-for="(action, index) in managementActions" :key="index">
                <v-card
                    class="action-card modern-action-card admin-action-card"
                    elevation="0"
                    hover
                    :to="action.route ? action.route : undefined"
                    @click="action.action ? action.action() : null"
                >
                  <div class="action-card-overlay admin-overlay"></div>
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


      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

const router = useRouter()
const authStore = useAuthStore()

// Reaktif veriler
const totalStudents = ref(0)
const todayReservations = ref(0)

// Management Actions Data
const managementActions = [
  {
    title: 'Öğrenci Yönetimi',
    description: 'Öğrenci hesaplarını görüntüle ve yönet',
    icon: 'mdi-account-group',
    gradient: 'primary-gradient',
    route: { name: 'StudentManagement' }
  },
  {
    title: 'Yoklama Takibi',
    description: 'Öğrenci yoklamalarını ayarla',
    icon: 'mdi-clipboard-check',
    gradient: 'success-gradient',
    route: { name: 'Attendance' }
  },
  {
    title: 'Kort Yönetimi',
    description: 'Kort durumunu ve müsaitliğini yönet',
    icon: 'mdi-tennis-ball',
    gradient: 'info-gradient',
    route: { name: 'Courts' }
  },
  {
    title: 'Fiyat Yönetimi',
    description: 'Fiyatları ve paketleri güncelle',
    icon: 'mdi-currency-try',
    gradient: 'warning-gradient',
    route: { name: 'Pricing' }
  }
]

// Firebase'den öğrenci sayısını al
const fetchTotalStudents = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    let studentCount = 0

    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      if (userData.role === 'student') {
        studentCount++
      }
    })

    totalStudents.value = studentCount
    console.log('✅ Toplam öğrenci sayısı:', studentCount)
  } catch (error) {
    console.error('❌ Öğrenci sayısı alınırken hata:', error)
  }
}

// Firebase'den bugünkü rezervasyon sayısını al
const fetchTodayReservations = async () => {
  try {
    const today = new Date()
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD formatı

    let totalOccupied = 0

    // K1, K2, K3 kortları için kontrol et
    const courts = ['K1', 'K2', 'K3']

    for (const court of courts) {
      try {
        const docRef = doc(db, 'courtSchedule', dateString)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.schedule && data.schedule[court]) {
            const courtSchedule = data.schedule[court]

            // Occupied olan time slotları say
            Object.values(courtSchedule).forEach((status) => {
              if (status === 'occupied') {
                totalOccupied++
              }
            })
          }
        }
      } catch (error) {
        console.error(`❌ ${court} için rezervasyon verisi alınırken hata:`, error)
      }
    }

    todayReservations.value = totalOccupied
    console.log('✅ Bugünkü rezervasyon sayısı:', totalOccupied)
  } catch (error) {
    console.error('❌ Rezervasyon sayısı alınırken hata:', error)
  }
}

// Refresh data function
const refreshData = async () => {
  await Promise.all([
    fetchTotalStudents(),
    fetchTodayReservations()
  ])
}

const navigateTo = (routeName: string) => {
  // Belirli route'a yönlendir
  if (routeName === 'StudentManagement') {
    // Bu, uygulandığında öğrenci yönetimi sayfasına yönlendirecek
    console.log('Öğrenci Yönetimine Git')
  }
}

// Component mount edildiğinde verileri yükle
onMounted(() => {
  fetchTotalStudents()
  fetchTodayReservations()
})
</script>

<style scoped>
/* Styles are handled in main.css */
</style>