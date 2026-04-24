import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from "react-i18next";

export default function InstallPWA() {
    const [showIosModal, setShowIosModal] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIos, setIsIos] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const isInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone

        if (isInstalled) return

        const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
        if (!isMobile) return

        const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const androidDevice = /android/i.test(navigator.userAgent)

        // iOS
        if (iosDevice) {
            setIsIos(true)
            setShowBanner(true)
        }

        // Android fallback: luôn show
        if (androidDevice) {
            setShowBanner(true)
        }

        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (isIos) {
            setShowIosModal(true)
            return
        }

        // ❗ nếu không có prompt → fallback hướng dẫn
        if (!deferredPrompt) {
            alert('Vui lòng dùng menu Chrome → "Add to Home screen"')
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowBanner(false)
        }

        setDeferredPrompt(null)
    }

    if (!showBanner) return null

    return (
        <>
            {/* ✅ Banner dưới cùng */}
            <div style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 99999,
                background: 'linear-gradient(135deg, #1a1a1a, #111)',
                borderTop: '1px solid #facc1540',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            }}>
                {/* Icon app */}
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                }}>🕯️</div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                        {t('dashboard.light_map')}
                    </div>
                    <div style={{ color: '#888', fontSize: 11 }}>
                         {t('installApp.install_app_more_convenient')}
                    </div>
                </div>

                {/* Nút cài */}
                <button
                    onClick={handleInstall}
                    style={{
                        background: '#facc15', color: '#000',
                        border: 'none', borderRadius: 8,
                        padding: '8px 16px', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <DownloadOutlined /> {t('installApp.install_app')}
                </button>

                {/* Nút đóng */}
                <button
                    onClick={() => setShowBanner(false)}
                    style={{
                        background: 'transparent', border: 'none',
                        color: '#555', cursor: 'pointer',
                        padding: 4, flexShrink: 0,
                    }}
                >
                    <CloseOutlined />
                </button>
            </div>

            {/* Modal hướng dẫn iOS */}
            <Modal
                open={showIosModal}
                onCancel={() => setShowIosModal(false)}
                footer={null}
                centered
                width={360}
                styles={{
                    content: { background: '#ffffff', border: 'none', borderRadius: 16, padding: 0, overflow: 'hidden' },
                    header: { background: '#ffffff', borderBottom: '1px solid #f0f0f0', padding: '16px 20px', margin: 0 },
                    body: { padding: '20px' },
                    mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' },
                }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                        }}>🕯️</div>
                        <div>
                            <div style={{ color: '#111', fontSize: 16, fontWeight: 700 }}>{t('installApp.install_light_map')}</div>
                            <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>{t('installApp.only_tree_steps')}</div>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
                    {/* Đường kẻ dọc kết nối các bước */}
                    <div style={{
                        position: 'absolute', left: 13, top: 30, bottom: 40, width: 2,
                        background: 'linear-gradient(to bottom, #facc15, #facc1540, transparent)',
                        zIndex: 0
                    }} />

                    {[
                        {
                            num: 1, title: t('installApp.select_share'), desc: t('installApp.select_share_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                                    marginTop: 10, border: '1px solid #e5e5ea',
                                }}>
                                    <span style={{ color: '#007aff', fontSize: 20 }}>⟨</span>
                                    <span style={{ color: '#c7c7cc', fontSize: 20 }}>⟩</span>
                                    {/* Nút Share mô phỏng iOS */}
                                    <div style={{
                                        background: 'rgba(250,204,21,0.2)', padding: '6px 12px', borderRadius: 8,
                                        border: '1.5px solid #facc15', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                            <polyline points="16 6 12 2 8 6" />
                                            <line x1="12" y1="2" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span style={{ color: '#007aff', fontSize: 20 }}>📖</span>
                                    <span style={{ color: '#007aff', fontSize: 20 }}>⧉</span>
                                </div>
                            )
                        },
                        {
                            num: 2, title: t('installApp.select_add_to_main_screen'), desc: t('installApp.select_add_to_main_screen_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '4px 0',
                                    marginTop: 10, border: '1px solid #e5e5ea',
                                }}>
                                    {[
                                        { label: t('installApp.copy'), icon: <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /> },
                                        { 
                                          label: t('installApp.add_to_main_screen'), highlight: true, 
                                          icon: <><rect x="3" y="3" width="18" height="18" rx="4" ry="4" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></> 
                                        },
                                        { label: t('installApp.bookmark'), icon: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderBottom: i === 2 ? 'none' : '1px solid #d1d1d6',
                                            background: item.highlight ? 'rgba(250,204,21,0.1)' : 'transparent',
                                        }}>
                                            <span style={{
                                                fontSize: 15, color: '#000', fontWeight: item.highlight ? 600 : 400,
                                                display: 'flex', alignItems: 'center', gap: 8
                                            }}>
                                                {item.label}
                                                {item.highlight && (
                                                    <span style={{
                                                        fontSize: 10, background: '#facc15', color: '#000',
                                                        borderRadius: 4, padding: '2px 6px', fontWeight: 700,
                                                    }}>{t('installApp.select_here')}</span>
                                                )}
                                            </span>
                                            <svg viewBox="0 0 24 24" width="20" height="20" stroke={item.highlight ? "#d97706" : "#000"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                {item.icon}
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            )
                        },
                        {
                            num: 3, title: t('installApp.select_add_right_top'), desc: t('installApp.select_add_right_top_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '12px',
                                    marginTop: 10, border: '1px solid #e5e5ea',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 8,
                                            background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                        }}>🕯️</div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: 14, fontWeight: 600 }}>{t('dashboard.light_map')}</div>
                                            <div style={{ color: '#666', fontSize: 12 }}>bandoanhsang.vercel.app</div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#007aff', fontSize: 16, fontWeight: 600 }}>{t('installApp.add')}</div>
                                </div>
                            )
                        },
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1, position: 'relative' }}>
                            {/* Vòng tròn số thứ tự */}
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#fff', border: '2px solid #facc15',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, color: '#d97706',
                                flexShrink: 0, marginTop: -2,
                            }}>
                                {step.num}
                            </div>
                            {/* Nội dung */}
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#111', fontSize: 15, fontWeight: 700 }}>{step.title}</div>
                                <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{step.desc}</div>
                                {step.visual}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, color: '#d97706', textAlign: 'center', marginTop: 24, fontWeight: 500
                }}>
                    ⚠️ {t('installApp.feature_only_work_on_browser')} <strong>Safari</strong>
                </div>
            </Modal>
        </>
    )
}