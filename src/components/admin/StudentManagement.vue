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
                      <!-- Grup bilgisi gösterimi -->
                      <div v-if="isGroupMembership(selectedStudent?.membershipType) && selectedStudent?.groupAssignment" class="info-item mb-3">
                        <label class="info-label">Grup:</label>
                        <v-chip
                            color="purple"
                            variant="flat"
                            size="small"
                            class="font-weight-bold"
                        >
                          <v-icon start size="16">mdi-account-group</v-icon>
                          {{ getGroupDisplayName(selectedStudent?.membershipType, selectedStudent?.groupAssignment) }}
                        </v-chip>
                      </div>
                      <!-- Grup programı gösterimi -->
                      <div v-if="isGroupMembership(selectedStudent?.membershipType) && selectedStudent?.groupSchedule?.weeklyPlan?.length" class="info-item mb-3">
                        <label class="info-label">Haftalık Program:</label>
                        <div class="mt-2">
                          <v-chip
                              v-for="(plan, index) in selectedStudent.groupSchedule.weeklyPlan"
                              :key="index"
                              color="indigo"
                              variant="flat"
                              size="small"
                              class="mr-2 mb-2"
                          >
                            <v-icon start size="16">mdi-calendar-clock</v-icon>
                            {{ getDayDisplayName(plan.day) }} {{ plan.time }} - {{ getCourtDisplayName(plan.court) }}
                          </v-chip>
                        </div>
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
                          @update:model-value="onMembershipTypeChange"
                      />
                      <!-- Grup seçimi - sadece grup üyeliklerinde göster -->
                      <v-select
                          v-if="isGroupMembership(editForm.membershipType)"
                          v-model="editForm.groupAssignment"
                          label="Grup Seçimi"
                          :items="getGroupOptions(editForm.membershipType)"
                          variant="outlined"
                          density="compact"
                          class="mb-3"
                          clearable
                          placeholder="Grup seçiniz"
                      >
                        <template #prepend-inner>
                          <v-icon color="purple">mdi-account-group</v-icon>
                        </template>
                      </v-select>

                      <!-- Haftalık program düzenleyici -->
                      <div v-if="isGroupMembership(editForm.membershipType) && editForm.groupAssignment">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <label class="text-subtitle-1 font-weight-medium">Haftalık Program</label>
                          <v-btn
                              size="small"
                              color="primary"
                              variant="tonal"
                              @click="addDayToPlan"
                              prepend-icon="mdi-plus"
                          >
                            Gün Ekle
                          </v-btn>
                        </div>

                        <!-- Her gün için ayrı seçim -->
                        <v-card
                            v-for="(dayPlan, index) in editForm.weeklyPlan"
                            :key="index"
                            class="mb-3 pa-3"
                            variant="outlined"
                        >
                          <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-subtitle-2 font-weight-medium">{{ index + 1 }}. Ders Günü</span>
                            <v-btn
                                size="x-small"
                                color="error"
                                variant="text"
                                icon="mdi-delete"
                                @click="removeDayFromPlan(index)"
                            />
                          </div>

                          <v-row dense>
                            <!-- Gün seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.day"
                                  label="Gün"
                                  :items="dayOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Gün seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="blue" size="16">mdi-calendar</v-icon>
                                </template>
                              </v-select>
                            </v-col>

                            <!-- Saat seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.time"
                                  label="Saat"
                                  :items="timeOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Saat seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="green" size="16">mdi-clock</v-icon>
                                </template>
                              </v-select>
                            </v-col>

                            <!-- Kort seçimi -->
                            <v-col cols="12">
                              <v-select
                                  v-model="dayPlan.court"
                                  label="Kort"
                                  :items="courtOptions"
                                  variant="outlined"
                                  density="compact"
                                  placeholder="Kort seçiniz"
                              >
                                <template #prepend-inner>
                                  <v-icon color="orange" size="16">mdi-tennis-ball</v-icon>
                                </template>
                              </v-select>
                            </v-col>
                          </v-row>

                          <!-- Seçim özeti -->
                          <div v-if="dayPlan.day && dayPlan.time && dayPlan.court" class="mt-2">
                            <v-chip color="success" size="small" variant="flat">
                              <v-icon start size="16">mdi-check</v-icon>
                              {{ getDayDisplayName(dayPlan.day) }} {{ dayPlan.time }} - {{ getCourtDisplayName(dayPlan.court) }}
                            </v-chip>
                          </div>
                        </v-card>

                        <!-- Program özeti -->
                        <div v-if="editForm.weeklyPlan.length > 0" class="my-3">
                          <v-alert
                              color="info"
                              variant="tonal"
                              density="compact"
                              icon="mdi-information"
                          >
                            <strong>Program Özeti:</strong><br>
                            {{ getWeeklyPlanDisplay(editForm.weeklyPlan.filter(p => p.day && p.time && p.court)) }}
                          </v-alert>
                        </div>
                      </div>
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
import { collection,deleteDoc, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp, addDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'


interface WeeklyPlan {
  day: string
  time: string
  court: string
}
// Define student interface - groupAssignment alanı eklendi
interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  emergencyContact: string
  membershipType: string
  groupAssignment?: string
  groupSchedule?: {
    weeklyPlan: Array<{
      day: string
      time: string
      court: string
    }>
  }
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

// Edit form - groupAssignment alanı eklendi
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  emergencyContact: '',
  membershipType: '',
  groupAssignment: '',
  weeklyPlan: [] as WeeklyPlan[],
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

// Options
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

// Hafta günleri seçenekleri
const dayOptions = [
  { title: 'Pazartesi', value: 'monday' },
  { title: 'Salı', value: 'tuesday' },
  { title: 'Çarşamba', value: 'wednesday' },
  { title: 'Perşembe', value: 'thursday' },
  { title: 'Cuma', value: 'friday' },
  { title: 'Cumartesi', value: 'saturday' },
  { title: 'Pazar', value: 'sunday' }
]

// Saat seçenekleri
const timeOptions = [
  { title: '09:00', value: '09:00' },
  { title: '10:00', value: '10:00' },
  { title: '11:00', value: '11:00' },
  { title: '12:00', value: '12:00' },
  { title: '13:00', value: '13:00' },
  { title: '14:00', value: '14:00' },
  { title: '15:00', value: '15:00' },
  { title: '16:00', value: '16:00' },
  { title: '17:00', value: '17:00' },
  { title: '18:00', value: '18:00' },
  { title: '19:00', value: '19:00' },
  { title: '20:00', value: '20:00' },
  { title: '21:00', value: '21:00' }
]

// Kort seçenekleri
const courtOptions = [
  { title: 'Kort 1', value: 'court-1' },
  { title: 'Kort 2', value: 'court-2' },
  { title: 'Kort 3', value: 'court-3' }
]

// Grup üyelik türlerini kontrol eden fonksiyon
const isGroupMembership = (membershipType: string): boolean => {
  const groupMemberships = [
    'private_group_3_8',
    'private_group_4_8',
    'adult_group',
    'tennis_school_age',
    'tennis_school_performance'
  ]
  return groupMemberships.includes(membershipType)
}

// Grup seçeneklerini dinamik olarak oluşturan fonksiyon
const getGroupOptions = (membershipType: string) => {
  if (!isGroupMembership(membershipType)) return []

  const groups = []
  let maxGroups = 10
  let groupSize = ''

  switch (membershipType) {
    case 'private_group_3_8':
      groupSize = '3 Kişilik Grup'
      break
    case 'private_group_4_8':
      groupSize = '4 Kişilik Grup'
      break
    case 'adult_group':
      groupSize = 'Yetişkin Grup'
      maxGroups = 5
      break
    case 'tennis_school_age':
      groupSize = 'Yaş Grubu'
      maxGroups = 8
      break
    case 'tennis_school_performance':
      groupSize = 'Performans Grubu'
      maxGroups = 6
      break
    default:
      groupSize = 'Grup'
  }

  for (let i = 1; i <= maxGroups; i++) {
    groups.push({
      title: `${groupSize} - ${i}`,
      value: `group_${i}`
    })
  }

  return groups
}

// Grup görüntü adını getiren fonksiyon
const getGroupDisplayName = (membershipType: string, groupAssignment: string): string => {
  if (!groupAssignment) return ''

  const groupNumber = groupAssignment.replace('group_', '')

  switch (membershipType) {
    case 'private_group_3_8':
      return `3 Kişilik Grup - ${groupNumber}`
    case 'private_group_4_8':
      return `4 Kişilik Grup - ${groupNumber}`
    case 'adult_group':
      return `Yetişkin Grup - ${groupNumber}`
    case 'tennis_school_age':
      return `Yaş Grubu - ${groupNumber}`
    case 'tennis_school_performance':
      return `Performans Grubu - ${groupNumber}`
    default:
      return `Grup - ${groupNumber}`
  }
}

// Üyelik türü değiştiğinde grup atamasını sıfırla
const onMembershipTypeChange = () => {
  if (!isGroupMembership(editForm.value.membershipType)) {
    editForm.value.groupAssignment = ''
    editForm.value.weeklyPlan = []
  }
}

// Günlük program yönetimi
const addDayToPlan = () => {
  editForm.value.weeklyPlan.push({
    day: '',
    time: '',
    court: ''
  })
}

const removeDayFromPlan = async (index: number) => {
  if (!selectedStudent.value) return

  const removedPlan = editForm.value.weeklyPlan[index]
  editForm.value.weeklyPlan.splice(index, 1)

  // Eğer kayıtlı bir öğrenciyse ve silinen planın gün/zaman/kort bilgisi varsa
  if (selectedStudent.value.id && removedPlan.day && removedPlan.time && removedPlan.court) {
    try {
      // 1. İlgili rezervasyonları sil
      const reservationsRef = collection(db, 'reservations')
      const q = query(
          reservationsRef,
          where('studentId', '==', selectedStudent.value.id),
          where('groupSchedule', '==', true),
          where('courtId', '==', removedPlan.court),
          where('startTime', '==', removedPlan.time)
      )

      const querySnapshot = await getDocs(q)
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // 2. Court schedule'ı güncelle
      const courtId = convertCourtIdToScheduleFormat(removedPlan.court)
      const dateStrings = getReservationDateStrings(selectedStudent.value.joinDate, removedPlan.day)

      const scheduleUpdates = dateStrings.map(async dateString => {
        const docRef = doc(db, 'courtSchedule', dateString)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const schedule = docSnap.data().schedule || {}
          if (schedule[courtId] && schedule[courtId][removedPlan.time] === 'occupied') {
            schedule[courtId][removedPlan.time] = 'available'
            await setDoc(docRef, {
              schedule: schedule,
              lastUpdated: new Date(),
              updatedBy: 'manual-delete'
            })
          }
        }
      })

      await Promise.all(scheduleUpdates)

      console.log('✅ Silinen plan için rezervasyonlar ve court schedule güncellendi')
    } catch (error) {
      console.error('❌ Rezervasyon silinirken hata:', error)
    }
  }
}

