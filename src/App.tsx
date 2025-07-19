
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

  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        AuthProvider,
        null,
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(
            Router,
            null,
            React.createElement(
              "div",
              { className: "min-h-screen bg-background text-foreground" },
              React.createElement(DbErrorListener, null),
              React.createElement(
                Routes,
                null,
                React.createElement(Route, { path: "/", element: React.createElement(Index, null) }),
                React.createElement(Route, { path: "*", element: React.createElement(NotFound, null) })
              ),
              React.createElement(Toaster, null)
            )
          )
        )
      )
    )
  );
}

export default App;
