
import React from 'react';
import { render, RenderOptions, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/theme-context';
import { Toaster } from '@/components/ui/toaster';
import { vi } from 'vitest';

// Mock Dexie database for testing
export const createMockDb = () => ({
  txns: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
  },
  goals: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
  investments: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  emergencyFunds: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
  },
  globalSettings: {
    toArray: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue('test-id'),
  },
  rentalProperties: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
  tenants: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything including screen
export * from '@testing-library/react';
export { customRender as render, screen };

// Common test data factories
export const createMockTxn = (overrides = {}) => ({
  id: 'test-txn-1',
  date: new Date('2024-01-01'),
  amount: -1000,
  currency: 'INR',
  category: 'Groceries',
  note: 'Test transaction',
  tags: ['test'],
  paymentMix: [{ method: 'UPI', amount: 1000 }],
  splitWith: [],
  isPartialRent: false,
  isSplit: false,
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: 'test-goal-1',
  name: 'Emergency Fund',
  type: 'Short' as const,
  targetAmount: 100000,
  targetDate: new Date('2025-01-01'),
  currentAmount: 50000,
  notes: 'Test goal',
  ...overrides,
});

export const createMockInvestment = (overrides = {}) => ({
  id: 'test-investment-1',
  type: 'MF-Growth' as const,
  name: 'Test Mutual Fund',
  folioNo: 'TEST123',
  currentNav: 100,
  units: 100,
  investedValue: 10000,
  currentValue: 11000,
  startDate: new Date('2024-01-01'),
  frequency: 'Monthly' as const,
  goalId: 'test-goal-1',
  lockInYears: 0,
  taxBenefit: false,
  familyMember: 'Self',
  notes: 'Test investment',
  ...overrides,
});
