<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :max-width="maxWidth"
      :persistent="persistent"
      :no-click-animation="noClickAnimation"
  >
    <v-card class="confirm-dialog-card">
      <!-- Header -->
      <v-card-title
          class="pa-6 d-flex align-center"
          :class="headerClass"
      >
        <v-icon
            v-if="!icon"
            :icon="defaultIcon"
            :color="defaultIconColor"
            size="32"
            class="mr-3"
        />
        <div>
          <h3 class="text-h5 font-weight-bold">{{ title }}</h3>
          <p v-if="subtitle" class="text-body-2 mt-1 mb-0" :class="subtitleClass">
            {{ subtitle }}
          </p>
        </div>
      </v-card-title>

      <!-- Content -->
      <v-card-text class="pa-6">
        <div class="message-content">
          <!-- Main Message -->
          <p v-if="message" class="text-body-1 mb-4">
            {{ message }}
          </p>

          <!-- Custom Content Slot -->
          <slot name="content" />

          <!-- Warning List -->
          <v-alert
              v-if="warnings.length > 0"
              type="warning"
              variant="tonal"
              class="mb-4"
          >
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-alert-triangle" class="mr-2" />
              <span class="font-weight-medium">Please note:</span>
            </div>
            <ul class="pl-4">
              <li v-for="warning in warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </v-alert>

          <!-- Confirmation Input -->
          <div v-if="requireConfirmation" class="confirmation-input">
            <p class="text-body-2 mb-3">
              Type <strong>{{ confirmationText }}</strong> to confirm:
            </p>
            <v-text-field
                v-model="confirmationInput"
                variant="outlined"
                density="compact"
                :placeholder="confirmationText"
                :error="confirmationError"
                :error-messages="confirmationError ? `Please type '${confirmationText}' to confirm` : ''"
                @input="confirmationError = false"
            />
          </div>

          <!-- Details Section -->
          <v-expansion-panels v-if="details" variant="accordion" class="mt-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-information-outline" class="mr-2" />
                Show Details
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="details-content">
                  {{ details }}
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />

        <!-- Cancel Button -->
        <v-btn
            variant="outlined"
            :color="cancelColor"
            :disabled="loading"
            @click="handleCancel"
        >
          {{ cancelText }}
        </v-btn>

        <!-- Confirm Button -->
        <v-btn
            :variant="confirmVariant"
            :color="confirmColor"
            :loading="loading"
            :disabled="!canConfirm"
            @click="handleConfirm"
        >
          <v-icon v-if="confirmIcon" :icon="confirmIcon" class="mr-2" />
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  message?: string
  details?: string
  warnings?: string[]
  icon?: string
  iconColor?: string
  type?: 'info' | 'warning' | 'error' | 'success' | 'question'
  confirmText?: string
  cancelText?: string
  confirmIcon?: string
  maxWidth?: string | number
  persistent?: boolean
  noClickAnimation?: boolean
  loading?: boolean
  requireConfirmation?: boolean
  confirmationText?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  message: '',
  details: '',
  warnings: () => [],
  icon: '',
  iconColor: '',
  type: 'question',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmIcon: '',
  maxWidth: 500,
  persistent: false,
  noClickAnimation: false,
  loading: false,
  requireConfirmation: false,
  confirmationText: 'DELETE'
})

// Emits
defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Data
const confirmationInput = ref('')
const confirmationError = ref(false)

// Computed
const headerClass = computed(() => {
  const baseClass = 'text-white'
  switch (props.type) {
    case 'error':
      return `${baseClass} bg-error`
    case 'warning':
      return `${baseClass} bg-warning`
    case 'success':
      return `${baseClass} bg-success`
    case 'info':
      return `${baseClass} bg-info`
    default:
      return `${baseClass} bg-primary`
  }
})

const subtitleClass = computed(() => {
  return 'text-white opacity-90'
})

const confirmColor = computed((): string => {
  switch (props.type) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    case 'info':
      return 'info'
    default:
      return 'primary'
  }
})

const confirmVariant = computed((): 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain' => {
  switch (props.type) {
    case 'error':
      return 'flat'
    case 'warning':
      return 'tonal'
    case 'success':
      return 'flat'
    case 'info':
      return 'outlined'
    default:
      return 'flat'
  }
})

const cancelColor = computed((): string => {
  return 'grey'
})

const defaultIcon = computed((): string => {
  if (props.icon) return props.icon

  switch (props.type) {
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert-triangle'
    case 'success':
      return 'mdi-check-circle'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-help-circle'
  }
})

const defaultIconColor = computed((): string => {
  if (props.iconColor) return props.iconColor
  return 'white'
})

const canConfirm = computed(() => {
  if (props.loading) return false
  if (!props.requireConfirmation) return true
  return confirmationInput.value === props.confirmationText
})

// Methods
const handleConfirm = () => {
  if (props.requireConfirmation && confirmationInput.value !== props.confirmationText) {
    confirmationError.value = true
    return
  }

  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  resetDialog()
}

const resetDialog = () => {
  confirmationInput.value = ''
  confirmationError.value = false
}

// Setup emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Watch for dialog close to reset state
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    setTimeout(resetDialog, 300) // Delay to allow dialog close animation
  }
})
</script>

<script lang="ts">
import { watch } from 'vue'

export default {
  name: 'ConfirmDialog'
}
</script>

<style scoped>
.confirm-dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.message-content {
  line-height: 1.6;
}

.confirmation-input {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #ff9800;
}

.details-content {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
}

:deep(.v-expansion-panel-title) {
  padding: 12px 16px;
  min-height: auto;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 16px 16px;
}

:deep(.v-alert) {
  border-radius: 8px;
}

:deep(.v-alert ul) {
  margin: 0;
}

:deep(.v-alert li) {
  margin-bottom: 4px;
}

:deep(.v-alert li:last-child) {
  margin-bottom: 0;
}

/* Animation for dialog */
:deep(.v-dialog) {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Button loading state */
:deep(.v-btn--loading) {
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .confirm-dialog-card {
    margin: 16px;
  }

  :deep(.v-card-title) {
    padding: 20px !important;
  }

  :deep(.v-card-text) {
    padding: 20px !important;
  }

  :deep(.v-card-actions) {
    padding: 20px !important;
    padding-top: 0 !important;
    flex-direction: column-reverse;
    gap: 12px;
  }

  :deep(.v-card-actions .v-btn) {
    width: 100%;
  }

  :deep(.v-spacer) {
    display: none;
  }
}
</style>