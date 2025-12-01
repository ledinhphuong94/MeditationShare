// components/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../UserContext';
import Admin from "../pages/Admin/Admin.jsx";

const AdminRoute = () => {
    const { userRole } = useUser();

    // Dùng cho trường hợp Auth đang tải
    if (userRole === 'loading') {
        return <div className="loading-screen">Đang kiểm tra quyền...</div>;
    }

    // Nếu không phải admin, chuyển hướng về trang chủ
    if (userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Nếu là admin, cho phép truy cập
    return <Admin />;
};

export default AdminRoute;