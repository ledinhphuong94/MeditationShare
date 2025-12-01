import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabaseClient';

// 1. Tạo Context
const UserContext = createContext(null);

// =========================================================
// HÀM HELPER ĐỘC LẬP (Không phụ thuộc vào Provider state)
// =========================================================

// Hàm này được tách ra để tránh lỗi recursion RLS, đồng thời lấy role và name
const fetchUserProfileAndRole = async (id) => {
    // Truy vấn bảng profiles
    // const { data, error } = await supabase
    //     .from('profiles')
    //     .select('role, name') // Chỉ select những cột cần thiết
    //     .eq('id', id)
    //     .single(); // Chỉ mong muốn 1 kết quả

    const { data, error } = await supabase.rpc('get_user_role', { user_id: id });
    // console.log('data', data)
    if (error && error.code !== 'PGRST116') { // PGRST116: Dòng không tồn tại (OK)
        console.error('Lỗi khi fetch profile:', error);
    }

    if (data) {
        return data || 'user';
    }
    
    // Nếu chưa có profile (rất hiếm nếu Function backend hoạt động)
    return 'anon'; 
};


// 2. Tạo Provider Component
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('loading');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading

  // Hợp nhất logic cập nhật state
  const setAuthState = (id, role, name) => {
      setUserId(id);
      setUserRole(role);
      setUsername(name);
      setIsLoading(false);
  };
  
  // Hàm đăng xuất (Gọi supabase.auth.signOut)
  const logout = async () => {
    // Supabase sẽ tự động xử lý signOut và kích hoạt AuthListener (SIGNED_OUT)
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('meditation_anonymous_user_id');
    localStorage.removeItem('meditation_user_name');
    if (error) console.error('Lỗi khi đăng xuất:', error);
  };

  useEffect(() => {
      let isMounted = true; // Flag để kiểm tra component đã unmount chưa

      const handleSession = async (session) => {
          if (!isMounted) return;
          
          if (session && session.user) {
              const currentUserId = session.user.id;
              console.log('session', session)
              localStorage.setItem('meditation_anonymous_user_id', currentUserId);
              // Người dùng đã xác thực (bao gồm cả đăng nhập ẩn danh ban đầu)
              if (session.user.is_anonymous) {
                  setAuthState(currentUserId, 'anon', 'Anonymous');
              } else {
                  // Người dùng đã đăng ký
                  const profileRole = await fetchUserProfileAndRole(currentUserId);
                  console.log('profileData', profileRole);
                  setAuthState(currentUserId, profileRole, session.user.user_metadata?.name);
              }

          } else {
              // KHÔNG CÓ SESSION -> Xử lý Đăng nhập Ẩn danh/Đăng xuất hoàn toàn
              
              // Trường hợp 1: Mới tải (INITIAL_SESSION) HOẶC user vừa SIGNED_OUT
              try {
                  const { data } = await supabase.auth.signInAnonymously();
                  
                  if (data?.user) {
                      // Đăng nhập ẩn danh thành công, set state lần 2 (SIGNED_IN)
                      setAuthState(data.user.id, 'anon', 'Anonymous');
                  } else {
                       // Không có user (ví dụ: lỗi server)
                      setAuthState(null, 'anon', 'Anonymous');
                  }
              } catch (e) {
                  console.error("Lỗi đăng nhập ẩn danh", e);
                  setAuthState(null, 'anon', 'Anonymous');
              }
          }
      };

      // Lắng nghe thay đổi trạng thái Auth: Đây là nguồn chân lý duy nhất.
      // Sẽ kích hoạt lần 1 với INITIAL_SESSION (có hoặc không có session)
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`Auth Event changed: ${event}`); // Kiểm tra event: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT
          
          // Tránh gọi handleSession nếu session.user đã là null và event là SIGNED_OUT.
          // Chúng ta xử lý logic anon trong khối else của handleSession
          handleSession(session);
      });

      return () => {
        isMounted = false; // Cleanup
        authListener?.subscription?.unsubscribe();
      };
  }, []); // Chỉ chạy 1 lần khi mount

  const userInfo = {
      userId,
      userRole,
      username,
      isLoading, // Thêm trạng thái loading
  };

  return (
    <UserContext.Provider value={{ userInfo, logout }}>
      {/* Chỉ hiển thị children khi đã load xong trạng thái Auth */}
      {isLoading ? <div>Loading Authentication...</div> : children}
    </UserContext.Provider>
  );
};

// 3. Tạo Custom Hook để sử dụng Context dễ dàng hơn
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};