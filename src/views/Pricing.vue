<template>
  <div class="pricing-page">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h1 class="page-title mb-4">2025 Yılı Fiyat Listesi</h1>
        <!-- Admin Controls -->
        <div v-if="authStore.isAdmin" class="admin-controls mb-4">
          <v-btn
              v-if="!editMode"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-pencil"
              @click="enableEditMode"
          >
            Fiyatları Düzenle
          </v-btn>
          <div v-else class="d-flex gap-2 justify-center">
            <v-btn
                color="success"
                variant="flat"
                prepend-icon="mdi-check"
                @click="savePrices"
                :loading="saving"
            >
              Değişiklikleri Kaydet
            </v-btn>
            <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-close"
                @click="cancelEdit"
            >
              İptal
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Main Pricing Grid -->
      <v-row>
        <!-- Özel Dersler -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100" elevation="8">
            <v-card-title class="section-title">Özel Dersler</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>1 Kişi (45 dk)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelDers1Kisi45dk }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelDers1Kisi45dk"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>2 Kişi (60 dk)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelDers2Kisi60dk }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelDers2Kisi60dk"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Özel Grup Dersler -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100" elevation="8">
            <v-card-title class="section-title">Özel Grup Dersler</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>3 Kişi (8 Ders)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelGrup3Kisi }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelGrup3Kisi"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>4 Kişi (8 Ders)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelGrup4Kisi }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelGrup4Kisi"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Özel Paket Dersler -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100 featured-card" elevation="12">
            <v-card-title class="section-title">Özel Paket Dersler</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>1 Kişi (8 Ders)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelPaket1Kisi }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelPaket1Kisi"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>2 Kişi (8 Ders)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.ozelPaket2Kisi }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.ozelPaket2Kisi"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Yetişkin Grup Dersleri -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100" elevation="8">
            <v-card-title class="section-title">Yetişkin Grup Dersleri</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-subtitle class="text-caption text-grey mb-2">Seviye</v-list-item-subtitle>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Başlangıç - Orta - İleri</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.yetiskinGrup }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.yetiskinGrup"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Tenis Okulu -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100" elevation="8">
            <v-card-title class="section-title">Tenis Okulu</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-subtitle class="text-caption text-grey mb-2">5-7 | 8-9 | 10-12 | 12-14 | 15-17</v-list-item-subtitle>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Yaş grupları</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.tenisOkuluYas }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.tenisOkuluYas"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-subtitle class="text-caption text-grey mb-2">4 Gün</v-list-item-subtitle>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Performans</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.tenisOkuluPerformans }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.tenisOkuluPerformans"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Kort Rezervasyon -->
        <v-col cols="12" md="6" class="mb-6">
          <v-card class="pricing-card h-100" elevation="8">
            <v-card-title class="section-title">Kort Rezervasyon</v-card-title>
            <v-card-text class="pa-6">
              <v-list class="pricing-list">
                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>1 Saat</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.kortRezervasyonSaat }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.kortRezervasyonSaat"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>10 Saat (paket)</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.kortRezervasyonPaket }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.kortRezervasyonPaket"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item class="pricing-item">
                  <v-list-item-subtitle class="text-caption text-grey mb-2">1 saat</v-list-item-subtitle>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Raket & Top</span>
                    <span v-if="!editMode || !authStore.isAdmin" class="price">{{ pricing.raketTop }} ₺</span>
                    <v-text-field
                        v-else
                        v-model.number="editPricing.raketTop"
                        type="number"
                        suffix="₺"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="price-input"
                    />
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Important Notes -->
      <v-row justify="center" class="mt-8">
        <v-col cols="12" md="10">
          <v-card class="info-card" elevation="4">
            <v-card-text class="pa-6">
              <div class="important-notes">
                <div class="note-item mb-4">
                  <div class="d-flex align-start">
                    <v-icon
                        icon="mdi-information"
                        color="#2E7D32"
                        class="me-3 mt-1 flex-shrink-0"
                    />
                    <div class="note-text">
                      <p class="text-body-1 mb-0">
                        Paket dersler kayıt tarihinden itibaren maksimum 45 gün içinde tamamlanmalıdır
                      </p>
                    </div>
                  </div>
                </div>

                <div class="note-item">
                  <div class="d-flex align-start">
                    <v-icon
                        icon="mdi-information"
                        color="#2E7D32"
                        class="me-3 mt-1 flex-shrink-0"
                    />
                    <div class="note-text">
                      <p class="text-body-1 mb-0">
                        Grup çalışmalarımız 5-6 kişi ile sınırlı olup, haftada 2 gün, ayda 8 ders olarak yapılmaktadır.
                        Bir ders süremiz 60 dakikadır. Yeni başlayan kursiyerlerimiz için raket, top vb. ihtiyaçlar
                        kulübümüz tarafından karşılanmaktadır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Contact Information -->
      <v-row justify="center" class="mt-6">
        <v-col cols="12" md="8">
          <v-card class="contact-card" elevation="4">
            <v-card-text class="pa-6 text-center">
              <h3 class="text-h5 mb-4">İletişim</h3>
              <div class="d-flex justify-center align-center gap-4 flex-wrap">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-phone" class="me-2" />
                  <span class="text-h6">0551 850 8486</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-instagram" class="me-2" />
                  <span class="text-h6">urlatenis</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Success/Error Snackbars -->
      <v-snackbar
          v-model="showSuccessMessage"
          color="success"
          timeout="3000"
          location="top"
      >
        <v-icon icon="mdi-check-circle" class="me-2" />
        Fiyatlar başarıyla güncellendi!
      </v-snackbar>

      <v-snackbar
          v-model="showErrorMessage"
          color="error"
          timeout="4000"
          location="top"
      >
        <v-icon icon="mdi-alert-circle" class="me-2" />
        {{ errorMessage }}
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