// Yardımcı fonksiyon: Tarih string'lerini getir
const getReservationDateStrings = (joinDate: Date, dayOfWeek: string) => {
  const dates = getReservationDatesForDay(
      new Date(joinDate),
      new Date(),
      dayOfWeek
  )
  return dates.map(date => date.toISOString().split('T')[0])
}

// Gün isimlerini Türkçe olarak getiren fonksiyon
const getDayDisplayName = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    'monday': 'Pazartesi',
    'tuesday': 'Salı',
    'wednesday': 'Çarşamba',
    'thursday': 'Perşembe',
    'friday': 'Cuma',
    'saturday': 'Cumartesi',
    'sunday': 'Pazar'
  }
  return dayMap[day] || day
}

// Kort isimlerini görüntüleme fonksiyonu
const getCourtDisplayName = (court: string): string => {
  const courtMap: { [key: string]: string } = {
    'court-1': 'Kort 1',
    'court-2': 'Kort 2',
    'court-3': 'Kort 3'
  }
  return courtMap[court] || court
}

// Haftalık programı string olarak gösterme
const getWeeklyPlanDisplay = (weeklyPlan: Array<{day: string, time: string, court: string}>): string => {
  if (!weeklyPlan || weeklyPlan.length === 0) return 'Program belirlenmemiş'

  return weeklyPlan.map(plan =>
      `${getDayDisplayName(plan.day)} ${plan.time} - ${getCourtDisplayName(plan.court)}`
  ).join(', ')
}

