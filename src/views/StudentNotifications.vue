<template>
  <div class="notifications-page pb-12">
    <v-container>
      <!-- Page Header -->
      <v-row class="mb-6 mt-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">Bildirimler</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Hesabınızla ilgili tüm duyuru ve bildirimleri buradan takip edebilirsiniz.
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Main Content -->
      <v-row>
        <v-col cols="12">
          <v-card class="modern-card" elevation="0">
            <!-- Loading State -->
            <div v-if="loading" class="pa-8 text-center">
              <v-progress-circular indeterminate color="primary" size="64" />
              <p class="mt-4 text-medium-emphasis">Bildirimler yükleniyor...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="notifications.length === 0" class="pa-12 text-center text-medium-emphasis">
              <v-icon icon="mdi-bell-outline" size="80" color="grey" class="mb-4 opacity-50"></v-icon>
              <h3 class="text-h6">Yeni bildiriminiz bulunmamaktadır.</h3>
              <p>Hesabınızla ilgili tüm gelişmeler burada görüntülenecektir.</p>
            </div>

            <!-- Notifications List -->
            <v-list v-else lines="two" class="bg-transparent pa-4">
              <v-slide-y-transition group>
                <v-list-item
                    v-for="notification in notifications"
                    :key="notification.id"
                    class="notification-item mb-4"
                    :class="{ 'unread-item': !isReadByMe(notification) }"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="getIconColor(notification.type)" size="56" class="mr-4 text-white">
                      <v-icon :icon="getIcon(notification.type)"></v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-h6 font-weight-bold mb-1">
                    {{ notification.title }}
                    <v-chip v-if="!isReadByMe(notification)" color="error" size="x-small" class="ml-2">Yeni</v-chip>
                  </v-list-item-title>
                  
                  <v-list-item-subtitle class="d-flex align-center mt-2 pb-1">
                    <span class="text-body-1 text-wrap">{{ notification.message }}</span>
                  </v-list-item-subtitle>
                  <div class="mt-2 text-caption text-medium-emphasis">
                    <v-icon icon="mdi-calendar" size="x-small" class="mr-1" />
                    {{ formatDate(notification.createdAt) }}
                  </div>

                  <template v-slot:append>
                    <div class="d-flex flex-column gap-2 align-end h-100 mt-2">
                      <v-btn
                          v-if="!isReadByMe(notification)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { notificationService, UserNotification } from '@/services/notificationService'

const authStore = useAuthStore()

const notifications = ref<UserNotification[]>([])
const loading = ref(false)
let unsubscribe: (() => void) | null = null

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

const getIcon = (type: string) => {
  switch(type) {
    case 'system': return 'mdi-bullhorn'
    case 'lesson_cancelled': return 'mdi-calendar-remove'
    case 'lesson_added': return 'mdi-calendar-plus'
    case 'payment_due': return 'mdi-cash-alert'
    default: return 'mdi-bell'
  }
}

const getIconColor = (type: string) => {
  switch(type) {
    case 'system': return 'info'
    case 'lesson_cancelled': return 'error'
    case 'lesson_added': return 'success'
    case 'payment_due': return 'warning'
    default: return 'primary'
  }
}

const fetchNotifications = async () => {
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
  if (!notification.id) return
  
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

onMounted(() => {
  fetchNotifications()
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
