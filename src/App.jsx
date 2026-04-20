// App.js (Bố cục mới)
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { useAuth } from './context/AuthContext.js'; // Sử dụng context
import Auth from './pages/Auth/Auth.jsx';
import Admin from './pages/Admin/Admin.jsx'; // Component Admin bạn sẽ tạo
import AdminRoute from './routes/Admin.Route.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword'

// Component chính chứa Routes
function AppWrapper() {
    // const { userRole } = useAuth(); // Lấy role để sử dụng trong UI

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} /> 
                <Route path="/login" element={<Auth type="login" />} />
                <Route path="/register" element={<Auth type="register" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<Admin />} />
                </Route>

                <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />

                {/* Tùy chọn: Trang 404 */}
                {/* <Route path="*" element={<MaintenancePage />} /> */}
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
