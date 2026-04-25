import { useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { supabase } from '../supabaseClient'
import { notification } from 'antd'

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

// ✅ Lấy hoặc tạo device_id cố định cho thiết bị này
const getDeviceId = () => {
    let deviceId = localStorage.getItem('push_device_id')
    if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem('push_device_id', deviceId)
    }
    return deviceId
}

export const usePushNotification = (userId, userRole) => {
    useEffect(() => {
        // ✅ Chỉ đăng ký nếu đã login (không phải anon)
        if (!userId || userRole === 'anon') return
        registerPush(userId)

        // ✅ Cleanup khi unmount hoặc logout
        return () => {
            if (userId && userRole !== 'anon') {
                unregisterPush(userId)
            }
        }
    }, [userId, userRole])

    

    const registerPush = async (userId) => {
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') return

            const token = await getToken(messaging, { vapidKey: VAPID_KEY })
            if (!token) return

            await supabase.from('push_tokens').upsert({
                user_id: userId,
                token,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'token' })

        } catch (err) {
            console.error('Push registration error:', err)
        }
    }

    // ✅ Xóa token khi logout
    const unregisterPush = async (userId) => {
        try {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY })
            if (!token) return

            await supabase
                .from('push_tokens')
                .delete()
                .eq('user_id', userId)
                .eq('token', token)
        } catch (err) {
            console.error('Unregister push error:', err)
        }
    }

    // ✅ Hiện notification khi app đang mở
    onMessage(messaging, (payload) => {
        notification.open({
            message: (
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {payload.notification?.title}
                </div>
            ),
            description: (
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                    {payload.notification?.body}
                </div>
            ),
            icon: (
                <span style={{
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    🕯️
                </span>
            ),
            placement: 'topRight',
            duration: 3,
            style: {
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: 320
            },
            className: 'custom-notification'
        });
    })
}