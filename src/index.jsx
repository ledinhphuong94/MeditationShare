import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.js';
import { UsersProvider } from './context/UsersContext.js';
import reportWebVitals from './reportWebVitals.js';
import "./i18n/index.js";
import { ConfigProvider } from 'antd'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UsersProvider>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#00b96b', // màu chủ đạo
              borderRadius: 8,
              fontFamily: 'Inter, sans-serif',
            },
            components: {
              Tabs: {
                itemColor: '#ffffff',
                itemSelectedColor: '#facc15',
                itemHoverColor: '#fde68a',
                inkBarColor: '#facc15',
              },
            },
          }}
        >
          <App />
        </ConfigProvider>
      </UsersProvider>  
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
