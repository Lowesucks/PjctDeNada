import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './config/suppressWarnings';

// Suprimir advertencias de React en desarrollo
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('Warning:') || args[0].includes('Deprecation'))) {
      return;
    }
    originalError.call(console, ...args);
  };
}

// Detectar iOS y aplicar clase al body
function setIOSClass() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    document.body.classList.add('is-ios');
  } else {
    document.body.classList.remove('is-ios');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setIOSClass);
} else {
  setIOSClass();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
); 