// Store
const authStore = useAuthStore()

// Reactive data
const editMode = ref(false)
const saving = ref(false)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const errorMessage = ref('')

// Pricing data - matching your Turkish price list
const pricing = reactive({
  // Özel Dersler
  ozelDers1Kisi45dk: 2000,
  ozelDers2Kisi60dk: 3500,

  // Özel Grup Dersler
  ozelGrup3Kisi: 10000,
  ozelGrup4Kisi: 7500,

  // Özel Paket Dersler
  ozelPaket1Kisi: 15000,
  ozelPaket2Kisi: 25000,

  // Yetişkin Grup Dersleri
  yetiskinGrup: 6000,

  // Tenis Okulu
  tenisOkuluYas: 6000,
  tenisOkuluPerformans: 10000,

  // Kort Rezervasyon
  kortRezervasyonSaat: 1000,
  kortRezervasyonPaket: 7500,
  raketTop: 500
})

// Edit pricing data
const editPricing = reactive({
  ozelDers1Kisi45dk: 2000,
  ozelDers2Kisi60dk: 3500,
  ozelGrup3Kisi: 10000,
  ozelGrup4Kisi: 7500,
  ozelPaket1Kisi: 15000,
  ozelPaket2Kisi: 25000,
  yetiskinGrup: 6000,
  tenisOkuluYas: 6000,
  tenisOkuluPerformans: 10000,
  kortRezervasyonSaat: 1000,
  kortRezervasyonPaket: 7500,
  raketTop: 500
})

// Methods
const enableEditMode = () => {
  editMode.value = true
  // Copy current prices to edit mode
  Object.assign(editPricing, pricing)
}

const cancelEdit = () => {
  editMode.value = false
  // Reset edit prices to original values
  Object.assign(editPricing, pricing)
}

