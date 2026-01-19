<template>
  <div class="group-management">
    <v-container fluid>
      <!-- Header Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h2 class="text-h4 font-weight-bold mb-2">Grup Yönetimi</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                Grupları oluşturun, düzenleyin ve üyeleri yönetin
              </p>
            </div>
            <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-plus"
                @click="openAddGroupDialog"
            >
              Yeni Grup
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Groups Grid -->
      <v-row>
        <v-col
            v-for="group in groups"
            :key="group.id"
            cols="12"
            md="6"
            lg="4"
        >
          <v-card class="group-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <v-avatar
                    :color="getGroupColor(group.membershipType)"
                    size="40"
                    class="mr-3"
                >
                  <v-icon color="white">mdi-account-group</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">{{ group.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getMembershipTypeLabel(group.membershipType) }}
                  </div>
                </div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      v-bind="props"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="editGroup(group)">
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Düzenle</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteGroup(group)">
                    <template v-slot:prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title class="text-error">Sil</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
              <!-- Capacity Info -->
              <div class="mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-2">Kapasite</span>
                  <v-chip
                      :color="getCapacityColor(group)"
                      size="small"
                      variant="flat"
                  >
                    {{ group.members.length }} / {{ group.maxCapacity }}
                  </v-chip>
                </div>
                <v-progress-linear
                    :model-value="(group.members.length / group.maxCapacity) * 100"
                    :color="getCapacityColor(group)"
                    height="8"
                    rounded
                ></v-progress-linear>
              </div>

              <!-- Schedule -->
              <div class="mb-4" v-if="group.schedule && group.schedule.length > 0">
                <div class="text-body-2 font-weight-medium mb-2">Program</div>
                <v-chip
                    v-for="(sch, idx) in group.schedule"
                    :key="idx"
                    size="small"
                    class="mr-1 mb-1"
                    variant="outlined"
                >
                  <v-icon start size="small">mdi-calendar</v-icon>
                  {{ sch.day }} - {{ sch.time }}
                </v-chip>
              </div>

              <!-- Members Preview -->
              <div>
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-2 font-weight-medium">Üyeler</span>
                  <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      @click="openMembersDialog(group)"
                  >
                    Yönet
                  </v-btn>
                </div>
                <v-avatar-group v-if="group.members.length > 0">
                  <v-avatar
                      v-for="(member, idx) in group.members.slice(0, 4)"
                      :key="idx"
                      size="32"
                      :color="getAvatarColor(idx)"
                  >
                    <span class="text-caption">
                      {{ getInitials(member.name) }}
                    </span>
                  </v-avatar>
                  <v-avatar
                      v-if="group.members.length > 4"
                      size="32"
                      color="grey"
                  >
                    <span class="text-caption">+{{ group.members.length - 4 }}</span>
                  </v-avatar>
                </v-avatar-group>
                <div v-else class="text-caption text-medium-emphasis">
                  Henüz üye eklenmemiş
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-if="groups.length === 0">
        <v-col cols="12">
          <v-card class="text-center pa-8" elevation="0" variant="outlined">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-account-group-outline
            </v-icon>
            <h3 class="text-h6 mb-2">Henüz grup oluşturulmamış</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Yeni grup oluşturmak için yukarıdaki butona tıklayın
            </p>
            <v-btn color="primary" @click="openAddGroupDialog">
              İlk Grubu Oluştur
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Add/Edit Group Dialog -->
    <v-dialog v-model="groupDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ editingGroup ? 'Grup Düzenle' : 'Yeni Grup Ekle' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeGroupDialog"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-4">
          <v-form ref="groupForm">
            <v-select
                v-model="groupFormData.membershipType"
                :items="membershipTypeOptions"
                label="Üyelik Türü"
                :rules="[v => !!v || 'Üyelik türü seçilmeli']"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                @update:model-value="updateMaxCapacity"
            ></v-select>

            <v-text-field
                v-model="groupFormData.name"
                label="Grup Adı"
                placeholder="Örn: Pazartesi Sabah Grubu"
                :rules="[v => !!v || 'Grup adı gerekli']"
                variant="outlined"
                density="comfortable"
                class="mb-3"
            ></v-text-field>

            <v-text-field
                v-model.number="groupFormData.maxCapacity"
                label="Maksimum Kapasite"
                type="number"
                :rules="[v => !!v && v > 0 || 'Kapasite 0\'dan büyük olmalı']"
                variant="outlined"
                density="comfortable"
                class="mb-3"
            ></v-text-field>

            <v-textarea
                v-model="groupFormData.description"
                label="Açıklama (Opsiyonel)"
                placeholder="Grup hakkında notlar"
                variant="outlined"
                density="comfortable"
                rows="3"
                class="mb-3"
            ></v-textarea>

            <!-- Schedule Section -->
            <div class="mb-3">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2">Haftalık Program</span>
                <v-btn
                    size="small"
                    variant="text"
                    prepend-icon="mdi-plus"
                    @click="addScheduleSlot"
                >
                  Ekle
                </v-btn>
              </div>

              <v-card
                  v-for="(slot, idx) in groupFormData.schedule"
                  :key="idx"
                  variant="outlined"
                  class="mb-2 pa-3"
              >
                <v-row dense>
                  <v-col cols="3">
                    <v-select
                        v-model="slot.day"
                        :items="dayOptions"
                        label="Gün"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="3">
                    <v-select
                        v-model="slot.time"
                        :items="timeOptions"
                        label="Saat"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="3">
                    <v-select
                        v-model="slot.court"
                        :items="courtOptions"
                        label="Kort"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="3" class="d-flex align-center justify-end">
                    <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeScheduleSlot(idx)"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeGroupDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveGroup">
            {{ editingGroup ? 'Güncelle' : 'Oluştur' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Members Management Dialog -->
    <v-dialog v-model="membersDialog" max-width="800" persistent>
      <v-card v-if="selectedGroup">
        <v-card-title class="d-flex justify-space-between align-center">
          <div>
            <div class="text-h6">{{ selectedGroup.name }}</div>
            <div class="text-caption text-medium-emphasis">
              Üye Yönetimi
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeMembersDialog"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-4">
          <!-- Add Member Section -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex gap-2">
                <v-autocomplete
                    v-model="selectedMemberToAdd"
                    :items="availableMembers"
                    item-title="name"
                    item-value="id"
                    label="Üye Ekle"
                    placeholder="Öğrenci seçin"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                    :disabled="isGroupFull"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                        v-bind="props"
                        :subtitle="item.raw.email"
                    ></v-list-item>
                  </template>
                </v-autocomplete>
                <v-btn
                    color="primary"
                    @click="addMemberToGroup"
                    :disabled="!selectedMemberToAdd || isGroupFull"
                >
                  Ekle
                </v-btn>
              </div>
              <div v-if="isGroupFull" class="text-caption text-error mt-2">
                Grup kapasitesi dolu
              </div>
            </v-card-text>
          </v-card>

          <!-- Current Members List -->
          <div class="text-subtitle-2 mb-2">
            Mevcut Üyeler ({{ selectedGroup.members.length }} / {{ selectedGroup.maxCapacity }})
          </div>

          <v-card variant="outlined" v-if="selectedGroup.members.length > 0">
            <v-list>
              <v-list-item
                  v-for="(member, idx) in selectedGroup.members"
                  :key="member.id"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getAvatarColor(idx)" size="40">
                    <span class="text-subtitle-2">
                      {{ getInitials(member.name) }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ member.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeMemberFromGroup(member.id)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card v-else variant="outlined" class="text-center pa-6">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">
              mdi-account-off-outline
            </v-icon>
            <p class="text-body-2 text-medium-emphasis">
              Bu grupta henüz üye bulunmuyor
            </p>
          </v-card>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-6 py-4">
          <v-btn 
            color="success" 
            variant="tonal" 
            @click="handleExportGroupAttendance"
            :loading="exportingGroupAttendance"
            :disabled="selectedGroup.members.length === 0"
          >
            <v-icon icon="mdi-microsoft-excel" class="mr-1" />
            Grup Yoklaması İndir
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeMembersDialog">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Yoklama Arşivleme Uyarı Dialog -->
    <AttendanceArchiveWarning
        v-model="showArchiveWarningDialog"
        :student-id="archiveWarningData.studentId"
        :student-name="archiveWarningData.studentName"
        :group-id="archiveWarningData.groupId"
        :group-name="archiveWarningData.groupName"
        :attendance-count="archiveWarningData.attendanceCount"
        :archive-reason="archiveWarningData.archiveReason"
        @archive="handleArchiveAndContinue"
        @continue-without-archive="handleContinueWithoutArchive"
        @cancel="handleArchiveCancel"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Kapat</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, getDoc, serverTimestamp, FieldValue } from 'firebase/firestore'
import { db } from '@/services/firebase'
import AttendanceArchiveWarning from '@/components/common/AttendanceArchiveWarning.vue'
import {
  checkStudentAttendanceHistory,
  checkGroupAttendanceHistory,
  archiveStudentAttendance,
  archiveGroupAttendance,
  exportToExcel,
  exportGroupAttendanceToExcel
} from '@/services/attendanceArchive'
import type { ArchiveReason, AttendanceRecord } from '@/types/attendanceArchive'

// Types
interface ScheduleSlot {
  day: string
  time: string
  court: string
}

interface GroupMember {
  id: string
  name: string
  email: string
}

interface Group {
  id?: string
  name: string
  membershipType: string
  maxCapacity: number
  description?: string
  schedule: ScheduleSlot[]
  members: GroupMember[]
  createdAt?: Date | FieldValue
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  groupAssignment?: string
  membershipType: string
}

// Data
const groups = ref<Group[]>([])
const students = ref<Student[]>([])
const groupDialog = ref(false)
const membersDialog = ref(false)
const editingGroup = ref<Group | null>(null)
const selectedGroup = ref<Group | null>(null)
const selectedMemberToAdd = ref<string | null>(null)

// Yoklama arşivleme state'leri
const showArchiveWarningDialog = ref(false)
const archiveWarningData = ref({
  studentId: '',
  studentName: '',
  groupId: '',
  groupName: '',
  attendanceCount: 0,
  archiveReason: 'removed_from_group' as ArchiveReason,
  attendanceRecords: [] as AttendanceRecord[]
})
const pendingRemoveMemberId = ref<string | null>(null)
const pendingDeleteGroup = ref<Group | null>(null)
const archiveProcessing = ref(false)
const exportingGroupAttendance = ref(false)
const groupForm = ref<any>(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const groupFormData = ref<Group>({
  name: '',
  membershipType: '',
  maxCapacity: 8,
  description: '',
  schedule: [],
  members: []
})

// Options
const membershipTypeOptions = [
  { title: 'Özel Grup (3 Kişi)', value: 'private_group_3_8' },
  { title: 'Özel Grup (4 Kişi)', value: 'private_group_4_8' },
  { title: 'Yetişkin Grup', value: 'adult_group' },
  { title: 'Tenis Okulu (Yaş Grubu)', value: 'tennis_school_age' },
  { title: 'Tenis Okulu (Performans)', value: 'tennis_school_performance' }
]

const dayOptions = [
  { title: 'Pazartesi', value: 'Pazartesi' },
  { title: 'Salı', value: 'Salı' },
  { title: 'Çarşamba', value: 'Çarşamba' },
  { title: 'Perşembe', value: 'Perşembe' },
  { title: 'Cuma', value: 'Cuma' },
  { title: 'Cumartesi', value: 'Cumartesi' },
  { title: 'Pazar', value: 'Pazar' }
]

const timeOptions = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

const courtOptions = [
  { title: 'Kort 1', value: 'K1' },
  { title: 'Kort 2', value: 'K2' },
  { title: 'Kort 3', value: 'K3' }
]

// Computed
const availableMembers = computed(() => {
  if (!selectedGroup.value) return []

  const currentMemberIds = selectedGroup.value.members.map(m => m.id)
  return students.value
      .filter(s => !currentMemberIds.includes(s.id))
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email
      }))
})

