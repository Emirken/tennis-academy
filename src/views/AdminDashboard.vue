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

        <!-- Yoklama Arşiv Bildirimleri -->
        <v-row class="mb-8" v-if="pendingArchives.length > 0 && showArchiveNotifications">
          <v-col cols="12">
            <v-alert
              type="warning"
              variant="tonal"
              closable
              @click:close="dismissArchiveNotifications"
              class="archive-notification"
            >
              <template #prepend>
                <v-icon icon="mdi-archive-clock" size="28" />
              </template>
              <div class="d-flex flex-column">
                <span class="text-subtitle-1 font-weight-bold mb-2">
                  Süresi Dolacak Yoklama Arşivleri
                </span>
                <span class="text-body-2 mb-3">
                  Aşağıdaki yoklama kayıtlarının saklama süresi yakında dolacak. 
                  Excel olarak indirip silebilir veya otomatik silinmesini bekleyebilirsiniz.
                </span>
                
                <v-divider class="my-3" />
                
                <div class="archive-list">
                  <div 
                    v-for="archive in pendingArchives" 
                    :key="archive.id"
                    class="archive-item d-flex align-center justify-space-between py-2"
                  >
                    <div class="archive-info">
                      <span class="font-weight-medium">{{ archive.studentName }}</span>
                      <span v-if="archive.groupName" class="text-medium-emphasis"> - {{ archive.groupName }}</span>
                      <v-chip
                        :color="archive.daysRemaining <= 3 ? 'error' : 'warning'"
                        size="x-small"
                        class="ml-2"
                      >
                        {{ archive.daysRemaining }} gün kaldı
                      </v-chip>
                      <v-chip
                        color="grey"
                        size="x-small"
                        class="ml-1"
                        variant="outlined"
                      >
                        {{ getArchiveReasonText(archive.archiveReason) }}
                      </v-chip>
                    </div>
                    <div class="archive-actions">
                      <v-btn
                        color="success"
                        size="small"
                        variant="tonal"
                        class="mr-2"
                        @click="handleExportArchive(archive.id)"
                      >
                        <v-icon start size="16">mdi-microsoft-excel</v-icon>
                        Excel
                      </v-btn>
                      <v-btn
                        color="error"
                        size="small"
                        variant="tonal"
                        @click="handleDeleteArchive(archive.id)"
                      >
                        <v-icon start size="16">mdi-delete</v-icon>
                        Sil
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-alert>
          </v-col>
        </v-row>

        <!-- Tüm Arşivler Bölümü -->
        <v-row class="mb-8">
          <v-col cols="12">
            <v-card class="modern-card" elevation="0">
              <v-card-title class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-archive" class="mr-2" color="primary" />
                  <span>Yoklama Arşivleri</span>
                  <v-chip size="small" color="primary" class="ml-2">
                    {{ allArchives.length }}
                  </v-chip>
                </div>
                <v-btn
                  :icon="showAllArchivesSection ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  variant="text"
                  @click="showAllArchivesSection = !showAllArchivesSection"
                />
              </v-card-title>
              
              <v-expand-transition>
                <div v-show="showAllArchivesSection">
                  <v-divider />
                  <v-card-text v-if="allArchives.length === 0" class="text-center py-8">
                    <v-icon icon="mdi-archive-off" size="48" color="grey" class="mb-4" />
                    <p class="text-body-1 text-medium-emphasis">Henüz arşivlenmiş yoklama kaydı bulunmuyor.</p>
                  </v-card-text>
                  <v-card-text v-else class="pa-0">
                    <v-table density="comfortable">
                      <thead>
                        <tr>
                          <th>Öğrenci</th>
                          <th>Grup</th>
                          <th>Ders Sayısı</th>
                          <th>Devam %</th>
                          <th>Arşiv Tarihi</th>
                          <th>Sona Erme</th>
                          <th>Sebep</th>
                          <th class="text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="archive in allArchives" :key="archive.id">
                          <td>
                            <span class="font-weight-medium">{{ archive.studentName }}</span>
                          </td>
                          <td>
                            <span v-if="archive.groupName">{{ archive.groupName }}</span>
                            <span v-else class="text-medium-emphasis">-</span>
                          </td>
                          <td>{{ archive.totalLessons }}</td>
                          <td>
                            <v-chip
                              :color="archive.percentage >= 80 ? 'success' : archive.percentage >= 50 ? 'warning' : 'error'"
                              size="small"
                              variant="tonal"
                            >
                              %{{ archive.percentage }}
                            </v-chip>
                          </td>
                          <td>{{ formatArchiveDate(archive.archivedAt) }}</td>
                          <td>
                            <v-chip
                              :color="getDaysUntilExpiry(archive.expiresAt) <= 7 ? 'error' : 'grey'"
                              size="small"
                              variant="outlined"
                            >
                              {{ getDaysUntilExpiry(archive.expiresAt) }} gün
                            </v-chip>
                          </td>
                          <td>
                            <v-chip size="x-small" variant="outlined">
                              {{ getArchiveReasonText(archive.archiveReason) }}
                            </v-chip>
                          </td>
                          <td class="text-right">
                            <v-btn
                              icon="mdi-microsoft-excel"
                              color="success"
                              size="small"
                              variant="tonal"
                              class="mr-1"
                              @click="handleExportArchive(archive.id)"
                            />
                            <v-btn
                              icon="mdi-delete"
                              color="error"
                              size="small"
                              variant="tonal"
                              @click="handleDeleteArchive(archive.id)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </div>
              </v-expand-transition>
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
import {
  getPendingArchives,
  exportArchiveToExcel,
  deleteArchive,
  deleteExpiredArchives,
  getAllArchives
} from '@/services/attendanceArchive'
import type { PendingArchiveNotification, AttendanceArchive } from '@/types/attendanceArchive'

