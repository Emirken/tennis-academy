<template>
  <div class="pricing-page">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Enhanced Welcome Section -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  2025 Yılı Fiyat Listesi
                </h1>
                <p class="welcome-subtitle">
                  Tenis akademi ders fiyatlarımız - En uygun paketlerimizi keşfedin!
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget" v-if="authStore.isAdmin">
                <div class="current-date">Admin Kontrolü</div>
                <div class="current-time">{{ getCurrentTime() }}</div>
              </div>
            </v-col>
          </v-row>
        </div>
        <!-- Admin Controls -->
        <div v-if="authStore.isAdmin" class="mb-6">
          <v-row>
            <v-col cols="12">
              <v-card class="modern-card admin-controls-card" elevation="0">
                <div class="stat-card-overlay"></div>
                <v-card-text class="pa-4">
                  <div class="d-flex justify-center">
                    <v-btn
                        v-if="!editMode"
                        variant="flat"
                        prepend-icon="mdi-pencil"
                        @click="enableEditMode"
                        class="text-white view-color nav-btn"
                    >
                      Fiyatları Düzenle
                    </v-btn>
                    <div v-else class="d-flex gap-2">
                      <v-btn
                          color="success"
                          variant="flat"
                          prepend-icon="mdi-check"
                          @click="savePrices"
                          :loading="saving"
                          class="nav-btn"
                      >
                        Değişiklikleri Kaydet
                      </v-btn>
                      <v-btn
                          color="error"
                          variant="outlined"
                          prepend-icon="mdi-close"
                          @click="cancelEdit"
                          class="ml-2 nav-btn"
                      >
                        İptal
                      </v-btn>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Main Pricing Grid -->
        <v-row class="mb-6">
          <!-- Özel Dersler -->
          <v-col cols="12" md="6" class="mb-6">
            <v-card class="modern-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-account" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number primary--text">Özel Dersler</h3>
                  <p class="stat-label">Bireysel ve ikili dersler</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">1 Kişi (45 dk)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.ozelDers1Kisi45dk }} ₺</span>
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
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">2 Kişi (60 dk)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.ozelDers2Kisi60dk }} ₺</span>
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

          <!-- Özel Paket Dersler -->
          <v-col cols="12" md="6" class="mb-6">
            <v-card class="modern-card h-100 featured-card" elevation="0">
              <div class="stat-card-overlay success-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-star" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">Özel Paket Dersler</h3>
                  <p class="stat-label">8 dersten oluşan paketler</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-trending-up</v-icon>
                    <span class="trend-text">Popüler seçim</span>
                  </div>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">1 Kişi (8 Ders)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display featured">{{ pricing.ozelPaket1Kisi }} ₺</span>
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
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">2 Kişi (8 Ders)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display featured">{{ pricing.ozelPaket2Kisi }} ₺</span>
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

          <!-- Özel Grup Dersler -->
          <v-col cols="12" md="6" class="mb-6">
            <v-card class="modern-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper info-gradient">
                  <v-icon icon="mdi-account-group" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number info--text">Özel Grup Dersler</h3>
                  <p class="stat-label">3-4 kişilik grup dersleri</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">3 Kişi (8 Ders)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.ozelGrup3Kisi }} ₺</span>
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
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">4 Kişi (8 Ders)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.ozelGrup4Kisi }} ₺</span>
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

          <!-- Yetişkin Grup Dersleri -->
          <v-col cols="12" md="6" class="mb-6">
            <v-card class="modern-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-account-multiple" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number warning--text">Yetişkin Grup Dersleri</h3>
                  <p class="stat-label">Grup halinde dersler</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">Yetişkin Grup (Aylık)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.yetiskinGrup }} ₺</span>
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

                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">Çocuk Grup (Aylık)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.cocukGrupAylik }} ₺</span>
                      <v-text-field
                          v-else
                          v-model.number="editPricing.cocukGrupAylik"
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
            <v-card class="modern-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper amber-gradient">
                  <v-icon icon="mdi-school" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number amber--text">Tenis Okulu</h3>
                  <p class="stat-label">Yaş ve performans grupları</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">Yaş Grubu</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.tenisOkuluYas }} ₺</span>
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
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">Performans</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.tenisOkuluPerformans }} ₺</span>
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
            <v-card class="modern-card h-100" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper court-gradient">
                  <v-icon icon="mdi-tennis-ball" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number success--text">Kort Rezervasyon</h3>
                  <p class="stat-label">Saatlik kort kiralamaları</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <v-list class="pricing-list">
                  <v-list-item class="pricing-item">
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">1 Saat</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.kortRezervasyonSaat }} ₺</span>
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
                    <v-list-item-title class="d-flex justify-space-between align-center">
                      <span class="service-name">10 Saat (paket)</span>
                      <span v-if="!editMode || !authStore.isAdmin" class="price-display">{{ pricing.kortRezervasyonPaket }} ₺</span>
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
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Additional Info Section -->
        <v-row>
          <v-col cols="12">
            <v-card class="modern-card info-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper info-gradient">
                  <v-icon icon="mdi-information" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="stat-number info--text">Önemli Bilgiler</h3>
                  <p class="stat-label">Fiyatlar ve koşullar hakkında</p>
                </div>
              </v-card-text>
              <v-card-text class="pa-4 pt-0">
                <div class="info-text">
                  <p>
                    <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                    Yeni başlayan kursiyerlerimiz için raket, top vb. ihtiyaçlar kulübümüz tarafından karşılanmaktadır.
                  </p>
                  <p>
                    <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
                    Bir ders süremiz 60 dakikadır.
                  </p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Contact Information -->
        <v-row justify="center" class="mt-6">
          <v-col cols="12" md="8">
            <v-card class="modern-card contact-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="pa-4 text-center">
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
  cocukGrupAylik: 6000,

  // Kort Kiralama
  kortKiralamaGunduz: 1000,
  kortKiralamaAksam: 1200,

  // Diğer Hizmetler
  raketKiralama: 100,
  topSatisi: 50,

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
  cocukGrupAylik: 6000,
  kortKiralamaGunduz: 1000,
  kortKiralamaAksam: 1200,
  raketKiralama: 100,
  topSatisi: 50,
  tenisOkuluYas: 6000,
  tenisOkuluPerformans: 10000,
  kortRezervasyonSaat: 1000,
  kortRezervasyonPaket: 7500,
  raketTop: 500
})

// Methods
const getCurrentTime = () => {
  return new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

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
      updatedBy: authStore.user?.phone_number || 'Bilinmeyen'
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