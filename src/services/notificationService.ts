import { db } from '@/services/firebase'
import { pushNotificationService } from '@/services/pushNotificationService'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'

export type NotificationType = 'system' | 'approval_pending' | 'payment_due' | 'lesson_cancelled' | 'lesson_added' | 'reservation_pending' | 'reservation_approved' | 'reservation_rejected'

export interface UserNotification {
    id?: string
    targetType: 'student' | 'admin' | 'all'
    targetId?: string
    title: string
    message: string
    type: NotificationType
    isRead: boolean | string[]
    createdAt: Timestamp | any
    relatedData?: any
}

const COLLECTION_NAME = 'notifications'

export const notificationService = {
    subscribeToNotifications(userId: string, userRole: string, callback: (notifications: UserNotification[]) => void) {
        const notificationsRef = collection(db, COLLECTION_NAME)

        let q;
        const normalizedRole = userRole?.toLowerCase?.() || userRole
        if (normalizedRole === 'admin') {
            q = query(
                notificationsRef,
                where('targetType', 'in', ['admin', 'all']),
                orderBy('createdAt', 'desc')
            )
        } else {
            q = query(
                notificationsRef,
                where('targetType', '==', 'student'),
                where('targetId', '==', userId),
                orderBy('createdAt', 'desc')
            )
        }

        const seenIds = new Set<string>()

        return onSnapshot(
            q,
            (snapshot) => {
                const notifications: UserNotification[] = []
                snapshot.forEach((doc) => {
                    notifications.push({ id: doc.id, ...doc.data() } as UserNotification)
                })

                // Yeni gelen bildirimler icin tarayici bildirimi goster
                for (const notif of notifications) {
                    if (notif.id && !seenIds.has(notif.id)) {
                        seenIds.add(notif.id)
                        if (notif.createdAt && typeof notif.createdAt.toDate === 'function') {
                            const age = Date.now() - notif.createdAt.toDate().getTime()
                            if (age < 10000) {
                                pushNotificationService.showBrowserNotification(
                                    notif.title,
                                    notif.message,
                                    {
                                        notificationId: notif.id,
                                        type: notif.type,
                                        clickAction: userRole === 'admin' ? '/admin/notifications' : '/student/notifications'
                                    }
                                )
                            }
                        }
                    }
                }

                callback(notifications)
            },
            (error) => {
                console.error('Bildirim dinleme hatasi:', error)
                console.error('Kullanici rolu:', userRole, '| Index veya izin hatasi olabilir.')
                callback([])
            }
        )
    },

    async createAdminNotification(title: string, message: string, type: NotificationType, relatedData?: any) {
        const notificationsRef = collection(db, COLLECTION_NAME)
        const newNotification: UserNotification = {
            targetType: 'admin',
            title,
            message,
            type,
            isRead: false,
            createdAt: serverTimestamp(),
            relatedData
        }
        return await addDoc(notificationsRef, newNotification)
    },

    async createStudentNotification(studentId: string, title: string, message: string, type: NotificationType, relatedData?: any) {
        const notificationsRef = collection(db, COLLECTION_NAME)
        const newNotification: UserNotification = {
            targetType: 'student',
            targetId: studentId,
            title,
            message,
            type,
            isRead: false,
            createdAt: serverTimestamp(),
            relatedData
        }
        return await addDoc(notificationsRef, newNotification)
    },

    async markAsRead(notificationId: string, userId: string, userRole: string, currentIsRead: boolean | string[]) {
        const notifRef = doc(db, COLLECTION_NAME, notificationId)
        await updateDoc(notifRef, { isRead: true })
    },

    async markAsUnread(notificationId: string) {
        const notifRef = doc(db, COLLECTION_NAME, notificationId)
        await updateDoc(notifRef, { isRead: false })
    },

    async deleteNotification(notificationId: string) {
        const notifRef = doc(db, COLLECTION_NAME, notificationId)
        await deleteDoc(notifRef)
    }
}
