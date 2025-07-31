
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen } from '@testing-library/react';
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
    where: vi.fn(() => ({ 
      equals: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })),
      between: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) }))
    })),
    get: vi.fn(),
  },
  goals: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  investments: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  emergencyFunds: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  globalSettings: {
    toArray: vi.fn(() => Promise.resolve([])),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
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

// Mock data creation functions
export const createMockTxn = (overrides = {}) => ({
  id: 'test-txn-id',
  date: new Date('2024-01-01'),
  amount: -1000,
  category: 'Groceries',
  subcategory: '',
  paymentMethod: 'Cash',
  note: 'Test transaction',
  currency: 'INR',
  paymentMix: [],
  splitWith: [],
  tags: [],
  isPartialRent: false,
  isSplit: false,
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  name: 'Test Goal',
  type: 'savings',
  targetAmount: 100000,
  currentAmount: 50000,
  targetDate: new Date('2025-12-31'),
  ...overrides,
});

export const createMockInvestment = (overrides = {}) => ({
  id: 'test-investment-id',
  name: 'Test Investment',
  type: 'mutual_fund',
  investedValue: 50000,
  currentValue: 55000,
  startDate: new Date('2024-01-01'),
  maturityDate: new Date('2025-12-31'),
  goalId: undefined,
  ...overrides,
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
