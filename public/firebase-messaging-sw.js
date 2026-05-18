importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCgAu7nHl0LribarO-SJymPqcKmiKUUnS0",
  authDomain: "urla-tenis.firebaseapp.com",
  projectId: "urla-tenis",
  storageBucket: "urla-tenis.firebasestorage.app",
  messagingSenderId: "257632351926",
  appId: "1:257632351926:web:6143c39473447ba5865817"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Arka plan mesajı alındı:', payload)

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Urla Tenis Akademisi'
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/Uta-logo.svg',
    badge: '/Uta-logo.svg',
    data: payload.data || {},
    tag: payload.data?.notificationId || 'default'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.clickAction || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
