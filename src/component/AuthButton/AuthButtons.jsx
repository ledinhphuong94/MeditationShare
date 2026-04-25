// components/AuthButtons/AuthButtons.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { supabase } from '../../supabaseClient.js';
import { useTranslation } from 'react-i18next';
import {getAvatarColor, getInitials} from '../../utils/common.js';
import {
  Button,
  Avatar,
  Dropdown,
  Space,
  Tag,
  Skeleton,
  Typography,
  message,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  SettingOutlined,
  CrownOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { getToken } from 'firebase/messaging'
import { messaging, VAPID_KEY } from '../../hooks/usePushNotification.js'

const { Text } = Typography;

/* ─────────────────────────────────────────────
   Inline styles (no external CSS file needed)
   ───────────────────────────────────────────── */
const styles = {
  /* ── Loading ── */
  skeleton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },

  /* ── Registered user trigger ── */
  userTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)',
    transition: 'all .2s ease',
    userSelect: 'none',
    maxWidth: 220,
    marginTop: 6
  },
  userTriggerHover: {
    background: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  userName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#fff',
    maxWidth: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  chevron: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    transition: 'transform .2s',
  },

  /* ── Dropdown menu header ── */
  menuHeader: {
    padding: '14px 16px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  menuHeaderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },
  menuHeaderName: {
    fontWeight: 700,
    fontSize: 15,
    color: '#1a1a2e',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 160,
  },

  /* ── Guest buttons ── */
  guestWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
};

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */
function AuthButtons() {
    const { userInfo, logout } = useAuth();
    const { userRole, username } = userInfo;
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const isAdmin = userRole === 'admin';
    const isRegistered = userRole === 'user' || userRole === 'admin';
    const isLoading = userRole === 'loading';

    /* ── Logout ── */
    const handleLogout = async () => {
        // ✅ Xóa push token trước
        try {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY })
            if (token) {
                await supabase.from('push_tokens').delete().eq('token', token)
            }
        } catch (err) {
            console.error('Remove push token error:', err)
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
        console.error('Lỗi khi đăng xuất:', error);
        messageApi.error(t('auth.unable_logout'));
        } else {
        logout();
        messageApi.success(t('auth.logout_success', 'Đã đăng xuất thành công'));
        navigate('/');
        }
    };

    /* ── Loading skeleton ── */
    if (isLoading) {
        return (
        <div style={styles.skeleton}>
            <Skeleton.Avatar active size={34} />
            <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
        );
    }

    /* ── Logged in ── */
    if (isRegistered) {
        const color = getAvatarColor(username);

        const dropdownItems = [
        {
            key: 'header',
            label: (
            <div style={styles.menuHeader}>
                <Avatar
                size={44}
                style={{ background: color, fontWeight: 700, fontSize: 16, flexShrink: 0 }}
                >
                {getInitials(username) || <UserOutlined />}
                </Avatar>
                <div style={styles.menuHeaderInfo}>
                <span style={styles.menuHeaderName}>{username}</span>
                {isAdmin ? (
                    <Tag icon={<CrownOutlined />} color="gold" style={{ width: 'fit-content', marginTop: 2 }}>
                    {t('auth.admin', 'Admin')}
                    </Tag>
                ) : (
                    <Tag color="blue" style={{ width: 'fit-content', marginTop: 2 }}>
                    {t('auth.user_role', 'Thành viên')}
                    </Tag>
                )}
                </div>
            </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        ...(isAdmin
            ? [
                {
                key: 'admin',
                icon: <SettingOutlined />,
                label: t('auth.admin_panel', 'Bảng quản trị'),
                onClick: () => navigate('/admin'),
                },
                { type: 'divider' },
            ]
            : []),
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            danger: true,
            label: t('auth.logout', 'Đăng xuất'),
            onClick: handleLogout,
        },
        ];

        return (
        <>
            {contextHolder}
            <Dropdown
                menu={{ items: dropdownItems }}
                trigger={['click']}
                placement="bottomRight"
                overlayStyle={{ minWidth: 220, zIndex: 1100 }}
            >
                <div
                    style={{
                    ...styles.userTrigger,
                    ...(hovered ? styles.userTriggerHover : {}),
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    role="button"
                    aria-label="User menu"
                >
                    <Avatar
                        size={20}
                        style={{ background: color, fontWeight: 700, fontSize: 10, flexShrink: 0 }}
                    >
                        {getInitials(username) || <UserOutlined />}
                    </Avatar>

                    {/* Hide name on very small screens via inline media query workaround */}
                    <span
                        style={styles.userName}
                        className="auth-username-label"
                    >
                    {username}
                    </span>

                    <DownOutlined
                        style={{
                            ...styles.chevron,
                            transform: hovered ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </div>
            </Dropdown>

            {/* Tiny CSS for hiding username on xs screens */}
            <style>{`
            @media (max-width: 360px) {
                .auth-username-label { display: none !important; }
            }
            `}</style>
        </>
        );
    }

    /* ── Guest ── */
    return (
        <>
        {contextHolder}
        <Space size={8} style={styles.guestWrap} wrap={false}>
            {/* Show "Guest" label only on md+ */}
            <Text
                style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    display: 'var(--auth-guest-display, inline)',
                }}
                className="auth-guest-label"
            >
                {t('auth.guest', 'Khách')}
            </Text>

            <Link to="/login">
            <Button
                type="default"
                icon={<LoginOutlined />}
                size="middle"
                style={{
                    borderRadius: 999,
                    borderColor: 'rgba(255,255,255,0.45)',
                    color: '#fff',
                    background: 'transparent',
                    fontWeight: 600,
                    fontSize: 11,
                    padding: '0 10px',
                }}
                ghost
            >
                <span className="auth-btn-text">{t('auth.login', 'Đăng nhập')}</span>
            </Button>
            </Link>

            <Link to="/register">
            <Button
                type="primary"
                icon={<UserAddOutlined />}
                size="middle"
                style={{
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 11,
                padding: '0 10px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }}
            >
                <span className="auth-btn-text">{t('auth.register', 'Đăng ký')}</span>
            </Button>
            </Link>
        </Space>

        <style>{`
            /* Hide guest label on mobile */
            @media (max-width: 480px) {
            .auth-guest-label { display: none !important; }
            }
            /* Hide button text on very small screens, keep icon */
            @media (max-width: 360px) {
            .auth-btn-text { display: none !important; }
            }
        `}</style>
        </>
    );
}

export default AuthButtons;