import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { messaging, db } from '@/services/firebase'
import { getToken as getFCMToken, onMessage as onFCMMessage, deleteToken } from 'firebase/messaging'

const VAPID_KEY = 'BECy-Rq2yFa3ZQGAcmUp2aw7C5gjIo37GrGHRnCTNWpWpM358QeobQ16ubC_55ZzAfhzCCoOLlVoDBtk3y65Vm4'

export const pushNotificationService = {
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('Bu tarayıcı bildirimleri desteklemiyor.')
            return 'denied'
        }

        const permission = await Notification.requestPermission()
        console.log('Bildirim izni:', permission)
        return permission
    },

    async registerDeviceToken(userId: string): Promise<string | null> {
        if (!messaging) {
            console.warn('Firebase Messaging başlatılamadı.')
            return null
        }

        try {
            const permission = await this.requestPermission()
            if (permission !== 'granted') {
                console.warn('Bildirim izni verilmedi.')
                return null
            }

            const currentToken = await getFCMToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
            })

            if (currentToken) {
                await setDoc(doc(db, 'deviceTokens', userId), {
                    token: currentToken,
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    updatedAt: new Date()
                })
                console.log('Device token kaydedildi:', currentToken.substring(0, 10) + '...')
            }

            return currentToken
        } catch (error) {
            console.error('Device token alınamadı:', error)
            return null
        }
    },

    async unregisterDeviceToken(userId: string): Promise<void> {
        try {
            if (messaging) {
                const currentToken = await getFCMToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
                })
                if (currentToken) {
                    await deleteToken(messaging)
                }
            }
            await deleteDoc(doc(db, 'deviceTokens', userId)).catch(() => {})
            console.log('Device token silindi.')
        } catch (error) {
            console.error('Device token silinirken hata:', error)
        }
    },

    onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
        if (!messaging) return null
        return onFCMMessage(messaging, callback)
    },

    showBrowserNotification(title: string, body: string, data?: any): void {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return
        }

        try {
            const notification = new Notification(title, {
                body,
                icon: '/Uta-logo.svg',
                badge: '/Uta-logo.svg',
                tag: data?.notificationId || 'tennis-notification',
                data: data || {}
            })

            notification.onclick = () => {
                window.focus()
                notification.close()
                if (data?.clickAction) {
                    window.location.href = data.clickAction
                }
            }

            setTimeout(() => notification.close(), 8000)
        } catch (error) {
            console.error('Bildirim gösterilemedi:', error)
        }
    }
}
