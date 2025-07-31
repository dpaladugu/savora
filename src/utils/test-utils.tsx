import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Txn, Goal, Investment } from '@/lib/db';

// Export screen and render for use in tests
export { screen, render };

// Mock data creation functions
export const createMockTxn = (overrides: Partial<Txn> = {}): Txn => ({
  id: 'mock-txn-' + Math.random().toString(36).substr(2, 9),
  date: new Date(),
  amount: -1000,
  category: 'Test Category',
  currency: 'INR',
  note: 'Test transaction',
  paymentMix: [],
  splitWith: [],
  tags: [],
  isPartialRent: false,
  isSplit: false,
  ...overrides
});

export const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'mock-goal-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Goal',
  type: 'Medium',
  targetAmount: 100000,
  currentAmount: 25000,
  targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  notes: 'Test goal notes',
  ...overrides
});

export const createMockInvestment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 'mock-investment-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Investment',
  type: 'MF-Growth',
  investedValue: 50000,
  currentValue: 55000,
  currentNav: 25.50,
  units: 2156.86,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  frequency: 'Monthly',
  taxBenefit: false,
  familyMember: 'Self',
  notes: 'Test investment notes',
  ...overrides
});

// Create mock database that matches the actual database structure
export const createMockDb = () => ({
  txns: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
  },
  goals: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
  },
  investments: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
  },
  rentalProperties: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
  tenants: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
  emergencyFunds: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  }
});

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
}

export const renderWithRouter = (
  ui: React.ReactElement,
  options?: ExtendedRenderOptions
) => {
  const { route = '/', initialEntries = [route], ...renderOptions } = options || {};

  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface WithQueryClientOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithClient(ui: React.ReactElement, options?: WithQueryClientOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  });
}
