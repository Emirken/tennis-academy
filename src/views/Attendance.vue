<template>
  <div class="attendance-page">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">Yoklama Yönetimi</h1>
        <p class="page-subtitle">
          Öğrenci devam durumlarını takip edin ve yönetin
        </p>
      </div>

      <!-- Month/Class Selection -->
      <v-card class="filter-card mb-6" elevation="4">
        <v-card-title class="section-title">
          Dönem Seçimi
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
                  @update:model-value="loadAttendanceData"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                  v-model="selectedYear"
                  label="Yıl"
                  :items="years"
                  variant="outlined"
                  @update:model-value="loadAttendanceData"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Attendance Sheet -->
      <v-card elevation="6" class="attendance-sheet mb-6">
        <v-card-title class="attendance-title">
          <div class="d-flex justify-space-between align-center w-100">
            <div>
              <v-icon icon="mdi-clipboard-check" class="me-2" />
              Yoklama Listesi - {{ getMonthTitle() }} {{ selectedYear }}
            </div>
            <div class="d-flex gap-2">
              <v-chip color="success" variant="flat" v-if="getTotalLessons() > 0">
                {{ getTotalLessons() }} Ders
              </v-chip>
              <v-btn
                  class="ml-3"
                  v-if="authStore.isAdmin"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-plus"
                  @click="showAddStudentDialog = true"
                  size="small"
              >
                Öğrenci Ekle
              </v-btn>
            </div>
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

              <!-- Student Rows -->
              <tbody>
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

      <!-- Class Statistics -->
      <v-row class="mt-6">
        <v-col cols="12" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-4">
              <div class="stat-number">{{ classStudents.length }}</div>
              <div class="stat-label">Toplam Öğrenci</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-4">
              <div class="stat-number">{{ monthLessons.length }}</div>
              <div class="stat-label">Aylık Ders</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-4">
              <div class="stat-number">{{ getTotalAttendance() }}</div>
              <div class="stat-label">Toplam Katılım</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card" elevation="4">
            <v-card-text class="text-center pa-4">
              <div class="stat-number">{{ getOverallPercentage() }}%</div>
              <div class="stat-label">Genel Devam</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Date Picker Dialog -->
      <v-dialog v-model="showDatePicker" max-width="400">
        <v-card>
          <v-card-title class="text-h6">
            {{ selectedLessonIndex + 1 }}. Ders Tarihi Seç
          </v-card-title>
          <v-card-text class="pa-6">
            <v-text-field
                v-model="selectedDate"
                label="Tarih"
                variant="outlined"
                type="date"
                hide-details
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="closeDatePicker">İptal</v-btn>
            <v-btn color="primary" @click="updateSelectedDate">Kaydet</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Add Student Dialog -->
      <v-dialog v-model="showAddStudentDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">Öğrenci Ekle</v-card-title>
          <v-card-text>
            <v-form ref="studentForm" v-model="formValid">
              <v-select
                  v-model="selectedStudentId"
                  label="Öğrenci Seç"
                  :items="availableStudents"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :rules="[v => !!v || 'Öğrenci seçimi gereklidir']"
                  :loading="loadingStudents"
                  class="mb-4"
                  required
              >
                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ loadingStudents ? 'Öğrenciler yükleniyor...' : 'Eklenebilecek öğrenci bulunamadı' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="closeAddStudentDialog">İptal</v-btn>
            <v-btn
                color="primary"
                :disabled="!formValid || !selectedStudentId"
                @click="addStudent"
                :loading="addingStudent"
            >
              Ekle
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Success Messages -->
      <v-snackbar
          v-model="showSuccessMessage"
          color="success"
          timeout="3000"
          location="top"
      >
        <v-icon icon="mdi-check-circle" class="me-2" />
        {{ successMessage }}
      </v-snackbar>

      <v-snackbar
          v-model="showErrorMessage"
          color="error"
          timeout="4000"
          location="top"
      >
        <v-icon icon="mdi-alert-circle" class="me-2" />
        {{ errorMessage }}
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Store
const authStore = useAuthStore()

// Reactive data
const formValid = ref(false)
const showAddStudentDialog = ref(false)
const showDatePicker = ref(false)
const selectedLessonIndex = ref(0)
const selectedDate = ref('')
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const selectedStudentId = ref('')
const loadingStudents = ref(false)
const addingStudent = ref(false)

// Selections
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

// Data
const attendanceData = reactive<Record<string, boolean[]>>({})
const allStudents = ref<Array<{id: string, name: string}>>([])

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
const studentsData = reactive<Record<string, Array<{id: string, name: string}>>>({
  'baslangic-a': []
})

// Lesson dates - now editable
const monthLessons = ref<Array<{date: Date, dateString: string, lessonNumber: number}>>([])

// Computed properties
const classStudents = computed(() => {
  // Tek bir grup kullan - başlangıç grubu A
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

const updateAttendanceValue = async (studentId: string, lessonIndex: number, value: boolean) => {
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
    const firebaseStudents: Array<{id: string, name: string}> = []

    studentsSnapshot.forEach((doc) => {
      const studentData = doc.data()
      if (studentData.role === 'student') {
        firebaseStudents.push({
          id: doc.id,
          name: `${studentData.firstName} ${studentData.lastName}`
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

    studentsData['baslangic-a'].push(selectedStudent)
    attendanceData[selectedStudent.id] = new Array(8).fill(false)

    // Save immediately after adding student
    await autoSaveAttendance()

    closeAddStudentDialog()
    showSuccessMessage.value = true
    successMessage.value = 'Öğrenci başarıyla eklendi!'
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
}

const openAddStudentDialog = async () => {
  await loadStudentsFromFirebase()
  showAddStudentDialog.value = true
}

const openDatePicker = (index: number) => {
  selectedLessonIndex.value = index
  selectedDate.value = monthLessons.value[index].dateString
  showDatePicker.value = true
}

const closeDatePicker = () => {
  showDatePicker.value = false
  selectedDate.value = ''
  selectedLessonIndex.value = 0
}

const updateSelectedDate = async () => {
  if (selectedDate.value) {
    updateLessonDate(selectedLessonIndex.value, selectedDate.value)
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

<style scoped>

</style>