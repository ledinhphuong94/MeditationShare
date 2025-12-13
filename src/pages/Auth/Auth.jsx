// pages/Auth.js
import './Auth.css'
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate để điều hướng
import { useUser } from '../../UserContext.js'; // Import UserContext để lấy ID ẩn danh hiện tại
import { useTranslation } from "react-i18next";

function Auth({ type }) {
    // Sử dụng useUser để lấy ID ẩn danh hiện tại (userId từ context)
    const { userInfo } = useUser();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
            setMessage(t("auth.error_move_markers_from_anon"));
        } else {
            console.log("Di chuyển markers thành công.");
        }
    }

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

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
            setMessage(error.message);

        } else if (type === 'register') {
            // --- Xử lý Thành công Đăng ký ---
            
            // Lấy ID ẩn danh cũ từ UserContext (đã được load từ LocalStorage hoặc signInAnonymously)
            const oldAnonId = userInfo.userId;
            const newRegisteredId = data.user.id; 
            
            if (data.user && !data.session) {
                // Xác nhận Email được bật (Mặc định): Chỉ thông báo và di chuyển
                await migrateMarkers(oldAnonId, newRegisteredId);
                setMessage(t("auth.register_sucess_check_email"));
                // Tùy chọn: Chuyển hướng về trang login sau khi đăng ký
                // navigate('/login');
            
            } else if (data.session) {
                // Xác nhận Email bị TẮT HOẶC Đăng ký và có session ngay lập tức
                await migrateMarkers(oldAnonId, newRegisteredId);
                setMessage(t("auth.register_login_success"));
                // Chuyển hướng về trang chính/bản đồ
                navigate('/');
            }

        } else if (type === 'login' && data.session) {
             // --- Xử lý Thành công Đăng nhập ---
             setMessage(t("auth.login_success"));
             // Auth Listener sẽ tự cập nhật Context, chỉ cần chuyển hướng
             navigate('/'); 
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <Link to="/" className="home-page">
                {t("auth.back_to_map")}
            </Link>
            <div className="auth-form">
                <h2>{type === 'register' ? t("auth.register_account") : t("auth.login")}</h2>
                <form onSubmit={handleAuth}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                    {type === 'register' && 
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("auth.your_name")} required />
                    }
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")} required />
                    
                    {/* Hiển thị thông báo lỗi/thành công */}
                    {message && <p>{message}</p>}
                    
                    <button type="submit" disabled={loading}>
                        {loading ? t("common.loading") : (type === 'register' ? t("auth.register") : t("auth.login"))}
                    </button>
                </form>

                <p className="auth-switch">
                    {type === 'register' ? (
                        <>
                            {t("auth.already_had_account_ques")} <Link to="/login">{t("auth.login_now")}</Link>
                        </>
                    ) : (
                        <>
                            {t("auth.dont_have_account_ques")} <Link to="/register">{t("auth.register_new")}</Link>
                        </>
                    )}
                </p>
            </div>
        </div>
        
    );
}

export default Auth;