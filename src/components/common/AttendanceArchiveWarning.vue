<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="600"
    persistent
  >
    <v-card class="archive-warning-card">
      <!-- Header -->
      <v-card-title class="pa-0">
        <div class="warning-header">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="48" class="mr-4">
              <v-icon color="white" size="28">mdi-alert-circle</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold mb-1">Yoklama Geçmişi Mevcut</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Bu işlem öncesi yoklama verilerini arşivleyebilirsiniz
              </p>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="handleCancel"
          />
        </div>
      </v-card-title>

      <v-divider />

      <!-- Content -->
      <v-card-text class="pa-6">
        <!-- Student/Group Info -->
        <v-alert
          :color="getReasonColor(archiveReason)"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <template #prepend>
            <v-icon :icon="getReasonIcon(archiveReason)" />
          </template>
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ getReasonTitle(archiveReason) }}</span>
            <span class="text-body-2">
              <strong>{{ studentName }}</strong>
              <span v-if="groupName"> - {{ groupName }}</span>
            </span>
          </div>
        </v-alert>

        <!-- Attendance Stats -->
        <v-card variant="outlined" class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-clipboard-check</v-icon>
                <span class="text-body-1">Yoklama Kayıtları</span>
              </div>
              <v-chip color="primary" variant="flat" size="small">
                {{ attendanceCount }} kayıt
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Warning Message -->
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <div class="text-body-2">
            <strong>Önemli:</strong> Yoklama kayıtları <strong>3 ay</strong> süreyle arşivlenecektir. 
            Bu süre dolmadan önce bildirim alacaksınız ve Excel olarak indirebilirsiniz.
          </div>
        </v-alert>

        <!-- Export Option -->
        <v-card 
          variant="outlined" 
          class="export-option-card"
          :class="{ 'selected': exportBeforeArchive }"
          @click="exportBeforeArchive = !exportBeforeArchive"
        >
          <v-card-text class="d-flex align-center">
            <v-checkbox
              v-model="exportBeforeArchive"
              hide-details
              density="compact"
              color="success"
              class="mr-2"
            />
            <div class="flex-grow-1">
              <div class="d-flex align-center">
                <v-icon color="success" size="20" class="mr-2">mdi-microsoft-excel</v-icon>
                <span class="font-weight-medium">Şimdi Excel olarak indir</span>
              </div>
              <span class="text-body-2 text-medium-emphasis">
                Arşivlemeden önce yoklama verilerini bilgisayarınıza kaydedin
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          İptal
        </v-btn>
        <v-spacer />
        <v-btn
          color="warning"
          variant="flat"
          :loading="processing"
          @click="handleArchiveAndContinue"
        >
          <v-icon start>mdi-archive</v-icon>
          {{ exportBeforeArchive ? 'İndir ve Arşivle' : 'Arşivle ve Devam Et' }}
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="processing"
          @click="handleContinueWithoutArchive"
        >
          <v-icon start>mdi-delete</v-icon>
          Arşivlemeden Devam Et
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ArchiveReason } from '@/types/attendanceArchive'

// Props
interface Props {
  modelValue: boolean
  studentId: string
  studentName: string
  groupId?: string
  groupName?: string
  attendanceCount: number
  archiveReason: ArchiveReason
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  studentId: '',
  studentName: '',
  attendanceCount: 0,
  archiveReason: 'student_deleted'
})

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'archive', exportFirst: boolean): void
  (e: 'continue-without-archive'): void
  (e: 'cancel'): void
}>()

// State
const exportBeforeArchive = ref(true)
const processing = ref(false)

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
const getReasonColor = (reason: ArchiveReason): string => {
  const colors: Record<ArchiveReason, string> = {
    'student_deleted': 'error',
    'removed_from_group': 'warning',
    'group_changed': 'info',
    'group_deleted': 'error'
  }
  return colors[reason] || 'grey'
}

const getReasonIcon = (reason: ArchiveReason): string => {
  const icons: Record<ArchiveReason, string> = {
    'student_deleted': 'mdi-account-remove',
    'removed_from_group': 'mdi-account-minus',
    'group_changed': 'mdi-account-switch',
    'group_deleted': 'mdi-account-group-outline'
  }
  return icons[reason] || 'mdi-help-circle'
}

const getReasonTitle = (reason: ArchiveReason): string => {
  const titles: Record<ArchiveReason, string> = {
    'student_deleted': 'Öğrenci Siliniyor',
    'removed_from_group': 'Gruptan Çıkarılıyor',
    'group_changed': 'Grup Değiştiriliyor',
    'group_deleted': 'Grup Siliniyor'
  }
  return titles[reason] || 'İşlem'
}

const handleArchiveAndContinue = () => {
  processing.value = true
  emit('archive', exportBeforeArchive.value)
}

const handleContinueWithoutArchive = () => {
  processing.value = true
  emit('continue-without-archive')
}

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

// Reset state when dialog opens
watch(dialogVisible, (newValue) => {
  if (newValue) {
    exportBeforeArchive.value = true
    processing.value = false
  }
})
</script>

<style scoped>
.archive-warning-card {
  border-radius: 12px;
  overflow: hidden;
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.export-option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.export-option-card:hover {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.04);
}

.export-option-card.selected {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.08);
}
</style>


