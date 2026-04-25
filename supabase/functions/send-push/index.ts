import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ✅ Thêm CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ✅ Dùng FCM API V1 (không phải Legacy)
const getAccessToken = async (serviceAccount: any) => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const now = Math.floor(Date.now() / 1000)
    const claim = btoa(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }))

    const { privateKey } = await crypto.subtle.importKey(
        'pkcs8',
        str2ab(serviceAccount.private_key
            .replace('-----BEGIN PRIVATE KEY-----\n', '')
            .replace('\n-----END PRIVATE KEY-----\n', '')
        ),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(`${header}.${claim}`)
    )

    const jwt = `${header}.${claim}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })
    const { access_token } = await res.json()
    return access_token
}

const str2ab = (str: string) => {
    const binary = atob(str)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}

serve(async (req) => {
    // ✅ Xử lý preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    try {
        const { user_id, title, body, url } = await req.json()

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Lấy tất cả token của user
        const { data: tokens, error } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', user_id)

        if (error || !tokens?.length) {
            return new Response('No tokens found', { status: 404 })
        }

        const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
        const accessToken = await getAccessToken(serviceAccount)
        const projectId = serviceAccount.project_id

        // Gửi đến tất cả thiết bị
        const results = await Promise.all(tokens.map(({ token }) =>
            fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token,
                        notification: { title, body },
                        data: { url: url || '/' },
                        webpush: {
                            notification: {
                                icon: '/logo192.png',
                                badge: '/logo192.png',
                            }
                        }
                    }
                }),
            }).then(r => r.json())
        ))

        return new Response(JSON.stringify(results), { 
            status: 200,
            headers: corsHeaders // ✅ thêm vào response
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: corsHeaders // ✅ thêm vào error response
        })
    }
})