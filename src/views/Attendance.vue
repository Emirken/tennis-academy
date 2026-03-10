<template>
  <div class="attendance-page">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Enhanced Welcome Section -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  <v-icon icon="mdi-clipboard-check" class="mr-3" color="white" />
                  Yoklama Yönetimi
                </h1>
                <p class="welcome-subtitle">
                  Öğrenci devam durumlarını takip edin ve yönetin
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ getMonthTitle() }}</div>
                <div class="current-time">{{ selectedYear }} - {{ getTotalLessons() }} Ders</div>
              </div>
            </v-col>
          </v-row>
        </div>
        <!-- Enhanced Stats Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-account-group" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ classStudents.length }}</h3>
                  <p class="stat-label">Toplam Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="primary">mdi-account-multiple</v-icon>
                    <span class="trend-text">Aktif sınıf</span>
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
                  <h3 class="stat-number success--text">{{ getTotalLessons() }}</h3>
                  <p class="stat-label">Toplam Ders</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-check-circle</v-icon>
                    <span class="trend-text">Bu dönem</span>
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
                  <v-icon icon="mdi-check-all" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ getTotalAttendance() }}</h3>
                  <p class="stat-label">Toplam Katılım</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="warning">mdi-trending-up</v-icon>
                    <span class="trend-text">Devam eden</span>
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
                  <v-icon icon="mdi-percent" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number info--text">{{ getOverallPercentage() }}%</h3>
                  <p class="stat-label">Genel Devam</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="info">mdi-chart-line</v-icon>
                    <span class="trend-text">Ortalama</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Month/Year Selection -->
        <v-card class="modern-card mb-6" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-4">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper primary-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-calendar" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Dönem Seçimi</h3>
                <p class="text-body-2 text-grey-600 mb-0">Ay ve yıl seçerek yoklama verilerini görüntüleyin</p>
              </div>
            </div>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                    v-model="selectedMonth"
                    label="Ay"
                    :items="months"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-calendar-month"
                    @update:model-value="loadAttendanceData"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                    v-model="selectedYear"
                    label="Yıl"
                    :items="years"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-calendar-range"
                    @update:model-value="loadAttendanceData"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                    v-model="selectedGroupFilter"
                    label="Grup Filtresi"
                    :items="availableGroups"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-account-group"
                    :loading="loadingGroups"
                    clearable
                    placeholder="Grup seçin..."
                    @click:clear="selectedGroupFilter = null"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-autocomplete
                    v-model="selectedPersonFilter"
                    label="Kişi Listesi"
                    :items="ungroupedStudents"
                    item-title="name"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-account"
                    :loading="loadingStudents"
                    clearable
                    no-data-text="Grupsuz kişi bulunamadı"
                    placeholder="Kişi ara..."
                    :menu-props="{ maxHeight: 200 }"
                    @update:model-value="onPersonSelected"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Enhanced Attendance Sheet -->
        <v-card class="modern-card attendance-sheet" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-4 d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper success-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-clipboard-check" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Yoklama Listesi</h3>
                <p class="text-body-2 text-grey-600 mb-0">{{ getMonthTitle() }} {{ selectedYear }} - Devam durumu takibi</p>
              </div>
            </div>
            <div class="d-flex gap-2 align-center">
              <v-chip color="success" variant="flat" class="mr-2 font-weight-bold" v-if="getTotalLessons() > 0">
                {{ getTotalLessons() }} Ders
              </v-chip>
              <v-btn
                  class="mr-1"
                color="success"
                variant="tonal"
                size="small"
                @click="handleExportCurrentView"
                :loading="exportingView"
                :disabled="classStudents.length === 0 || monthLessons.length === 0"
              >
                <v-icon icon="mdi-microsoft-excel" class="mr-1" size="18" />
                Excel İndir
              </v-btn>
              
              <!-- Toplu Kaydet Butonu -->
              <v-btn
                v-if="authStore.isAdmin"
                color="primary"
                variant="flat"
                size="small"
                @click="saveAllAttendance"
                :loading="savingAll"
                :disabled="!hasAnyChanges()"
              >
                <v-icon icon="mdi-content-save-all" class="mr-1" size="18" />
                {{ hasAnyChanges() ? 'Tümünü Kaydet' : 'Değişiklik Yok' }}
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <div class="attendance-table-wrapper">
              <table class="attendance-table">
                <!-- Header Row -->
                <thead>
                <tr class="attendance-header-row">
                  <th class="student-name-header">
                    <strong>ÖĞRENCİ ADI SOYADI</strong>
                  </th>
                  <th
                      v-for="(lesson, index) in monthLessons"
                      :key="index"
                      class="lesson-header-cell"
                      :class="{ 'clickable': authStore.isAdmin }"
                      @click="authStore.isAdmin ? openDatePicker(index) : null"
                  >
                    <div class="lesson-header-content">
                      <div class="lesson-date">{{ formatLessonDate(lesson.date) }}</div>
                      <div class="lesson-day">{{ formatLessonDay(lesson.date) }}</div>
                      <v-icon v-if="authStore.isAdmin" size="12" class="edit-icon">mdi-pencil</v-icon>
                    </div>
                  </th>
                  <th class="stats-header-cell">
                    <div class="stats-header-grid">
                      <div class="stat-header-cell"><strong>TOPLAM</strong></div>
                      <div class="stat-header-cell"><strong>GELDİ</strong></div>
                      <div class="stat-header-cell"><strong>GELMEDİ</strong></div>
                      <div class="stat-header-cell"><strong>%</strong></div>
                    </div>
                  </th>

                </tr>
                </thead>

                <tbody>
                <!-- Student Rows -->
                <tr
                    v-for="student in classStudents"
                    :key="student.id"
                    class="student-row"
                >
                  <!-- Student Name -->
                  <td class="student-name-cell">
                    <div class="student-info">
                      <v-avatar size="24" class="me-2" color="primary">
                          <span class="text-white text-caption font-weight-bold">
                            {{ getInitials(student.name) }}
                          </span>
                      </v-avatar>
                      <span class="student-name">{{ student.name }}</span>
                      <v-chip
                          v-if="student.membershipType"
                          size="x-small"
                          color="purple"
                          variant="flat"
                          class="ml-2"
                      >
                        {{ membershipTypesStore.getDisplayInfo(student.membershipType)?.name || student.membershipType }}
                      </v-chip>
                      <v-chip
                          v-if="student.groupAssignment"
                          size="x-small"
                          color="info"
                          variant="flat"
                          class="ml-2"
                      >
                        {{ GroupTuruLabel[student.groupAssignment] || student.groupAssignment }}
                      </v-chip>

                    </div>
                  </td>

                  <!-- Attendance Checkboxes -->
                  <td
                      v-for="(lesson, lessonIndex) in monthLessons"
                      :key="lessonIndex"
                      class="attendance-cell"
                  >
                    <v-checkbox
                        :model-value="getAttendanceValue(student.id, lessonIndex)"
                        color="success"
                        hide-details
                        density="compact"
                        :disabled="!authStore.isAdmin"
                        @update:model-value="(value) => updateAttendanceValue(student.id, lessonIndex, value)"
                    />
                  </td>

                  <!-- Statistics -->
                  <td class="stats-cell">
                    <div class="stats-grid">
                      <div class="stat-value total">{{ monthLessons.length }}</div>
                      <div class="stat-value attended">{{ getAttendedCount(student.id) }}</div>
                      <div class="stat-value absent">{{ getAbsentCount(student.id) }}</div>
                      <div class="stat-value percentage">{{ getAttendancePercentage(student.id) }}%</div>
                    </div>
                  </td>


                </tr>

                <!-- Summary Row -->
                <tr class="summary-row">
                  <td class="summary-name-cell">
                    <strong>TOPLAM</strong>
                  </td>
                  <td
                      v-for="(lesson, index) in monthLessons"
                      :key="index"
                      class="summary-attendance-cell"
                  >
                    <strong>{{ getLessonAttendanceCount(index) }}</strong>
                  </td>
                  <td class="summary-stats-cell">
                    <div class="stats-grid">
                      <div class="stat-value total"><strong>{{ getTotalPossibleAttendance() }}</strong></div>
                      <div class="stat-value attended"><strong>{{ getTotalAttendance() }}</strong></div>
                      <div class="stat-value absent"><strong>{{ getTotalAbsent() }}</strong></div>
                      <div class="stat-value percentage"><strong>{{ getOverallPercentage() }}%</strong></div>
                    </div>
                  </td>

                </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>

    <!-- Enhanced Date Picker Dialog -->
    <v-dialog v-model="showDatePicker" max-width="400">
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-4 bg-primary text-white">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calendar" class="mr-3" />
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Ders Tarihi Seç</h3>
              <p class="text-body-2 opacity-90 mb-0">{{ selectedLessonIndex + 1 }}. Ders için tarih belirleyin</p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-date-picker
              v-model="selectedDate"
              color="primary"
              full-width
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn @click="closeDatePicker" variant="text">İptal</v-btn>
          <v-btn color="primary" @click="updateSelectedDate" variant="flat">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enhanced Add Student Dialog -->
    <v-dialog v-model="showAddStudentDialog" max-width="500">
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-4 bg-success text-white">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-plus" class="mr-3" />
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Öğrenci Ekle</h3>
              <p class="text-body-2 opacity-90 mb-0">Sınıfa yeni öğrenci ekleyin</p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form v-model="formValid" ref="addStudentForm">
            <v-select
                v-model="selectedStudentId"
                label="Öğrenci Seçin"
                :items="availableStudents"
                item-title="displayName"
                item-value="id"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-account"
                :rules="[v => !!v || 'Öğrenci seçimi gereklidir']"
                :loading="loadingStudents"
                class="mb-4"
                required
                @update:model-value="onStudentSelected"
            >
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ loadingStudents ? 'Öğrenciler yükleniyor...' : 'Eklenebilecek öğrenci bulunamadı' }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-select>

            <!-- Grup Arkadaşları Bildirimi -->
            <v-alert
                v-if="selectedStudentGroup && groupMembers.length > 0"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-4"
            >
              <div class="text-body-2">
                <strong>{{ selectedStudentGroup }} grubundan şu öğrenciler de eklenecek:</strong>
                <ul class="mt-2 pl-4">
                  <li v-for="member in groupMembers" :key="member.id">
                    {{ member.name }}
                  </li>
                </ul>
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn @click="closeAddStudentDialog" variant="text">İptal</v-btn>
          <v-btn
              color="success"
              :disabled="!formValid || !selectedStudentId"
              @click="addStudent"
              :loading="addingStudent"
              variant="flat"
          >
            {{ groupMembers.length > 0 ? `Ekle (${groupMembers.length + 1} öğrenci)` : 'Ekle' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enhanced Success Messages -->
    <v-snackbar
        v-model="showSuccessMessage"
        color="success"
        timeout="3000"
        location="top"
    >
      <div class="d-flex align-center">
        <v-icon icon="mdi-check-circle" class="mr-2" />
        {{ successMessage }}
      </div>
    </v-snackbar>

    <v-snackbar
        v-model="showErrorMessage"
        color="error"
        timeout="4000"
        location="top"
    >
      <div class="d-flex align-center">
        <v-icon icon="mdi-alert-circle" class="mr-2" />
        {{ errorMessage }}
      </div>
    </v-snackbar>

    <!-- Yoklama Kaldırma Onay Dialog -->
    <v-dialog v-model="showUncheckConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert-circle" color="warning" class="mr-2" />
          Yoklama Kaldırılsın mı?
        </v-card-title>
        <v-card-text>
          Bu öğrencinin yoklamasını kaldırmak istediğinizden emin misiniz?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelUncheck">İptal</v-btn>
          <v-btn color="error" variant="flat" @click="confirmUncheck">Kaldır</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { exportCurrentViewToExcel } from '@/services/attendanceArchive'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'

// Store
const authStore = useAuthStore()
const membershipTypesStore = useMembershipTypesStore()

// Reactive data
const formValid = ref(false)
const showAddStudentDialog = ref(false)
const showDatePicker = ref(false)
const selectedLessonIndex = ref(0)
const selectedDate = ref(new Date())
const exportingView = ref(false)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const selectedStudentId = ref('')
const loadingStudents = ref(false)
const addingStudent = ref(false)
const selectedStudentGroup = ref('')
const groupMembers = ref<Array<{id: string, name: string}>>([])
const selectedGroupFilter = ref<string | null>(null)
const selectedPersonFilter = ref<string | null>(null)
const availableGroups = ref<Array<{id: string, name: string}>>([])
const loadingGroups = ref(false)
const showUncheckConfirmDialog = ref(false)
const pendingUncheckData = ref<{studentId: string, lessonIndex: number} | null>(null)
const savingStudentId = ref<string | null>(null)
const pendingChanges = reactive<Record<string, boolean>>({})
const savingAll = ref(false)
const lastSavedData = reactive<Record<string, boolean[]>>({})


// Selections
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

// Data
const attendanceData = reactive<Record<string, boolean[]>>({})
const allStudents = ref<Array<{id: string, name: string, groupAssignment?: string, membershipType?: string, displayName?: string}>>([])

// Month options
const months = [
  { text: 'Ocak', value: 1 },
  { text: 'Şubat', value: 2 },
  { text: 'Mart', value: 3 },
  { text: 'Nisan', value: 4 },
  { text: 'Mayıs', value: 5 },
  { text: 'Haziran', value: 6 },
  { text: 'Temmuz', value: 7 },
  { text: 'Ağustos', value: 8 },
  { text: 'Eylül', value: 9 },
  { text: 'Ekim', value: 10 },
  { text: 'Kasım', value: 11 },
  { text: 'Aralık', value: 12 }
]

// Year options
const years = ref([2024, 2025, 2026])


// Group labels - will be populated from Firebase
const GroupTuruLabel = ref<Record<string, string>>({})

// Students data by class - will be loaded from Firebase
const studentsData = reactive<Record<string, Array<{id: string, name: string, groupAssignment?: string, membershipType?: string}>>>({
  'baslangic-a': []
})

// Lesson dates - now editable
const monthLessons = ref<Array<{date: Date, dateString: string, lessonNumber: number}>>([])

// Computed properties
const classStudents = computed(() => {
  // Hiçbir filtre seçili değilse boş liste dön
  if (!selectedGroupFilter.value && !selectedPersonFilter.value) {
    return []
  }
  
  const students = studentsData['baslangic-a'] || []
  return students
})

const availableStudents = computed(() => {
  const currentStudentIds = classStudents.value.map(s => s.id)
  return allStudents.value.filter(student => !currentStudentIds.includes(student.id))
})

// Grubu olmayan öğrenciler (Kişi Listesi için)
const ungroupedStudents = computed(() => {
  return allStudents.value.filter(student => !student.groupAssignment || student.groupAssignment === '')
})

// Methods
const initializeLessons = () => {
  monthLessons.value = Array.from({ length: 8 }, (_, index) => {
    const today = new Date()
    const lessonDate = new Date(today)
    lessonDate.setDate(today.getDate() + (index * 3)) // 3 days apart initially

    return {
      date: lessonDate,
      dateString: lessonDate.toISOString().split('T')[0],
      lessonNumber: index + 1
    }
  })
}

const updateLessonDate = (index: number, dateString: string) => {
  if (dateString && monthLessons.value[index]) {
    const newDate = new Date(dateString)
    monthLessons.value[index].date = newDate
    monthLessons.value[index].dateString = dateString
  }
}

const initializeAttendanceData = () => {
  classStudents.value.forEach(student => {
    if (!attendanceData[student.id]) {
      attendanceData[student.id] = new Array(8).fill(false)
    } else {
      // Ensure array has correct length
      while (attendanceData[student.id].length < 8) {
        attendanceData[student.id].push(false)
      }
    }
  })
}

const updateAttendanceValue = async (studentId: string, lessonIndex: number, value: any) => {
  if (!attendanceData[studentId]) {
    attendanceData[studentId] = new Array(8).fill(false)
  }
  
  // Eğer işaret kaldırılıyorsa onay iste
  const currentValue = attendanceData[studentId][lessonIndex]
  if (currentValue === true && value === false) {
    pendingUncheckData.value = { studentId, lessonIndex }
    showUncheckConfirmDialog.value = true
    return // Onay bekle
  }
  
  attendanceData[studentId][lessonIndex] = value

  // Değişiklik yapıldığını işaretle (otomatik kaydetme kaldırıldı)
  pendingChanges[studentId] = true
}

const confirmUncheck = async () => {
  if (pendingUncheckData.value) {
    const { studentId, lessonIndex } = pendingUncheckData.value
    attendanceData[studentId][lessonIndex] = false
    // Değişiklik yapıldığını işaretle (otomatik kaydetme kaldırıldı)
    pendingChanges[studentId] = true
  }
  showUncheckConfirmDialog.value = false
  pendingUncheckData.value = null
}

const cancelUncheck = () => {
  showUncheckConfirmDialog.value = false
  pendingUncheckData.value = null
}

/**
 * Herhangi bir öğrencide değişiklik var mı kontrol eder
 */
const hasAnyChanges = (): boolean => {
  // Eğer öğrenci sayısı değiştiyse
  if (JSON.stringify(Object.keys(attendanceData)) !== JSON.stringify(Object.keys(lastSavedData))) {
    return true
  }
  
  // Her öğrencinin verisini karşılaştır
  return Object.keys(attendanceData).some(studentId => {
    const current = attendanceData[studentId]
    const saved = lastSavedData[studentId]
    
    if (!saved) return true
    
    return JSON.stringify(current) !== JSON.stringify(saved)
  })
}

/**
 * Dokuman ID'sini oluşturur (grup/kişi bazlı)
 */
const getAttendanceDocId = (): string => {
  const baseId = `attendance-${selectedYear.value}-${selectedMonth.value}`
  
  if (selectedGroupFilter.value) {
    return `${baseId}-group-${selectedGroupFilter.value}`
  } else if (selectedPersonFilter.value) {
    return `${baseId}-person-${selectedPersonFilter.value}`
  }
  
  return baseId
}

/**
 * Tüm yoklama verilerini kaydeder
 */
const saveAllAttendance = async () => {
  if (!authStore.isAdmin) return
  
  // Grup veya kişi seçili değilse kaydetme
  if (!selectedGroupFilter.value && !selectedPersonFilter.value) {
    errorMessage.value = 'Lütfen önce bir grup veya kişi seçin'
    showErrorMessage.value = true
    return
  }
  
  savingAll.value = true
  
  try {
    const docId = getAttendanceDocId()
    
    // Mevcut görünüm bilgisini belirle
    let viewType: 'group' | 'person' | null = null
    let viewId: string | null = null
    
    if (selectedGroupFilter.value) {
      viewType = 'group'
      viewId = selectedGroupFilter.value
    } else if (selectedPersonFilter.value) {
      viewType = 'person'
      viewId = selectedPersonFilter.value
    }
    
    const attendanceRecord = {
      year: selectedYear.value,
      month: selectedMonth.value,
      viewType: viewType,
      viewId: viewId,
      attendanceData: { ...attendanceData },
      students: classStudents.value,
      lessons: monthLessons.value.map(lesson => ({
        date: lesson.date,
        lessonNumber: lesson.lessonNumber
      })),
      updatedAt: serverTimestamp(),
      updatedBy: authStore.user?.phone_number || 'Bilinmeyen'
    }
    
    await setDoc(doc(db, 'attendance', docId), attendanceRecord)
    
    // Kaydedilen veriyi sakla (değişiklik kontrolü için)
    Object.keys(attendanceData).forEach(studentId => {
      lastSavedData[studentId] = [...attendanceData[studentId]]
    })
    
    // Tüm pending changes'i temizle
    Object.keys(pendingChanges).forEach(key => {
      delete pendingChanges[key]
    })
    
    successMessage.value = 'Tüm yoklamalar başarıyla kaydedildi!'
    showSuccessMessage.value = true
    
    console.log('✅ Tüm yoklamalar kaydedildi, DocID:', docId)
  } catch (error) {
    console.error('❌ Yoklama kaydetme hatası:', error)
    errorMessage.value = 'Yoklamalar kaydedilirken hata oluştu'
    showErrorMessage.value = true
  } finally {
    savingAll.value = false
  }
}

const getAttendanceValue = (studentId: string, lessonIndex: number): boolean => {
  if (!attendanceData[studentId]) {
    attendanceData[studentId] = new Array(8).fill(false)
  }
  return attendanceData[studentId][lessonIndex] || false
}

const autoSaveAttendance = async () => {
  if (!authStore.isAdmin) return
  
  // Grup veya kişi seçili değilse kaydetme
  if (!selectedGroupFilter.value && !selectedPersonFilter.value) return

  try {
    const docId = getAttendanceDocId()
    const attendanceRecord = {
      year: selectedYear.value,
      month: selectedMonth.value,
      attendanceData: { ...attendanceData },
      students: classStudents.value,
      lessons: monthLessons.value.map(lesson => ({
        date: lesson.date,
        lessonNumber: lesson.lessonNumber
      })),
      updatedAt: serverTimestamp(),
      updatedBy: authStore.user?.phone_number || 'Bilinmeyen'
    }

    await setDoc(doc(db, 'attendance', docId), attendanceRecord)
  } catch (error) {
    console.error('❌ Otomatik kayıt hatası:', error)
  }
}

const loadAttendanceData = async () => {
  // Eğer ne grup ne de kişi seçiliyse, sadece mevcut verileri temizle
  if (!selectedGroupFilter.value && !selectedPersonFilter.value) {
    Object.keys(attendanceData).forEach(key => delete attendanceData[key])
    Object.keys(lastSavedData).forEach(key => delete lastSavedData[key])
    studentsData['baslangic-a'] = []
    initializeLessons()
    console.log('📂 Filtre seçili değil, veriler temizlendi')
    return
  }
  
  try {
    const docId = getAttendanceDocId()
    console.log('📂 Yoklama verisi yükleniyor, DocID:', docId)
    const attendanceDoc = await getDoc(doc(db, 'attendance', docId))

    // Mevcut yoklama verilerini temizle
    Object.keys(attendanceData).forEach(key => delete attendanceData[key])
    Object.keys(lastSavedData).forEach(key => delete lastSavedData[key])

    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data()

      // Attendance data'ı yükle
      if (data.attendanceData) {
        Object.assign(attendanceData, data.attendanceData)
        // Kaydedilen veriyi kopyala (değişiklik kontrolü için)
        Object.keys(data.attendanceData).forEach(studentId => {
          lastSavedData[studentId] = [...data.attendanceData[studentId]]
        })
      }
      
      // Ders tarihlerini yükle (eğer kaydedilmiş varsa ve grup filtresi seçili değilse)
      if (data.lessons && data.lessons.length > 0 && !selectedGroupFilter.value) {
        monthLessons.value = data.lessons.map((lesson: any, index: number) => ({
          date: lesson.date?.toDate() || new Date(),
          dateString: lesson.date?.toDate().toISOString().split('T')[0] || '',
          lessonNumber: index + 1
        }))
      }
      console.log('✅ Yoklama verileri yüklendi')
    } else {
      console.log('📝 Bu dönem/görünüm için yoklama verisi bulunamadı')
    }

    // Eğer grup filtresi seçiliyse, öğrencileri ve rezervasyon tarihlerini yeniden yükle
    if (selectedGroupFilter.value) {
      await loadGroupStudents(selectedGroupFilter.value)
      await loadGroupReservationDates(selectedGroupFilter.value)
    }

    // Her zaman attendance data'ı başlat
    initializeAttendanceData()
  } catch (error) {
    console.error('❌ Yoklama verilerini yükleme hatası:', error)
    initializeLessons()
    initializeAttendanceData()
  }
}

const loadGroupsFromFirebase = async () => {
  loadingGroups.value = true
  try {
    const groupsSnapshot = await getDocs(collection(db, 'groups'))
    const firebaseGroups: Array<{id: string, name: string}> = []
    const groupLabels: Record<string, string> = {}

    groupsSnapshot.forEach((doc) => {
      const groupData = doc.data()
      const groupName = groupData.name || doc.id

      firebaseGroups.push({
        id: doc.id,
        name: groupName
      })

      // Populate GroupTuruLabel mapping
      groupLabels[doc.id] = groupName
    })

    availableGroups.value = firebaseGroups
    GroupTuruLabel.value = groupLabels
    console.log('✅ Firebase grupları yüklendi:', firebaseGroups.length)
  } catch (error) {
    console.error('❌ Firebase gruplarını yükleme hatası:', error)
  } finally {
    loadingGroups.value = false
  }
}

const loadStudentsFromFirebase = async () => {
  loadingStudents.value = true
  try {
    const studentsSnapshot = await getDocs(collection(db, 'users'))
    const firebaseStudents: Array<{id: string, name: string, groupAssignment?: string, membershipType?: string, displayName?: string}> = []

    studentsSnapshot.forEach((doc) => {
      const studentData = doc.data()
      if (studentData.role === 'student') {
        const fullName = `${studentData.firstName} ${studentData.lastName}`

        firebaseStudents.push({
          id: doc.id,
          name: fullName,
          groupAssignment: studentData.groupAssignment,
          membershipType: studentData.membershipType,
          displayName: fullName // Sadece isim göster, parantez içinde bilgi yok
        })
      }
    })

    allStudents.value = firebaseStudents
    console.log('✅ Firebase öğrencileri yüklendi:', firebaseStudents.length)
  } catch (error) {
    console.error('❌ Firebase öğrencilerini yükleme hatası:', error)
    showErrorMessage.value = true
    errorMessage.value = 'Öğrenci listesi yüklenirken hata oluştu'
  } finally {
    loadingStudents.value = false
  }
}

const onStudentSelected = (studentId: string) => {
  const selectedStudent = allStudents.value.find(s => s.id === studentId)
  if (!selectedStudent) {
    groupMembers.value = []
    selectedStudentGroup.value = ''
    return
  }

  // Seçilen öğrencinin grup ve üyelik bilgilerini kontrol et
  if (selectedStudent.groupAssignment && selectedStudent.membershipType) {
    const membershipDisplayName = membershipTypesStore.getDisplayInfo(selectedStudent.membershipType)?.name || selectedStudent.membershipType
    selectedStudentGroup.value = `${membershipDisplayName} - ${selectedStudent.groupAssignment}`

    // Aynı membershipType VE groupAssignment'a sahip diğer öğrencileri bul
    const currentStudentIds = classStudents.value.map(s => s.id)
    groupMembers.value = allStudents.value.filter(student =>
        student.id !== studentId && // Seçilen öğrenciyi hariç tut (selectedStudentId yerine studentId kullan)
        !currentStudentIds.includes(student.id) && // Zaten ekli olanları hariç tut
        student.membershipType === selectedStudent.membershipType && // Aynı membership tipi
        student.groupAssignment === selectedStudent.groupAssignment // Aynı grup
    ).map(student => ({
      id: student.id,
      name: student.name
    }))
  } else {
    groupMembers.value = []
    selectedStudentGroup.value = ''
  }
}

const addStudent = async () => {
  if (!selectedStudentId.value) return

  addingStudent.value = true

  try {
    const selectedStudent = allStudents.value.find(s => s.id === selectedStudentId.value)
    if (!selectedStudent) {
      throw new Error('Seçilen öğrenci bulunamadı')
    }

    if (!studentsData['baslangic-a']) {
      studentsData['baslangic-a'] = []
    }

    // Seçilen öğrenciyi ekle
    const studentToAdd = {
      id: selectedStudent.id,
      name: selectedStudent.name,
      groupAssignment: selectedStudent.groupAssignment,
      membershipType: selectedStudent.membershipType
    }

    studentsData['baslangic-a'].push(studentToAdd)
    attendanceData[selectedStudent.id] = new Array(8).fill(false)

    // Aynı gruptaki diğer öğrencileri de ekle
    let addedCount = 1
    for (const groupMember of groupMembers.value) {
      const memberStudent = allStudents.value.find(s => s.id === groupMember.id)
      if (memberStudent) {
        studentsData['baslangic-a'].push({
          id: memberStudent.id,
          name: memberStudent.name,
          groupAssignment: memberStudent.groupAssignment,
          membershipType: memberStudent.membershipType
        })
        attendanceData[memberStudent.id] = new Array(8).fill(false)
        addedCount++
      }
    }

    // Save immediately after adding students
    await autoSaveAttendance()

    closeAddStudentDialog()
    showSuccessMessage.value = true
    successMessage.value = addedCount > 1
        ? `${addedCount} öğrenci başarıyla eklendi!`
        : 'Öğrenci başarıyla eklendi!'
  } catch (error: any) {
    console.error('❌ Öğrenci ekleme hatası:', error)
    showErrorMessage.value = true
    errorMessage.value = error.message || 'Öğrenci eklenirken hata oluştu'
  } finally {
    addingStudent.value = false
  }
}

const removeStudent = async (studentId: string) => {
  const index = studentsData['baslangic-a'].findIndex(s => s.id === studentId)
  if (index !== -1) {
    studentsData['baslangic-a'].splice(index, 1)
    delete attendanceData[studentId]

    // Save immediately after removing student
    await autoSaveAttendance()

    showSuccessMessage.value = true
    successMessage.value = 'Öğrenci silindi!'
  }
}

const closeAddStudentDialog = () => {
  showAddStudentDialog.value = false
  selectedStudentId.value = ''
  groupMembers.value = []
  selectedStudentGroup.value = ''
}

const openAddStudentDialog = async () => {
  await loadStudentsFromFirebase()
  showAddStudentDialog.value = true
}

// Kişi Listesinden seçilen kişiyi yoklama listesine göster
const onPersonSelected = async (personId: string | null) => {
  if (!personId) {
    // Seçim temizlendiyse ve grup filtresi de yoksa listeyi temizle
    if (!selectedGroupFilter.value) {
      studentsData['baslangic-a'] = []
      // Yoklama verilerini de temizle
      Object.keys(attendanceData).forEach(key => delete attendanceData[key])
      Object.keys(lastSavedData).forEach(key => delete lastSavedData[key])
    }
    return
  }
  
  // Grup filtresini temizle (karşılıklı dışlayıcılık)
  selectedGroupFilter.value = null
  
  const selectedPerson = allStudents.value.find(s => s.id === personId)
  if (!selectedPerson) return
  
  // Sadece bu kişiyi listede göster
  studentsData['baslangic-a'] = [{
    id: selectedPerson.id,
    name: selectedPerson.name,
    groupAssignment: selectedPerson.groupAssignment,
    membershipType: selectedPerson.membershipType
  }]
  
  // Varsayılan tarihleri yükle
  initializeLessons()
  
  // Kişi için kaydedilmiş yoklama verilerini yükle
  await loadGroupAttendanceData()
  
  console.log(`✅ ${selectedPerson.name} yoklama listesinde gösteriliyor`)
}

const openDatePicker = (index: number) => {
  selectedLessonIndex.value = index
  const currentDateString = monthLessons.value[index].dateString
  selectedDate.value = currentDateString ? new Date(currentDateString) : new Date()
  showDatePicker.value = true
}

const closeDatePicker = () => {
  showDatePicker.value = false
  selectedDate.value = new Date()
  selectedLessonIndex.value = 0
}

const updateSelectedDate = async () => {
  if (selectedDate.value) {
    const dateString = selectedDate.value.toISOString().split('T')[0]
    updateLessonDate(selectedLessonIndex.value, dateString)
    await autoSaveAttendance()
    showSuccessMessage.value = true
    successMessage.value = `${selectedLessonIndex.value + 1}. ders tarihi güncellendi!`
  }
  closeDatePicker()
}

// Utility methods
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatLessonDate = (date: Date): string => {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

const formatLessonDay = (date: Date): string => {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  return days[date.getDay()]
}

const getMonthTitle = (): string => {
  const monthObj = months.find(m => m.value === selectedMonth.value)
  return monthObj?.text || ''
}

const getTotalLessons = (): number => {
  return monthLessons.value.length
}

// Statistics methods
const getAttendedCount = (studentId: string): number => {
  if (!attendanceData[studentId]) return 0
  return attendanceData[studentId].filter(Boolean).length || 0
}

const getAbsentCount = (studentId: string): number => {
  const total = monthLessons.value.length
  const attended = getAttendedCount(studentId)
  return total - attended
}

const getAttendancePercentage = (studentId: string): number => {
  const total = monthLessons.value.length
  const attended = getAttendedCount(studentId)
  return total > 0 ? Math.round((attended / total) * 100) : 0
}

const getLessonAttendanceCount = (lessonIndex: number): number => {
  return classStudents.value.filter(student =>
      attendanceData[student.id]?.[lessonIndex] || false
  ).length
}

const getTotalPossibleAttendance = (): number => {
  return classStudents.value.length * monthLessons.value.length
}

const getTotalAttendance = (): number => {
  return classStudents.value.reduce((total, student) =>
      total + getAttendedCount(student.id), 0
  )
}

const getTotalAbsent = (): number => {
  return getTotalPossibleAttendance() - getTotalAttendance()
}

const getOverallPercentage = (): number => {
  const total = getTotalPossibleAttendance()
  const attended = getTotalAttendance()
  return total > 0 ? Math.round((attended / total) * 100) : 0
}

// Watch for month/year changes
watch([selectedMonth, selectedYear], async () => {
  // loadAttendanceData içinde grup filtresi kontrolü yapılıyor ve rezervasyon tarihleri yükleniyor
  await loadAttendanceData()
})

// Update the click handler
watch(showAddStudentDialog, (newValue) => {
  if (newValue) {
    openAddStudentDialog()
  }
})

// Grup seçildiğinde rezervasyon tarihlerini ve öğrencileri yükle
watch(selectedGroupFilter, async (newGroupId) => {
  // Kişi filtresini temizle (karşılıklı dışlayıcılık)
  if (newGroupId) {
    selectedPersonFilter.value = null
    await loadGroupStudents(newGroupId)
    await loadGroupReservationDates(newGroupId)
    // Grup için kaydedilmiş yoklama verilerini yükle
    await loadGroupAttendanceData()
  } else if (!selectedPersonFilter.value) {
    // Her iki filtre de boşsa listeyi temizle
    studentsData['baslangic-a'] = []
    initializeLessons()
    // Yoklama verilerini de temizle
    Object.keys(attendanceData).forEach(key => delete attendanceData[key])
    Object.keys(lastSavedData).forEach(key => delete lastSavedData[key])
  }
})

/**
 * Grup/Kişi için kaydedilmiş yoklama verilerini yükler (studentsData yüklü olduktan sonra çağrılır)
 */
const loadGroupAttendanceData = async () => {
  try {
    const docId = getAttendanceDocId()
    console.log('📂 Grup/Kişi yoklama verisi yükleniyor, DocID:', docId)
    const attendanceDoc = await getDoc(doc(db, 'attendance', docId))
    
    // Mevcut yoklama verilerini temizle
    Object.keys(attendanceData).forEach(key => delete attendanceData[key])
    Object.keys(lastSavedData).forEach(key => delete lastSavedData[key])
    
    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data()
      
      // Kaydedilmiş attendance data'yı yükle
      if (data.attendanceData) {
        Object.assign(attendanceData, data.attendanceData)
        // Kaydedilen veriyi kopyala (değişiklik kontrolü için)
        Object.keys(data.attendanceData).forEach(studentId => {
          lastSavedData[studentId] = [...data.attendanceData[studentId]]
        })
        console.log('✅ Kaydedilmiş yoklama verileri yüklendi')
      }
    } else {
      console.log('📝 Bu grup/kişi için kaydedilmiş yoklama verisi bulunamadı')
    }
    
    // Her zaman tüm öğrenciler için attendance data'yı başlat
    initializeAttendanceData()
  } catch (error) {
    console.error('❌ Grup yoklama verileri yüklenirken hata:', error)
    initializeAttendanceData()
  }
}

// Grup üyelerini Firebase'den yükle
const loadGroupStudents = async (groupId: string) => {
  try {
    // Grup dokümanını çek
    const groupDoc = await getDoc(doc(db, 'groups', groupId))
    
    if (groupDoc.exists()) {
      const groupData = groupDoc.data()
      const members = groupData.members || []
      
      // Üyeleri studentsData formatına dönüştür
      const groupStudents = members.map((member: any) => ({
        id: member.id,
        name: member.name,
        groupAssignment: groupId,
        membershipType: groupData.membershipType
      }))
      
      studentsData['baslangic-a'] = groupStudents
      initializeAttendanceData()
      console.log(`✅ ${groupStudents.length} grup üyesi yüklendi`)
    } else {
      console.log('📝 Grup bulunamadı')
      studentsData['baslangic-a'] = []
    }
  } catch (error) {
    console.error('❌ Grup üyeleri yüklenirken hata:', error)
  }
}

// Grup rezervasyon tarihlerini yükle
const loadGroupReservationDates = async (groupId: string) => {
  try {
    const reservationsRef = collection(db, 'reservations')
    // orderBy kaldırıldı - client-side sıralama yapacağız (Firebase index gerektirmemek için)
    const q = query(
      reservationsRef,
      where('groupId', '==', groupId)
    )
    
    const querySnapshot = await getDocs(q)
    const reservationDates: Date[] = []
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.date) {
        const date = data.date.toDate ? data.date.toDate() : new Date(data.date)
        reservationDates.push(date)
      }
    })
    
    // Client-side sıralama (eskiden yeniye)
    reservationDates.sort((a, b) => a.getTime() - b.getTime())
    
    // Seçilen ay/yıl aralığına göre filtrele
    // selectedMonth.value 1-indexed (1=Ocak, 12=Aralık), JavaScript months 0-indexed
    const selectedMonthStart = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    selectedMonthStart.setHours(0, 0, 0, 0)
    
    // Son günü almak için: selectedMonth.value (1-indexed) kullanarak bir sonraki ayın 0. günü
    const selectedMonthEnd = new Date(selectedYear.value, selectedMonth.value, 0, 23, 59, 59)
    
    // Seçilen ay içindeki tarihleri filtrele
    const monthDates = reservationDates.filter(d => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      return date >= selectedMonthStart && date <= selectedMonthEnd
    })
    
    // Aynı gündeki mükerrer tarihleri kaldır (deduplicate by date string)
    const uniqueDatesMap = new Map<string, Date>()
    monthDates.forEach(date => {
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!uniqueDatesMap.has(dateKey)) {
        uniqueDatesMap.set(dateKey, date)
      }
    })
    const uniqueMonthDates = Array.from(uniqueDatesMap.values())
    
    if (uniqueMonthDates.length > 0) {
      monthLessons.value = uniqueMonthDates.slice(0, 8).map((date, index) => ({
        date: date,
        dateString: date.toISOString().split('T')[0],
        lessonNumber: index + 1
      }))
      console.log(`✅ ${monthLessons.value.length} benzersiz rezervasyon tarihi yüklendi (${selectedMonth.value}/${selectedYear.value})`)
    } else {
      console.log(`📝 ${selectedMonth.value}/${selectedYear.value} için bu grup için rezervasyon bulunamadı, varsayılan tarihler kullanılıyor`)
      initializeLessons()
    }
  } catch (error) {
    console.error('❌ Rezervasyon tarihleri yüklenirken hata:', error)
    initializeLessons()
  }
}

