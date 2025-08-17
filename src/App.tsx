
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedDashboard } from '@/components/layout/protected-dashboard';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalErrorBoundary } from '@/components/ui/global-error-boundary';
import { DbErrorListener } from '@/components/error/DbErrorListener';
import { NotFound } from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="savora-ui-theme">
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <DbErrorListener />
                <Routes>
                  <Route path="/" element={
                    <AuthGuard>
                      <ProtectedDashboard />
                    </AuthGuard>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
