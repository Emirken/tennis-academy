<template>
  <div class="home-view">
    <!-- Hero Bölümü -->
    <section class="hero-section">
      <v-container fluid class="pa-0">
        <div class="hero-image-container">
          <v-img
              src="/images/tennis-court-hero.jpg"
              height="560"
              cover
              class="hero-image"
          >
            <div class="hero-overlay">
              <v-container class="hero-content">
                <v-row justify="center" align="center" class="fill-height">
                  <v-col cols="12" class="text-center">
                    <h1 class="hero-title text-white mb-4">
                      Urla’da Tenisin Merkezi
                    </h1>
                    <p class="hero-subtitle text-white mb-6">
                      Profesyonel kortlar ve ayrıcalıklı tenis deneyimi.
                    </p>
                    <div class="hero-images-wrapper mt-6">
                      <v-row class="hero-images" no-gutters>
                        <v-col cols="12" md="4" class="pa-2">
                          <div class="hero-banner-frame">
                            <v-img
                                :src="banner1"
                                class="hero-banner-img"
                                cover
                                aspect-ratio="4/3"
                            />
                          </div>
                        </v-col>
                        <v-col cols="12" md="4" class="pa-2">
                          <div class="hero-banner-frame">
                            <v-img
                                :src="banner2"
                                class="hero-banner-img"
                                cover
                                aspect-ratio="4/3"
                            />
                          </div>
                        </v-col>
                        <v-col cols="12" md="4" class="pa-2">
                          <div class="hero-banner-frame">
                            <v-img
                                :src="banner3"
                                class="hero-banner-img"
                                cover
                                aspect-ratio="4/3"
                            />
                          </div>
                        </v-col>
                      </v-row>
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </div>
          </v-img>
        </div>
      </v-container>
    </section>

    <!-- Programlarımız Bölümü -->
    <section class="programs-section py-16 bg-grey-lighten-5">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="section-title mb-4">Programlarımız</h2>
          <p class="section-subtitle text-grey-darken-1">
            Her yaş ve seviyede oyuncu için özel hazırlanmış programlar
          </p>
        </div>

        <v-row>
          <v-col
            v-for="program in programs"
            :key="program.title"
            cols="12"
            md="6"
            class="mb-6"
          >
            <v-card class="program-card" elevation="4" hover>
              <v-card-text class="pa-4">
                <h3 class="program-title mb-3">{{ program.title }}</h3>
                <p class="program-description">
                  {{ program.description }}
                </p>
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
            Tenis gelişiminizi desteklemek için profesyönel antrenörlerimizle çalışın.
            Her seviyeden oyuncuya uygun eğitim yaklaşımımızla teknik gelişiminizi,
            oyun bilginizi ve performansınızı sistemli bir şekilde ilerletiyoruz.
          </p>
        </div>

        <v-row justify="center">
          <v-col
            v-for="trainer in trainers"
            :key="trainer.name"
            cols="12"
            md="4"
            class="mb-6"
          >
            <v-card class="trainer-card text-center" elevation="4" hover>
              <v-card-text class="pa-4">
                <v-chip color="primary" variant="flat" class="trainer-badge mb-3">
                  {{ trainer.badge }}
                </v-chip>
                <h3 class="trainer-name mb-3">{{ trainer.name }}</h3>
                <div class="trainer-stats mt-4">
                  <v-row>
                    <v-col cols="6">
                      <div class="stat-number">{{ trainer.students }}</div>
                      <div class="stat-label">Öğrenci</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="stat-number">{{ trainer.experience }}</div>
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
              Tenis yolculuğunuza bugün başlayın! Şimdi bizimle iletişime geçin
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
import banner1 from '@/assets/images/photo1.jpeg'
import banner2 from '@/assets/images/photo2.jpeg'
import banner3 from '@/assets/images/photo3.jpeg'

const programs = [
  {
    title: 'Özel Dersler',
    description: 'Her seviyeye uygun profesyonel antrenörlerle birebir tenis eğitimi. Oyuncunun teknik, taktik ve fiziksel gelişimine odaklanan kişiye özel antrenman programlarıyla performansınızı en üst seviyeye taşıyın'
  },
  {
    title: 'Kort Rezervasyonu',
    description: "Urla Tenis Akademisi'nde bulunan üç profesyonel toprak kortumuzda tenis keyfini yaşayın. Düzenli bakımı yapılan kortlarımız, hem antrenman hem de maçlar için ideal bir oyun deneyimi sunar"
  },
  {
    title: 'Tenis Okulu',
    description: '5–17 yaş arası çocuk ve gençler için seviyeye ve yaş grubuna uygun tenis eğitimi. Deneyimli antrenörlerimiz eşliğinde hazırlanan programlarla öğrencilerimizin teknik gelişimi, spor disiplini ve tenis sevgisi birlikte gelişir'
  },
  {
    title: 'Yetişkin Grup Dersleri',
    description: 'Tenise yeni başlayan veya oyununu geliştirmek isteyen yetişkinler için her seviyeye uygun grup dersleri. Eğlenceli ve motive edici antrenmanlarla hem teknik gelişiminizi sağlayın hem de tenis keyfini paylaşın'
  }
]

const trainers = [
  {
    badge: 'Baş Antrenör',
    name: 'Kansu Karaoğlu',
    students: '1000+',
    experience: '16'
  },
  {
    badge: 'Kıdemli Antrenör',
    name: 'Mert Sözgen',
    students: '600+',
    experience: '8'
  }
]
</script>

<style scoped>
/* Yeşil rengi #d17d45 ile değiştir */
.home-view {
  --v-theme-primary: 209 125 69;
  --v-theme-success: 209 125 69;
}

.home-view .contact-section {
  background: #d17d45 !important;
}

/* Hero Section - Profesyonel Arka Plan */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-image-container {
  position: relative;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.25) 40%,
    rgba(0, 0, 0, 0.35) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-title {
  font-weight: 700;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.hero-subtitle {
  font-size: 1.15rem;
  opacity: 0.95;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

/* Hero Banner Images - Profesyonel Görünüm */
.hero-images-wrapper {
  max-width: 1100px;
  margin: 0 auto;
}

.hero-images {
  justify-content: center;
}

.hero-banner-frame {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hero-banner-frame:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.12);
}

.hero-banner-img {
  display: block;
  width: 100%;
}
</style>