// Lifecycle
// Manuel Excel export
const handleExportCurrentView = async () => {
  try {
    exportingView.value = true
    
    // Görünüm başlığını oluştur
    let viewTitle = 'Yoklama'
    if (selectedGroupFilter.value) {
      const group = availableGroups.value.find((g: any) => g.id === selectedGroupFilter.value)
      viewTitle = group ? `${group.name} Yoklaması` : 'Grup Yoklaması'
    } else if (selectedPersonFilter.value) {
      const person = allStudents.value.find((s: any) => s.id === selectedPersonFilter.value)
      viewTitle = person ? `${person.name} Yoklaması` : 'Bireysel Yoklama'
    }

    // Öğrenci listesini hazırla
    const students = classStudents.value.map((s: any) => ({
      id: s.id,
      name: s.displayName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()
    }))

    // Ders listesini hazırla
    const lessons = monthLessons.value.map((l: any) => ({
      date: l.date,
      lessonNumber: l.lessonNumber
    }))

    const result = await exportCurrentViewToExcel(
      selectedYear.value,
      selectedMonth.value,
      students,
      attendanceData,
      lessons,
      viewTitle
    )

    if (result) {
      console.log('✅ Yoklama verileri başarıyla indirildi!')
    } else {
      console.log('⚠️ Export edilecek veri bulunamadı.')
    }
  } catch (error: any) {
    console.error('❌ Export hatası:', error)
  } finally {
    exportingView.value = false
  }
}

onMounted(async () => {
  await membershipTypesStore.initialize()
  initializeLessons()
  loadGroupsFromFirebase()
  loadStudentsFromFirebase() // Kişi Listesi için öğrencileri yükle
})
</script>