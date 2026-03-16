<template>
  <div class="contact-page">
    <v-container fluid class="pa-0">
      <v-container>
        <!-- Enhanced Welcome Section -->
        <div class="welcome-section mt-6 mb-6">
          <v-row align="center" class="py-4">
            <v-col cols="12">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  İletişim
                </h1>
                <p class="welcome-subtitle">
                  Her türlü soru, talep ve rezervasyon işlemleri için bizimle iletişime geçebilirsiniz.
                  Ekibimiz size yardımcı olmaktan memnuniyet duyacaktır
                </p>
              </div>
            </v-col>
          </v-row>
        </div>
        <!-- Contact Information Cards -->
        <v-row class="mb-6">
          <!-- Phone -->
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card contact-info-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper primary-gradient">
                  <v-icon icon="mdi-phone" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="contact-label">Telefon</h3>
                  <p class="contact-value">+90 (551) 850 84 86</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Email -->
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card contact-info-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper success-gradient">
                  <v-icon icon="mdi-email" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="contact-label">E-posta</h3>
                  <p class="contact-value">urlatenisakademisi@gmail.com</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Address -->
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card contact-info-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper info-gradient">
                  <v-icon icon="mdi-map-marker" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="contact-label">Adres</h3>
                  <p class="contact-value">İskele, Mithatpaşa Cd. no:10, 35441 Urla/İzmir</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Working Hours -->
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card modern-card contact-info-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="stat-content">
                <div class="stat-icon-wrapper warning-gradient">
                  <v-icon icon="mdi-clock" size="32" color="white" />
                </div>
                <div class="stat-details">
                  <h3 class="contact-label">Çalışma Saatleri</h3>
                  <p class="contact-value">Pazartesi - Pazar: 08:00 - 22:00</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Map Section -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="section-header mb-6">
              <h2 class="section-title">Bizi Bulun</h2>
              <p class="section-subtitle">Urla Tenis Akademisi konumumuz</p>
            </div>
            <v-card class="modern-card map-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="pa-0">
                <div class="map-container">
                  <v-img
                      src="/images/map-placeholder.jpg"
                      height="400"
                      cover
                      class="d-flex align-center justify-center"
                  >
                    <div class="map-overlay">
                      <div style="justify-items: center" class="text-center text-white">
                        <div class="map-icon-wrapper mb-4">
                          <v-icon size="64" color="white">mdi-map-marker</v-icon>
                        </div>
                        <h3 class="map-title mb-2">Urla Tenis Akademisi - UTA</h3>
                        <p class="map-address">İskele, Mithatpaşa Cd. no:10</p>
                        <p class="map-city mb-4">35441 Urla/İzmir</p>
                        <v-btn
                            color="white"
                            variant="flat"
                            class="map-direction-btn"
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
    </v-container>
  </div>
</template>

<script setup lang="ts">
// No form functionality needed since contact form is removed
</script>

<style scoped>
/* Styles are handled in main.css */
</style>