import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './UserContext.js';
import reportWebVitals from './reportWebVitals';
import "./i18n";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
