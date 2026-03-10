<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Giriş sayfasına dön
const goToLogin = () => {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="forgot-password-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="reset-card" elevation="8">
            <v-card-text class="pa-6">
              <!-- Logo ve Başlık -->
              <div class="text-center mb-6">
                <v-icon
                    icon="mdi-lock-reset"
                    size="48"
                    color="primary"
                    class="mb-4"
                />
                <h1 class="text-h4 font-weight-bold text-primary mb-2">
                  Şifre Sıfırlama
                </h1>
                <p class="text-subtitle-1 text-grey-darken-1">
                  Şifrenizi sıfırlamak için yöneticiyle iletişime geçin
                </p>
              </div>

              <!-- Bilgi Mesajı -->
              <div class="text-center">
                <v-icon
                    icon="mdi-phone-message"
                    size="64"
                    color="info"
                    class="mb-4"
                />
                <h2 class="text-h5 font-weight-medium mb-4">
                  Yöneticiyle İletişime Geçin
                </h2>
                <p class="text-body-1 text-grey-darken-1 mb-6">
                  Şifrenizi sıfırlamak için aşağıdaki numaralardan yöneticilerimize ulaşabilirsiniz:
                </p>

                <v-list class="mb-6">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-phone" color="primary" />
                    </template>
                    <v-list-item-title>Burak Seçkin</v-list-item-title>
                    <v-list-item-subtitle>0554 738 06 80</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-phone" color="primary" />
                    </template>
                    <v-list-item-title>Mert Sözgen</v-list-item-title>
                    <v-list-item-subtitle>0506 570 10 62</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-phone" color="primary" />
                    </template>
                    <v-list-item-title>Kansu Karaoğlu</v-list-item-title>
                    <v-list-item-subtitle>0555 596 38 21</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-btn
                    color="primary"
                    variant="flat"
                    size="large"
                    @click="goToLogin"
                    block
                >
                  Giriş Sayfasına Dön
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>

</style>