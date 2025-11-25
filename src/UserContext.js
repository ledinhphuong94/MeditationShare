// UserContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Tạo Context
const UserContext = createContext(null);

// 2. Tạo Provider Component
export const UserProvider = ({ children }) => {
  // state để lưu User ID và các thông tin khác
  const [userId, setUserId] = useState(null);
  
  // Bạn có thể thêm các hàm đăng nhập/đăng xuất tại đây
  const login = (id) => {
    setUserId(id);
    // Lưu ID vào Local Storage nếu cần duy trì phiên
    localStorage.setItem('meditation_user_id', id); 
  };
  
  const logout = () => {
    setUserId(null);
    localStorage.removeItem('meditation_user_id');
    localStorage.removeItem('meditationShare');
  };

  return (
    <UserContext.Provider value={{ userId, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// 3. Tạo Custom Hook để sử dụng Context dễ dàng hơn
export const useUser = () => {
  return useContext(UserContext);
};