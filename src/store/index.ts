// src/store/index.ts
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// Export all stores
export { useAuthStore } from './modules/auth'