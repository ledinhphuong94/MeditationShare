import { Drawer, Input, Button, Spin } from 'antd'
import { SendOutlined, SmileOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useChat } from '../../hooks/useChat'
import { getInitials, getAvatarColor } from '../../utils/common'
import * as prohibitWord from "../../utils/prohibitMessage.js";
import { useTranslation } from "react-i18next";

const ChatDrawer = ({ open, onClose, currentUser, targetUser }) => {
    const [input, setInput] = useState('')
    const [showPicker, setShowPicker] = useState(false)
    const bottomRef = useRef(null)
    const pickerRef = useRef(null)
    const inputRef = useRef(null)
    const { t } = useTranslation();
    let isMobile = window.innerWidth < 768;

    const { messages, loading, sendMessage } = useChat(
        currentUser?.id,
        targetUser?.user_id
    )

    // Scroll xuống tin mới nhất
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Click ngoài picker → đóng
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Đóng drawer → reset
    useEffect(() => {
        if (!open) {
            setShowPicker(false)
            setInput('')
        }
    }, [open])

    const handleEmojiSelect = (emoji) => {
        const native = emoji.native
        const el = inputRef.current?.input
        if (el) {
            // Chèn emoji vào đúng vị trí cursor
            const start = el.selectionStart
            const end = el.selectionEnd
            const newValue = input.slice(0, start) + native + input.slice(end)
            setInput(newValue)
            // Restore cursor sau emoji
            setTimeout(() => {
                el.focus()
                el.setSelectionRange(start + native.length, start + native.length)
            }, 0)
        } else {
            setInput(prev => prev + native)
        }
    }

    const handleSend = async () => {
        if (!input.trim()) return;
        // Kiểm tra nội dung có chứa từ cấm không?
        if (prohibitWord.containsForbiddenContent(input.trim()) || prohibitWord.containsProfanity(input.trim())) {
            alert(t("messageModal.not_valid_message"));
            return;
        };
        await sendMessage(input)
        setInput('')
        setShowPicker(false)
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={isMobile ? "90%" : 360}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: getAvatarColor(targetUser?.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 12,
                    }}>
                        {getInitials(targetUser?.name)}
                    </div>
                    <span style={{ color: '#f5f5f5' }}>{targetUser?.name}</span>
                </div>
            }
            zIndex={9999}
            styles={{
                body: {
                    display: 'flex', flexDirection: 'column',
                    padding: 0, background: '#0f0f0f', height: '100%',
                },
                header: { background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' },
            }}
        >
            {/* ── Messages ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                {loading
                    ? <div style={{ textAlign: 'center', paddingTop: 40 }}><Spin /></div>
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
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    wordBreak: 'break-word',
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

            {/* ── Emoji Picker (popup) ── */}
            <div style={{ position: 'relative' }}>
                {showPicker && (
                    <div
                        ref={pickerRef}
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 12,
                            zIndex: 1000,
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                            border: '1px solid #2a2a2a',
                        }}
                    >
                        <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme="dark"
                            locale="vi"
                            previewPosition="none"
                            skinTonePosition="none"
                            maxFrequentRows={2}
                            perLine={8}
                        />
                    </div>
                )}

                {/* ── Input row ── */}
                <div style={{
                    padding: '12px',
                    borderTop: '1px solid #2a2a2a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    {/* Emoji button */}
                    <Button
                        shape="circle"
                        icon={<SmileOutlined />}
                        onClick={() => setShowPicker(prev => !prev)}
                        style={{
                            background: showPicker ? 'rgba(250,204,21,0.15)' : 'transparent',
                            borderColor: showPicker ? '#facc15' : '#2a2a2a',
                            color: showPicker ? '#facc15' : '#888',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                        }}
                    />

                    {/* Input */}
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Nhập tin nhắn..."
                        style={{
                            background: '#1a1a1a',
                            borderColor: '#2a2a2a',
                            color: '#f0f0f0',
                            borderRadius: 20,
                        }}
                    />

                    {/* Send button */}
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={!input.trim()}
                        style={{
                            background: input.trim() ? '#facc15' : '#1f1f1f',
                            borderColor: input.trim() ? '#facc15' : '#2a2a2a',
                            color: input.trim() ? '#000' : '#444',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                        }}
                    />
                </div>
            </div>
        </Drawer>
    )
}

export default ChatDrawer