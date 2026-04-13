// components/AuthButtons.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { supabase } from '../../supabaseClient.js';
import "./AuthButtons.css";
import { useTranslation } from "react-i18next";


function AuthButtons() {
    const { userInfo, logout } = useAuth();
    const { userRole, username } = userInfo;
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    // Kiểm tra trạng thái
    const isAdmin = userRole === 'admin';
    const isRegistered = userRole === 'user' || userRole === 'admin';
    const isLoading = userRole === 'loading';

    const handleLogout = async () => {
        // Log out user thật. Phiên ẩn danh vẫn giữ (nếu bạn tiếp tục dùng logic signInAnonymously)
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Lỗi khi đăng xuất:', error);
            alert(t("auth.unable_logout"));
        } else {
            logout();
            navigate('/'); 
        }
    };
    
    // Đang tải
    if (isLoading) {
        return <div className="auth-status">{t("common.loading")}</div>;
    }

    // Đã đăng nhập (User/Admin)
    if (isRegistered) {
        return (
            <div className="auth-actions">
                <span className="user-info"><b>{username}</b> </span>
                {/* 1. Nút Admin (chỉ hiển thị cho Admin) */}
                {isAdmin && (
                    <span className="user-info">
                        (🛠️ {t("auth.admin")})
                    </span>
                )}
                {/* 2. Nút Đăng xuất */}
                <button onClick={handleLogout} className="btn-logout">
                    {t("auth.logout")}
                </button>
            </div>
        );
    }
    
    // Chưa đăng ký (hoặc là Guest/Anonymous)
    return (
        <div className="auth-actions">
            <span className="user-info">{t("auth.guest")}</span>
            <Link to="/login" className="btn-login">
                {t("auth.login")}
            </Link>
            <Link to="/register" className="btn-register">
                {t("auth.register")}
            </Link>          
        </div>
    );
}

export default AuthButtons;