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
    const now = Math.floor(Date.now() / 1000)
    
    const claim = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }

    const header = { alg: 'RS256', typ: 'JWT' }

    const encode = (obj: any) => 
        btoa(JSON.stringify(obj))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')

    const signingInput = `${encode(header)}.${encode(claim)}`

    // ✅ Fix: parse đúng định dạng private key PEM
    const pemContents = serviceAccount.private_key
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, '')
        .trim()

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    // ✅ Fix: import key đúng cách
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        privateKey,
        new TextEncoder().encode(signingInput)
    )

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

    const jwt = `${signingInput}.${encodedSignature}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    const data = await res.json()
    return data.access_token
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
            return new Response('No tokens found', { status: 404, headers: corsHeaders })
        }

        const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
        const accessToken = await getAccessToken(serviceAccount)
        const projectId = serviceAccount.project_id

        // Gửi đến từng thiết bị
        const results = await Promise.all(tokens.map(({ token }) =>
            fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // message: {
                    //     token,
                    //     notification: { title, body },
                    //     data: { url: url || '/' },
                    //     webpush: {
                    //         notification: {
                    //             icon: '/logo192.png',
                    //             badge: '/logo192.png',
                    //         }
                    //     }
                    // }
                    message: {
                        token,
                        // ❌ Bỏ notification field
                        // notification: { title, body },
                        
                        // ✅ Chỉ dùng data
                        data: { 
                            title,  // truyền title qua data
                            body,   // truyền body qua data
                            url: url || '/',
                        },
                        webpush: {
                            // ✅ Hiện notification thủ công trong SW
                            headers: { Urgency: 'high' },
                        }
                    }
                }),
            }).then(r => r.json())
        ))

        // ✅ Xóa token invalid — fix index bug
        const invalidTokens = results
            .map((r, i) => ({ result: r, token: tokens[i].token }))
            .filter(({ result }) =>
                result.error?.code === 404 ||
                result.error?.status === 'NOT_FOUND' ||
                result.error?.details?.[0]?.errorCode === 'UNREGISTERED'
            )
            .map(({ token }) => token)

        if (invalidTokens.length > 0) {
            await supabase
                .from('push_tokens')
                .delete()
                .in('token', invalidTokens)
        }

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