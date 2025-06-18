<template>
  <div class="contact-view">
    <v-container class="py-8">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="page-title mb-4">İletişim</h1>
        <p class="page-subtitle text-success">
          Size yardımcı olmak için buradayız! Herhangi bir sorunuz veya talebiniz için bizimle iletişime geçin.
        </p>
      </div>

      <v-row>
        <!-- Contact Information -->
        <v-col cols="12" md="12" class="mb-6">
          <v-card class="contact-info-card h-100" elevation="4">
            <v-card-title class="text-h5 pa-6 bg-primary text-white">
              <v-icon icon="mdi-information" class="mr-2" />
              İletişim Bilgileri
            </v-card-title>

            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="contact-item mb-6">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" size="24" class="mr-4">mdi-phone</v-icon>
                      <span class="contact-label text-h6">Telefon</span>
                    </div>
                    <p class="contact-value">+90 (555) 596 38 21</p>
                  </div>

                  <div class="contact-item mb-6">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" size="24" class="mr-4">mdi-email</v-icon>
                      <span class="contact-label text-h6">E-posta</span>
                    </div>
                    <p class="contact-value">info@urlatennis.com</p>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="contact-item mb-6">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" size="24" class="mr-4">mdi-map-marker</v-icon>
                      <span class="contact-label text-h6">Adres</span>
                    </div>
                    <p class="contact-value">İskele, Mithatpaşa Cd. no:10, 35441<br>Urla / İzmir</p>
                  </div>

                  <div class="contact-item">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" size="24" class="mr-4">mdi-clock</v-icon>
                      <span class="contact-label text-h6">Çalışma Saatleri</span>
                    </div>
                    <div class="contact-value">
                      <p class="mb-1">Pazartesi - Cuma: 06:00 - 22:00</p>
                      <p class="mb-1">Cumartesi - Pazar: 07:00 - 21:00</p>
                      <p class="mb-0 text-caption text-grey">Resmi tatillerde kapalıyız</p>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Map Section -->
      <v-row class="mt-8">
        <v-col cols="12">
          <v-card elevation="4">
            <v-card-title class="text-h5 pa-6 bg-info text-white">
              <v-icon icon="mdi-map" class="mr-2" />
              Bizi Bulun
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="map-container">
                <v-img
                    src="/images/map-placeholder.jpg"
                    height="400"
                    cover
                    class="d-flex align-center justify-center"
                >
                  <div class="map-overlay">
                    <div class="text-center text-white">
                      <v-icon size="64" color="white" class="mb-4">mdi-map-marker</v-icon>
                      <h3 class="text-h4 mb-2">Urla Tenis Akademisi - UTA</h3>
                      <p class="text-h6">İskele, Mithatpaşa Cd. no:10</p>
                      <p class="text-body-1 mb-4">35441 Urla/İzmir</p>
                      <v-btn
                          color="white"
                          variant="flat"
                          class="mt-4"
                          href="https://maps.google.com/maps?q=UTA,+İskele,+Mithatpaşa+Cd.+no:10,+35441+Urla/İzmir&z=17"
                          target="_blank"
                      >
                        <v-icon icon="mdi-directions" class="mr-2" />
                        Yol Tarifi Al
                      </v-btn>
                    </div>
                  </div>
                </v-img>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// No form functionality needed since contact form is removed
</script>

<style scoped>
.contact-view {
  background-color: #fafafa;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2E7D32;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #4CAF50;
  max-width: 800px;
  margin: 0 auto;
  font-weight: 500;
}

.contact-info-card{
  border-radius: 12px;
  background: white;
}

.contact-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 24px;
}

.contact-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.contact-label {
  font-weight: 600;
  color: #2E7D32;
}

.contact-value {
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  margin-left: 36px;
  line-height: 1.6;
}

.map-container {
  position: relative;
  overflow: hidden;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 960px) {
  .page-title {
    font-size: 2rem;
  }

  .contact-value {
    margin-left: 0;
    margin-top: 8px;
  }

  .map-overlay h3 {
    font-size: 1.5rem;
  }

  .map-overlay p {
    font-size: 1rem;
  }
}
</style>