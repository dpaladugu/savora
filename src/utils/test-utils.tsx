
import React from 'react';
import { render, screen, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/theme-context';

// Create mock database
export const createMockDb = () => ({
  txns: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(() => ({ equals: vi.fn(), between: vi.fn() })),
  },
  goals: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  investments: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  emergencyFunds: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  globalSettings: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  rentalProperties: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  tenants: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
});

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { screen };
export { customRender as render };
