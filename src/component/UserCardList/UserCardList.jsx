import { useEffect, useRef, useState, useCallback } from 'react'; // Thêm useCallback
import { Avatar, Badge, List, Typography, Button } from 'antd'
import { MessageOutlined, EnvironmentOutlined, WifiOutlined } from '@ant-design/icons'
import { isOnline, getInitials, getAvatarColor } from '../../utils/common.js';
import { supabase } from '../../supabaseClient';
import { useTranslation } from "react-i18next";
import { useUsersContext } from '../../context/UsersContext.js';
const { Text } = Typography

const formatDistance = (distance) => {
    if (distance == null) return ''
    if (distance < 1000) return `${Math.round(distance)} m`
    return `${(distance / 1000).toFixed(1)} km`
}

const formatLastSeen = (t, last_seen) => {
    if (!last_seen) return ''
    const diff = Math.floor((Date.now() - new Date(last_seen).getTime()) / 1000)
    if (diff < 60) return t('userCardList.just_now')
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t('userCardList.minute_ago')}`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('userCardList.hour_ago')}`
    return `${Math.floor(diff / 86400)} ${t('userCardList.day_ago')}`
}

const UserCardList = ({ mapRef, myUserId, activeUserId, onSendMessage, onCloseDrawer }) => {
    const itemRefs = useRef({})
    const [unreadMap, setUnreadMap] = useState({});
    const { t } = useTranslation();
    const { users } = useUsersContext();

    // ✅ Bọc useCallback để tránh re-render trigger effect
    const fetchUnread = useCallback(async () => {
        if (!myUserId) return
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
    }, [myUserId]);

    useEffect(() => {
        if (!myUserId) return
        fetchUnread()

        const channel = supabase
            .channel('unread-badge')
            .on('postgres_changes', {
                event: '*', // Lắng nghe cả INSERT (có tin mới) và UPDATE (khi tin nhắn được mark read)
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${myUserId}`,
            }, fetchUnread)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [myUserId, fetchUnread])

    useEffect(() => {
        if (activeUserId && itemRefs.current[activeUserId]) {
            itemRefs.current[activeUserId].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [activeUserId])

    const handleClick = (user) => {
        if (onCloseDrawer) onCloseDrawer();
        if (mapRef?.current && user.lat && user.lng) {
            mapRef.current.flyTo([user.lat, user.lng], 15, { duration: 1 })
        }
    }

    return (
        <div className="user-card-list-container">
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
                            className={`user-list-item ${isActive ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''}`}
                            style={{
                                animationDelay: `${index * 0.05}s`,
                            }}
                        >
                            {/* ── Avatar Section (Giữ nguyên) ── */}
                            <Badge count={unread} size="small" offset={[-3, 3]}
                                styles={{ indicator: { background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)', fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px', padding: '0 4px', fontWeight: 700 } }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <Avatar size={42} style={{ backgroundColor: color, fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, letterSpacing: 1, flexShrink: 0, border: online ? '2px solid rgba(74,222,128,0.55)' : '2px solid rgba(255,255,255,0.08)', boxShadow: online ? '0 0 0 3px rgba(74,222,128,0.1)' : 'none' }}>
                                        {initials}
                                    </Avatar>
                                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: online ? '#4ade80' : '#2a2a2a', border: '2px solid #111', boxShadow: online ? '0 0 5px rgba(74,222,128,0.8)' : 'none' }} />
                                </div>
                            </Badge>

                            {/* ── Info Section ── */}
                            <div style={{ flex: 1, marginLeft: 11, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                    <Text strong style={{ color: unread > 0 ? '#ffffff' : '#d4d4d4', fontSize: 13.5, fontWeight: unread > 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {user.name}
                                    </Text>
                                    <div className="distance-tag">
                                        <EnvironmentOutlined style={{ fontSize: 9, color: '#ffffff' }} />
                                        <Text className="distance-text">{formatDistance(user.distance)}</Text>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {online ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <WifiOutlined style={{ color: '#4ade80', fontSize: 10 }} />
                                            <Text style={{ color: '#4ade80', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{t('userCardList.online')}</Text>
                                        </div>
                                    ) : (
                                        <Text style={{ color: '#b6b6b6', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                                            {formatLastSeen(t, user.last_seen)}
                                        </Text>
                                    )}

                                    {unread > 0 && (
                                        <Text className="unread-label">
                                            {unread} {t('userCardList.new_message')}
                                        </Text>
                                    )}
                                </div>
                            </div>

                            <Button size="small" shape="circle" icon={<MessageOutlined />}
                                onClick={(e) => { e.stopPropagation(); onSendMessage(user); }}
                                className={`msg-btn ${unread > 0 ? 'unread' : ''}`}
                            />
                        </List.Item>
                    )
                }}
            />

            <style>{`
                .user-card-list-container { height: 100%; overflow-y: auto; padding: 4px 0; }
                
                .user-list-item {
                    padding: 9px 12px 9px 14px !important;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    border-left: 3px solid transparent;
                    transition: background 0.2s ease, border-color 0.2s ease;
                    animation: fadeSlideIn 0.3s ease both;
                    align-items: center !important;
                }

                /* Hover effect bằng CSS cực mượt */
                .user-list-item:hover { background: rgba(255,255,255,0.03); }

                .user-list-item.active {
                    border-left: 3px solid #facc15;
                    background: rgba(250,204,21,0.06) !important;
                }

                .user-list-item.has-unread { border-left: 3px solid #ef4444; }

                .distance-tag {
                    display: flex; align-items: center; gap: 3; flex-shrink: 0;
                    background: rgba(250,204,21,0.08); padding: 1px 7px;
                    border-radius: 20px; border: 1px solid rgba(250,204,21,0.12);
                }
                .distance-text { color: #e5e5e5ea; font-size: 10.5px; font-family: 'DM Mono', monospace; font-weight: 600; }

                .unread-label {
                    color: #ef4444; font-size: 10px; font-family: 'DM Mono', monospace;
                    font-weight: 600; animation: pulse 1.5s ease infinite;
                }

                .msg-btn { background: transparent !important; border-color: #ffffff !important; color: #ffffff !important; flex-shrink: 0; margin-left: 8px; }
                .msg-btn.unread { border-color: #ef4444 !important; }

                @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.2); border-radius: 4px; }
            `}</style>
        </div>
    )
}

export default UserCardList