// Computed properties
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

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = students.value.filter(s =>
      s.joinDate && new Date(s.joinDate) >= thisMonth
  ).length

  return {
    totalStudents: total,
    activeStudents: active,
    inactiveStudents: inactive,
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

// Rezervasyon oluşturma fonksiyonları
const createGroupReservations = async (student: Student, weeklyPlan: WeeklyPlan[]): Promise<void> => {
  try {
    const today = new Date()
    const endDate = new Date()
    endDate.setMonth(today.getMonth() + 3) // 3 ay ileri

    for (const plan of weeklyPlan) {
      const dates = getReservationDatesForDay(new Date(student.joinDate), endDate, plan.day)
      const courtId = convertCourtIdToScheduleFormat(plan.court)

      await Promise.all(dates.map(async date => {
        const reservationData = {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          courtId: plan.court,
          courtName: `Kort ${plan.court.split('-')[1]}`,
          date,
          startTime: plan.time,
          endTime: `${parseInt(plan.time.split(':')[0]) + 1}:00`,
          duration: 60,
          type: 'group-lesson',
          status: 'confirmed',
          groupId: student.groupAssignment,
          membershipType: student.membershipType,
          groupSchedule: true,
          createdAt: new Date()
        }

        await addDoc(collection(db, 'reservations'), reservationData)

        // Court schedule'ı güncelle
        const dateString = date.toISOString().split('T')[0]
        const docRef = doc(db, 'courtSchedule', dateString)
        const docSnap = await getDoc(docRef)

        const schedule = docSnap.exists() ? docSnap.data().schedule || {} : {}
        if (!schedule[courtId]) schedule[courtId] = {}

        schedule[courtId][plan.time] = 'occupied'

        await setDoc(docRef, {
          schedule,
          lastUpdated: new Date(),
          updatedBy: 'system-reservation'
        })
      }))
    }
  } catch (error) {
    console.error('Rezervasyon oluşturma hatası:', error)
    throw error
  }
}
const deleteGroupReservations = async (student: Student) => {
  if (!student.groupSchedule?.weeklyPlan || student.groupSchedule.weeklyPlan.length === 0) {
    return
  }

  try {
    console.log('🗑️ Grup rezervasyonları siliniyor...', { student: student.id })

    // Rezervasyonları sil
    const reservationsRef = collection(db, 'reservations')
    const q = query(
        reservationsRef,
        where('studentId', '==', student.id),
        where('groupSchedule', '==', true)
    )

    const querySnapshot = await getDocs(q)
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
      console.log(`✅ Rezervasyon silindi: ${doc.id}`)
    })

    // Court schedule'dan ilgili slotları temizle
    await clearCourtScheduleSlots(student)

    console.log('✅ Tüm grup rezervasyonları başarıyla silindi')

  } catch (error) {
    console.error('❌ Grup rezervasyonları silinirken hata:', error)
    throw error
  }
}

