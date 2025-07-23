
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SeedButton } from '@/components/ui/SeedButton';
import { AppRoutes } from '@/routes';
import { SeedToggle } from '@/components/SeedToggle';

export default function App() {
  return (
    <>
      <SeedToggle />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
}
