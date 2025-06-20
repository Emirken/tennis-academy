<template>
  <div class="student-management">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  <v-icon icon="mdi-account-group" class="mr-3" color="white" />
                  Öğrenci Yönetimi
                </h1>
                <p class="welcome-subtitle">
                  Öğrenci profillerini, üyeliklerini ve hesap bilgilerini yönetin
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">{{ getCurrentDate() }}</div>
                <div class="current-time">{{ filteredStudents.length }} Öğrenci</div>
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
                  <v-icon icon="mdi-account-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">{{ stats.totalStudents }}</h3>
                  <p class="stat-label">Toplam Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-trending-up</v-icon>
                    <span class="trend-text">+{{ stats.newThisMonth }} bu ay</span>
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
                  <v-icon icon="mdi-account-check" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">{{ stats.activeStudents }}</h3>
                  <p class="stat-label">Aktif Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-check-circle</v-icon>
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
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-account-clock" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">{{ stats.inactiveStudents }}</h3>
                  <p class="stat-label">Pasif Öğrenci</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="warning">mdi-clock-alert</v-icon>
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
                <div class="stat-icon-wrapper amber-gradient">
                  <v-icon icon="mdi-cash-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number amber--text">{{ totalBalance.toLocaleString('tr-TR') }}₺</h3>
                  <p class="stat-label">Toplam Bakiye</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="amber">mdi-currency-try</v-icon>
                    <span class="trend-text">Nakit akışı</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Enhanced Filters Section -->
        <v-card class="modern-card mb-8" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper info-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-filter" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Filtreler ve Arama</h3>
                <p class="text-body-2 text-grey-600 mb-0">Öğrencileri filtreleyin ve hızlı arama yapın</p>
              </div>
            </div>
          </v-card-title>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                    v-model="filters.search"
                    label="Öğrenci Ara"
                    variant="outlined"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    clearable
                    placeholder="İsim, email veya telefon ara..."
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                    v-model="filters.membership"
                    label="Üyelik Türü"
                    :items="membershipTypes"
                    variant="outlined"
                    density="compact"
                    clearable
                    prepend-inner-icon="mdi-card-account-details"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                    v-model="filters.status"
                    label="Durum"
                    :items="statusOptions"
                    variant="outlined"
                    density="compact"
                    clearable
                    prepend-inner-icon="mdi-account-check"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Enhanced Students Table -->
        <v-card class="modern-card" elevation="0">
          <div class="action-card-overlay"></div>
          <v-card-title class="pa-6 d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <div class="stat-icon-wrapper success-gradient mr-4" style="width: 48px; height: 48px;">
                <v-icon icon="mdi-table" size="24" color="white" />
              </div>
              <div>
                <h3 class="text-h6 font-weight-bold mb-0">Öğrenci Listesi</h3>
                <p class="text-body-2 text-grey-600 mb-0">Tüm öğrenci bilgileri ve detayları</p>
              </div>
            </div>
            <v-chip color="success" variant="flat" class="font-weight-bold">
              {{ filteredStudents.length }} öğrenci
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
                :headers="headers"
                :items="filteredStudents"
                :items-per-page="itemsPerPage"
                :loading="loading"
                class="elevation-0"
                loading-text="Öğrenciler yükleniyor..."
                no-data-text="Henüz öğrenci kaydı bulunmamaktadır"
            >
              <template #item.student="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar
                      :color="item.status === 'active' ? 'success' : item.status === 'suspended' ? 'error' : 'grey'"
                      class="mr-3"
                      size="40"
                  >
                    <span class="white--text font-weight-bold text-h6">
                      {{ item.firstName?.charAt(0) }}{{ item.lastName?.charAt(0) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold text-body-1">
                      {{ item.firstName }} {{ item.lastName }}
                    </div>
                    <div class="text-body-2 text-grey-600">{{ item.email }}</div>
                  </div>
                </div>
              </template>

              <template #item.membershipType="{ item }">
                <v-chip
                    :color="getMembershipColor(item.membershipType)"
                    variant="flat"
                    size="small"
                    class="font-weight-bold"
                >
                  {{ getMembershipDisplayName(item.membershipType) }}
                </v-chip>
              </template>

              <template #item.status="{ item }">
                <v-chip
                    :color="getStatusColor(item.status)"
                    variant="flat"
                    size="small"
                    class="font-weight-bold"
                >
                  <v-icon
                      start
                      size="16"
                      :icon="getStatusIcon(item.status)"
                  />
                  {{ getStatusDisplayName(item.status) }}
                </v-chip>
              </template>

              <template #item.joinDate="{ item }">
                <div class="text-body-2">
                  {{ formatDate(item.joinDate) }}
                </div>
              </template>

              <template #item.balance="{ item }">
                <div class="font-weight-bold" :class="getBalanceColor(item.balance)">
                  {{ item.balance?.toLocaleString('tr-TR') }}₺
                </div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex justify-center gap-2">
                  <v-btn
                      icon
                      size="small"
                      color="primary"
                      variant="tonal"
                      @click="viewStudentDetails(item)"
                  >
                    <v-icon size="16">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Profili Görüntüle</v-tooltip>
                  </v-btn>
                  <v-btn
                      class="ml-2"
                      icon
                      size="small"
                      color="error"
                      variant="tonal"
                      @click="deleteStudent(item)"
                  >
                    <v-icon size="16">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">Sil</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>

    <!-- Enhanced Student Details Dialog -->
    <v-dialog
        v-model="showStudentDetailsDialog"
        max-width="900"
        scrollable
    >
      <v-card class="modern-card" elevation="8">
        <v-card-title class="pa-0">
          <div class="welcome-section" style="margin: 0; border-radius: 0;">
            <div class="welcome-content py-6 px-6">
              <div class="d-flex align-center">
                <v-avatar
                    :color="selectedStudent?.status === 'active' ? 'success' : selectedStudent?.status === 'suspended' ? 'error' : 'grey'"
                    class="mr-4"
                    size="56"
                >
                  <span class="white--text font-weight-bold text-h5">
                    {{ selectedStudent?.firstName?.charAt(0) }}{{ selectedStudent?.lastName?.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h2 class="text-h5 font-weight-bold text-white mb-1">
                    {{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}
                  </h2>
                  <p class="text-body-1 text-white opacity-90 mb-0">
                    {{ selectedStudent?.email }}
                  </p>
                </div>
                <v-spacer />
                <v-btn
                    icon
                    color="white"
                    variant="text"
                    @click="showStudentDetailsDialog = false"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-0">
          <v-container class="py-6">
            <v-row>
              <!-- Student Info Section -->
              <v-col cols="12" md="6">
                <v-card class="modern-card mb-4" elevation="2">
                  <v-card-title class="pa-4 bg-primary text-white">
                    <v-icon icon="mdi-account-details" class="mr-2" />
                    Kişisel Bilgiler
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div v-if="!isEditMode">
                      <div class="info-item mb-3">
                        <label class="info-label">Ad Soyad:</label>
                        <span class="info-value">{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">E-posta:</label>
                        <span class="info-value">{{ selectedStudent?.email }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Telefon:</label>
                        <span class="info-value">{{ selectedStudent?.phone }}</span>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Adres:</label>
                        <span class="info-value">{{ selectedStudent?.address }}</span>
                      </div>
                      <div class="info-item">
                        <label class="info-label">Acil Durum İletişim:</label>
                        <span class="info-value">{{ selectedStudent?.emergencyContact }}</span>
                      </div>
                    </div>
                    <div v-else>
                      <v-text-field
                          v-model="editForm.firstName"
                          label="Ad"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.lastName"
                          label="Soyad"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.email"
                          label="E-posta"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.phone"
                          label="Telefon"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-textarea
                          v-model="editForm.address"
                          label="Adres"
                          variant="outlined"
                          density="compact"
                          rows="2"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.emergencyContact"
                          label="Acil Durum İletişim"
                          variant="outlined"
                          density="compact"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Membership & Status Section -->
              <v-col cols="12" md="6">
                <v-card class="modern-card mb-4" elevation="2">
                  <v-card-title class="pa-4 bg-success text-white">
                    <v-icon icon="mdi-card-account-details" class="mr-2" />
                    Üyelik Bilgileri
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div v-if="!isEditMode">
                      <div class="info-item mb-3">
                        <label class="info-label">Üyelik Türü:</label>
                        <v-chip
                            :color="getMembershipColor(selectedStudent?.membershipType)"
                            variant="flat"
                            size="small"
                            class="font-weight-bold"
                        >
                          {{ getMembershipDisplayName(selectedStudent?.membershipType) }}
                        </v-chip>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Durum:</label>
                        <v-chip
                            :color="getStatusColor(selectedStudent?.status)"
                            variant="flat"
                            size="small"
                            class="font-weight-bold"
                        >
                          <v-icon
                              start
                              size="16"
                              :icon="getStatusIcon(selectedStudent?.status)"
                          />
                          {{ getStatusDisplayName(selectedStudent?.status) }}
                        </v-chip>
                      </div>
                      <div class="info-item mb-3">
                        <label class="info-label">Kayıt Tarihi:</label>
                        <span class="info-value">{{ formatDate(selectedStudent?.joinDate) }}</span>
                      </div>
                      <div class="info-item">
                        <label class="info-label">Bakiye:</label>
                        <span class="font-weight-bold" :class="getBalanceColor(selectedStudent?.balance)">
                          {{ selectedStudent?.balance?.toLocaleString('tr-TR') }}₺
                        </span>
                      </div>
                    </div>
                    <div v-else>
                      <v-select
                          v-model="editForm.membershipType"
                          label="Üyelik Türü"
                          :items="membershipTypes"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-select
                          v-model="editForm.status"
                          label="Durum"
                          :items="statusOptions"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                      />
                      <v-text-field
                          v-model="editForm.balance"
                          label="Bakiye"
                          variant="outlined"
                          density="compact"
                          type="number"
                          suffix="₺"
                          class="mb-3"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-6 bg-grey-50">
          <div v-if="!isEditMode" class="d-flex w-100 gap-2">
            <v-btn color="primary" variant="flat" @click="toggleEditMode">
              <v-icon icon="mdi-pencil" class="mr-1" />
              Düzenle
            </v-btn>
            <v-spacer />
            <v-btn color="red" variant="text" @click="showStudentDetailsDialog = false">Kapat</v-btn>
          </div>

          <div v-else class="d-flex w-100 gap-2">
            <v-btn color="success" variant="flat" @click="saveStudentChanges" :loading="savingChanges">
              <v-icon icon="mdi-check" class="mr-1" />
              Kaydet
            </v-btn>
            <v-spacer />
            <v-btn color="grey" variant="flat" @click="cancelEdit">
              <v-icon icon="mdi-close" class="mr-1" />
              İptal
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="3000"
        location="top"
    >
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Define student interface
interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  emergencyContact: string
  membershipType: string
  status: 'active' | 'inactive' | 'suspended'
  joinDate: Date
  balance: number
  notes?: string
  role: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

// Reactive state
const students = ref<Student[]>([])
const loading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const showStudentDetailsDialog = ref(false)
const selectedStudent = ref<Student | null>(null)
const isEditMode = ref(false)
const savingChanges = ref(false)
const itemsPerPage = ref(10)

// Filters
const filters = reactive({
  search: '',
  membership: '',
  status: ''
})

// Edit form
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  emergencyContact: '',
  membershipType: '',
  status: '',
  balance: 0,
  notes: ''
})

// Table headers
const headers = [
  { title: 'Öğrenci', key: 'student', sortable: false },
  { title: 'Üyelik Türü', key: 'membershipType', align: 'center' },
  { title: 'Durum', key: 'status', align: 'center' },
  { title: 'Kayıt Tarihi', key: 'joinDate', align: 'center' },
  { title: 'Bakiye', key: 'balance', align: 'center' },
  { title: 'İşlemler', key: 'actions', sortable: false, align: 'center' }
]

// Options (ORİJİNAL KOD)
const membershipTypes = [
  { title: 'Özel Ders 1 Kişi (45dk)', value: 'private_1_45' },
  { title: 'Özel Ders 2 Kişi (60dk)', value: 'private_2_60' },
  { title: 'Özel Grup 3 Kişi (8ders)', value: 'private_group_3_8' },
  { title: 'Özel Grup 4 Kişi (8ders)', value: 'private_group_4_8' },
  { title: 'Özel Paket 1 Kişi (8ders)', value: 'private_package_1_8' },
  { title: 'Özel Paket 2 Kişi (8ders)', value: 'private_package_2_8' },
  { title: 'Yetişkin Grup', value: 'adult_group' },
  { title: 'Tenis Okulu Yaş Grubu', value: 'tennis_school_age' },
  { title: 'Tenis Okulu Performans', value: 'tennis_school_performance' }
]

const statusOptions = [
  { title: 'Aktif', value: 'active' },
  { title: 'Pasif', value: 'inactive' },
  { title: 'Askıda', value: 'suspended' }
]

// Computed properties (ORİJİNAL MANTIK KORUNDU)
const filteredStudents = computed(() => {
  let filtered = students.value

  if (filters.search) {
    filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.phone.includes(filters.search)
    )
  }

  if (filters.membership) {
    filtered = filtered.filter(student => student.membershipType === filters.membership)
  }

  if (filters.status) {
    filtered = filtered.filter(student => student.status === filters.status)
  }

  return filtered
})

const stats = computed(() => {
  const total = students.value.length
  const active = students.value.filter(s => s.status === 'active').length
  const inactive = students.value.filter(s => s.status === 'inactive').length
  const suspended = students.value.filter(s => s.status === 'suspended').length

  // Calculate new students this month
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = students.value.filter(s =>
      s.joinDate && new Date(s.joinDate) >= thisMonth
  ).length

  return {
    totalStudents: total,
    activeStudents: active,
    inactiveStudents: inactive,
    suspendedStudents: suspended,
    newThisMonth
  }
})

const totalBalance = computed(() => {
  return students.value.reduce((sum, student) => sum + (student.balance || 0), 0)
})

// Utility functions
const getCurrentDate = () => {
  const now = new Date()
  return now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDate = (date: any) => {
  if (!date) return '-'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('tr-TR')
}

const getMembershipColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'basic': 'info',
    'premium': 'warning',
    'vip': 'error',
    'private_1_45': 'purple',
    'private_2_60': 'purple',
    'private_group_3_8': 'indigo',
    'private_group_4_8': 'indigo',
    'private_package_1_8': 'deep-purple',
    'private_package_2_8': 'deep-purple',
    'adult_group': 'teal',
    'tennis_school_age': 'orange',
    'tennis_school_performance': 'red'
  }
  return colors[type] || 'grey'
}

const getMembershipDisplayName = (type: string) => {
  const texts: { [key: string]: string } = {
    'basic': 'Temel',
    'premium': 'Premium',
    'vip': 'VIP',
    'private_1_45': 'Özel Ders 1 Kişi (45dk)',
    'private_2_60': 'Özel Ders 2 Kişi (60dk)',
    'private_group_3_8': 'Özel Grup 3 Kişi (8ders)',
    'private_group_4_8': 'Özel Grup 4 Kişi (8ders)',
    'private_package_1_8': 'Özel Paket 1 Kişi (8ders)',
    'private_package_2_8': 'Özel Paket 2 Kişi (8ders)',
    'adult_group': 'Yetişkin Grup',
    'tennis_school_age': 'Tenis Okulu Yaş Grubu',
    'tennis_school_performance': 'Tenis Okulu Performans'
  }
  return texts[type] || type || 'Belirtilmemiş'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'grey'
    case 'suspended': return 'error'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return 'mdi-check-circle'
    case 'inactive': return 'mdi-pause-circle'
    case 'suspended': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
}

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif'
    case 'inactive': return 'Pasif'
    case 'suspended': return 'Askıda'
    default: return status
  }
}

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-success'
  if (balance < 0) return 'text-error'
  return 'text-grey-600'
}