const clearCourtScheduleSlots = async (student: Student) => {
  if (!student.groupSchedule?.weeklyPlan) return

  try {
    console.log('🔄 Court schedule güncelleniyor...')

    // Haftalık plana göre tüm tarihleri işle
    for (const plan of student.groupSchedule.weeklyPlan) {
      if (plan.day && plan.time && plan.court) {
        const reservationDates = getReservationDatesForDay(
            new Date(student.joinDate),
            new Date(),
            plan.day
        )

        for (const date of reservationDates) {
          const dateString = date.toISOString().split('T')[0]
          const docRef = doc(db, 'courtSchedule', dateString)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const schedule = docSnap.data().schedule || {}
            const courtId = convertCourtIdToScheduleFormat(plan.court)

            if (schedule[courtId] && schedule[courtId][plan.time] === 'occupied') {
              schedule[courtId][plan.time] = 'available'

              await setDoc(docRef, {
                schedule: schedule,
                lastUpdated: new Date(),
                updatedBy: 'group-lesson-auto-delete'
              })

              console.log(`✅ Court schedule güncellendi: ${dateString} ${courtId} ${plan.time}`)
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Court schedule güncellerken hata:', error)
  }
}
// Yardımcı fonksiyonlar
const getReservationDatesForDay = (startDate: Date, endDate: Date, dayName: string): Date[] => {
  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }

  const targetDay = dayMap[dayName.toLowerCase()]
  if (targetDay === undefined) return []

  const current = new Date(startDate)
  const dates: Date[] = []

  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }

  return dates
}

const convertCourtIdToReservationFormat = (courtId: string): string => {
  const mapping: { [key: string]: string } = {
    'court-1': 'court-1',
    'court-2': 'court-2',
    'court-3': 'court-3'
  }
  return mapping[courtId] || courtId
}

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + 1
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const updateCourtScheduleForReservation = async (date: Date, courtId: string, timeSlot: string) => {
  try {
    const dateString = date.toISOString().split('T')[0]
    const docRef = doc(db, 'courtSchedule', dateString)

    const docSnap = await getDoc(docRef)
    let schedule: any = {}

    if (docSnap.exists()) {
      schedule = docSnap.data().schedule || {}
    }

    const courtScheduleId = convertCourtIdToScheduleFormat(courtId)

    if (!schedule[courtScheduleId]) {
      schedule[courtScheduleId] = {}
    }

    schedule[courtScheduleId][timeSlot] = 'occupied'

    await setDoc(docRef, {
      schedule: schedule,
      lastUpdated: new Date(),
      updatedBy: 'group-lesson-auto'
    })

    console.log(`✅ Court schedule güncellendi: ${dateString} ${courtScheduleId} ${timeSlot}`)

  } catch (error) {
    console.error('❌ Court schedule güncellerken hata:', error)
  }
}

const convertCourtIdToScheduleFormat = (courtId: string): string => {
  const mapping: { [key: string]: string } = {
    'court-1': 'K1',
    'court-2': 'K2',
    'court-3': 'K3'
  }
  return mapping[courtId] || courtId
}

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
        groupAssignment: data.groupAssignment || '',
        groupSchedule: data.groupSchedule || undefined,
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
    editForm.value = {
      firstName: selectedStudent.value.firstName,
      lastName: selectedStudent.value.lastName,
      email: selectedStudent.value.email,
      phone: selectedStudent.value.phone,
      address: selectedStudent.value.address,
      emergencyContact: selectedStudent.value.emergencyContact,
      membershipType: selectedStudent.value.membershipType,
      groupAssignment: selectedStudent.value.groupAssignment || '',
      weeklyPlan: selectedStudent.value.groupSchedule?.weeklyPlan || [],
      status: selectedStudent.value.status,
      balance: selectedStudent.value.balance,
      notes: selectedStudent.value.notes || ''
    }
  }
  isEditMode.value = !isEditMode.value
}

