<template>
  <div class="schedule-settings">
    <v-container>
      <!-- Header Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon icon="mdi-clock-outline" class="mr-2" color="primary" />
              Ders Saatleri Ayarları
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              İlk ve son ders saatini ayarlayın. Bu ayar tüm kort takvimlerini,
              doluluk hesabını ve rezervasyon formlarını etkiler.
            </p>
          </div>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card variant="outlined" rounded="lg">
            <v-card-title class="text-h6 font-weight-bold py-4">
              <v-icon icon="mdi-calendar-clock" class="mr-2" color="primary" />
              Çalışma Saatleri
            </v-card-title>
            <v-divider />
            <v-card-text class="pt-6">
              <v-form ref="formRef">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="firstHourInput"
                      :items="firstHourOptions"
                      item-title="title"
                      item-value="value"
                      label="İlk Ders Saati"
                      prepend-inner-icon="mdi-weather-sunset-up"
                      variant="outlined"
                      :rules="[v => v != null || 'Zorunlu']"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="lastLessonStartInput"
                      :items="lastHourOptions"
                      item-title="title"
                      item-value="value"
                      label="Son Ders Başlangıç Saati"
                      prepend-inner-icon="mdi-weather-sunset-down"
                      variant="outlined"
                      :rules="[v => v != null || 'Zorunlu']"
                    />
                  </v-col>
                </v-row>

                <v-alert
                  v-if="rangeError"
                  type="warning"
                  variant="tonal"
                  density="comfortable"
                  class="mb-4"
                >
                  Son ders başlangıç saati ilk ders saatinden büyük olmalıdır.
                </v-alert>

                <v-alert
                  type="info"
                  variant="tonal"
                  density="comfortable"
                  class="mb-2"
                >
                  Bu ayarla dersler <strong>{{ pad(firstHourInput) }}:00</strong> ile
                  <strong>{{ pad(lastLessonStartInput) }}:00</strong> arasında başlar
                  (son ders {{ pad(lastLessonStartInput) }}:00'de başlar,
                  {{ pad(lastLessonStartInput + 1) }}:00'de biter). Toplam
                  <strong>{{ slotCount }}</strong> ders saati dilimi.
                </v-alert>
              </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-4">
              <v-spacer />
              <v-btn
                variant="text"
                :disabled="saving"
                @click="resetFromStore"
              >
                Sıfırla
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-content-save"
                :loading="saving"
                :disabled="rangeError"
                @click="save"
              >
                Kaydet
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useScheduleSettings } from '@/composables/useScheduleSettings'

const { firstHour, lastHour, updateSchedule } = useScheduleSettings()

// Kullanıcıya EXCLUSIVE lastHour yerine "son ders başlangıç saati" sorulur
// (daha az kafa karıştırıcı). Kaydederken +1 ile exclusive lastHour'a çevrilir.
const firstHourInput = ref<number>(firstHour.value)
const lastLessonStartInput = ref<number>(lastHour.value - 1)

const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const pad = (h: number) => (h ?? 0).toString().padStart(2, '0')

// Seçenekler: 0..23 (ilk ders), 1..23 (son ders başlangıç).
const firstHourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({ title: `${pad(i)}:00`, value: i }))
)
const lastHourOptions = computed(() =>
  Array.from({ length: 23 }, (_, i) => ({ title: `${pad(i + 1)}:00`, value: i + 1 }))
)

const rangeError = computed(() => lastLessonStartInput.value <= firstHourInput.value)
const slotCount = computed(() =>
  Math.max(0, lastLessonStartInput.value + 1 - firstHourInput.value)
)

// Store'dan (canlı) gelen değerleri forma yansıt — admin başka yerden değiştirirse.
const resetFromStore = () => {
  firstHourInput.value = firstHour.value
  lastLessonStartInput.value = lastHour.value - 1
}
watch([firstHour, lastHour], resetFromStore)

const save = async () => {
  if (rangeError.value) return
  saving.value = true
  try {
    // Son ders başlangıç saati → exclusive lastHour (+1).
    await updateSchedule(firstHourInput.value, lastLessonStartInput.value + 1)
    snackbar.value = {
      show: true,
      message: 'Ders saatleri başarıyla kaydedildi.',
      color: 'success',
    }
  } catch (error) {
    console.error('Ders saatleri kaydedilemedi:', error)
    snackbar.value = {
      show: true,
      message: 'Ders saatleri kaydedilirken bir hata oluştu.',
      color: 'error',
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.schedule-settings {
  padding: 16px 0;
}
</style>
