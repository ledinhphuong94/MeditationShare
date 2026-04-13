// src/components/ChatDrawer/ChatDrawer.jsx
import { Drawer, Input, Button, Spin } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { getInitials, getAvatarColor } from '../../utils/common.js'

const ChatDrawer = ({ open, onClose, currentUser, targetUser }) => {
    const [input, setInput] = useState('')
    const bottomRef = useRef(null)

    const { messages, loading, sendMessage } = useChat(
        currentUser?.id,
        targetUser?.user_id
    )

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return
        await sendMessage(input)
        setInput('')
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={360}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: getAvatarColor(targetUser?.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 12,
                        flexShrink: 0,
                    }}>
                        {getInitials(targetUser?.name)}
                    </div>
                    <span style={{ color: '#f5f5f5' }}>{targetUser?.name}</span>
                </div>
            }
            styles={{
                body: {
                    display: 'flex', flexDirection: 'column',
                    padding: 0, background: '#0f0f0f', height: '100%',
                },
                header: {
                    background: '#1a1a1a',
                    borderBottom: '1px solid #2a2a2a',
                },
                mask: { backdropFilter: 'blur(2px)' },
            }}
        >
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                {loading
                    ? <div style={{ textAlign: 'center', paddingTop: 40 }}>
                        <Spin />
                    </div>
                    : messages.map((msg) => {
                        const isMine = msg.sender_id === currentUser?.id
                        return (
                            <div key={msg.id} style={{
                                display: 'flex',
                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                marginBottom: 8,
                            }}>
                                <div style={{
                                    maxWidth: '75%',
                                    background: isMine ? '#facc15' : '#1f1f1f',
                                    color: isMine ? '#000' : '#f0f0f0',
                                    padding: '8px 12px',
                                    borderRadius: isMine
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                }}>
                                    {msg.content}
                                    <div style={{
                                        fontSize: 10, opacity: 0.5,
                                        marginTop: 3, textAlign: 'right',
                                    }}>
                                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '12px',
                borderTop: '1px solid #2a2a2a',
                display: 'flex', gap: 8,
            }}>
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={handleSend}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        background: '#1a1a1a', borderColor: '#2a2a2a',
                        color: '#f0f0f0', borderRadius: 20,
                    }}
                />
                <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!input.trim()}
                    style={{
                        background: '#facc15', borderColor: '#facc15',
                        color: '#000', flexShrink: 0,
                    }}
                />
            </div>
        </Drawer>
    )
}

export default ChatDrawer