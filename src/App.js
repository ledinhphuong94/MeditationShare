// App.js (Bố cục mới)
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useUser } from './UserContext.js'; // Sử dụng context
import Auth from './pages/Auth/Auth.jsx';
import Admin from './pages/Admin/Admin.jsx'; // Component Admin bạn sẽ tạo
import AdminRoute from './routes/Admin.Route.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx'; // Component chứa Mapty, MarkupCardList, v.v.

// Component chính chứa Routes
function AppWrapper() {
    const { userRole } = useUser(); // Lấy role để sử dụng trong UI

    return (
        <BrowserRouter>
            <Routes>
                {/* 1. Trang chính (Map và List) */}
                <Route path="/" element={<Dashboard />} /> 

                {/* 2. Trang Đăng nhập/Đăng ký */}
                <Route path="/login" element={<Auth type="login" />} />
                <Route path="/register" element={<Auth type="register" />} />

                {/* 3. Route Bảo vệ (Chỉ Admin) */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<Admin />} />
                </Route>

                {/* Tùy chọn: Trang 404 */}
                <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
            </Routes>
        </BrowserRouter>
    );
}


function App() {
  return (
        // Giả định UserProvider đã bọc ở Index.js/main.js
        <AppWrapper />
  );
}

export default App;
