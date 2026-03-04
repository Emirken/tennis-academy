<template>
  <div class="membership-type-management">
    <v-container>
      <!-- Header Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center flex-wrap">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                <v-icon icon="mdi-card-account-details" class="mr-2" color="primary" />
                Üyelik Türleri Yönetimi
              </h1>
              <p class="text-body-1 text-medium-emphasis">
                Üyelik türlerini ekleyin, düzenleyin ve yönetin
              </p>
            </div>
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Yeni Üyelik Türü
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="membershipTypesStore.loading">
        <v-col cols="12" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4 text-body-1">Yükleniyor...</p>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-else-if="membershipTypesStore.allTypes.length === 0">
        <v-col cols="12">
          <v-card class="text-center py-12" variant="outlined">
            <v-icon icon="mdi-card-account-details-outline" size="80" color="grey" />
            <h3 class="text-h5 mt-4">Henüz üyelik türü yok</h3>
            <p class="text-body-1 text-medium-emphasis mt-2">
              İlk üyelik türünü eklemek için yukarıdaki butonu kullanın
            </p>
            <v-btn
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Üyelik Türü Ekle
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Membership Types Grid -->
      <v-row v-else>
        <v-col
          v-for="(type, index) in membershipTypesStore.allTypes"
          :key="type.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            class="membership-card h-100"
            :class="{ 'inactive-card': !type.isActive }"
            elevation="2"
          >
            <!-- Card Header with Color -->
            <div
              class="card-header pa-4"
              :style="{ backgroundColor: getColorValue(type.color) }"
            >
              <div class="d-flex justify-space-between align-start">
                <div>
                  <v-chip
                    v-if="type.isGroupType"
                    color="white"
                    size="x-small"
                    variant="flat"
                    class="mb-2"
                  >
                    <v-icon start size="12">mdi-account-group</v-icon>
                    Grup Türü
                  </v-chip>
                  <h3 class="text-h6 text-white font-weight-bold">
                    {{ type.name }}
                  </h3>
                </div>
                <div class="d-flex gap-1">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="white"
                    @click="openEditDialog(type)"
                  >
                    <v-icon size="18">mdi-pencil</v-icon>
                    <v-tooltip activator="parent">Düzenle</v-tooltip>
                  </v-btn>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <v-card-text class="pa-4">
              <div class="info-row mb-2">
                <span class="info-label">Anahtar:</span>
                <code class="info-value">{{ type.key }}</code>
              </div>
              
              <div v-if="type.description" class="info-row mb-2">
                <span class="info-label">Açıklama:</span>
                <span class="info-value">{{ type.description }}</span>
              </div>
              
              <div class="info-row mb-2">
                <span class="info-label">Renk:</span>
                <v-chip :color="type.color" size="small" variant="flat">
                  {{ type.color }}
                </v-chip>
              </div>
              
              <div v-if="type.isGroupType" class="info-row mb-2">
                <span class="info-label">Max Kapasite:</span>
                <span class="info-value font-weight-bold">{{ type.maxCapacity }} kişi</span>
              </div>
              
              <div v-if="type.monthlyPrice !== undefined" class="info-row mb-2">
                <span class="info-label">Fiyat:</span>
                <span class="info-value">{{ type.monthlyPrice }} ₺</span>
              </div>

              <div v-if="type.monthlyLessons !== undefined" class="info-row mb-2">
                <span class="info-label">Ders:</span>
                <span class="info-value">{{ type.monthlyLessons }}</span>
              </div>

              <div v-if="type.icon" class="info-row mb-2">
                <span class="info-label">İkon:</span>
                <v-icon size="small" class="mr-1">{{ type.icon }}</v-icon>
                <span class="info-value">{{ type.icon }}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Sıra:</span>
                <span class="info-value">{{ type.order }}</span>
              </div>
            </v-card-text>

            <!-- Card Actions -->
            <v-divider />
            <v-card-actions class="pa-4">
              <v-switch
                :model-value="type.isActive"
                color="success"
                density="compact"
                hide-details
                :label="type.isActive ? 'Aktif' : 'Pasif'"
                @update:model-value="toggleActive(type)"
              />
              <v-spacer />
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(type)"
              >
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent">Sil</v-tooltip>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Create/Edit Dialog -->
      <v-dialog v-model="dialog" max-width="600" persistent>
        <v-card>
          <v-card-title class="pa-6 bg-primary">
            <v-icon icon="mdi-card-account-details" class="mr-2" />
            {{ isEditing ? 'Üyelik Türü Düzenle' : 'Yeni Üyelik Türü' }}
          </v-card-title>

          <v-card-text class="pa-6">
            <v-form ref="formRef" v-model="formValid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.name"
                    label="Üyelik Adı *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-rename"
                    hint="Örn: Özel Ders 1 Kişi (45dk)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="formData.key"
                    label="Anahtar (Key) *"
                    variant="outlined"
                    :rules="[rules.required, rules.keyFormat]"
                    :disabled="isEditing"
                    prepend-inner-icon="mdi-key"
                    hint="Benzersiz tanımlayıcı (örn: private_1_45)"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="formData.description"
                    label="Açıklama"
                    variant="outlined"
                    rows="2"
                    prepend-inner-icon="mdi-text"
                    hint="Opsiyonel açıklama"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="formData.color"
                    label="Renk *"
                    variant="outlined"
                    :items="colorOptions"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-palette"
                  >
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar :color="item.value" size="24" class="mr-2" />
                        </template>
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      <v-avatar :color="item.value" size="20" class="mr-2" />
                      {{ item.title }}
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.order"
                    label="Sıra *"
                    variant="outlined"
                    type="number"
                    :rules="[rules.required, rules.positiveNumber]"
                    prepend-inner-icon="mdi-sort-numeric-ascending"
                    hint="Görüntülenme sırası"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="formData.isGroupType"
                    color="primary"
                    label="Grup Türü mü?"
                    hint="Etkinleştirilirse, bu üyelik türü için grup ataması gerekir"
                    persistent-hint
                  />
                </v-col>

                <v-col v-if="formData.isGroupType" cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.maxCapacity"
                    label="Maksimum Kapasite *"
                    variant="outlined"
                    type="number"
                    :rules="formData.isGroupType ? [rules.required, rules.positiveNumber] : []"
                    prepend-inner-icon="mdi-account-multiple"
                    hint="Gruptaki maksimum kişi sayısı"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="formData.monthlyPrice"
                    label="Paket / Aylık Ücret (₺)"
                    variant="outlined"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    hint="Opsiyonel fiyat"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="formData.monthlyLessons"
                    label="Aylık / Paket Ders Sayısı"
                    variant="outlined"
                    type="number"
                    prepend-inner-icon="mdi-format-list-numbered"
                    hint="Opsiyonel"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="formData.icon"
                    label="İkon Sınıfı"
                    variant="outlined"
                    :prepend-inner-icon="formData.icon || 'mdi-help-circle-outline'"
                    hint="Örn: mdi-star"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="formData.isActive"
                    color="success"
                    label="Aktif"
                    hint="Pasif türler seçim listelerinde görünmez"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              variant="text"
              @click="closeDialog"
            >
              İptal
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :loading="saving"
              :disabled="!formValid"
              @click="saveForm"
            >
              {{ isEditing ? 'Güncelle' : 'Oluştur' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="450">
        <v-card>
          <v-card-title class="pa-6 bg-error">
            <v-icon icon="mdi-delete-alert" class="mr-2" />
            Üyelik Türünü Sil
          </v-card-title>

          <v-card-text class="pa-6">
            <p class="text-body-1">
              <strong>{{ selectedType?.name }}</strong> üyelik türünü silmek istediğinizden emin misiniz?
            </p>
            <v-alert type="warning" variant="tonal" class="mt-4">
              <strong>Dikkat:</strong> Bu üyelik türünü kullanan mevcut öğrenciler etkilenebilir.
            </v-alert>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              variant="text"
              @click="deleteDialog = false"
            >
              İptal
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              :loading="deleting"
              @click="deleteType"
            >
              Sil
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        :timeout="3000"
      >
        {{ snackbarText }}
        <template #actions>
          <v-btn variant="text" @click="snackbar = false">
            Kapat
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMembershipTypesStore } from '@/store/modules/membershipTypes'
import { AVAILABLE_COLORS } from '@/types/membershipType'
import type { MembershipType } from '@/types/membershipType'

const membershipTypesStore = useMembershipTypesStore()

// Dialog state
const dialog = ref(false)
const deleteDialog = ref(false)
const isEditing = ref(false)
const selectedType = ref<MembershipType | null>(null)
const formRef = ref<any>(null)
const formValid = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Form data
const defaultFormData = {
  key: '',
  name: '',
  description: '',
  color: 'primary',
  isGroupType: false,
  maxCapacity: 8,
  order: 1,
  isActive: true,
  monthlyPrice: null as number | null,
  monthlyLessons: null as number | null,
  icon: ''
}

const formData = ref({ ...defaultFormData })

// Color options
const colorOptions = AVAILABLE_COLORS

// Validation rules
const rules = {
  required: (v: any) => !!v || 'Bu alan zorunludur',
  keyFormat: (v: string) => /^[a-z0-9_]+$/.test(v) || 'Sadece küçük harf, rakam ve alt çizgi kullanın',
  positiveNumber: (v: number) => v > 0 || 'Pozitif bir sayı girin'
}

// Helper to get actual color value for background
const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'purple': '#9c27b0',
    'deep-purple': '#673ab7',
    'indigo': '#3f51b5',
    'blue': '#2196f3',
    'light-blue': '#03a9f4',
    'cyan': '#00bcd4',
    'teal': '#009688',
    'green': '#4caf50',
    'light-green': '#8bc34a',
    'lime': '#cddc39',
    'yellow': '#ffeb3b',
    'amber': '#ffc107',
    'orange': '#ff9800',
    'deep-orange': '#ff5722',
    'red': '#f44336',
    'pink': '#e91e63',
    'grey': '#9e9e9e',
    'blue-grey': '#607d8b',
    'primary': '#1976d2',
    'success': '#4caf50',
    'warning': '#ff9800',
    'error': '#f44336',
    'info': '#2196f3'
  }
  return colorMap[colorName] || colorMap['primary']
}