const savePrices = async () => {
  if (!authStore.isAdmin) {
    showErrorMessage.value = true
    errorMessage.value = 'Yetkisiz: Sadece yöneticiler fiyatları güncelleyebilir'
    return
  }

  // Validate prices
  const invalidPrices = Object.values(editPricing).some(price => price <= 0)
  if (invalidPrices) {
    showErrorMessage.value = true
    errorMessage.value = 'Tüm fiyatlar 0\'dan büyük olmalıdır'
    return
  }

  saving.value = true

  try {
    const pricesData = {
      ...editPricing,
      updatedAt: serverTimestamp(),
      updatedBy: authStore.user?.email || 'Bilinmeyen'
    }

    // Save to Firestore
    await setDoc(doc(db, 'settings', 'pricing'), pricesData, { merge: true })

    // Update local pricing
    Object.assign(pricing, editPricing)

    // Exit edit mode
    editMode.value = false
    showSuccessMessage.value = true

    console.log('✅ Fiyatlar başarıyla güncellendi:', pricesData)
  } catch (error: any) {
    console.error('❌ Fiyatları güncelleme hatası:', error)
    showErrorMessage.value = true
    errorMessage.value = 'Fiyatları güncellemede hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    saving.value = false
  }
}

const loadPrices = async () => {
  try {
    const pricesDoc = await getDoc(doc(db, 'settings', 'pricing'))

    if (pricesDoc.exists()) {
      const data = pricesDoc.data()
      Object.assign(pricing, data)
      console.log('✅ Fiyatlar yüklendi:', data)
    } else {
      console.log('📝 Fiyat belgesi bulunamadı, varsayılanlar kullanılıyor')
      // Create initial pricing document if admin
      if (authStore.isAdmin) {
        await savePrices()
      }
    }
  } catch (error: any) {
    console.error('❌ Fiyatları yükleme hatası:', error)
    // Use default prices if loading fails
  }
}

// Lifecycle
onMounted(() => {
  loadPrices()
})
</script>

<style scoped>
.pricing-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2E7D32;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.admin-controls {
  margin-top: 16px;
}

.admin-controls .v-btn {
  margin: 0 8px;
}

.pricing-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid transparent;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  border-color: #2E7D32;
}

.featured-card {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
  color: white;
  position: relative;
}

.featured-card::before {
  content: 'POPÜLER';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #1B5E20;
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.featured-card .section-title {
  color: white !important;
}

.featured-card .pricing-list .v-list-item-title {
  color: white;
}

.featured-card .pricing-list .v-list-item-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2E7D32;
  background: rgba(46, 125, 50, 0.1);
  padding: 16px 24px;
  margin: 0;
  border-radius: 16px 16px 0 0;
}

.pricing-list {
  background: transparent;
}

.pricing-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.pricing-item:last-child {
  border-bottom: none;
}

.pricing-item .v-list-item-title {
  font-size: 1rem;
  font-weight: 500;
}

.price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2E7D32;
}

.featured-card .price {
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.price-input {
  max-width: 120px;
}

.price-input :deep(.v-field__input) {
  text-align: right;
  font-weight: 600;
}

.info-card {
  background: white;
  border: 2px solid #2E7D32;
  border-radius: 16px;
}

.important-notes .v-list-item {
  padding: 8px 0;
  align-items: flex-start;
}

.important-notes .v-list-item-title {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #444;
}

.contact-card {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%) !important;
  color: white !important;
  border-radius: 16px;
}

.contact-card h3 {
  color: white !important;
}

.contact-card .v-icon {
  color: white !important;
}

.contact-card .text-h6 {
  color: white !important;
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

@media (max-width: 960px) {
  .page-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 1.2rem;
    padding: 12px 16px;
  }

  .pricing-item .v-list-item-title {
    font-size: 0.9rem;
  }

  .price {
    font-size: 1.1rem;
  }

  .price-input {
    max-width: 100px;
  }

  .admin-controls .v-btn {
    margin: 4px;
  }

  .contact-card .d-flex {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .pricing-item .v-list-item-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .price-input {
    max-width: 80px;
  }
}
</style>