<template>
  <div>
    <!-- Hero Bölümü -->
    <section class="hero-section">
      <v-container fluid class="pa-0">
        <div class="hero-image-container">
          <v-img
              src="/images/tennis-court-hero.jpg"
              height="500"
              cover
              class="hero-image"
          >
            <div class="hero-overlay">
              <v-container class="hero-content">
                <v-row justify="center" align="center" class="fill-height">
                  <v-col cols="12" md="8" class="text-center">
                    <h1 class="hero-title text-white mb-4">
                      Urla Tenis Akademisi'ne Hoş Geldiniz
                    </h1>
                    <p class="hero-subtitle text-white mb-6">
                      Urla'daki tenis mükemmelliğinin öncü adresi. Kortunuzu bugün rezerve edin ve farkı yaşayın!
                    </p>
                  </v-col>
                </v-row>
              </v-container>
            </div>
          </v-img>
        </div>
      </v-container>
    </section>

    <!-- Tesislerimiz Bölümü -->
    <section class="facilities-section py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="section-title mb-4">Tesislerimiz</h2>
          <p class="section-subtitle text-grey-darken-1">
            Modern ve konforlu tesislerimizde tenis keyfinizi yaşayın
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="4" class="mb-6">
            <v-card class="facility-card" elevation="4" hover>
              <v-img
                  src="/images/indoor-courts.jpg"
                  height="250"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-home" size="48" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="facility-title mb-3">Kapalı Kortlar</h3>
                <p class="facility-description">
                  Yıl boyunca oyun için iklim kontrollü kortlar. Her mevsim konforlu tenis deneyimi yaşayın.
                </p>
                <v-chip size="small" color="primary" variant="flat" class="mt-2">
                  4 Kort
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="mb-6">
            <v-card class="facility-card" elevation="4" hover>
              <v-img
                  src="/images/outdoor-courts.jpg"
                  height="250"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-weather-sunny" size="48" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="facility-title mb-3">Açık Kortlar</h3>
                <p class="facility-description">
                  Güneşin altında doğayla iç içe tenis keyfi. Mükemmel hava koşullarında unutulmaz maçlar.
                </p>
                <v-chip size="small" color="success" variant="flat" class="mt-2">
                  3 Kort
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="mb-6">
            <v-card class="facility-card" elevation="4" hover>
              <v-img
                  src="/images/training-center.jpg"
                  height="250"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-dumbbell" size="48" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="facility-title mb-3">Antrenman Merkezi</h3>
                <p class="facility-description">
                  Son teknoloji antrenman tesisleri. Profesyonel ekipmanlarla tekniğinizi geliştirin.
                </p>
                <v-chip size="small" color="orange" variant="flat" class="mt-2">
                  Modern Ekipman
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Programlarımız Bölümü -->
    <section class="programs-section py-16 bg-grey-lighten-5">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="section-title mb-4">Programlarımız</h2>
          <p class="section-subtitle text-grey-darken-1">
            Her seviyeden oyuncu için özel tasarlanmış programlar
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="4" class="mb-6">
            <v-card class="program-card" elevation="4" hover>
              <v-img
                  src="/images/coaching.jpg"
                  height="200"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-account-tie" size="40" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="program-title mb-3">Özel Ders</h3>
                <p class="program-description">
                  Tüm seviyelere uygun profesyonel antrenörlük. Bireysel gelişiminiz için özelleştirilmiş eğitim.
                </p>
                <div class="mt-4">
                  <v-chip size="small" color="primary" variant="outlined" class="me-2">
                    Birebir
                  </v-chip>
                  <v-chip size="small" color="primary" variant="outlined">
                    Esnek Saatler
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="mb-6">
            <v-card class="program-card" elevation="4" hover>
              <v-img
                  src="/images/junior-programs.jpg"
                  height="200"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-account-child" size="40" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="program-title mb-3">Çocuk Programları</h3>
                <p class="program-description">
                  Genç oyuncular için eğlenceli ve öğretici programlar. Sporla sağlıklı büyüme.
                </p>
                <div class="mt-4">
                  <v-chip size="small" color="success" variant="outlined" class="me-2">
                    6-16 Yaş
                  </v-chip>
                  <v-chip size="small" color="success" variant="outlined">
                    Grup Dersi
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="mb-6">
            <v-card class="program-card" elevation="4" hover>
              <v-img
                  src="/images/adult-leagues.jpg"
                  height="200"
                  cover
              >
                <div class="card-overlay">
                  <v-icon icon="mdi-trophy" size="40" color="white" />
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="program-title mb-3">Yetişkin Ligleri</h3>
                <p class="program-description">
                  Yetişkin oyuncular için rekabetçi ligler. Sosyal tenis ortamında becerilerinizi test edin.
                </p>
                <div class="mt-4">
                  <v-chip size="small" color="orange" variant="outlined" class="me-2">
                    Turnuvalar
                  </v-chip>
                  <v-chip size="small" color="orange" variant="outlined">
                    Sosyal
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Antrenörlerimiz Bölümü -->
    <section class="trainers-section py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="section-title mb-4">Antrenörlerimiz</h2>
          <p class="section-subtitle text-grey-darken-1">
            Deneyimli ve sertifikalı antrenörlerle tenis yolculuğunuz
          </p>
        </div>

        <v-row justify="center">
          <v-col cols="12" md="4" class="mb-6">
            <v-card class="trainer-card text-center" elevation="4" hover>
              <v-img
                  src="/images/trainer1.jpg"
                  height="300"
                  cover
              >
                <div class="trainer-overlay">
                  <v-chip color="primary" variant="flat" class="trainer-badge">
                    Baş Antrenör
                  </v-chip>
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="trainer-name mb-2">Sarah Johnson</h3>
                <p class="trainer-title text-primary mb-3">Baş Antrenör</p>
                <p class="trainer-description text-grey-darken-1">
                  15 yıllık deneyim, ITF sertifikalı
                </p>
                <div class="trainer-stats mt-4">
                  <v-row>
                    <v-col cols="6">
                      <div class="stat-number">200+</div>
                      <div class="stat-label">Öğrenci</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="stat-number">15</div>
                      <div class="stat-label">Yıl Deneyim</div>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="mb-6">
            <v-card class="trainer-card text-center" elevation="4" hover>
              <v-img
                  src="/images/trainer2.jpg"
                  height="300"
                  cover
              >
                <div class="trainer-overlay">
                  <v-chip color="success" variant="flat" class="trainer-badge">
                    Tenis Uzmanı
                  </v-chip>
                </div>
              </v-img>
              <v-card-text class="pa-6">
                <h3 class="trainer-name mb-2">Michael Davis</h3>
                <p class="trainer-title text-primary mb-3">Tenis Uzmanı</p>
                <p class="trainer-description text-grey-darken-1">
                  Eski profesyonel oyuncu, çocuk uzmanı
                </p>
                <div class="trainer-stats mt-4">
                  <v-row>
                    <v-col cols="6">
                      <div class="stat-number">150+</div>
                      <div class="stat-label">Öğrenci</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="stat-number">12</div>
                      <div class="stat-label">Yıl Deneyim</div>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- İletişim Bölümü -->
    <section class="contact-section py-16 bg-primary">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="8">
            <h2 class="text-white mb-4">Hemen Başlayın!</h2>
            <p class="text-white text-h6 mb-0">
              Tenis yolculuğunuza bugün başlayın. İlk dersinizi rezerve edin.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-md-end">
            <v-btn
                size="large"
                color="white"
                variant="flat"
                class="contact-btn"
                :to="{ name: 'Login' }"
            >
              Hemen Kayıt Ol
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup lang="ts">
// Gerekirse component mantığı buraya eklenebilir
</script>

<style scoped>

</style>