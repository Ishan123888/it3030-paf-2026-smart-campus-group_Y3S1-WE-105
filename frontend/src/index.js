import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Apply saved theme early to avoid flash
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
} catch {
  // ignore
}

// ✅ NO AuthProvider here — it's already in App.js
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
