<template>
  <div class="admin-dashboard">
    <v-container class="py-8">
      <!-- Hoş Geldiniz Bölümü -->
      <div class="welcome-section mb-8">
        <v-row align="center">
          <v-col cols="12" md="8">
            <h1 class="text-h3 font-weight-bold text-white mb-2">
              Yönetici Paneli
            </h1>
            <p class="text-h6 text-white">
              Hoş geldiniz, {{ authStore.user?.firstName }}! Tenis akademinizi yönetin.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-md-right">
            <v-chip
                color="white"
                size="large"
                variant="flat"
                class="font-weight-bold"
            >
              <v-icon start icon="mdi-shield-crown" color="primary" />
              Yönetici
            </v-chip>
          </v-col>
        </v-row>
      </div>

      <!-- Hızlı İstatistikler -->
      <v-row class="mb-8">
        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-account-group"
                  size="48"
                  color="primary"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-primary">{{ totalStudents }}</h3>
              <p class="text-body-2">Toplam Öğrenci</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-tennis"
                  size="48"
                  color="success"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-success">3</h3>
              <p class="text-body-2">Aktif Kort</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-6">
              <v-icon
                  icon="mdi-calendar-check"
                  size="48"
                  color="warning"
                  class="mb-3"
              />
              <h3 class="text-h4 font-weight-bold text-warning">{{ todayReservations }}</h3>
              <p class="text-body-2">Bugünkü Rezervasyonlar</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Yönetim İşlemleri -->
      <v-row class="mb-8">
        <v-col cols="12">
          <h2 class="text-h4 font-weight-bold text-primary mb-4">Yönetim</h2>
          <v-row>
            <v-col cols="12" sm="6" md="4">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'StudentManagement' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-account-group"
                      size="64"
                      color="primary"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Öğrenci Yönetimi</h3>
                  <p class="text-body-2">Öğrenci hesaplarını görüntüle ve yönet</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'Attendance' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-clipboard-check"
                      size="64"
                      color="success"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Yoklama Takibi</h3>
                  <p class="text-body-2">Öğrenci yoklamalarını ayarla</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="4">
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
                  <h3 class="text-h5 font-weight-bold mb-2">Kort Yönetimi</h3>
                  <p class="text-body-2">Kort durumunu ve müsaitliğini yönet</p>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-card
                  class="action-card"
                  elevation="4"
                  hover
                  :to="{ name: 'Pricing' }"
              >
                <v-card-text class="text-center pa-6">
                  <v-icon
                      icon="mdi-currency-try"
                      size="64"
                      color="amber"
                      class="mb-4"
                  />
                  <h3 class="text-h5 font-weight-bold mb-2">Fiyat Yönetimi</h3>
                  <p class="text-body-2">Fiyatları ve paketleri güncelle</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
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
.admin-dashboard {
  background-color: #fafafa;
  min-height: calc(100vh - 140px);
}

.welcome-section {
  background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
  color: white;
  padding: 40px;
  border-radius: 16px;
}

.stat-card,
.action-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
  height: 100%;
}

.action-card:hover {
  transform: translateY(-4px);
  cursor: pointer;
}

@media (max-width: 960px) {
  .welcome-section {
    padding: 24px;
  }

  .welcome-section h1 {
    font-size: 2rem;
  }
}
</style>