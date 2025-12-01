// components/AuthButtons.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext.js';
import { supabase } from '../../supabaseClient.js';
import "./AuthButtons.css";

function AuthButtons() {
    const { userInfo, logout } = useUser();
    const { userRole, userId, username } = userInfo;
    const navigate = useNavigate();
    
    // Kiểm tra trạng thái
    const isAdmin = userRole === 'admin';
    const isRegistered = userRole === 'user' || userRole === 'admin';
    const isLoading = userRole === 'loading';

    const handleLogout = async () => {
        // Log out user thật. Phiên ẩn danh vẫn giữ (nếu bạn tiếp tục dùng logic signInAnonymously)
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Lỗi khi đăng xuất:', error);
            alert('Không thể đăng xuất.');
        } else {
            logout();
            navigate('/'); 
        }
    };
    
    // Đang tải
    if (isLoading) {
        return <div className="auth-status">Đang tải...</div>;
    }

    // Đã đăng nhập (User/Admin)
    if (isRegistered) {
        return (
            <div className="auth-actions">
                <span className="user-info"><b>{username}</b> </span>
                {/* 1. Nút Admin (chỉ hiển thị cho Admin) */}
                {isAdmin && (
                    <span className="user-info">
                        (🛠️ Quản trị viên)
                    </span>
                )}
                {/* 2. Nút Đăng xuất */}
                <button onClick={handleLogout} className="btn-logout">
                    Đăng xuất
                </button>
            </div>
        );
    }
    
    // Chưa đăng ký (hoặc là Guest/Anonymous)
    return (
        <div className="auth-actions">
            <span className="user-info">Guest</span>
            <Link to="/login" className="btn-login">
                Đăng nhập
            </Link>
            <Link to="/register" className="btn-register">
                Đăng ký
            </Link>          
        </div>
    );
}

export default AuthButtons;