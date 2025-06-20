<template>
  <div class="contact-page">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="welcome-section mt-8 mx-15 mb-8">
        <v-container>
          <v-row align="center" class="py-6">
            <v-col cols="12" md="8">
              <div class="welcome-content">
                <h1 class="welcome-title mb-3">
                  İletişim
                </h1>
                <p class="welcome-subtitle">
                  Size yardımcı olmak için buradayız! Herhangi bir sorunuz veya talebiniz için bizimle iletişime geçin.
                </p>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <div class="date-time-widget">
                <div class="current-date">İletişim Bilgileri</div>
                <div class="current-time">7/24 Hizmet</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container>
        <!-- Contact Information Cards -->
        <v-row class="mb-8">
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
                  <p class="contact-value">+90 (555) 596 38 21</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="primary">mdi-phone-ring</v-icon>
                    <span class="trend-text">7/24 Ulaşabilirsiniz</span>
                  </div>
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
                  <p class="contact-value">info@urlatennis.com</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="success">mdi-email-fast</v-icon>
                    <span class="trend-text">Hızlı Yanıt</span>
                  </div>
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
                  <div class="stat-trend">
                    <v-icon size="16" color="info">mdi-directions</v-icon>
                    <span class="trend-text">Kolay Ulaşım</span>
                  </div>
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
                  <p class="contact-value">Pazartesi - Cuma: 06:00 - 22:00</p>
                  <p class="contact-extra">Cumartesi - Pazar: 07:00 - 21:00</p>
                  <div class="stat-trend">
                    <v-icon size="16" color="warning">mdi-calendar-clock</v-icon>
                    <span class="trend-text">Geniş Saat Aralığı</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Map Section -->
        <v-row class="mb-8">
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