
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SeedButton } from '@/components/ui/SeedButton';
import { SettingsPage } from '@/components/SettingsPage';

export default function App() {
  return (
    <>
      <SeedButton />
      <Router>
        <Routes>
          <Route path="/" element={<div className="p-4 text-2xl">Savora v1.0</div>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </>
  );
}