// Dialog methods
const openCreateDialog = () => {
  isEditing.value = false
  formData.value = { 
    ...defaultFormData,
    order: (membershipTypesStore.allTypes.length || 0) + 1
  }
  dialog.value = true
}

const openEditDialog = (type: MembershipType) => {
  isEditing.value = true
  selectedType.value = type
  formData.value = {
    key: type.key,
    name: type.name,
    description: type.description || '',
    color: type.color,
    isGroupType: type.isGroupType,
    maxCapacity: type.maxCapacity || 8,
    order: type.order,
    isActive: type.isActive,
    monthlyPrice: type.monthlyPrice ?? null,
    monthlyLessons: type.monthlyLessons ?? null,
    icon: type.icon || ''
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  isEditing.value = false
  selectedType.value = null
  formData.value = { ...defaultFormData }
  formRef.value?.reset()
}

// Save form
const saveForm = async () => {
  if (!formRef.value?.validate()) return
  
  saving.value = true
  
  try {
    const dataToSave: any = { ...formData.value }
    if (dataToSave.monthlyPrice === null) delete dataToSave.monthlyPrice
    if (dataToSave.monthlyLessons === null) delete dataToSave.monthlyLessons
    if (!dataToSave.icon) delete dataToSave.icon

    if (isEditing.value && selectedType.value?.id) {
      await membershipTypesStore.update(selectedType.value.id, dataToSave)
      showSnackbar('Üyelik türü güncellendi', 'success')
    } else {
      await membershipTypesStore.create(dataToSave)
      showSnackbar('Yeni üyelik türü oluşturuldu', 'success')
    }
    closeDialog()
  } catch (error) {
    showSnackbar((error as Error).message || 'Bir hata oluştu', 'error')
  } finally {
    saving.value = false
  }
}

// Toggle active status
const toggleActive = async (type: MembershipType) => {
  try {
    await membershipTypesStore.toggleActive(type.id!, !type.isActive)
    showSnackbar(
      type.isActive ? 'Üyelik türü pasifleştirildi' : 'Üyelik türü aktifleştirildi',
      'success'
    )
  } catch (error) {
    showSnackbar((error as Error).message || 'Bir hata oluştu', 'error')
  }
}

// Delete methods
const confirmDelete = (type: MembershipType) => {
  selectedType.value = type
  deleteDialog.value = true
}

const deleteType = async () => {
  if (!selectedType.value?.id) return
  
  deleting.value = true
  
  try {
    await membershipTypesStore.remove(selectedType.value.id)
    showSnackbar('Üyelik türü silindi', 'success')
    deleteDialog.value = false
    selectedType.value = null
  } catch (error) {
    showSnackbar((error as Error).message || 'Silme işlemi başarısız', 'error')
  } finally {
    deleting.value = false
  }
}

// Snackbar helper
const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Initialize
onMounted(async () => {
  await membershipTypesStore.initialize()
})
</script>

<style scoped>
.membership-type-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding-top: 20px;
  padding-bottom: 40px;
}

.membership-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.membership-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.inactive-card {
  opacity: 0.7;
}

.card-header {
  position: relative;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  min-width: 100px;
}

.info-value {
  font-size: 0.9rem;
}

code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