const isGroupFull = computed(() => {
  if (!selectedGroup.value) return false
  return selectedGroup.value.members.length >= selectedGroup.value.maxCapacity
})

// Methods
const loadGroups = async () => {
  try {
    const groupsRef = collection(db, 'groups')
    const snapshot = await getDocs(groupsRef)
    groups.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[]
  } catch (error) {
    console.error('Gruplar yüklenirken hata:', error)
    showSnackbar('Gruplar yüklenirken hata oluştu', 'error')
  }
}

const loadStudents = async () => {
  try {
    const studentsRef = collection(db, 'users')
    const q = query(studentsRef, where('role', '==', 'student'))
    const snapshot = await getDocs(q)
    students.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[]
  } catch (error) {
    console.error('Öğrenciler yüklenirken hata:', error)
  }
}

const openAddGroupDialog = () => {
  editingGroup.value = null
  groupFormData.value = {
    name: '',
    membershipType: '',
    maxCapacity: 8,
    description: '',
    schedule: [],
    members: []
  }
  groupDialog.value = true
}

const editGroup = (group: Group) => {
  editingGroup.value = group
  groupFormData.value = { ...group }
  groupDialog.value = true
}

const closeGroupDialog = () => {
  groupDialog.value = false
  editingGroup.value = null
}

