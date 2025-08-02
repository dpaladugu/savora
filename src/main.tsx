
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure React is available globally before any components are rendered
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Also ensure React hooks are available
Object.assign(globalThis, { React });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
