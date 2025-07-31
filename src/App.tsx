
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/services/auth-service';
import { SeedToggle } from '@/components/SeedToggle';
import Index from '@/pages/Index';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div>
            <SeedToggle />
            <Index />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
