// components/AdminRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import Admin from "../pages/Admin/Admin.jsx";

const AdminRoute = () => {
    const { userInfo: {userRole} } = useAuth();
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