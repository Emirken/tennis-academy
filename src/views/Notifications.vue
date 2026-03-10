<template>
  <div class="notifications-page pb-12">
    <v-container>
      <!-- Page Header -->
      <v-row class="mb-6 mt-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">Sistem Bildirimleri</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Tüm sistem bildirimlerini ve onay bekleyen işlemleri buradan yönetin.
              </p>
            </div>
            <v-chip color="primary" variant="flat" size="large" v-if="unreadCount > 0">
              {{ unreadCount }} Yeni Bildirim
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Main Content -->
      <v-row>
        <v-col cols="12">
          <v-card class="modern-card" elevation="0">
            <!-- Loading State -->
            <div v-if="loading" class="pa-5 text-center">
              <v-progress-circular indeterminate color="primary" size="64" />
              <p class="mt-4 text-medium-emphasis">Bildirimler yükleniyor...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="displayedNotifications.length === 0" class="pa-12 text-center text-medium-emphasis">
              <v-icon icon="mdi-bell-outline" size="80" color="success" class="mb-4 opacity-50"></v-icon>
              <h3 class="text-h6">Hiç bildiriminiz yok.</h3>
              <p>Yeni bir işlem olduğunda burada görebilirsiniz.</p>
            </div>

            <!-- Notifications List -->
            <v-list v-else lines="three" class="bg-transparent pa-4">
              <v-slide-y-transition group>
                <v-list-item
                    v-for="notification in displayedNotifications"
                    :key="notification.id"
                    class="notification-item mb-4"
                    :class="{ 'unread-item': !isReadByMe(notification) }"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="getIconColor(notification.type)" size="56" class="mr-4 text-white">
                      <v-icon :icon="getIcon(notification.type)" />
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-h6 font-weight-bold mb-1">
                    {{ notification.title }}
                    <v-chip v-if="!isReadByMe(notification)" color="error" size="x-small" class="ml-2">Yeni</v-chip>
                  </v-list-item-title>
                  
                  <v-list-item-subtitle class="text-body-1 mt-1 pb-1">
                    {{ notification.message }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-body-2 mt-1 opacity-70">
                    <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
                    {{ formatDate(notification.createdAt) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex flex-column gap-2 align-end h-100 mt-2">
                       <v-btn
                          v-if="notification.type === 'approval_pending'"
                          color="success"
                          variant="elevated"
                          prepend-icon="mdi-check"
                          @click="approveUserFromNotification(notification)"
                          :loading="processingId === notification.id"
                          :disabled="processingId !== null"
                      >
                        Kullanıcıyı Onayla
                      </v-btn>
                      <v-btn
                          v-else-if="!isReadByMe(notification)"
                          color="primary"
                          variant="tonal"
                          size="small"
                          @click="markAsRead(notification)"
                      >
                        Okundu İşaretle
                      </v-btn>
                    </div>
                  </template>
                </v-list-item>
              </v-slide-y-transition>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Kapat</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/store/modules/auth'
import { notificationService, UserNotification } from '@/services/notificationService'

const authStore = useAuthStore()

const notifications = ref<UserNotification[]>([])
const pendingStudentsFromUsers = ref<Array<{ id: string; firstName: string; lastName: string; phone_number: string; createdAt?: any }>>([])
const loading = ref(true)
const processingId = ref<string | null>(null)
let unsubscribe: (() => void) | null = null

// Firestore bildirimleri + users'dan bekleyen öğrenciler (sadece admin için)
const displayedNotifications = computed(() => {
  if (authStore.user?.role !== 'admin') {
    return notifications.value
  }
  const firestoreIds = new Set(
    notifications.value
      .filter((n) => n.type === 'approval_pending' && n.relatedData)
      .map((n) => n.relatedData)
  )
  const synthetic = pendingStudentsFromUsers.value
    .filter((s) => !firestoreIds.has(s.id))
    .map((s) => ({
      id: `pending-${s.id}`,
      type: 'approval_pending' as const,
      title: 'Yeni Öğrenci Kaydı',
      message: `${s.firstName} ${s.lastName} kayıt oldu, onayınızı bekliyor.`,
      relatedData: s.id,
      createdAt: s.createdAt || new Date(),
      isRead: [] as string[]
    }))
  return [...synthetic, ...notifications.value].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
    return dateB.getTime() - dateA.getTime()
  })
})

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const formatDate = (dateValue: any) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  return new Intl.DateTimeFormat('tr-TR', { 
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const isReadByMe = (notification: UserNotification) => {
  if (!authStore.user) return false
  if (Array.isArray(notification.isRead)) {
    return notification.isRead.includes(authStore.user.id)
  }
  return notification.isRead === true
}

const unreadCount = computed(() => {
  return displayedNotifications.value.filter((n) => !isReadByMe(n)).length
})

const getIcon = (type: string) => {
  switch(type) {
    case 'approval_pending': return 'mdi-account-clock'
    case 'system': return 'mdi-bell-cog'
    default: return 'mdi-bell'
  }
}

const getIconColor = (type: string) => {
  switch(type) {
    case 'approval_pending': return 'warning'
    case 'system': return 'info'
    default: return 'primary'
  }
}

const fetchNotifications = () => {
  if (!authStore.user) return
  loading.value = true
  
  unsubscribe = notificationService.subscribeToNotifications(
    authStore.user.id,
    authStore.user.role,
    (data) => {
      notifications.value = data
      loading.value = false
    }
  )
}

const markAsRead = async (notification: UserNotification) => {
  if (!authStore.user) return
  if (!notification.id || String(notification.id).startsWith('pending-')) return

  try {
    await notificationService.markAsRead(
      notification.id,
      authStore.user.id,
      authStore.user.role,
      notification.isRead
    )
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const approveUserFromNotification = async (notification: UserNotification) => {
  if (!authStore.user || processingId.value || !notification.relatedData) return
  const userId = typeof notification.relatedData === 'string' ? notification.relatedData : notification.relatedData
  processingId.value = notification.id || userId

  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { status: 'active' })

    if (notification.id && !String(notification.id).startsWith('pending-')) {
      await notificationService.markAsRead(
        notification.id,
        authStore.user.id,
        authStore.user.role,
        notification.isRead
      )
    } else {
      await loadPendingStudents()
    }

    showSnackbar('Kullanıcı başarıyla onaylandı.')
  } catch (error) {
    console.error('Error approving user:', error)
    showSnackbar('Kullanıcı onaylanırken bir hata oluştu.', 'error')
  } finally {
    processingId.value = null
  }
}

const loadPendingStudents = async () => {
  if (authStore.user?.role !== 'admin') return
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    const pending: typeof pendingStudentsFromUsers.value = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.role === 'student' && data.status === 'pending' && !data.deleted) {
        pending.push({
          id: docSnap.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone_number: data.phone_number || '',
          createdAt: data.createdAt
        })
      }
    })
    pendingStudentsFromUsers.value = pending
  } catch (error) {
    console.error('Bekleyen öğrenciler yüklenemedi:', error)
  }
}

onMounted(() => {
  fetchNotifications()
  if (authStore.user?.role === 'admin') {
    loadPendingStudents()
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.notification-item {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}
.notification-item.unread-item {
  border-left: 4px solid rgba(var(--v-theme-error), 1);
  background: rgba(var(--v-theme-error), 0.02);
}
.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: rgba(var(--v-theme-primary), 0.2);
}
.gap-2 {
  gap: 8px;
}
</style>
