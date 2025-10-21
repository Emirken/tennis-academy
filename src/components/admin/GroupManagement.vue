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
                  <v-col cols="5">
                    <v-select
                        v-model="slot.day"
                        :items="dayOptions"
                        label="Gün"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="5">
                    <v-select
                        v-model="slot.time"
                        :items="timeOptions"
                        label="Saat"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="2" class="d-flex align-center">
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
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeMembersDialog">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Types
interface ScheduleSlot {
  day: string
  time: string
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
  createdAt?: Date
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
  groupFormData.value.schedule.push({ day: '', time: '' })
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
      createdAt: new Date()
    }

    if (editingGroup.value?.id) {
      const groupRef = doc(db, 'groups', editingGroup.value.id)
      await updateDoc(groupRef, groupData)
      showSnackbar('Grup başarıyla güncellendi', 'success')
    } else {
      await addDoc(collection(db, 'groups'), groupData)
      showSnackbar('Grup başarıyla oluşturuldu', 'success')
    }

    closeGroupDialog()
    await loadGroups()
  } catch (error) {
    console.error('Grup kaydedilirken hata:', error)
    showSnackbar('Grup kaydedilirken hata oluştu', 'error')
  }
}

const deleteGroup = async (group: Group) => {
  if (!confirm(`"${group.name}" grubunu silmek istediğinize emin misiniz?`)) return

  try {
    if (group.id) {
      await deleteDoc(doc(db, 'groups', group.id))
      showSnackbar('Grup başarıyla silindi', 'success')
      await loadGroups()
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

      // Öğrencinin grup atamasını güncelle
      const studentRef = doc(db, 'users', student.id)
      await updateDoc(studentRef, {
        groupAssignment: selectedGroup.value.id
      })
    }

    selectedMemberToAdd.value = null
    showSnackbar('Üye gruba eklendi', 'success')
    await loadGroups()
    await loadStudents()
  } catch (error) {
    console.error('Üye eklenirken hata:', error)
    showSnackbar('Üye eklenirken hata oluştu', 'error')
  }
}

const removeMemberFromGroup = async (memberId: string) => {
  if (!selectedGroup.value) return

  try {
    selectedGroup.value.members = selectedGroup.value.members.filter(m => m.id !== memberId)

    if (selectedGroup.value.id) {
      const groupRef = doc(db, 'groups', selectedGroup.value.id)
      await updateDoc(groupRef, {
        members: selectedGroup.value.members
      })

      // Öğrencinin grup atamasını kaldır
      const studentRef = doc(db, 'users', memberId)
      await updateDoc(studentRef, {
        groupAssignment: null
      })
    }

    showSnackbar('Üye gruptan çıkarıldı', 'success')
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