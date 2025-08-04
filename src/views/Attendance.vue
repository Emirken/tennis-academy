<template>
  <div class="attendance-page">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
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
        <v-card class="modern-card mb-8" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6">
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
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
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
              <v-col cols="12" md="6">
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
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Enhanced Attendance Sheet -->
        <v-card class="modern-card attendance-sheet" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6 d-flex justify-space-between align-center">
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
                  v-if="authStore.isAdmin"
                  class="view-color"
                  variant="flat"
                  prepend-icon="mdi-plus"
                  @click="showAddStudentDialog = true"
                  size="small"
              >
                Öğrenci Ekle
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
                        {{ MembershipTypeLabel[student.membershipType as keyof typeof MembershipTypeLabel] || student.membershipType }}
                      </v-chip>
                      <v-chip
                          v-if="student.groupAssignment"
                          size="x-small"
                          color="info"
                          variant="flat"
                          class="ml-2"
                      >
                        {{ GroupTuruLabel[student.groupAssignment as keyof typeof GroupTuruLabel] || student.groupAssignment }}
                      </v-chip>
                      <v-btn
                          v-if="authStore.isAdmin"
                          icon="mdi-delete"
                          size="x-small"
                          color="error"
                          variant="text"
                          class="ml-2"
                          @click="removeStudent(student.id)"
                      />
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
        <v-card-title class="pa-6 bg-primary text-white">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calendar" class="mr-3" />
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Ders Tarihi Seç</h3>
              <p class="text-body-2 opacity-90 mb-0">{{ selectedLessonIndex + 1 }}. Ders için tarih belirleyin</p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-date-picker
              v-model="selectedDate"
              color="primary"
              full-width
          />
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="closeDatePicker" variant="text">İptal</v-btn>
          <v-btn color="primary" @click="updateSelectedDate" variant="flat">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enhanced Add Student Dialog -->
    <v-dialog v-model="showAddStudentDialog" max-width="500">
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-6 bg-success text-white">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-plus" class="mr-3" />
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Öğrenci Ekle</h3>
              <p class="text-body-2 opacity-90 mb-0">Sınıfa yeni öğrenci ekleyin</p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
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
        <v-card-actions class="pa-6">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { GroupTuruLabel, MembershipTypeLabel } from '@/enums/GroupTuru'

// Store
const authStore = useAuthStore()

// Reactive data
const formValid = ref(false)
const showAddStudentDialog = ref(false)
const showDatePicker = ref(false)
const selectedLessonIndex = ref(0)
const selectedDate = ref(new Date())
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const selectedStudentId = ref('')
const loadingStudents = ref(false)
const addingStudent = ref(false)
const selectedStudentGroup = ref('')
const groupMembers = ref<Array<{id: string, name: string}>>([])

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

// Students data by class - will be loaded from Firebase
const studentsData = reactive<Record<string, Array<{id: string, name: string, groupAssignment?: string, membershipType?: string}>>>({
  'baslangic-a': []
})

// Lesson dates - now editable
const monthLessons = ref<Array<{date: Date, dateString: string, lessonNumber: number}>>([])

// Computed properties
const classStudents = computed(() => {
  return studentsData['baslangic-a'] || []
})

const availableStudents = computed(() => {
  const currentStudentIds = classStudents.value.map(s => s.id)
  return allStudents.value.filter(student => !currentStudentIds.includes(student.id))
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
  attendanceData[studentId][lessonIndex] = value

  // Auto-save after each change
  await autoSaveAttendance()
}

const getAttendanceValue = (studentId: string, lessonIndex: number): boolean => {
  if (!attendanceData[studentId]) {
    attendanceData[studentId] = new Array(8).fill(false)
  }
  return attendanceData[studentId][lessonIndex] || false
}

const autoSaveAttendance = async () => {
  if (!authStore.isAdmin) return

  try {
    const docId = `attendance-${selectedYear.value}-${selectedMonth.value}`
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
      updatedBy: authStore.user?.email || 'Bilinmeyen'
    }

    await setDoc(doc(db, 'attendance', docId), attendanceRecord)
  } catch (error) {
    console.error('❌ Otomatik kayıt hatası:', error)
  }
}

const loadAttendanceData = async () => {
  try {
    const docId = `attendance-${selectedYear.value}-${selectedMonth.value}`
    const attendanceDoc = await getDoc(doc(db, 'attendance', docId))

    // Clear existing data first
    Object.keys(attendanceData).forEach(key => {
      delete attendanceData[key]
    })

    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data()

      // Load students from Firebase data
      if (data.students && data.students.length > 0) {
        studentsData['baslangic-a'] = data.students
        console.log('✅ Öğrenciler Firebase\'den yüklendi:', data.students.length)
      }

      if (data.attendanceData) {
        Object.assign(attendanceData, data.attendanceData)
      }
      if (data.lessons && data.lessons.length > 0) {
        monthLessons.value = data.lessons.map((lesson: any, index: number) => ({
          date: lesson.date?.toDate() || new Date(),
          dateString: lesson.date?.toDate().toISOString().split('T')[0] || '',
          lessonNumber: index + 1
        }))
      } else {
        initializeLessons()
      }
      console.log('✅ Yoklama verileri yüklendi')
    } else {
      console.log('📝 Bu dönem için yoklama verisi bulunamadı')
      // Start with empty student list if no data exists
      studentsData['baslangic-a'] = []
      initializeLessons()
    }

    // Always initialize after loading
    initializeAttendanceData()
  } catch (error) {
    console.error('❌ Yoklama verilerini yükleme hatası:', error)
    initializeLessons()
    initializeAttendanceData()
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
    selectedStudentGroup.value = `${selectedStudent.membershipType} - ${selectedStudent.groupAssignment}`

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
watch([selectedMonth, selectedYear], () => {
  loadAttendanceData()
})

// Update the click handler
watch(showAddStudentDialog, (newValue) => {
  if (newValue) {
    openAddStudentDialog()
  }
})

// Lifecycle
onMounted(() => {
  initializeLessons()
  loadAttendanceData()
})
</script>