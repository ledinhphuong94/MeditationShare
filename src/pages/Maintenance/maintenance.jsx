// 1. Tạo một Component cho trang Bảo trì/Lỗi (Ví dụ: MaintenancePage.js)
// Hoặc đơn giản là một component hiển thị thông báo.
const MaintenancePage = () => (
    <div style={{textAlign: "center"}}>
        <h1>🛠️ Hệ thống đang bảo trì</h1>
        <p>Chúng tôi đang nâng cấp và cải thiện ứng dụng. Xin vui lòng quay lại sau ít phút.</p>
        <p>Xin lỗi vì sự bất tiện này!</p>
    </div>
);

export default MaintenancePage;