const updateMaxCapacity = () => {
  const capacities: { [key: string]: number } = {
    'private_group_3_8': 3,
    'private_group_4_8': 4,
    'adult_group': 8,
    'tennis_school_age': 6,
    'tennis_school_performance': 8
  }
  groupFormData.value.maxCapacity = capacities[groupFormData.value.membershipType] || 8
}

const addScheduleSlot = () => {
  groupFormData.value.schedule.push({ day: '', time: '', court: '' })
}

const removeScheduleSlot = (index: number) => {
  groupFormData.value.schedule.splice(index, 1)
}

const saveGroup = async () => {
  const { valid } = await groupForm.value.validate()
  if (!valid) return

  try {
    const groupData = {
      ...groupFormData.value,
      // Eğer üyeler varsa, güncelleme sırasında override etmemek için mevcut üyeleri koru veya form verisini kullan
      // Burada form verisi (groupFormData) zaten güncel üyeleri içeriyor mu? 
      // editGroup fonksiyonunda groupFormData = { ...group } yapılıyor.
      // Ancak members dialog'u ayrı çalışıyor. saveGroup çağrıldığında members güncel olmayabilir mi?
      // GroupManagement yapısında members dialog ayrı bir işlem. saveGroup sadece META verileri ve PROGRAMI güncelliyor gibi.
      // EĞER members dizisi form data'da eksikse, mevcut gruptan almalıyız. 
      // editGroup ile yüklendiğinde members da geliyor. Sorun yok.
      // Ancak members dialog'u members array'ini FIREBASE'de güncelliyor ama local groupFormData'yı güncelliyor mu?
      // loadGroups() çağrıldığında groups listesi güncelleniyor. editingGroup ref'i buna point ediyorsa sorun yok.
      // Ama groupFormData bir kopya.
      // Eğer create/edit dialog açıkken member eklenirse, groupFormData güncel kalmayabilir.
      // Neyse ki saveGroup members üzerinde değişiklik yapmıyor, schedule üzerinde yapıyor.
      // Biz sadece schedule değişikliğinde üyeler için rezervasyonları yeniden oluşturacağız.
      // Bu yüzden groupFormData.members'a güvenmek yerine, DB'den (veya güncel groups listesinden) üyeleri almak daha güvenli olabilir.
      // Ama editingGroup.value varsa oradan ID alıp güncel halini bulabiliriz. 
      // Basitlik adına groupFormData kullanacağız ama dikkatli olmalıyız.
      updatedAt: serverTimestamp()
    }
    
    // Yeni oluşturuluyorsa createdAt ekle
    if (!editingGroup.value) {
       groupData.createdAt = serverTimestamp()
    }

    let groupId = editingGroup.value?.id
    let isUpdate = false

    if (groupId) {
      isUpdate = true
      const groupRef = doc(db, 'groups', groupId)
      // Members alanını groupFormData'dan güncelleme riskli olabilir çünkü member dialogu paralel çalışıyor.
      // Sadece isim, kapasite, schedule güncellemek daha güvenli.
      // Ama groupFormData tüm objeyi içeriyor.
      // Biz sadece değişen alanları göndersek?
      // Şimdilik groupData'yı kullanıyoruz.
      await updateDoc(groupRef, {
        name: groupData.name,
        membershipType: groupData.membershipType,
        maxCapacity: groupData.maxCapacity,
        description: groupData.description || '',
        schedule: groupData.schedule
      })
      showSnackbar('Grup başarıyla güncellendi', 'success')
    } else {
      const docRef = await addDoc(collection(db, 'groups'), groupData)
      groupId = docRef.id
      showSnackbar('Grup başarıyla oluşturuldu', 'success')
    }
    
    //---------------------------------------------------------
    // REZERVASYON SENKRONİZASYONU (Sadece Gelecek)
    //---------------------------------------------------------
    
    // 1. Bu grubun GELECEKTEKİ tüm rezervasyonlarını temizle
    if (isUpdate && groupId) {
      console.log('🔄 Eski gelecek rezervasyonları temizleniyor...')
      await deleteFutureGroupReservations(groupId)
    }
    
    // 2. Grubun üyeleri için yeni gelecek rezervasyonları oluştur
    // Not: groupFormData.members eski olabilir, güncel gruplar listesinden veya editingGroup üzerinden alalım
    // Eğer yeni grupsa members boştur zaten.
    let currentMembers = groupFormData.value.members
    
    if (isUpdate && groupId) {
        // En güncel üye listesini bulmaya çalışalım
        const currentGroup = groups.value.find(g => g.id === groupId)
        if (currentGroup) {
            currentMembers = currentGroup.members
        }
    }

    if (groupId && groupFormData.value.schedule.length > 0 && currentMembers && currentMembers.length > 0) {
      console.log(`➕ ${currentMembers.length} üye için rezervasyonlar oluşturuluyor...`)
      await createFutureGroupReservations(groupId, groupFormData.value, currentMembers)
    }

    // 3. Öğrencilerin 'weeklyPlan' alanını güncelle (StudentManagement uyumluluğu için)
    if (groupId && currentMembers && currentMembers.length > 0) {
      const weeklyPlan = groupFormData.value.schedule.map(slot => ({
        day: convertTurkisDayToEnglish(slot.day), // StudentManagement 'monday' bekler
        time: slot.time,
        court: slot.court // 'K1' bekler mi? StudentManagement 'court-1' kullanıyor ama biz K1 kaydediyoruz.
        // StudentManagement K1'i court-1'e çeviriyor genelde.
        // Court schedule K1.
        // StudentManagement groupSchedule kaydederken court: slot.court (K1) olarak kaydediyor mu?
        // Bir dakika, StudentManagement'ta: 
        // groupSchedule: { weeklyPlan: [{ day: 'monday', time: '10:00', court: 'court-1' }] }
        // Bizim schedule: { day: 'Pazartesi', time: '10:00', court: 'K1' }
        // Çeviri yapmamız lazım!
      }))

      const updatePromises = currentMembers.map(member => {
        const studentRef = doc(db, 'users', member.id)
        return updateDoc(studentRef, {
          groupSchedule: {
            weeklyPlan: weeklyPlan
          }
        })
      })

      await Promise.all(updatePromises)
      console.log(`✅ ${currentMembers.length} öğrencinin profili güncellendi`)
    }

    closeGroupDialog()
    await loadGroups()
  } catch (error) {
    console.error('Grup kaydedilirken hata:', error)
    showSnackbar('Grup kaydedilirken hata oluştu', 'error')
  }
}

