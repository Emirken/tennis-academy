<template>
  <v-footer
      app
      color="primary"
      class="text-white pa-8"
  >
<!--    <v-container>
      <v-row>
        &lt;!&ndash; Academy Info &ndash;&gt;
        <v-col cols="12" md="4" class="mb-6">
          <div class="d-flex align-center mb-4">
            <v-icon
                icon="mdi-tennis"
                size="32"
                class="mr-3"
            />
            <h3 class="text-h5 font-weight-bold">
              Urla Tenis Akademi
            </h3>
          </div>
          <p class="text-body-2 mb-4">
            Your premier destination for tennis excellence in Urla.
            Professional coaching, modern facilities, and a passion for the game.
          </p>

          &lt;!&ndash; Social Media &ndash;&gt;
          <div class="social-links">
            <v-btn
                icon="mdi-facebook"
                variant="text"
                color="white"
                size="large"
                class="mr-2"
            />
            <v-btn
                icon="mdi-instagram"
                variant="text"
                color="white"
                size="large"
                class="mr-2"
            />
            <v-btn
                icon="mdi-twitter"
                variant="text"
                color="white"
                size="large"
                class="mr-2"
            />
            <v-btn
                icon="mdi-youtube"
                variant="text"
                color="white"
                size="large"
            />
          </div>
        </v-col>



        &lt;!&ndash; Contact Info &ndash;&gt;
&lt;!&ndash;        <v-col cols="12" md="3" class="mb-6">
          <h4 class="text-h6 font-weight-bold mb-4">Contact Info</h4>

          <div class="contact-item mb-3">
            <div class="d-flex align-center">
              <v-icon icon="mdi-map-marker" class="mr-3" />
              <div>
                <p class="text-body-2 mb-0">123 Court Street</p>
                <p class="text-body-2 mb-0">Urla, İzmir, TR</p>
              </div>
            </div>
          </div>

          <div class="contact-item mb-3">
            <div class="d-flex align-center">
              <v-icon icon="mdi-phone" class="mr-3" />
              <p class="text-body-2 mb-0">(555) 123-4567</p>
            </div>
          </div>

          <div class="contact-item mb-3">
            <div class="d-flex align-center">
              <v-icon icon="mdi-email" class="mr-3" />
              <p class="text-body-2 mb-0">info@urlatennis.com</p>
            </div>
          </div>

          <div class="contact-item">
            <div class="d-flex align-center">
              <v-icon icon="mdi-clock" class="mr-3" />
              <div>
                <p class="text-body-2 mb-0">Mon-Fri: 6AM - 10PM</p>
                <p class="text-body-2 mb-0">Sat-Sun: 7AM - 9PM</p>
              </div>
            </div>
          </div>
        </v-col>&ndash;&gt;
      </v-row>

      &lt;!&ndash; Divider &ndash;&gt;
      <v-divider class="my-6 border-opacity-25" />

      &lt;!&ndash; Bottom Section &ndash;&gt;
      <v-row align="center">
        <v-col cols="12" md="6">
          <p class="text-body-2 mb-0">
            © {{ currentYear }} Urla Tennis Academy. All rights reserved.
          </p>
        </v-col>

        <v-col cols="12" md="6" class="text-md-right">
          <div class="footer-legal">
            <a href="#" class="text-white text-decoration-none mr-4">
              Privacy Policy
            </a>
            <a href="#" class="text-white text-decoration-none mr-4">
              Terms of Service
            </a>
            <a href="#" class="text-white text-decoration-none">
              Cookie Policy
            </a>
          </div>
        </v-col>
      </v-row>
    </v-container>-->
  </v-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer-links .v-list-item {
  min-height: auto;
}

.footer-links .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.contact-item {
  margin-bottom: 12px;
}

.social-links .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.footer-legal a:hover {
  text-decoration: underline !important;
}

@media (max-width: 960px) {
  .text-md-right {
    text-align: left !important;
  }

  .footer-legal {
    margin-top: 16px;
  }

  .footer-legal a {
    display: block;
    margin-bottom: 8px;
    margin-right: 0 !important;
  }
}
</style>