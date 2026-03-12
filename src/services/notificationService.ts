import { db } from '@/services/firebase'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'

export type NotificationType = 'system' | 'approval_pending' | 'payment_due' | 'lesson_cancelled' | 'lesson_added'

export interface UserNotification {
    id?: string
    targetType: 'student' | 'admin' | 'all'
    targetId?: string // if targetType is 'student', this is the userId.
    title: string
    message: string
    type: NotificationType
    isRead: boolean | string[] // boolean for student/single, array of userIds for admin/multi
    createdAt: Timestamp | any
    relatedData?: any // e.g. userId of the pending user
}

const COLLECTION_NAME = 'notifications'

export const notificationService = {
    // Dinleme işlemi için
    subscribeToNotifications(userId: string, userRole: string, callback: (notifications: UserNotification[]) => void) {
        const notificationsRef = collection(db, COLLECTION_NAME)

        // Admin ise hem 'admin' hem 'all' görebilir. Öğrenci ise kendi IDsine özel ve 'all' olanları görebilir.
        // Ancak firestore'da OR sorguları karmaşık olduğundan genelde ayrı ayrı dinlenir veya
        // basitleştirmek adına iki sorgu birleştirilir. 
        // Burada in sorgusu kullanabiliriz: targetType in ['admin', 'all'] vs.

        let q;
        const normalizedRole = userRole?.toLowerCase?.() || userRole
        if (normalizedRole === 'admin') {
            q = query(
                notificationsRef,
                where('targetType', 'in', ['admin', 'all']),
                orderBy('createdAt', 'desc')
            )
        } else {
            // Öğrenci
            q = query(
                notificationsRef,
                where('targetType', '==', 'student'),
                where('targetId', '==', userId),
                orderBy('createdAt', 'desc')
            )
        }

        return onSnapshot(
            q,
            (snapshot) => {
                const notifications: UserNotification[] = []
                snapshot.forEach((doc) => {
                    notifications.push({ id: doc.id, ...doc.data() } as UserNotification)
                })
                callback(notifications)
            },
            (error) => {
                console.error('❌ Bildirim dinleme hatası:', error)
                console.error('Kullanıcı rolü:', userRole, '| Index veya izin hatası olabilir.')
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

        if (userRole === 'admin') {
            await updateDoc(notifRef, { isRead: true })
        } else {
            // Öğrenci
            await updateDoc(notifRef, { isRead: true })
        }
    }
}