// Gelecekteki grup rezervasyonlarını sil
const deleteFutureGroupReservations = async (groupId: string) => {
  try {
    // Bugünün başlangıcı
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const reservationsRef = collection(db, 'reservations')
    
    // Bu gruba ait VE tarihi bugünden büyük/eşit olanlar
    const q = query(
        reservationsRef, 
        where('groupId', '==', groupId),
        where('date', '>=', today)
    )
    
    const snapshot = await getDocs(q)
    
    // Her rezervasyonu sil ve courtSchedule'ı temizle
    const deletePromises = snapshot.docs.map(async (resDoc) => {
        const data = resDoc.data()
        
        // 1. Doc sil
        await deleteDoc(resDoc.ref)
        
        // 2. Court Schedule güncelle
        if (data.date) {
            try {
                const dateObj = data.date.toDate() // Firestore Timestamp -> Date
                const dateString = dateObj.toISOString().split('T')[0]
                const courtId = data.courtId // 'K1' vb.
                
                const scheduleRef = doc(db, 'courtSchedule', dateString)
                const docSnap = await getDoc(scheduleRef)
                
                if (docSnap.exists()) {
                    const schedule = docSnap.data().schedule || {}
                    // İlgili saatteki slotu kontrol et
                    // Eğer slot 'occupied' ise veya bu gruba aitse temizle
                    // Basitçe o saati 'available' yapabiliriz, çünkü rezervasyonu sildik.
                    // Ancak başkasının rezervasyonunu silmeyelim (teorik çakışma).
                    // groupId kontrolü yapabiliriz ama slot yapısı detaylı.
                    
                    if (schedule[courtId] && schedule[courtId][data.startTime]) {
                        // Slotu temizle
                        schedule[courtId][data.startTime] = 'available'
                        
                        await updateDoc(scheduleRef, {
                            schedule: schedule,
                            lastUpdated: serverTimestamp(),
                            updatedBy: 'group-update-auto'
                        })
                    }
                }
            } catch (err) {
                console.error('Court schedule temizlenirken hata:', err)
            }
        }
    })
    
    await Promise.all(deletePromises)
    console.log(`✅ ${snapshot.docs.length} gelecek rezervasyon silindi`)
    
  } catch (error) {
    console.error('Rezervasyonlar silinirken hata:', error)
  }
}

