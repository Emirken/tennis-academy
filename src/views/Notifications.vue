<template>
  <div class="notifications-page pb-12">
    <v-container>
      <!-- Page Header -->
      <v-row class="mb-6 mt-4">
        <v-col cols="12">
          <div class="page-header d-flex flex-wrap align-start justify-space-between gap-3">
            <div class="page-header__text">
              <h1 class="page-title font-weight-bold mb-2">Sistem Bildirimleri</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                Tüm sistem bildirimlerini ve onay bekleyen işlemleri buradan yönetin.
              </p>
            </div>
            <v-chip color="primary" variant="flat" size="large" class="flex-shrink-0" v-if="unreadCount > 0">
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
                    <v-avatar :color="getIconColor(notification.type)" size="56" class="notification-avatar mr-4 text-white">
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
                    <div class="notification-actions d-flex flex-column gap-2 align-end mt-2">
                      <template v-if="notification.type === 'approval_pending'">
                        <v-btn
                            color="success"
                            variant="elevated"
                            prepend-icon="mdi-check"
                            class="notification-actions__btn"
                            @click="approveUserFromNotification(notification)"
                            :loading="processingId === notification.id"
                            :disabled="processingId !== null"
                        >
                          Kayıt Onayla
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="tonal"
                            prepend-icon="mdi-close"
                            class="notification-actions__btn"
                            @click="rejectUserFromNotification(notification)"
                            :loading="processingId === notification.id"
                            :disabled="processingId !== null"
                        >
                          Reddet
                        </v-btn>
                      </template>
                      <template v-else-if="notification.type === 'reservation_pending'">
                        <v-btn
                            color="success"
                            variant="elevated"
                            prepend-icon="mdi-calendar-check"
                            class="notification-actions__btn"
                            @click="approveReservation(notification)"
                            :loading="processingId === notification.id"
                            :disabled="processingId !== null"
                        >
                          Onayla
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="tonal"
                            prepend-icon="mdi-calendar-remove"
                            class="notification-actions__btn"
                            @click="rejectReservation(notification)"
                            :loading="processingId === notification.id"
                            :disabled="processingId !== null"
                        >
                          Reddet
                        </v-btn>
                      </template>
                      <template v-else>
                        <v-btn
                            v-if="!isReadByMe(notification)"
                            color="primary"
                            variant="tonal"
                            size="small"
                            class="notification-actions__btn"
                            @click="markAsRead(notification)"
                        >
                          Okundu İşaretle
                        </v-btn>
                        <v-btn
                            v-else
                            color="grey"
                            variant="text"
                            size="small"
                            class="notification-actions__btn"
                            prepend-icon="mdi-eye-off-outline"
                            @click="markAsUnread(notification)"
                        >
                          Okunmadı Olarak İşaretle
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="text"
                            size="small"
                            class="notification-actions__btn"
                            prepend-icon="mdi-delete-outline"
                            @click="deleteNotification(notification)"
                        >
                          Sil
                        </v-btn>
                      </template>
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
import { collection, getDocs, doc, updateDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/store/modules/auth'
import { notificationService, UserNotification } from '@/services/notificationService'
import type { NotificationType } from '@/services/notificationService'

const authStore = useAuthStore()

const notifications = ref<UserNotification[]>([])
const pendingStudentsFromUsers = ref<Array<{ id: string; firstName: string; lastName: string; phone_number: string; createdAt?: any }>>([])
const loading = ref(true)
const processingId = ref<string | null>(null)
let unsubscribe: (() => void) | null = null
let unsubscribeUsers: (() => void) | null = null

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
      isRead: false
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
    case 'reservation_pending': return 'mdi-calendar-clock'
    case 'reservation_approved': return 'mdi-calendar-check'
    case 'reservation_rejected': return 'mdi-calendar-remove'
    case 'system': return 'mdi-bell-cog'
    default: return 'mdi-bell'
  }
}

