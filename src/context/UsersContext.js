import React, { createContext, useState, useContext } from 'react';
import { useUsers } from '../hooks/useUsers.js';

// 1. Tạo Context
const UsersContext = createContext(null);

// 2. Tạo Provider Component
export const UsersProvider = ({ children }) => {
    const usersState = useUsers();
    // const usersState ={};

    return (
        <UsersContext.Provider value={usersState}>
            {children}
        </UsersContext.Provider>
    );
};

// 3. Tạo Custom Hook để sử dụng Context dễ dàng hơn
export const useUsersContext = () => useContext(UsersContext);