// Fetch students from Firebase (ORİJİNAL KOD KORUNDU)
const fetchStudents = async () => {
  loading.value = true

  try {
    console.log('🔍 Firebase\'den öğrenciler getiriliyor...')

    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'student'))

    const querySnapshot = await getDocs(q)
    const fetchedStudents: Student[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('📄 Öğrenci verisi:', data)

      const student: Student = {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        membershipType: data.membershipType || 'basic',
        status: data.status || 'active',
        joinDate: data.createdAt?.toDate() || new Date(),
        balance: data.balance || 0,
        notes: data.notes || '',
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate()
      }

      fetchedStudents.push(student)
    })

    fetchedStudents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    students.value = fetchedStudents
    console.log(`✅ ${fetchedStudents.length} öğrenci başarıyla yüklendi`)

    if (fetchedStudents.length === 0) {
      successMessage.value = 'Henüz kayıtlı öğrenci bulunmuyor'
      successSnackbar.value = true
    }

  } catch (error: any) {
    console.error('❌ Öğrencileri yükleme hatası:', error)
    successMessage.value = 'Öğrenciler yüklenirken hata oluştu: ' + error.message
    successSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const viewStudentDetails = (student: Student) => {
  console.log('Öğrenci detayları görüntüle:', student)
  selectedStudent.value = student
  showStudentDetailsDialog.value = true
  isEditMode.value = false
}

const toggleEditMode = () => {
  if (!isEditMode.value && selectedStudent.value) {
    // Düzenleme moduna geçerken formu doldur
    editForm.value = {
      firstName: selectedStudent.value.firstName,
      lastName: selectedStudent.value.lastName,
      email: selectedStudent.value.email,
      phone: selectedStudent.value.phone,
      address: selectedStudent.value.address,
      emergencyContact: selectedStudent.value.emergencyContact,
      membershipType: selectedStudent.value.membershipType,
      status: selectedStudent.value.status,
      balance: selectedStudent.value.balance,
      notes: selectedStudent.value.notes || ''
    }
  }
  isEditMode.value = !isEditMode.value
}

const cancelEdit = () => {
  isEditMode.value = false
  // Form verilerini sıfırla
  editForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    membershipType: '',
    status: 'active',
    balance: 0,
    notes: ''
  }
}

