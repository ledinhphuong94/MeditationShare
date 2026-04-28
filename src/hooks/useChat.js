import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useTranslation } from "react-i18next";
const PAGE_SIZE = 20;

export const useChat = (currentUserId, targetUserId) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const channelRef = useRef(null)
    const oldestCreatedAtRef = useRef(null) 
    const { t } = useTranslation();

    useEffect(() => {
        if (!currentUserId || !targetUserId) return

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
            .order('created_at', { ascending: false }) // Mới nhất nằm đầu [0]
            .limit(PAGE_SIZE)

        if (!error && data) {
            setMessages(data) // KHÔNG reverse nữa
            setHasMore(data.length === PAGE_SIZE)
            // Lấy thời gian của tin nhắn cũ nhất (nằm ở cuối mảng data)
            oldestCreatedAtRef.current = data[data.length - 1]?.created_at || null
        }

        setLoading(false)
    }

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
            .lt('created_at', oldestCreatedAtRef.current)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE)

        if (!error && data) {
            // Append tin nhắn cũ vào CUỐI mảng
            setMessages(prev => [...prev, ...data]) 
            setHasMore(data.length === PAGE_SIZE)
            oldestCreatedAtRef.current = data[data.length - 1]?.created_at || null
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
                    // Prepend tin nhắn mới vào ĐẦU mảng
                    setMessages(prev => [msg, ...prev]) 
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
        if (!error) {
            supabase.functions.invoke('send-push', {
                body: {
                    user_id: targetUserId,
                    title: t('messageModal.new_mess'),
                    body: content.trim().slice(0, 100),
                    url: '/',
                }
            })
        }
    }

    return { messages, loading, loadingMore, hasMore, loadMore, sendMessage }
}