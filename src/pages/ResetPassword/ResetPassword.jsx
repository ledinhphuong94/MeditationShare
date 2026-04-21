// src/pages/ResetPassword/ResetPassword.jsx
import { useState, useEffect } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../Auth/Auth.css' // dùng chung CSS

function ResetPassword() {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('error')
    const [isValidSession, setIsValidSession] = useState(false)

    // Supabase tự parse token từ URL hash và set session
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsValidSession(true);
                return;
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    console.log('Auth event:', event, session);
                    if (event === 'PASSWORD_RECOVERY' || 
                        (event === 'SIGNED_IN' && session)) {
                        setIsValidSession(true);
                    }
                }
            );

            return () => subscription.unsubscribe();
        };

        init();
    }, []);

    const handleReset = async ({ password }) => {
        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setMessageType('error')
            setMessage(error.message)
        } else {
            setMessageType('success')
            setMessage(t("auth.reset_password_success"))
            setTimeout(() => navigate('/'), 2000)
        }

        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-form">
                <h2>{t("auth.reset_password")}</h2>

                {!isValidSession ? (
                    <Alert
                        message={t("auth.reset_link_invalid")}
                        description={t("auth.reset_link_invalid_desc")}
                        type="error"
                        showIcon
                    />
                ) : (
                    <Form form={form} onFinish={handleReset} layout="vertical" size="large">
                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: t("auth.password_required") },
                                { min: 6, message: t("auth.password_min") }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder={t("auth.new_password")}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: t("auth.confirm_password_required") },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(t("auth.password_not_match"))
                                    }
                                })
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder={t("auth.confirm_password")}
                            />
                        </Form.Item>

                        {message && (
                            <Form.Item>
                                <Alert message={message} type={messageType} showIcon />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 44, fontWeight: 600 }}
                            >
                                {t("auth.update_password")}
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </div>
        </div>
    )
}

export default ResetPassword