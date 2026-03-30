// components/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../UserContext';
import Admin from "../pages/Admin/Admin.jsx";

const AdminRoute = () => {
    const { userInfo } = useUser();
    console.log('userRole', userInfo.userRole)

    // Dùng cho trường hợp Auth đang tải
    if (userInfo.userRole === 'loading') {
        return <div className="loading-screen">Đang kiểm tra quyền...</div>;
    }

    // Nếu không phải admin, chuyển hướng về trang chủ
    if (userInfo.userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Nếu là admin, cho phép truy cập
    return <Admin />;
};

export default AdminRoute;