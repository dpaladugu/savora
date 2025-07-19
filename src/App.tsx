
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { DbErrorListener } from "@/components/error/DbErrorListener";
import { Logger } from "@/services/logger";
import "./App.css";

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

function App() {
  console.log('App: Component initializing');
  Logger.info('App initialized');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <DbErrorListener />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
