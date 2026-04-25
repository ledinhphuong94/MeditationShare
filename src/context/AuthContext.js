import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import { useTranslation } from "react-i18next";

const AuthContext = createContext(null);

const fetchUserProfileAndRole = async (id) => {
    const { data, error } = await supabase.rpc('get_user_role', { user_id: id });
    if (error && error.code !== 'PGRST116') {
        console.error('Lỗi khi fetch profile:', error);
    }
    return data || 'anon'; 
};

export const AuthProvider = ({ children }) => {
    // Gộp các state liên quan đến user vào 1 object để giảm số lần set dời rạc
    const [authState, setAuthState] = useState({
        userId: null,
        userRole: 'loading',
        username: '',
        isLoading: true
    });
    
    const { t } = useTranslation();

    // Dùng useCallback để hàm logout không bị tạo lại mỗi lần render
    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('meditation_anonymous_user_id');
        localStorage.removeItem('meditation_user_name');
        localStorage.removeItem('meditation_currPos');
        if (error) console.error('Lỗi khi đăng xuất:', error);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const handleAuthChange = async (event, session) => {
            if (!isMounted) return;

            if (session?.user) {
                const user = session.user;
                localStorage.setItem('meditation_anonymous_user_id', user.id);

                let role = 'anon';
                let name = user.user_metadata?.name || 'Anonymous';

                if (!user.is_anonymous) {
                    role = await fetchUserProfileAndRole(user.id);
                }

                setAuthState({
                    userId: user.id,
                    userRole: role,
                    username: name,
                    isLoading: false
                });
            } else {
                // Chỉ tự động sign in ẩn danh nếu thực sự không có session
                // Tránh loop nếu signInAnonymously đang chạy
                try {
                    const { data } = await supabase.auth.signInAnonymously();
                    if (!data?.user) {
                        setAuthState(prev => ({ ...prev, isLoading: false, userRole: 'anon' }));
                    }
                } catch (e) {
                    setAuthState(prev => ({ ...prev, isLoading: false }));
                }
            }
        };

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            // console.log(`Auth Event changed: ${event}`); 
            handleAuthChange(event, session);
        });

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    // QUAN TRỌNG NHẤT: Memoize cái value của Context
    // Chỉ tính toán lại khi authState thay đổi (logout là hàm tĩnh nhờ useCallback nên ko cần lo)
    const contextValue = useMemo(() => ({
        userInfo: authState,
        logout
    }), [authState, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {authState.isLoading ? (
                <div className='loading-page'>
                    <div className='loading-page-text'>{t("common.loading")}</div>
                    <div className="holder">
                        <div className="candle">
                            <div className="blinking-glow"></div>
                            <div className="thread"></div>
                            <div className="glow"></div>
                            <div className="flame"></div>
                        </div>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};