const getIconColor = (type: string) => {
  switch(type) {
    case 'approval_pending': return 'warning'
    case 'reservation_pending': return 'orange'
    case 'reservation_approved': return 'success'
    case 'reservation_rejected': return 'error'
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

const markAsUnread = async (notification: UserNotification) => {
  if (!authStore.user) return
  if (!notification.id || String(notification.id).startsWith('pending-')) return

  try {
    await notificationService.markAsUnread(notification.id)
  } catch (error) {
    console.error('Error marking as unread:', error)
  }
}

const deleteNotification = async (notification: UserNotification) => {
  if (!authStore.user || processingId.value || !notification.id) return
  if (String(notification.id).startsWith('pending-')) return
  
  processingId.value = notification.id

  try {
    await deleteDoc(doc(db, 'notifications', notification.id))
    showSnackbar('Bildirim silindi.')
  } catch (error) {
    console.error('Error deleting notification:', error)
    showSnackbar('Bildirim silinirken hata oluştu.', 'error')
  } finally {
    processingId.value = null
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
      await deleteDoc(doc(db, 'notifications', notification.id))
    }

    showSnackbar('Kullanıcı başarıyla onaylandı.')
  } catch (error) {
    console.error('Error approving user:', error)
    showSnackbar('Kullanıcı onaylanırken bir hata oluştu.', 'error')
  } finally {
    processingId.value = null
  }
}

const rejectUserFromNotification = async (notification: UserNotification) => {
  if (!authStore.user || processingId.value || !notification.relatedData) return
  
  if (!confirm('Bu kullanıcıyı reddetmek ve sistemden kalıcı olarak silmek istediğinize emin misiniz?')) {
    return
  }

  const userId = typeof notification.relatedData === 'string' ? notification.relatedData : notification.relatedData
  processingId.value = notification.id || userId

  try {
    // 1. Kullanıcıyı sil (hard delete)
    const userRef = doc(db, 'users', userId)
    const { deleteDoc, getDocs, collection, updateDoc } = await import('firebase/firestore')
    await deleteDoc(userRef)

    // 1.5. Öğrenciyi gruplardan çıkar
    try {
      const groupsRef = collection(db, 'groups')
      const groupsSnapshot = await getDocs(groupsRef)
      const updatePromises: any[] = []
      groupsSnapshot.forEach((groupDoc) => {
        const groupData = groupDoc.data()
        if (groupData.members && Array.isArray(groupData.members)) {
          const updatedMembers = groupData.members.filter((m: any) => m.id !== userId)
          if (updatedMembers.length !== groupData.members.length) {
            updatePromises.push(updateDoc(groupDoc.ref, { members: updatedMembers }))
          }
        }
      })
      await Promise.all(updatePromises)
    } catch (e) {
      console.error('Gruplardan çıkarma hatası', e)
    }

    // 2. Bildirimi de sil (eğer gerçek bir Firestore bildirimi ise)
    if (notification.id && !String(notification.id).startsWith('pending-')) {
      const notificationRef = doc(db, 'notifications', notification.id)
      await deleteDoc(notificationRef)
    }

    showSnackbar('Kullanıcı reddedildi ve silindi.')
  } catch (error) {
    console.error('Error rejecting user:', error)
    showSnackbar('Kullanıcı reddedilirken bir hata oluştu.', 'error')
  } finally {
    processingId.value = null
  }
}

const approveReservation = async (notification: UserNotification) => {
  if (!authStore.user || processingId.value || !notification.relatedData) return
  const { reservationId, studentId, studentName } = notification.relatedData
  processingId.value = notification.id || reservationId

  try {
    // Rezervasyonu 'confirmed' olarak güncelle
    const reservationRef = doc(db, 'reservations', reservationId)
    await updateDoc(reservationRef, { status: 'confirmed' })

    // Öğrenciye onay bildirimi gönder
    if (studentId) {
      await notificationService.createStudentNotification(
        studentId,
        'Rezervasyonunuz Onaylandı',
        'Rezervasyon talebiniz admin tarafından onaylandı.',
        'reservation_approved',
        { reservationId }
      )
    }

    if (notification.id && !String(notification.id).startsWith('pending-')) {
      await deleteDoc(doc(db, 'notifications', notification.id))
    }

    showSnackbar('Rezervasyon başarıyla onaylandı.')
  } catch (error) {
    console.error('Rezervasyon onaylama hatası:', error)
    showSnackbar('Rezervasyon onaylanırken hata oluştu.', 'error')
  } finally {
    processingId.value = null
  }
}

const rejectReservation = async (notification: UserNotification) => {
  if (!authStore.user || processingId.value || !notification.relatedData) return
  const { reservationId, studentId, studentName } = notification.relatedData
  processingId.value = notification.id || reservationId

  try {
    // Rezervasyonu 'cancelled' olarak güncelle
    const reservationRef = doc(db, 'reservations', reservationId)
    await updateDoc(reservationRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'admin'
    })

    // Öğrenciye red bildirimi gönder
    if (studentId) {
      await notificationService.createStudentNotification(
        studentId,
        'Rezervasyonunuz Reddedildi',
        'Rezervasyon talebiniz admin tarafından reddedildi. Farklı bir saat veya kort seçerek tekrar deneyebilirsiniz.',
        'reservation_rejected',
        { reservationId }
      )
    }

    if (notification.id && !String(notification.id).startsWith('pending-')) {
      await deleteDoc(doc(db, 'notifications', notification.id))
    }

    showSnackbar('Rezervasyon reddedildi.')
  } catch (error) {
    console.error('Rezervasyon reddetme hatası:', error)
    showSnackbar('Rezervasyon reddedilirken hata oluştu.', 'error')
  } finally {
    processingId.value = null
  }
}