// Belirli bir üyenin gelecekteki rezervasyonlarını sil
const deleteFutureMemberReservations = async (groupId: string, memberId: string) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const reservationsRef = collection(db, 'reservations')
    
    const q = query(
        reservationsRef, 
        where('groupId', '==', groupId),
        where('studentId', '==', memberId),
        where('date', '>=', today)
    )
    
    const snapshot = await getDocs(q)
    
    const deletePromises = snapshot.docs.map(async (resDoc) => {
        const data = resDoc.data()
        
        // 1. Doc sil
        await deleteDoc(resDoc.ref)
        
        // 2. Court Schedule güncelle
        if (data.date) {
            try {
                const dateObj = data.date.toDate()
                const dateString = dateObj.toISOString().split('T')[0]
                const courtId = data.courtId
                
                const scheduleRef = doc(db, 'courtSchedule', dateString)
                const docSnap = await getDoc(scheduleRef)
                
                if (docSnap.exists()) {
                    const schedule = docSnap.data().schedule || {}
                    
                    if (schedule[courtId] && schedule[courtId][data.startTime]) {
                        // Eğer bu slot bu öğrenciye aitse temizle
                        const slot = schedule[courtId][data.startTime]
                        if (slot.studentId === memberId) {
                            schedule[courtId][data.startTime] = 'available'
                            
                            await updateDoc(scheduleRef, {
                                schedule: schedule,
                                lastUpdated: serverTimestamp(),
                                updatedBy: 'group-member-remove-auto'
                            })
                        }
                    }
                }
            } catch (err) {
                console.error('Court schedule (üye silme) temizlenirken hata:', err)
            }
        }
    })
    
    await Promise.all(deletePromises)
    console.log(`✅ Üye (${memberId}) için ${snapshot.docs.length} gelecek rezervasyon silindi`)
    
  } catch (error) {
    console.error('Üye rezervasyonları silinirken hata:', error)
  }
}

