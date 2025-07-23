
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingWrapper } from '@/components/ui/loading-wrapper';

// Lazy load components
const Dashboard = React.lazy(() => import('@/components/dashboard/dashboard').then(m => ({ default: m.Dashboard })));
const RentalManager = React.lazy(() => import('@/components/RentalManager').then(m => ({ default: m.RentalManager })));
const SettingsPage = React.lazy(() => import('@/components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const HealthTracker = React.lazy(() => import('@/components/HealthTracker').then(m => ({ default: m.HealthTracker })));
const ExportPage = React.lazy(() => import('@/components/ExportPage').then(m => ({ default: m.ExportPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingWrapper isLoading={true} />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rentals" element={<RentalManager />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/health" element={<HealthTracker />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </Suspense>
  );
}
