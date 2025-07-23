
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SeedButton } from '@/components/ui/SeedButton';
import { AppRoutes } from '@/routes';
import { SeedToggle } from '@/components/SeedToggle';

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
      <SeedToggle />
      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}
