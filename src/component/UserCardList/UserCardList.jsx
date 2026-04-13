import { useEffect, useRef, useState } from 'react';
import { Avatar, Badge, List, Typography, Button } from 'antd'
import { MessageOutlined, EnvironmentOutlined, WifiOutlined } from '@ant-design/icons'
import { isOnline, getInitials, getAvatarColor } from '../../utils/common.js';
import { supabase } from '../../supabaseClient';

const { Text } = Typography

const formatDistance = (distance) => {
    if (distance == null) return ''
    if (distance < 1) return `${(distance).toFixed(0)} m`
    if (distance < 1000) return `${distance.toFixed(1)} m`
    return `${(distance / 1000).toFixed(1)} km`
}

const formatLastSeen = (last_seen) => {
    if (!last_seen) return ''
    const diff = Math.floor((Date.now() - new Date(last_seen).getTime()) / 1000)
    if (diff < 60) return 'vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
}

const UserCardList = ({ users = [], mapRef, myUserId, activeUserId, onSendMessage }) => {
    const itemRefs = useRef({})
    const [unreadMap, setUnreadMap] = useState({})

    // ── Unread: fetch + realtime ───────────────────────────────
    useEffect(() => {
        if (!myUserId) return
        fetchUnread()

        const channel = supabase
            .channel('unread-badge')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${myUserId}`,
            }, fetchUnread)
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [myUserId])

    const fetchUnread = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('receiver_id', myUserId)
            .eq('is_read', false)

        if (error || !data) return

        const counts = {}
        data.forEach(msg => {
            counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
        })
        setUnreadMap(counts)
    }

    // ── Scroll to active ───────────────────────────────────────
    useEffect(() => {
        if (activeUserId && itemRefs.current[activeUserId]) {
            itemRefs.current[activeUserId].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [activeUserId])

    const handleClick = (user) => {
        if (mapRef?.current && user.lat && user.lng) {
            mapRef.current.flyTo([user.lat, user.lng], 15, { duration: 1 })
        }
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '4px 0' }}>
            <List
                dataSource={users}
                renderItem={(user, index) => {
                    const online = isOnline(user.last_seen)
                    const initials = getInitials(user.name)
                    const color = getAvatarColor(user.name)
                    const isActive = user.user_id === activeUserId
                    const unread = unreadMap[user.user_id] || 0

                    if (user.user_id === myUserId) return null

                    return (
                        <List.Item
                            key={user.user_id}
                            ref={(el) => itemRefs.current[user.user_id] = el}
                            onClick={() => handleClick(user)}
                            style={{
                                padding: '9px 12px 9px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                // Left bar: vàng khi active, đỏ khi có tin chưa đọc
                                borderLeft: isActive
                                    ? '3px solid #facc15'
                                    : unread > 0
                                        ? '3px solid #ef4444'
                                        : '3px solid transparent',
                                background: isActive
                                    ? 'rgba(250,204,21,0.06)'
                                    : 'transparent',
                                transition: 'all 0.2s ease',
                                animation: `fadeSlideIn 0.3s ease both`,
                                animationDelay: `${index * 0.05}s`,
                                alignItems: 'center',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                            }}
                            onMouseLeave={e => {
                                if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(250,204,21,0.06)' : 'transparent'
                            }}
                        >
                            {/* ── Avatar + unread badge ── */}
                            <Badge
                                count={unread}
                                size="small"
                                offset={[-3, 3]}
                                styles={{
                                    indicator: {
                                        background: '#ef4444',
                                        boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                                        fontSize: 10,
                                        minWidth: 16,
                                        height: 16,
                                        lineHeight: '16px',
                                        padding: '0 4px',
                                        fontWeight: 700,
                                    }
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <Avatar
                                        size={42}
                                        style={{
                                            backgroundColor: color,
                                            fontFamily: "'DM Mono', monospace",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            letterSpacing: 1,
                                            flexShrink: 0,
                                            border: online
                                                ? '2px solid rgba(74,222,128,0.55)'
                                                : '2px solid rgba(255,255,255,0.08)',
                                            boxShadow: online
                                                ? '0 0 0 3px rgba(74,222,128,0.1)'
                                                : 'none',
                                        }}
                                    >
                                        {initials}
                                    </Avatar>
                                    {/* Online dot */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 1, right: 1,
                                        width: 10, height: 10,
                                        borderRadius: '50%',
                                        background: online ? '#4ade80' : '#2a2a2a',
                                        border: '2px solid #111',
                                        boxShadow: online ? '0 0 5px rgba(74,222,128,0.8)' : 'none',
                                    }} />
                                </div>
                            </Badge>

                            {/* ── Info ── */}
                            <div style={{ flex: 1, marginLeft: 11, minWidth: 0 }}>
                                {/* Row 1: tên + khoảng cách */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 3,
                                }}>
                                    <Text strong style={{
                                        color: unread > 0 ? '#ffffff' : '#d4d4d4',
                                        fontSize: 13.5,
                                        fontWeight: unread > 0 ? 700 : 500,
                                        fontFamily: "'DM Mono', monospace",
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {user.name}
                                    </Text>

                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 3,
                                        flexShrink: 0,
                                        background: 'rgba(250,204,21,0.08)',
                                        padding: '1px 7px',
                                        borderRadius: 20,
                                        border: '1px solid rgba(250,204,21,0.12)',
                                    }}>
                                        <EnvironmentOutlined style={{ color: '#e5e5e5ea', fontSize: 9 }} />
                                        <Text style={{
                                            color: '#e5e5e5ea', fontSize: 10.5,
                                            fontFamily: "'DM Mono', monospace",
                                            fontWeight: 600,
                                        }}>
                                            {formatDistance(user.distance)}
                                        </Text>
                                    </div>
                                </div>

                                {/* Row 2: online status + unread label */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    {online ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <WifiOutlined style={{ color: '#4ade80', fontSize: 10 }} />
                                            <Text style={{
                                                color: '#4ade80', fontSize: 11,
                                                fontFamily: "'DM Mono', monospace",
                                            }}>online</Text>
                                        </div>
                                    ) : (
                                        <Text style={{
                                            color: '#b6b6b6', fontSize: 11,
                                            fontFamily: "'DM Mono', monospace",
                                        }}>
                                            {formatLastSeen(user.last_seen)}
                                        </Text>
                                    )}

                                    {unread > 0 && (
                                        <Text style={{
                                            color: '#ef4444', fontSize: 10,
                                            fontFamily: "'DM Mono', monospace",
                                            fontWeight: 600,
                                            animation: 'pulse 1.5s ease infinite',
                                        }}>
                                            {unread} tin mới
                                        </Text>
                                    )}
                                </div>
                            </div>

                            {/* ── Message button ── */}
                            <Button
                                size="small"
                                shape="circle"
                                icon={<MessageOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSendMessage(user)
                                }}
                                style={{
                                    background: 'transparent',
                                    borderColor: unread > 0 ? '#ef4444' : '#ffffff',
                                    color: unread > 0 ? '#ffffff' : '#ffffff',
                                    flexShrink: 0,
                                    marginLeft: 8,
                                }}
                            />
                        </List.Item>
                    )
                }}
            />

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.2); border-radius: 4px; }
            `}</style>
        </div>
    )
}

export default UserCardList