const router = useRouter()
const authStore = useAuthStore()

// Reaktif veriler
const totalStudents = ref(0)
const todayReservations = ref(0)

// Arşiv bildirimleri
const pendingArchives = ref<PendingArchiveNotification[]>([])
const allArchives = ref<AttendanceArchive[]>([])
const showArchiveNotifications = ref(true)
const showAllArchivesSection = ref(false)
const archiveLoading = ref(false)

// Management Actions Data
const managementActions = [
  {
    title: 'Takvim',
    description: 'Ders programlarını ve rezervasyonları görüntüle',
    icon: 'mdi-calendar-month',
    gradient: 'court-gradient',
    route: { name: 'AdminCalendar' }
  },
  {
    title: 'Öğrenci Yönetimi',
    description: 'Öğrenci hesaplarını görüntüle ve yönet',
    icon: 'mdi-account-group',
    gradient: 'primary-gradient',
    route: { name: 'StudentManagement' }
  },
  {
    title: 'Grup Yönetimi',
    description: 'Grupları oluştur ve üyeleri yönet',
    icon: 'mdi-account-multiple',
    gradient: 'success-gradient',
    route: { name: 'GroupManagement' }
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

// Arşiv bildirimi fonksiyonları
const loadPendingArchives = async () => {
  try {
    archiveLoading.value = true
    // 7 gün içinde süresi dolacak arşivleri getir
    pendingArchives.value = await getPendingArchives(7)
    
    // Tüm arşivleri getir
    allArchives.value = await getAllArchives()
    
    // Süresi dolmuş arşivleri temizle
    await deleteExpiredArchives()
  } catch (error) {
    console.error('❌ Bekleyen arşivler yüklenemedi:', error)
  } finally {
    archiveLoading.value = false
  }
}

const handleExportArchive = async (archiveId: string) => {
  try {
    await exportArchiveToExcel(archiveId)
    // Export başarılıysa bildirimi güncelle
    await loadPendingArchives()
  } catch (error) {
    console.error('❌ Excel export hatası:', error)
  }
}

const handleDeleteArchive = async (archiveId: string) => {
  if (!confirm('Bu arşivi silmek istediğinizden emin misiniz?\n\nYoklama verileri kalıcı olarak silinecektir.')) {
    return
  }
  
  try {
    await deleteArchive(archiveId)
    pendingArchives.value = pendingArchives.value.filter(a => a.id !== archiveId)
    allArchives.value = allArchives.value.filter(a => a.id !== archiveId)
  } catch (error) {
    console.error('❌ Arşiv silme hatası:', error)
  }
}

const formatArchiveDate = (date: Date): string => {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
}

const getDaysUntilExpiry = (expiresAt: Date): number => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

const dismissArchiveNotifications = () => {
  showArchiveNotifications.value = false
}

const getArchiveReasonText = (reason: string): string => {
  const texts: Record<string, string> = {
    'student_deleted': 'Öğrenci Silindi',
    'removed_from_group': 'Gruptan Çıkarıldı',
    'group_changed': 'Grup Değiştirildi',
    'group_deleted': 'Grup Silindi'
  }
  return texts[reason] || 'Arşivlendi'
}

// Component mount edildiğinde verileri yükle
onMounted(async () => {
  await Promise.all([
    fetchTotalStudents(),
    fetchTodayReservations(),
    loadPendingArchives()
  ])
})
</script>

<style scoped>
/* Styles are handled in main.css */

/* Archive notification styles */
.archive-notification {
  border-radius: 12px;
}

.archive-list {
  max-height: 300px;
  overflow-y: auto;
}

.archive-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.archive-item:last-child {
  border-bottom: none;
}

.archive-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.archive-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 600px) {
  .archive-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .archive-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>