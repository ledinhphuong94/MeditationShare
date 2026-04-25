importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: "AIzaSyDRhby3K9aWbOQHvt670hq64l23a_UZWHw",
    authDomain: "bandoanhsang-da1ea.firebaseapp.com",
    projectId: "bandoanhsang-da1ea",
    storageBucket: "bandoanhsang-da1ea.firebasestorage.app",
    messagingSenderId: "412142258649",
    appId: "1:412142258649:web:499bad7df167b963ce31c8",
})

const messaging = firebase.messaging()

// Nhận notification khi app đang background/đóng
messaging.onBackgroundMessage((payload) => {
    return self.clients.matchAll({ type: 'window' }).then(clients => {
        const isFocused = clients.some(client => client.focused)
        if (isFocused) return

        // ✅ Đọc từ data thay vì notification
        const title = payload.data?.title || 'Bản Đồ Ánh Sáng'
        const body = payload.data?.body || ''

        return self.registration.showNotification(title, {
            body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            data: { url: payload.data?.url || '/' },
        })
    })
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(clients.openWindow(event.notification.data.url))
})