const createFutureGroupReservations = async (
    groupId: string, 
    groupData: Group, 
    members: GroupMember[]
) => {
  try {
    const today = new Date()
    today.setHours(0,0,0,0) // Bugünden başla
    
    const oneYearLater = new Date()
    oneYearLater.setMonth(today.getMonth() + 12)

    const lessonDuration = getLessonDuration(groupData.membershipType)
    let createdCount = 0

    // Schedule üzerinde dön
    for (const slot of groupData.schedule) {
      if (!slot.day || !slot.time || !slot.court) continue

      // Tarihleri hesapla
      const dates = getDatesByDayOfWeek(slot.day, today, oneYearLater)

      // Her tarih için
      for (const date of dates) {
          const dateString = date.toISOString().split('T')[0]
          const [startHour, startMinute] = slot.time.split(':').map(Number)
          
          const startDateTime = new Date(date)
          startDateTime.setHours(startHour, startMinute, 0, 0)

          const endDateTime = new Date(startDateTime)
          endDateTime.setMinutes(endDateTime.getMinutes() + lessonDuration)
          
          const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`

          // HER ÜYE İÇİN REZERVASYON OLUŞTUR
          for (const member of members) {
              const reservation = {
                  date: startDateTime,
                  courtId: slot.court,
                  startTime: slot.time,
                  endTime: endTime,
                  groupId: groupId,
                  studentId: member.id, // ÖNEMLİ: Üye bazlı
                  studentName: member.name,
                  groupAssignment: groupId, // StudentManagement uyumu
                  membershipType: groupData.membershipType,
                  reservationType: 'group-lesson',
                  status: 'confirmed',
                  type: 'lesson',
                  groupSchedule: true, // StudentManagement bu flag'i kullanıyor
                  createdAt: serverTimestamp(),
                  createdBy: 'admin-group-manager'
              }
              
              await addDoc(collection(db, 'reservations'), reservation)
              createdCount++
              
              // COURT SCHEDULE GÜNCELLE
              // Detaylı bilgi yaz (StudentManagement formatı)
              // Birden fazla üye varsa, sonuncusu yazar. 'Occupied' olması yeterli.
              // Detaylarda bir öğrenciyi görmek kabul edilebilir, veya "Group X" yazılabilir.
              // StudentManagement kendi öğrenci bilgisini yazıyor. Biz de öyle yapalım.
              
              const scheduleRef = doc(db, 'courtSchedule', dateString)
              const scheduleSnap = await getDoc(scheduleRef)
              
              let schedule = scheduleSnap.exists() ? scheduleSnap.data().schedule || {} : {}
              if (!schedule[slot.court]) schedule[slot.court] = {}
              
              schedule[slot.court][slot.time] = {
                  status: 'occupied',
                  studentId: member.id,
                  studentFirstName: member.name.split(' ')[0], // Basit parse
                  studentLastName: member.name.split(' ').slice(1).join(' '),
                  studentFullName: member.name,
                  groupAssignment: groupId,
                  membershipType: groupData.membershipType,
                  reservationType: 'group-lesson',
                  updatedAt: new Date(), // serverTimestamp array içinde çalışmayabilir bazen object olarak
                  updatedBy: 'group-manager'
              }
              
              await setDoc(scheduleRef, {
                  schedule: schedule,
                  lastUpdated: serverTimestamp()
              }, { merge: true })
          }
      }
    }

    console.log(`✅ Toplam ${createdCount} üye rezervasyonu oluşturuldu`)
    showSnackbar(`${createdCount} rezervasyon oluşturuldu`, 'success')
  } catch (error) {
    console.error('Rezervasyonlar oluşturulurken hata:', error)
    showSnackbar('Rezervasyonlar oluşturulurken hata oluştu', 'error')
  }
}

// Helper: Türkçe gün ismini İngilizceye çevir (StudentManagement uyumu için)
const convertTurkisDayToEnglish = (turkishDay: string): string => {
    const map: { [key: string]: string } = {
        'Pazartesi': 'monday',
        'Salı': 'tuesday',
        'Çarşamba': 'wednesday',
        'Perşembe': 'thursday',
        'Cuma': 'friday',
        'Cumartesi': 'saturday',
        'Pazar': 'sunday'
    }
    return map[turkishDay] || 'monday'
}


const getDatesByDayOfWeek = (dayName: string, startDate: Date, endDate: Date): Date[] => {
  const dayMap: { [key: string]: number } = {
    'Pazar': 0,
    'Pazartesi': 1,
    'Salı': 2,
    'Çarşamba': 3,
    'Perşembe': 4,
    'Cuma': 5,
    'Cumartesi': 6
  }

  const targetDay = dayMap[dayName]
  const dates: Date[] = []
  const current = new Date(startDate)

  // Find the first occurrence of the target day
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  // Collect all occurrences
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }

  return dates
}

const getLessonDuration = (membershipType: string): number => {
  // Return duration in minutes based on membership type
  const durations: { [key: string]: number } = {
    'private_1_45': 45,
    'private_2_60': 60,
    'private_group_3_8': 60,
    'private_group_4_8': 60,
    'adult_group': 60,
    'tennis_school_age': 60,
    'tennis_school_performance': 90
  }
  return durations[membershipType] || 60
}

const deleteGroup = async (group: Group) => {
  // Grup üyelerinin yoklama geçmişini kontrol et
  if (group.members && group.members.length > 0) {
    const memberIds = group.members.map(m => m.id)
    const { hasHistory, totalAttendance } = await checkGroupAttendanceHistory(group.id || '', memberIds)

    if (hasHistory) {
      // İlk üyenin bilgilerini kullanarak uyarı göster (grup silme için)
      archiveWarningData.value = {
        studentId: group.id || '',
        studentName: `${group.members.length} üye`,
        groupId: group.id || '',
        groupName: group.name,
        attendanceCount: totalAttendance,
        archiveReason: 'group_deleted',
        attendanceRecords: []
      }
      pendingDeleteGroup.value = group
      showArchiveWarningDialog.value = true
      return
    }
  }

  // Yoklama geçmişi yoksa onay al ve sil
  if (!confirm(`"${group.name}" grubunu silmek istediğinize emin misiniz?`)) return
  await performDeleteGroup(group)
}

// Grup silme işlemini gerçekleştir
const performDeleteGroup = async (group: Group) => {
  try {
    if (group.id) {
      // Önce gruba ait tüm üyelerin groupAssignment ve groupSchedule bilgilerini temizle
      if (group.members && group.members.length > 0) {
        const updatePromises = group.members.map(member => {
          const studentRef = doc(db, 'users', member.id)
          return updateDoc(studentRef, {
            groupAssignment: null,
            groupSchedule: null
          })
        })

        await Promise.all(updatePromises)
        console.log(`✅ ${group.members.length} öğrencinin grup bilgileri temizlendi`)
      }

      // Sonra grubu sil
      await deleteDoc(doc(db, 'groups', group.id))
      showSnackbar('Grup ve üye bilgileri başarıyla silindi', 'success')
      await loadGroups()
      await loadStudents()
    }
  } catch (error) {
    console.error('Grup silinirken hata:', error)
    showSnackbar('Grup silinirken hata oluştu', 'error')
  }
}

const openMembersDialog = (group: Group) => {
  selectedGroup.value = { ...group }
  selectedMemberToAdd.value = null
  membersDialog.value = true
}

const closeMembersDialog = () => {
  membersDialog.value = false
  selectedGroup.value = null
  selectedMemberToAdd.value = null
}

const addMemberToGroup = async () => {
  if (!selectedGroup.value || !selectedMemberToAdd.value) return

  const student = students.value.find(s => s.id === selectedMemberToAdd.value)
  if (!student) return

  try {
    const newMember: GroupMember = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email
    }

    selectedGroup.value.members.push(newMember)

    if (selectedGroup.value.id) {
      const groupRef = doc(db, 'groups', selectedGroup.value.id)
      await updateDoc(groupRef, {
        members: selectedGroup.value.members
      })

      // Grup schedule bilgilerini weeklyPlan'a dönüştür
      const weeklyPlan = selectedGroup.value.schedule.map(slot => ({
        day: slot.day,
        time: slot.time,
        court: slot.court
      }))


      // Öğrencinin grup atamasını, membershipType ve schedule'ını güncelle
      const studentRef = doc(db, 'users', student.id)
      await updateDoc(studentRef, {
        groupAssignment: selectedGroup.value.id,
        membershipType: selectedGroup.value.membershipType,
        groupSchedule: {
          weeklyPlan: weeklyPlan
        }
      })
    }

    selectedMemberToAdd.value = null
    
    // -----------------------------------------------------------------------
    // YENİ ÜYE İÇİN GELECEK REZERVASYONLARI OLUŞTUR
    // -----------------------------------------------------------------------
    if (selectedGroup.value.id && selectedGroup.value.schedule.length > 0) {
       console.log(`➕ Yeni üye (${newMember.name}) için rezervasyonlar oluşturuluyor...`)
       await createFutureGroupReservations(selectedGroup.value.id, selectedGroup.value, [newMember])
    }
    
    showSnackbar('Üye gruba eklendi, haftalık program atandı ve rezervasyonlar oluşturuldu', 'success')
    await loadGroups()
    await loadStudents()
  } catch (error) {
    console.error('Üye eklenirken hata:', error)
    showSnackbar('Üye eklenirken hata oluştu', 'error')
  }
}

const removeMemberFromGroup = async (memberId: string) => {
  if (!selectedGroup.value) return

  // Yoklama geçmişini kontrol et
  const { hasHistory, attendanceCount, records } = await checkStudentAttendanceHistory(memberId)

  if (hasHistory) {
    // Üye bilgisini bul
    const member = selectedGroup.value.members.find(m => m.id === memberId)
    
    archiveWarningData.value = {
      studentId: memberId,
      studentName: member?.name || 'Bilinmiyor',
      groupId: selectedGroup.value.id || '',
      groupName: selectedGroup.value.name,
      attendanceCount,
      archiveReason: 'removed_from_group',
      attendanceRecords: records.map(r => ({
        date: r.date,
        present: r.present,
        lessonNumber: r.lessonNumber
      }))
    }
    pendingRemoveMemberId.value = memberId
    showArchiveWarningDialog.value = true
    return
  }

  // Yoklama geçmişi yoksa direkt çıkar
  await performRemoveMemberFromGroup(memberId)
}

// Üyeyi gruptan çıkarma işlemini gerçekleştir
const performRemoveMemberFromGroup = async (memberId: string) => {
  if (!selectedGroup.value) return

  try {
    selectedGroup.value.members = selectedGroup.value.members.filter(m => m.id !== memberId)

    if (selectedGroup.value.id) {
      const groupRef = doc(db, 'groups', selectedGroup.value.id)
      await updateDoc(groupRef, {
        members: selectedGroup.value.members
      })

      const studentRef = doc(db, 'users', memberId)
      await updateDoc(studentRef, {
        groupAssignment: null,
        membershipType: 'basic',
        groupSchedule: null
      })
      
      // -----------------------------------------------------------------------
      // ÜYENİN GELECEK REZERVASYONLARINI SİL
      // -----------------------------------------------------------------------
      await deleteFutureMemberReservations(selectedGroup.value.id, memberId)
    }

    showSnackbar('Üye gruptan çıkarıldı, program temizlendi ve rezervasyonlar silindi', 'success')
    await loadGroups()
    await loadStudents()
  } catch (error) {
    console.error('Üye çıkarılırken hata:', error)
    showSnackbar('Üye çıkarılırken hata oluştu', 'error')
  }
}

const getMembershipTypeLabel = (type: string): string => {
  const option = membershipTypeOptions.find(o => o.value === type)
  return option ? option.title : type
}

const getGroupColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'private_group_3_8': 'purple',
    'private_group_4_8': 'indigo',
    'adult_group': 'blue',
    'tennis_school_age': 'green',
    'tennis_school_performance': 'orange'
  }
  return colors[type] || 'grey'
}

const getCapacityColor = (group: Group): string => {
  const percentage = (group.members.length / group.maxCapacity) * 100
  if (percentage >= 100) return 'error'
  if (percentage >= 80) return 'warning'
  return 'success'
}

const getAvatarColor = (index: number): string => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  return colors[index % colors.length]
}

const getInitials = (name: string): string => {
  return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Lifecycle
// Arşivle ve devam et
const handleArchiveAndContinue = async (exportFirst: boolean) => {
  archiveProcessing.value = true

  try {
    const data = archiveWarningData.value

    // Grup silme işlemi
    if (pendingDeleteGroup.value) {
      const group = pendingDeleteGroup.value

      // Her üye için yoklamayı arşivle
      const members = group.members.map(m => ({
        id: m.id,
        name: m.name,
        membershipType: group.membershipType
      }))

      await archiveGroupAttendance(
        group.id || '',
        group.name,
        members,
        'group_deleted'
      )

      // Grubu sil
      await performDeleteGroup(group)
      showSnackbar('Yoklamalar arşivlendi ve grup silindi', 'success')
    }
    // Üye çıkarma işlemi
    else if (pendingRemoveMemberId.value && selectedGroup.value) {
      // Excel export istendiyse önce indir
      if (exportFirst && data.attendanceRecords.length > 0) {
        await exportToExcel(data.studentName, data.attendanceRecords)
      }

      // Yoklama arşivle
      await archiveStudentAttendance(
        data.studentId,
        data.studentName,
        data.groupId,
        data.groupName,
        selectedGroup.value.membershipType,
        'removed_from_group'
      )

      // Üyeyi gruptan çıkar
      await performRemoveMemberFromGroup(pendingRemoveMemberId.value)
      showSnackbar('Yoklama arşivlendi ve üye çıkarıldı', 'success')
    }
  } catch (error: any) {
    console.error('Arşivleme hatası:', error)
    showSnackbar('Arşivleme sırasında hata oluştu', 'error')
  } finally {
    showArchiveWarningDialog.value = false
    pendingRemoveMemberId.value = null
    pendingDeleteGroup.value = null
    archiveProcessing.value = false
  }
}

// Arşivlemeden devam et
const handleContinueWithoutArchive = async () => {
  try {
    // Grup silme işlemi
    if (pendingDeleteGroup.value) {
      await performDeleteGroup(pendingDeleteGroup.value)
    }
    // Üye çıkarma işlemi
    else if (pendingRemoveMemberId.value) {
      await performRemoveMemberFromGroup(pendingRemoveMemberId.value)
    }
  } finally {
    showArchiveWarningDialog.value = false
    pendingRemoveMemberId.value = null
    pendingDeleteGroup.value = null
  }
}

// Arşivleme iptal
const handleArchiveCancel = () => {
  showArchiveWarningDialog.value = false
  pendingRemoveMemberId.value = null
  pendingDeleteGroup.value = null
}

// Manuel grup yoklama export
const handleExportGroupAttendance = async () => {
  if (!selectedGroup.value || selectedGroup.value.members.length === 0) return

  try {
    exportingGroupAttendance.value = true
    const group = selectedGroup.value
    const members = group.members.map(m => ({
      id: m.id,
      name: m.name
    }))

    const result = await exportGroupAttendanceToExcel(
      group.id || '',
      group.name,
      members
    )

    if (result) {
      showSnackbar('Grup yoklama verileri başarıyla indirildi!', 'success')
    } else {
      showSnackbar('Bu grup için yoklama kaydı bulunamadı.', 'warning')
    }
  } catch (error: any) {
    console.error('❌ Grup yoklama export hatası:', error)
    showSnackbar('Yoklama verileri indirilirken hata oluştu!', 'error')
  } finally {
    exportingGroupAttendance.value = false
  }
}

onMounted(async () => {
  await loadGroups()
  await loadStudents()
})
</script>

<style scoped>
.group-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.group-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>