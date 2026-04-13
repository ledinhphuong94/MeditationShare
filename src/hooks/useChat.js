// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export const useChat = (currentUserId, targetUserId) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const channelRef = useRef(null)

    useEffect(() => {
        if (!currentUserId || !targetUserId) return

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
            .order('created_at', { ascending: true })

        if (!error) setMessages(data || [])
        setLoading(false)
    }

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
                    setMessages(prev => [...prev, msg])
                    if (msg.sender_id === targetUserId) {
                        markAsRead()
                    }
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
        if (error) console.error('sendMessage error:', error)
    }

    return { messages, loading, sendMessage }
}