const cancelEdit = () => {
  isEditMode.value = false
  editForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    membershipType: '',
    groupAssignment: '',
    weeklyPlan: [],
    status: 'active',
    balance: 0,
    notes: ''
  }
}

const saveStudentChanges = async (): Promise<void> => {
  if (!selectedStudent.value) return

  savingChanges.value = true

  try {
    const studentId = selectedStudent.value.id
    const validWeeklyPlan = editForm.value.weeklyPlan.filter(p => p.day && p.time && p.court)
    const isGroup = isGroupMembership(editForm.value.membershipType)
    const groupAssignment:any = isGroup ? editForm.value.groupAssignment : null
    const groupSchedule:any = isGroup && groupAssignment ? { weeklyPlan: validWeeklyPlan } : null

    // Eski ve yeni verileri karşılaştır
    const oldStudent = selectedStudent.value
    const hadGroup = oldStudent.groupAssignment
    const hasGroup = groupAssignment
    const groupChanged = hadGroup && hasGroup &&
        (groupAssignment !== oldStudent.groupAssignment ||
            JSON.stringify(validWeeklyPlan) !== JSON.stringify(oldStudent.groupSchedule?.weeklyPlan || []))

    // 1. Grup kaldırıldıysa veya değiştirildiyse eski rezervasyonları sil
    if ((hadGroup && !hasGroup) || groupChanged) {
      if (oldStudent.groupSchedule?.weeklyPlan) {
        await Promise.all(
            oldStudent.groupSchedule.weeklyPlan.map(plan =>
                deleteReservationsForPlan(studentId, plan, oldStudent.joinDate)
            )
        )
      }
    }
    // 2. Silinen planları temizle (grup aynı kalsa bile)
    if (hadGroup && hasGroup && oldStudent.groupSchedule?.weeklyPlan) {
      const removedPlans = oldStudent.groupSchedule.weeklyPlan.filter(oldPlan =>
          !validWeeklyPlan.some(newPlan =>
              newPlan.day === oldPlan.day &&
              newPlan.time === oldPlan.time &&
              newPlan.court === oldPlan.court
          )
      )

      await Promise.all(
          removedPlans.map(plan =>
              deleteReservationsForPlan(studentId, plan, oldStudent.joinDate)
          )
      )
    }

    // 3. Öğrenci bilgilerini güncelle
    const userDocRef = doc(db, 'users', studentId)
    await updateDoc(userDocRef, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone,
      address: editForm.value.address,
      emergencyContact: editForm.value.emergencyContact,
      membershipType: editForm.value.membershipType,
      groupAssignment,
      groupSchedule,
      status: editForm.value.status,
      balance: editForm.value.balance,
      notes: editForm.value.notes,
      updatedAt: serverTimestamp()
    })

    // 4. Yeni grup rezervasyonları oluştur
    if (groupSchedule && validWeeklyPlan.length > 0) {
      await createGroupReservations({
        ...oldStudent,
        groupAssignment,
        groupSchedule
      }, validWeeklyPlan)
    }

    // 5. Local state'i güncelle
    const index = students.value.findIndex(s => s.id === studentId)
    if (index > -1) {
      students.value[index] = {
        ...oldStudent,
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        email: editForm.value.email,
        phone: editForm.value.phone,
        address: editForm.value.address,
        emergencyContact: editForm.value.emergencyContact,
        membershipType: editForm.value.membershipType,
        groupAssignment,
        groupSchedule,
        status: editForm.value.status as 'active' | 'inactive' | 'suspended',
        balance: editForm.value.balance,
        notes: editForm.value.notes,
        updatedAt: new Date()
      }
    }

    isEditMode.value = false
  } catch (error) {
    console.error('Öğrenci güncelleme hatası:', error)
    throw error
  } finally {
    savingChanges.value = false
  }
}

