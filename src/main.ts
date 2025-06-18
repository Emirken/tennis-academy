// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { useAuthStore } from './store/modules/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Auth state'i initialize et
const authStore = useAuthStore()
authStore.initializeAuth().then(() => {
    console.log('🎉 Auth başlatma tamamlandı, app mount ediliyor')
    app.mount('#app')
})