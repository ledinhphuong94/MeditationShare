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
// const getDeviceId = () => {
//     let deviceId = localStorage.getItem('push_device_id')
//     if (!deviceId) {
//         deviceId = crypto.randomUUID()
//         localStorage.setItem('push_device_id', deviceId)
//     }
//     return deviceId
// }

export const usePushNotification = (userId, userRole) => {
    useEffect(() => {
        console.log('usePushNotification userRole', userRole)
        // ✅ Chỉ đăng ký nếu đã login (không phải anon)
        if (!userId || userRole === 'anon') return
        registerPush(userId)
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
    // const unregisterPush = async (userId) => {
    //     console.log('>>> unregisterPush', userId)
    //     try {
    //         const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    //         if (!token) return

    //         await supabase
    //             .from('push_tokens')
    //             .delete()
    //             .eq('user_id', userId)
    //             .eq('token', token)
    //     } catch (err) {
    //         console.error('Unregister push error:', err)
    //     }
    // }

    // ✅ Hiện notification khi app đang mở
    onMessage(messaging, (payload) => {
        console.log('>>> payload', payload)
        notification.open({
            message: (
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {payload.data?.title}
                </span>
            ),
            description: (
                <span style={{ color: '#aaa', fontSize: 13 }}>
                    {payload.data?.body}
                </span>
            ),
            icon: (
                <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                }}>
                    🕯️
                </div>
            ),
            placement: 'topRight',
            duration: 4,
            style: {
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
        })
    })
}

export { messaging, VAPID_KEY }