// Yardımcı fonksiyon: Belirli bir plan için rezervasyonları sil
const deleteReservationsForPlan = async (studentId: string, plan: WeeklyPlan, joinDate: Date): Promise<void> => {
  try {
    // 1. Rezervasyonları sil
    const reservationsRef = collection(db, 'reservations')
    const q = query(
        reservationsRef,
        where('studentId', '==', studentId),
        where('groupSchedule', '==', true),
        where('courtId', '==', plan.court),
        where('startTime', '==', plan.time)
    )

    const querySnapshot = await getDocs(q)
    await Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)))

    // 2. Court schedule'ı güncelle
    const courtId = convertCourtIdToScheduleFormat(plan.court)
    const today = new Date()
    const dates = getReservationDatesForDay(new Date(joinDate), today, plan.day)

    await Promise.all(dates.map(async date => {
      const dateString = date.toISOString().split('T')[0]
      const docRef = doc(db, 'courtSchedule', dateString)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const schedule = docSnap.data().schedule || {}
        if (schedule[courtId]?.[plan.time] === 'occupied') {
          schedule[courtId][plan.time] = 'available'
          await setDoc(docRef, {
            schedule,
            lastUpdated: new Date(),
            updatedBy: 'system-cleanup'
          })
        }
      }
    }))

    console.log(`✅ Silinen plan için temizlik yapıldı: ${plan.day} ${plan.time} ${plan.court}`)
  } catch (error) {
    console.error(`❌ Plan temizliği hatası:`, error)
    throw error
  }
}


// Kullanım örneği (saveStudentChanges içinde):


const deleteStudent = async (student: Student): Promise<void> => {
  try {
    // 1. Rezervasyonları sil
    if (student.groupSchedule?.weeklyPlan) {
      await Promise.all(
          student.groupSchedule.weeklyPlan.map(plan =>
              deleteReservationsForPlan(student.id, plan, student.joinDate)
          )
      )
    }

    // 2. Öğrenciyi sil
    await deleteDoc(doc(db, 'users', student.id))

    // 3. Local state'i güncelle
    students.value = students.value.filter(s => s.id !== student.id)
    showStudentDetailsDialog.value = false
  } catch (error) {
    console.error('Öğrenci silme hatası:', error)
    throw error
  }
}

// Lifecycle
onMounted(() => {
  fetchStudents()
})
</script>