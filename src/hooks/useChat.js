import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const PAGE_SIZE = 20;

export const useChat = (currentUserId, targetUserId) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const channelRef = useRef(null)
    const oldestCreatedAtRef = useRef(null) // track tin cũ nhất đang có

    useEffect(() => {
        if (!currentUserId || !targetUserId) return

        // Reset khi đổi cuộc trò chuyện
        setMessages([])
        setHasMore(true)
        oldestCreatedAtRef.current = null

        fetchMessages()
        subscribeRealtime()
        markAsRead()

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
        }
    }, [currentUserId, targetUserId]);

    const markAsRead = async () => {
        if (!currentUserId || !targetUserId) return
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', currentUserId)
            .eq('sender_id', targetUserId)
            .eq('is_read', false)
    }

    const fetchMessages = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),` +
                `and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
            )
            .order('created_at', { ascending: false }) // mới nhất trước
            .limit(PAGE_SIZE)

        if (!error && data) {
            const sorted = [...data].reverse() // đảo lại để hiển thị đúng thứ tự
            setMessages(sorted)
            setHasMore(data.length === PAGE_SIZE)
            oldestCreatedAtRef.current = sorted[0]?.created_at || null
        }

        setLoading(false)
    }

    // Scroll lên → load thêm tin cũ hơn
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !oldestCreatedAtRef.current) return

        setLoadingMore(true)

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),` +
                `and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
            )
            .lt('created_at', oldestCreatedAtRef.current) // trước tin cũ nhất
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE)

        if (!error && data) {
            const sorted = [...data].reverse()
            setMessages(prev => [...sorted, ...prev]) // prepend lên đầu
            setHasMore(data.length === PAGE_SIZE)
            oldestCreatedAtRef.current = sorted[0]?.created_at || null
        }

        setLoadingMore(false)
    }, [loadingMore, hasMore, currentUserId, targetUserId])

    const subscribeRealtime = () => {
        channelRef.current = supabase
            .channel(`chat_${currentUserId}_${targetUserId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const msg = payload.new
                const relevant =
                    (msg.sender_id === currentUserId && msg.receiver_id === targetUserId) ||
                    (msg.sender_id === targetUserId && msg.receiver_id === currentUserId)
                if (relevant) {
                    setMessages(prev => [...prev, msg]) // append xuống cuối
                    if (msg.sender_id === targetUserId) markAsRead()
                }
            })
            .subscribe()
    }

    const sendMessage = async (content) => {
        if (!content.trim()) return
        const { error } = await supabase.from('messages').insert({
            sender_id: currentUserId,
            receiver_id: targetUserId,
            content: content.trim(),
        })
        if (error) console.error('sendMessage error:', error);
        // ✅ Gửi push cho receiver
        if (!error) {
            supabase.functions.invoke('send-push', {
                body: {
                    user_id: targetUserId,
                    title: '💬 Tin nhắn mới',
                    body: content.trim().slice(0, 100),
                    url: '/',
                }
            })
        }
    }

    return { messages, loading, loadingMore, hasMore, loadMore, sendMessage }
}