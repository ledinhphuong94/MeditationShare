import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { DownloadOutlined, CloseOutlined, MoreOutlined } from '@ant-design/icons'
import { useTranslation } from "react-i18next";

export default function InstallPWA() {
    const [showIosModal, setShowIosModal] = useState(false)
    const [showAndroidModal, setShowAndroidModal] = useState(false) // State mới cho Android Modal
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIos, setIsIos] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const isInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone

        if (isInstalled) return

        const isDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true'
        if (isDismissed) return

        const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const androidDevice = /android/i.test(navigator.userAgent)

        if (iosDevice) {
            setIsIos(true)
            setShowBanner(true)
        }

        // ✅ Android: Luôn show banner ngay từ đầu (không đợi prompt nữa)
        if (androidDevice) {
            setIsAndroid(true)
            setShowBanner(true)
        }

        // Vẫn lắng nghe sự kiện để nếu có prompt thì dùng
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

        if (isAndroid) {
            // Nếu trình duyệt đã cho phép cài tự động -> Dùng Native Prompt
            if (deferredPrompt) {
                deferredPrompt.prompt()
                const { outcome } = await deferredPrompt.userChoice
                if (outcome === 'accepted') {
                    setShowBanner(false)
                }
                setDeferredPrompt(null)
            } else {
                // ❗ Nếu không có prompt (do Webview Facebook/Zalo hoặc chưa đủ chuẩn PWA) -> Mở Modal hướng dẫn
                setShowAndroidModal(true)
            }
            return
        }
    }

    const handleCloseBanner = () => {
        setShowBanner(false)
        localStorage.setItem('pwa_banner_dismissed', 'true')
    }

    if (!showBanner) return null

    return (
        <>
            {/* ✅ Banner dưới cùng */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
                background: 'linear-gradient(135deg, #1a1a1a, #111)',
                borderTop: '1px solid #facc1540', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>🕯️</div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{t('dashboard.light_map')}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>{t('installApp.install_app_more_convenient')}</div>
                </div>
                <button onClick={handleInstall} style={{
                    background: '#facc15', color: '#000', border: 'none', borderRadius: 8,
                    padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
                }}>
                    <DownloadOutlined /> {t('installApp.install_app')}
                </button>
                <button onClick={handleCloseBanner} style={{
                    background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 4, flexShrink: 0,
                }}>
                    <CloseOutlined />
                </button>
            </div>

            {/* Modal hướng dẫn iOS (Giữ nguyên của bạn) */}
            {/* ✅ Modal hướng dẫn iOS */}
            <Modal
                open={showIosModal}
                onCancel={() => setShowIosModal(false)}
                footer={null}
                centered
                width={360}
                zIndex={99999}
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
                    {/* Đường kẻ dọc */}
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
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderBottom: i === 1 ? 'none' : '1px solid #d1d1d6',
                                            background: item.highlight ? 'rgba(250,204,21,0.1)' : 'transparent',
                                        }}>
                                            <span style={{ fontSize: 15, color: '#000', fontWeight: item.highlight ? 600 : 400 }}>{item.label}</span>
                                            <svg viewBox="0 0 24 24" width="20" height="20" stroke={item.highlight ? "#d97706" : "#000"} strokeWidth="1.5" fill="none">
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
                                    <div style={{ color: '#000', fontSize: 14, fontWeight: 600 }}>{t('dashboard.light_map')}</div>
                                    <div style={{ color: '#007aff', fontSize: 16, fontWeight: 600 }}>{t('installApp.add')}</div>
                                </div>
                            )
                        },
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1, position: 'relative' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid #facc15',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#d97706', flexShrink: 0
                            }}>{step.num}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#111', fontSize: 15, fontWeight: 700 }}>{step.title}</div>
                                <div style={{ color: '#666', fontSize: 13 }}>{step.desc}</div>
                                {step.visual}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* ✅ Modal hướng dẫn Android */}
            <Modal
                open={showAndroidModal}
                onCancel={() => setShowAndroidModal(false)}
                footer={null}
                centered
                width={360}
                zIndex={99999}
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
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>🕯️</div>
                        <div>
                            <div style={{ color: '#111', fontSize: 16, fontWeight: 700 }}>{t('installApp.install_light_map')}</div>
                            <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>{t('installApp.only_tree_steps')}</div>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', left: 13, top: 30, bottom: 40, width: 2,
                        background: 'linear-gradient(to bottom, #facc15, #facc1540, transparent)', zIndex: 0
                    }} />

                    {[
                        {
                            num: 1, title: t('installApp.step1_title'), desc: t('installApp.step1_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '12px 16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: 10, border: '1px solid #e5e5ea',
                                }}>
                                    <span style={{ color: '#000', fontSize: 14 }}>bandoanhsang.vercel.app</span>
                                    <div style={{
                                        background: 'rgba(250,204,21,0.2)', padding: '4px', borderRadius: 8,
                                        border: '1.5px solid #facc15', display: 'flex', alignItems: 'center'
                                    }}>
                                        <MoreOutlined style={{ fontSize: 20, color: '#d97706', transform: 'rotate(90deg)' }} />
                                    </div>
                                </div>
                            )
                        },
                        {
                            num: 2, title: t('installApp.step2_title'), desc: t('installApp.step2_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '4px 0',
                                    marginTop: 10, border: '1px solid #e5e5ea',
                                }}>
                                    {[
                                        { label: 'Dịch...', icon: '🌐' },
                                        { label: 'Thêm vào màn hình chính', highlight: true, icon: '📱' },
                                        { label: 'Cài đặt', icon: '⚙️' },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px', borderBottom: i === 2 ? 'none' : '1px solid #d1d1d6',
                                            background: item.highlight ? 'rgba(250,204,21,0.1)' : 'transparent',
                                        }}>
                                            <span style={{
                                                fontSize: 15, color: '#000', fontWeight: item.highlight ? 600 : 400, display: 'flex', alignItems: 'center', gap: 12
                                            }}>
                                                <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
                                            </span>
                                            {item.highlight && (
                                                <span style={{ fontSize: 10, background: '#facc15', color: '#000', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>CHỌN TẠI ĐÂY</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        },
                        {
                            num: 3, title: t('installApp.step3_title'), desc: t('installApp.step3_desc'),
                            visual: (
                                <div style={{
                                    background: '#f2f2f7', borderRadius: 12, padding: '12px',
                                    marginTop: 10, border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16
                                }}>
                                     <div style={{ color: '#007aff', fontSize: 15, fontWeight: 500 }}>Hủy</div>
                                     <div style={{ color: '#007aff', fontSize: 15, fontWeight: 700 }}>Thêm</div>
                                </div>
                            )
                        },
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1, position: 'relative' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid #facc15',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#d97706', flexShrink: 0, marginTop: -2,
                            }}>
                                {step.num}
                            </div>
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
                    borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#d97706', textAlign: 'center', marginTop: 24, fontWeight: 500
                }}>
                    ⚠️ {t('installApp.feature_only_work_on_browser')} <strong>Google Chrome</strong>
                </div>
            </Modal>
        </>
    )
}