const saveStudentChanges = async () => {
  if (!selectedStudent.value) return

  savingChanges.value = true

  try {
    console.log('💾 Öğrenci bilgileri kaydediliyor...', editForm.value)

    // Firebase'de güncelleme yap
    const userDocRef = doc(db, 'users', selectedStudent.value.id)

    await updateDoc(userDocRef, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone,
      address: editForm.value.address,
      emergencyContact: editForm.value.emergencyContact,
      membershipType: editForm.value.membershipType,
      status: editForm.value.status,
      balance: editForm.value.balance,
      notes: editForm.value.notes,
      updatedAt: serverTimestamp()
    })

    console.log('✅ Firebase güncellendi')

    // Öğrenci bilgilerini güncelle - tip güvenli şekilde
    const updatedStudent: Student = {
      ...selectedStudent.value,
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone,
      address: editForm.value.address,
      emergencyContact: editForm.value.emergencyContact,
      membershipType: editForm.value.membershipType,
      status: editForm.value.status as 'active' | 'inactive' | 'suspended',
      balance: editForm.value.balance,
      notes: editForm.value.notes,
      updatedAt: new Date()
    }

    // Local state'i güncelle
    const index = students.value.findIndex(s => s.id === selectedStudent.value!.id)
    if (index > -1) {
      students.value[index] = updatedStudent
      selectedStudent.value = updatedStudent
    }

    isEditMode.value = false
    successMessage.value = `${updatedStudent.firstName} ${updatedStudent.lastName} bilgileri başarıyla güncellendi`
    successSnackbar.value = true

    console.log('✅ Local state güncellendi')

  } catch (error: any) {
    console.error('❌ Öğrenci güncellerken hata:', error)
    successMessage.value = 'Güncelleme sırasında hata oluştu: ' + error.message
    successSnackbar.value = true
  } finally {
    savingChanges.value = false
  }
}

const sendMessage = (student: Student) => {
  console.log('Mesaj gönder:', student)
  successMessage.value = `${student.firstName} ${student.lastName} adlı öğrenciye mesaj gönderildi`
  successSnackbar.value = true
}

const suspendStudent = (student: Student) => {
  student.status = 'suspended'
  successMessage.value = `${student.firstName} ${student.lastName} askıya alındı`
  successSnackbar.value = true
}

const viewAttendance = (student: Student) => {
  console.log('Devam durumunu görüntüle:', student)
  successMessage.value = `${student.firstName} ${student.lastName} devam durumu görüntüleniyor`
  successSnackbar.value = true
}

const deleteStudent = (student: Student) => {
  const index = students.value.findIndex(s => s.id === student.id)
  if (index > -1) {
    students.value.splice(index, 1)
    successMessage.value = `${student.firstName} ${student.lastName} başarıyla silindi`
    successSnackbar.value = true
    showStudentDetailsDialog.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchStudents()
})
</script>