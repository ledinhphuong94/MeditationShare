import './Auth.css'
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate để điều hướng
import { useAuth } from '../../context/AuthContext.js'; // Import UserContext để lấy ID ẩn danh hiện tại
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Alert, Modal } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'

function Auth({ type }) {
    // Sử dụng useAuth để lấy ID ẩn danh hiện tại (userId từ context)
    const { userInfo } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('error')
    const [forgotOpen, setForgotOpen] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotMessage, setForgotMessage] = useState('')
    const [forgotType, setForgotType] = useState('success')

    const handleForgotPassword = async () => {
        if (!forgotEmail) return
        setForgotLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            setForgotType('error')
            setForgotMessage(error.message)
        } else {
            setForgotType('success')
            setForgotMessage(t("auth.forgot_email_sent"))
        }
        setForgotLoading(false)
    }

    /**
     * Hàm gọi RPC Function để di chuyển markers từ ID ẩn danh cũ sang ID mới
     * @param {string} anonymousId - UUID ẩn danh cũ
     * @param {string} registeredId - UUID đã đăng ký mới
     */
    async function migrateMarkers(anonymousId, registeredId) {
        if (!anonymousId || anonymousId === registeredId) {
            console.log("Không cần di chuyển hoặc ID đã khớp.");
            return;
        }        
        const { error: rpcError } = await supabase.rpc('migrate_anonymous_markers', {
            p_old_user_id: anonymousId,
            p_new_user_id: registeredId,
        });

        if (rpcError) {
            console.error('Lỗi di chuyển markers:', rpcError);
            setMessageType('error')
            setMessage(t("auth.error_move_markers_from_anon"));
        } else {
            console.log("Di chuyển markers thành công.");
        }
    }

    const handleAuth = async (values) => {
        const { email, password, username } = values
        setLoading(true)
        setMessage('')

        let authAction; // Biến lưu trữ hành động Auth (signUp hoặc signIn)

        if (type === 'register') {
            // --- 1. Đăng ký ---
            authAction = supabase.auth.signUp({ 
                email, 
                password, 
                options: {
                    data: {name: username}
                }
            });
        } else {
            // --- 2. Đăng nhập ---
            authAction = supabase.auth.signInWithPassword({ email, password });
        }

        const { data, error } = await authAction;
        if (error) {
            // Xử lý lỗi từ Supabase (Email đã tồn tại, mật khẩu sai, v.v.)
            setMessageType('error')
            setMessage(error.message);

        } else if (type === 'register') {
            // --- Xử lý Thành công Đăng ký ---
            
            // Lấy ID ẩn danh cũ từ UserContext (đã được load từ LocalStorage hoặc signInAnonymously)
            const oldAnonId = userInfo.userId;
            const newRegisteredId = data.user.id; 
            
            if (data.user && !data.session) {
                // Xác nhận Email được bật (Mặc định): Chỉ thông báo và di chuyển
                await migrateMarkers(oldAnonId, newRegisteredId);
                setMessageType('success')
                setMessage(t("auth.register_sucess_check_email"));
                // Tùy chọn: Chuyển hướng về trang login sau khi đăng ký
                // navigate('/login');
            
            } else if (data.session) {
                // Xác nhận Email bị TẮT HOẶC Đăng ký và có session ngay lập tức
                await migrateMarkers(oldAnonId, newRegisteredId);
                setMessageType('success')
                setMessage(t("auth.register_login_success"));
                // Chuyển hướng về trang chính/bản đồ
                navigate('/');
            }

        } else if (type === 'login' && data.session) {
             // --- Xử lý Thành công Đăng nhập ---
            setMessageType('success')
            setMessage(t("auth.login_success"));
            // Auth Listener sẽ tự cập nhật Context, chỉ cần chuyển hướng
            navigate('/'); 
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <Link to="/" className="home-page">{t("auth.back_to_map")}</Link>

            <div className="auth-form">
                <h2>{type === 'register' ? t("auth.register_account") : t("auth.login")}</h2>

                <Form form={form} onFinish={handleAuth} layout="vertical" size="large">
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: t("auth.email_required") },
                            { type: 'email', message: t("auth.email_invalid") }
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    {type === 'register' && (
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: t("auth.name_required") }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder={t("auth.your_name")} />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: t("auth.password_required") },
                            { min: 6, message: t("auth.password_min") }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder={t("auth.password")} />
                    </Form.Item>

                    {message && (
                        <Form.Item>
                            <Alert
                                message={message}
                                type={messageType}  // 'error' hoặc 'success'
                                showIcon
                                style={{ marginBottom: 8 }}
                            />
                        </Form.Item>
                    )}
                    {/* Thêm link Quên mật khẩu — chỉ hiện ở trang login */}
                    {type === 'login' && (
                        <p style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>
                            <a
                                onClick={() => setForgotOpen(true)}
                                style={{ color: '#4CAF50', cursor: 'pointer', fontSize: 13 }}
                            >
                                {t("auth.forgot_password")}
                            </a>
                        </p>
                    )}

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{ height: 44, fontWeight: 600 }}
                        >
                            {type === 'register' ? t("auth.register") : t("auth.login")}
                        </Button>
                    </Form.Item>
                </Form>

                <p className="auth-switch">
                    {type === 'register' ? (
                        <>{t("auth.already_had_account_ques")} <Link to="/login">{t("auth.login_now")}</Link></>
                    ) : (
                        <>{t("auth.dont_have_account_ques")} <Link to="/register">{t("auth.register_new")}</Link></>
                    )}
                </p>
            </div>

            {/* Modal quên mật khẩu */}
            <Modal
                title={t("auth.forgot_password")}
                open={forgotOpen}
                onCancel={() => {
                    setForgotOpen(false)
                    setForgotMessage('')
                    setForgotEmail('')
                }}
                footer={null}
                centered
            >
                <p style={{ color: '#666', marginBottom: 16 }}>
                    {t("auth.forgot_password_desc")}
                </p>

                <Input
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onPressEnter={handleForgotPassword}
                    size="large"
                    style={{ marginBottom: 12 }}
                />

                {forgotMessage && (
                    <Alert
                        message={forgotMessage}
                        type={forgotType}
                        showIcon
                        style={{ marginBottom: 12 }}
                    />
                )}

                <Button
                    type="primary"
                    block
                    loading={forgotLoading}
                    onClick={handleForgotPassword}
                    disabled={!forgotEmail}
                    style={{ height: 42 }}
                >
                    {t("auth.send_reset_link")}
                </Button>
            </Modal>
        </div>
    );
}

export default Auth;