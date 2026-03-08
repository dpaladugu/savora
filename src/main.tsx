
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
