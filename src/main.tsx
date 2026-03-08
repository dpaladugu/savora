
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { seedVehiclesIfEmpty } from '@/lib/fleet-seed';

if (typeof window !== 'undefined') {
  (window as any).React = React;
}
Object.assign(globalThis, { React });

// Seed fleet vehicles on first launch (no-op if already seeded)
seedVehiclesIfEmpty();

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* silent in dev */});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
