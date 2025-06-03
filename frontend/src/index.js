// src/index.js

import 'bootstrap/dist/css/bootstrap.min.css';  // ➡️ Import do Bootstrap vem primeiro
import './index.css';                            // ➡️ Seu CSS customizado vem em seguida

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
