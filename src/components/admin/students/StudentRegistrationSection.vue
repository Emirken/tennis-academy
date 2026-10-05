<template>
  <v-card class="modern-card mb-4" elevation="2">
    <v-card-title class="pa-4 bg-info text-white d-flex align-center">
      <v-icon icon="mdi-clipboard-account-outline" class="mr-2" />
      Kayıt Formu
    </v-card-title>
    <v-card-text class="pa-4">
      <template v-if="!editMode">
        <v-alert v-if="!hasAnswers" type="info" variant="tonal" density="compact" class="mb-3">
          Bu öğrenci kayıt formu kullanılmaya başlanmadan önce kaydolmuş; form alanları boş.
        </v-alert>
        <v-row dense>
          <v-col v-for="(column, index) in columns" :key="index" cols="12" sm="6">
            <div v-for="row in column" :key="row.label" class="info-item mb-3">
              <label class="info-label">{{ row.label }}:</label>
              <span class="info-value">{{ row.value }}</span>
            </div>
          </v-col>
        </v-row>
      </template>

      <template v-else>
        <v-row dense>
          <v-col cols="6">
            <v-text-field
                v-model="form.heightCm"
                label="Boy (cm)"
                type="number"
                variant="outlined"
                density="compact"
                :error-messages="err('heightCm')"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
                v-model="form.weightKg"
                label="Kilo (kg)"
                type="number"
                variant="outlined"
                density="compact"
                :error-messages="err('weightKg')"
            />
          </v-col>
        </v-row>
        <v-text-field
            v-model="form.occupation"
            label="Meslek"
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('occupation')"
        />

        <div class="text-subtitle-2 font-weight-bold">Öğrenci 18 yaşından küçük mü?</div>
        <v-radio-group v-model="form.isMinor" inline density="compact" hide-details class="mb-3">
          <v-radio label="Evet" :value="true" />
          <v-radio label="Hayır" :value="false" />
        </v-radio-group>

        <div class="text-subtitle-2 font-weight-bold">Eğitim Türü</div>
        <div class="registration-options mb-2">
          <v-checkbox
              v-for="opt in TRAINING_TYPE_OPTIONS"
              :key="opt.value"
              v-model="form.trainingTypes"
              :value="opt.value"
              :label="opt.title"
              density="compact"
              hide-details
          />
        </div>
        <v-text-field
            v-if="form.trainingTypes.includes('other')"
            v-model="form.trainingTypeOther"
            label="Diğer eğitim türü"
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('trainingTypeOther')"
        />

        <div class="text-subtitle-2 font-weight-bold">Sağlık durumu / fiziksel kısıtlılık</div>
        <v-radio-group v-model="form.hasHealthCondition" inline density="compact" hide-details class="mb-2">
          <v-radio label="Hayır" :value="false" />
          <v-radio label="Evet" :value="true" />
        </v-radio-group>
        <v-textarea
            v-if="form.hasHealthCondition === true"
            v-model="form.healthConditionNote"
            label="Sağlık durumu açıklaması"
            rows="2"
            auto-grow
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('healthConditionNote')"
        />
        <v-textarea
            v-model="form.specialCareNote"
            label="Düzenli dikkat edilmesi gereken durum"
            rows="2"
            auto-grow
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('specialCareNote')"
        />
        <v-textarea
            v-model="form.coachNote"
            label="Antrenöre not"
            rows="2"
            auto-grow
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('coachNote')"
        />

        <v-select
            v-model="form.referralSource"
            label="Nereden Duydu"
            :items="REFERRAL_SOURCE_OPTIONS"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            clearable
            class="mb-2"
        />
        <v-text-field
            v-if="form.referralSource === 'friend' || form.referralSource === 'other'"
            v-model="form.referralDetail"
            :label="form.referralSource === 'friend' ? 'Referans ismi' : 'Açıklama'"
            variant="outlined"
            density="compact"
            class="mb-2"
            :error-messages="err('referralDetail')"
        />

        <v-checkbox
            v-model="form.marketingConsent"
            :disabled="!info.marketingConsent"
            label="Pazarlama izni"
            density="compact"
            persistent-hint
            :hint="info.marketingConsent
              ? 'İzni kaldırabilirsiniz; izin yalnız öğrencinin kendi beyanıyla verilir.'
              : 'İzin yalnız öğrencinin kendi beyanıyla verilir.'"
        />
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { REFERRAL_SOURCE_OPTIONS, TRAINING_TYPE_OPTIONS } from '@/utils/registrationForm'
import {
  effectiveIsMinor,
  formatDateTr,
  formatYmdTr,
  hasRegistrationAnswers,
  referralLabel,
  trainingTypesLabel,
  yesNoLabel,
  type RegistrationEditErrors,
  type RegistrationEditForm,
  type StudentRegistrationInfo,
} from '@/utils/studentRegistrationAdmin'

// Öğrenci detayındaki "Kayıt Formu" bölümü: okuma modunda formun cevapları,
// düzenleme modunda admin'in değiştirebileceği alanlar. Onay zamanları salt okunur;
// pazarlama izni yalnız geri alınabilir (öğrencinin beyanı olmadan verilemez).
const props = defineProps<{
  info: StudentRegistrationInfo
  editMode: boolean
  errors?: RegistrationEditErrors
}>()
const form = defineModel<RegistrationEditForm>('form', { required: true })

const dash = (value: string) => value || '—'
const err = (field: keyof RegistrationEditForm): string | string[] => props.errors?.[field] ?? []
const hasAnswers = computed(() => hasRegistrationAnswers(props.info))

const heightWeight = computed(() => {
  const h = props.info.heightCm === null ? '' : `${props.info.heightCm} cm`
  const w = props.info.weightKg === null ? '' : `${props.info.weightKg} kg`
  return [h, w].filter(Boolean).join(' / ') || '—'
})

const health = computed(() => {
  if (props.info.hasHealthCondition === true) return `Var — ${props.info.healthConditionNote || 'açıklama yok'}`
  if (props.info.hasHealthCondition === false) return 'Yok'
  return '—'
})

const consent = (date: Date | null) => (date ? `Onaylandı (${formatDateTr(date)})` : '—')

const columns = computed(() => [
  [
    { label: 'Doğum Tarihi', value: dash(formatYmdTr(props.info.birthDate)) },
    { label: 'Boy / Kilo', value: heightWeight.value },
    { label: 'Meslek', value: dash(props.info.occupation) },
    { label: '18 Yaş Altı', value: yesNoLabel(effectiveIsMinor(props.info)) },
    { label: 'Eğitim Türü', value: dash(trainingTypesLabel(props.info.trainingTypes, props.info.trainingTypeOther)) },
    { label: 'Nereden Duydu', value: dash(referralLabel(props.info.referralSource, props.info.referralDetail)) },
  ],
  [
    { label: 'Sağlık Durumu', value: health.value },
    { label: 'Dikkat Edilecek Durum', value: dash(props.info.specialCareNote) },
    { label: 'Antrenöre Not', value: dash(props.info.coachNote) },
    { label: 'Sorumluluk Beyanı', value: consent(props.info.waiverAcceptedAt) },
    { label: 'Veri Kullanım Onayı', value: consent(props.info.dataConsentAcceptedAt) },
    {
      label: 'Pazarlama İzni',
      value: props.info.marketingConsent
        ? `Evet (${formatDateTr(props.info.marketingConsentAt) || 'tarih yok'})`
        : 'Hayır',
    },
  ],
])
</script>

<style scoped>
.registration-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
</style>
