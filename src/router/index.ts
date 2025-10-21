// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/courts',
    name: 'Courts',
    component: () => import('@/views/Courts.vue')
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/Pricing.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/Contact.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue')
  },
  // Öğrenci rotaları
  {
    path: '/student',
    meta: { requiresAuth: true, role: 'student' },
    children: [
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('@/views/StudentDashboard.vue')
      },
      {
        path: 'reservations',
        name: 'Reservations',
        component: () => import('@/views/Reservations.vue')
      },
      {
        path: 'dues',
        name: 'Dues',
        component: () => import('@/views/DuesTracking.vue')
      }
    ]
  },
  // Admin rotaları
  {
    path: '/admin',
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/AdminDashboard.vue')
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/views/Attendance.vue')
      },
      {
        path: 'students',
        name: 'StudentManagement',
        component: () => import('@/components/admin/StudentManagement.vue')
      },
      {
        path: 'groups',
        name: 'GroupManagement',
        component: () => import('@/components/admin/GroupManagement.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Auth state'in hazır olmasını bekle
  if (!authStore.initialized) {
    console.log('🔄 Auth state hazırlanıyor, bekleniyor...')
    await authStore.waitForAuth()
    console.log('✅ Auth state hazır, navigation devam ediyor')
  }

  console.log('🚦 Navigation guard:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    userRole: authStore.user?.role,
    requiredRole: to.meta.role
  })

  // Korumalı rotalar için auth kontrolü
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('❌ Auth gerekli ama kullanıcı giriş yapmamış, login\'e yönlendiriliyor')
    next('/login')
    return
  }

  // Guest rotalar için auth kontrolü (giriş yapmış kullanıcılar erişemez)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('❌ Guest rota ama kullanıcı giriş yapmış, home\'a yönlendiriliyor')
    // Kullanıcının rolüne göre yönlendir
    if (authStore.user?.role === 'admin') {
      next('/admin/dashboard')
    } else if (authStore.user?.role === 'student') {
      next('/student/dashboard')
    } else {
      next('/')
    }
    return
  }

  // Rol kontrolü
  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    console.log('❌ Rol uyumsuzluğu, home\'a yönlendiriliyor')
    next('/')
    return
  }

  // Kök path'e erişim - kullanıcının rolüne göre yönlendir
  if (to.path === '/' && authStore.isAuthenticated) {
    if (authStore.user?.role === 'admin') {
      next('/admin/dashboard')
    } else if (authStore.user?.role === 'student') {
      next('/student/dashboard')
    } else {
      next()
    }
    return
  }

  console.log('✅ Navigation izin verildi')
  next()
})

// Navigation sonrası log
router.afterEach((to, from) => {
  console.log('📍 Navigation tamamlandı:', {
    from: from.path,
    to: to.path
  })
})

export default router