import { useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { supabase } from '../supabaseClient'

const firebaseConfig = {
    apiKey: "AIzaSyDRhby3K9aWbOQHvt670hq64l23a_UZWHw",
    authDomain: "bandoanhsang-da1ea.firebaseapp.com",
    projectId: "bandoanhsang-da1ea",
    storageBucket: "bandoanhsang-da1ea.firebasestorage.app",
    messagingSenderId: "412142258649",
    appId: "1:412142258649:web:499bad7df167b963ce31c8",
}

const VAPID_KEY = "BOHWVrKG_otnlYqyNs3-M_Df7jimZGDHJ4NSDAoxXvtoIfeoUKD4INTcSarWJysA2CW0Z4Y_2lqgimJsyXsiNcQ"

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export const usePushNotification = (userId) => {
    useEffect(() => {
        if (!userId) return
        registerPush(userId)
    }, [userId])

    const registerPush = async (userId) => {
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') return

            const token = await getToken(messaging, { vapidKey: VAPID_KEY })
            if (!token) return

            // ✅ Mỗi user chỉ lưu 1 token mới nhất
            await supabase.from('push_tokens').upsert({
                user_id: userId,
                token,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })

        } catch (err) {
            console.error('Push registration error:', err)
        }
    }

    onMessage(messaging, (payload) => {
        // App đang mở → có thể show Antd notification thay thế
        console.log('Foreground message:', payload)
    })
}