const loadPendingStudents = () => {
  if (authStore.user?.role !== 'admin') return
  try {
    const usersRef = collection(db, 'users')
    if (unsubscribeUsers) unsubscribeUsers()
    unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
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
    })
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
  if (unsubscribeUsers) {
    unsubscribeUsers()
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

/* Başlık: dar ekranda taşmasın, kelimeler sarılsın */
.page-title {
  font-size: clamp(1.4rem, 4vw, 2.125rem);
  line-height: 1.2;
}
.page-header__text {
  min-width: 0;
}

/* Aksiyon butonları aksiyon kolonu (append slot içeriği) */
.notification-actions {
  height: 100%;
}

/* Tablet ve altı: aksiyon butonlarının taşmasını engelle */
@media (max-width: 959px) {
  .notification-item :deep(.v-list-item__append) {
    align-self: flex-start;
  }
  .notification-actions__btn {
    white-space: nowrap;
  }
}

/* Mobil: list-item'ı dikey akışa çevir, aksiyonlar tam genişlik alt satır */
@media (max-width: 599px) {
  .notification-item :deep(.v-list-item__content),
  .notification-item :deep(> .v-list-item__overlay + *),
  .notification-item :deep(.v-list-item) {
    /* güvence: içerik daralırsa sarılsın */
    min-width: 0;
  }

  /* Vuetify list-item kök flex satırını dikeye çevir */
  .notification-item :deep(.v-list-item__append) {
    width: 100%;
    margin-top: 8px;
    /* prepend+content satırından sonra tam genişlik bloğa düşür */
    flex-basis: 100%;
    align-self: stretch;
  }
  .notification-item :deep(.v-list-item) {
    flex-wrap: wrap;
  }

  /* Avatar mobilde biraz küçülsün ve daha az boşluk bıraksın */
  .notification-avatar {
    margin-right: 12px !important;
  }

  /* Aksiyon butonları tam genişlik + touch hedefi >=44px */
  .notification-actions {
    width: 100%;
    align-items: stretch !important;
  }
  .notification-actions__btn {
    width: 100%;
    min-height: 44px;
  }

  /* Başlık satırı: "Yeni" chip alt satıra düşebilsin */
  .notification-item :deep(.v-list-item-title) {
    white-space: normal;
  }
}
</style>
