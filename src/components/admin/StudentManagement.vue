<template>
  <div class="student-management">
    <!-- Header Section -->
    <div class="management-header mb-6">
      <v-row align="center">
        <v-col cols="12">
          <h2 class="text-h4 font-weight-bold text-white">
            <v-icon icon="mdi-account-group" class="mr-2" />
            Öğrenci Yönetimi
          </h2>
          <p class="text-body-1 text-white mt-2 opacity-90">
            Öğrenci profillerini, üyeliklerini ve hesap bilgilerini yönetin
          </p>
        </v-col>
      </v-row>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="6">
        <v-card class="stat-card" elevation="4" color="primary">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-multiple</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.totalStudents }}</h3>
            <p class="text-body-1">Toplam Öğrenci</p>
            <v-chip size="small" color="white" variant="flat" class="mt-2">
              <v-icon start size="16">mdi-trending-up</v-icon>
              +{{ stats.newThisMonth }} bu ay
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="6">
        <v-card class="stat-card" elevation="4" color="success">
          <v-card-text class="text-center pa-6 text-white">
            <v-icon size="48" class="mb-3">mdi-account-check</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ stats.activeStudents }}</h3>
            <p class="text-body-1">Aktif Öğrenci</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions & Filters -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="pa-6 bg-primary text-white">
        <v-icon icon="mdi-filter" class="mr-2" />
        Filtreler
      </v-card-title>
      <v-card-text class="pa-6">
        <v-row>
          <!-- Filters -->
          <v-col cols="12" md="4">
            <v-text-field
                v-model="filters.search"
                label="Öğrenci Ara"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                density="compact"
                clearable
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
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Students Table -->
    <v-card elevation="4">
      <v-card-title class="pa-6 bg-success text-white d-flex justify-space-between">
        <div>
          <v-icon icon="mdi-table" class="mr-2" />
          Öğrenci Listesi
        </div>
        <v-chip color="white" variant="flat">
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
        >
          <template #item.student="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="40" class="mr-3" :color="getStudentColor(item.id)">
                <span class="text-white font-weight-bold">
                  {{ getInitials(item.firstName + ' ' + item.lastName) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">
                  {{ item.firstName }} {{ item.lastName }}
                </div>
                <div class="text-caption text-grey">{{ item.email }}</div>
              </div>
            </div>
          </template>

          <template #item.membership="{ item }">
            <v-chip
                :color="getMembershipColor(item.membershipType)"
                size="small"
                variant="flat"
            >
              {{ getMembershipText(item.membershipType) }}
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template #item.joinDate="{ item }">
            {{ formatDate(item.joinDate) }}
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip text="Profili Görüntüle">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-eye"
                      size="small"
                      color="info"
                      variant="text"
                      v-bind="props"
                      @click="viewStudent(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip text="Mesaj Gönder">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-message"
                      size="small"
                      color="success"
                      variant="text"
                      v-bind="props"
                      @click="sendMessage(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip text="Öğrenciyi Sil">
                <template #activator="{ props }">
                  <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      v-bind="props"
                      @click="deleteStudent(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Student Details Dialog -->
    <v-dialog v-model="showStudentDetailsDialog" max-width="900">
      <v-card v-if="selectedStudent">
        <v-card-title class="pa-6 bg-primary text-white">
          <v-avatar size="40" class="mr-3" :color="getStudentColor(selectedStudent.id)">
            <span class="text-white font-weight-bold">
              {{ getInitials(selectedStudent.firstName + ' ' + selectedStudent.lastName) }}
            </span>
          </v-avatar>
          {{ selectedStudent.firstName }} {{ selectedStudent.lastName }}
          <v-spacer />
          <v-btn
              icon="mdi-pencil"
              variant="text"
              color="white"
              @click="toggleEditMode"
          >
            <v-tooltip activator="parent" location="bottom">
              {{ isEditMode ? 'Görüntüleme Modu' : 'Düzenleme Modu' }}
            </v-tooltip>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-4">Kişisel Bilgiler</h3>

              <div v-if="!isEditMode">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Ad:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.firstName }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Soyad:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.lastName }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>E-posta:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.email }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Telefon:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.phone }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Adres:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.address }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Acil Durum İletişim:</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedStudent.emergencyContact }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
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
                    type="email"
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
            </v-col>

            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-4">Üyelik Detayları</h3>

              <div v-if="!isEditMode">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Üyelik Türü:</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getMembershipColor(selectedStudent.membershipType)" size="small">
                        {{ getMembershipText(selectedStudent.membershipType) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Durum:</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getStatusColor(selectedStudent.status)" size="small">
                        {{ getStatusText(selectedStudent.status) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Bakiye:</v-list-item-title>
                    <v-list-item-subtitle>
                      <span :class="selectedStudent.balance < 0 ? 'text-error' : 'text-success'" class="font-weight-bold">
                        ₺{{ Math.abs(selectedStudent.balance) }}{{ selectedStudent.balance < 0 ? ' (borç)' : '' }}
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Kayıt Tarihi:</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(selectedStudent.joinDate) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <div v-else>
                <v-select
                    v-model="editForm.membershipType"
                    label="Üyelik Türü"
                    :items="membershipTypeOptions"
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
                    v-model.number="editForm.balance"
                    label="Bakiye (₺)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    class="mb-3"
                />
                <v-textarea
                    v-model="editForm.notes"
                    label="Notlar"
                    variant="outlined"
                    density="compact"
                    rows="3"
                    placeholder="Öğrenci hakkında notlar..."
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6">
          <div v-if="!isEditMode" class="d-flex w-100">
            <v-btn color="primary" @click="toggleEditMode">
              <v-icon icon="mdi-pencil" class="mr-1" />
              Düzenle
            </v-btn>
            <v-btn color="success" @click="sendMessage(selectedStudent)">
              <v-icon icon="mdi-message" class="mr-1" />
              Mesaj
            </v-btn>
            <v-spacer />
            <v-btn @click="showStudentDetailsDialog = false">Kapat</v-btn>
          </div>

          <div v-else class="d-flex w-100">
            <v-btn color="success" @click="saveStudentChanges" :loading="savingChanges">
              <v-icon icon="mdi-check" class="mr-1" />
              Kaydet
            </v-btn>
            <v-btn color="grey" @click="cancelEdit">
              <v-icon icon="mdi-close" class="mr-1" />
              İptal
            </v-btn>
            <v-spacer />
            <v-btn color="error" @click="deleteStudent(selectedStudent)" variant="outlined">
              <v-icon icon="mdi-delete" class="mr-1" />
              Sil
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

// Data
const showStudentDetailsDialog = ref(false)
const loading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const itemsPerPage = ref(15)
const selectedStudent = ref<Student | null>(null)
const students = ref<Student[]>([])
const isEditMode = ref(false)
const savingChanges = ref(false)

// Edit form data
const editForm = ref<{
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  emergencyContact: string
  membershipType: string
  status: 'active' | 'inactive' | 'suspended'
  balance: number
  notes: string
}>({
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
})

// Stats
const stats = computed(() => ({
  totalStudents: students.value.length,
  newThisMonth: students.value.filter(s => {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    return s.createdAt >= thisMonth
  }).length,
  activeStudents: students.value.filter(s => s.status === 'active').length
}))

// Filters
const filters = reactive({
  search: '',
  membership: '',
  status: ''
})

// Options
const membershipTypes = [
  { title: 'Temel', value: 'basic' },
  { title: 'Premium', value: 'premium' },
  { title: 'VIP', value: 'vip' }
]

const membershipTypeOptions = [
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

// Table headers
const headers = [
  { title: 'Öğrenci', key: 'student', sortable: false },
  { title: 'Üyelik', key: 'membership', sortable: true },
  { title: 'Durum', key: 'status', sortable: true },
  { title: 'Kayıt Tarihi', key: 'joinDate', sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false }
]

// Fetch students from Firebase
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

// Computed
const filteredStudents = computed(() => {
  let filtered = students.value

  if (filters.search) {
    filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  if (filters.membership) {
    filtered = filtered.filter(student => student.membershipType === filters.membership)
  }

  if (filters.status) {
    filtered = filtered.filter(student => student.status === filters.status)
  }

  return filtered.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime())
})

// Methods
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getStudentColor = (studentId: string): string => {
  const colors = ['primary', 'success', 'warning', 'info', 'error', 'purple']
  const index = parseInt(studentId) % colors.length
  return colors[index]
}

const getMembershipColor = (membership: string): string => {
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
  return colors[membership] || 'grey'
}

const getMembershipText = (membership: string): string => {
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
  return texts[membership] || membership
}

const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    'active': 'success',
    'inactive': 'grey',
    'suspended': 'error'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status: string): string => {
  const texts: { [key: string]: string } = {
    'active': 'Aktif',
    'inactive': 'Pasif',
    'suspended': 'Askıda'
  }
  return texts[status] || status
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const viewStudent = (student: Student) => {
  selectedStudent.value = student
  isEditMode.value = false
  showStudentDetailsDialog.value = true
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

<style scoped>

</style>