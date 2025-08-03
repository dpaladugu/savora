
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock data creators
export const createMockTxn = (overrides: any = {}) => ({
  id: 'mock-txn-id',
  date: new Date('2024-01-01'),
  amount: -1000,
  currency: 'INR',
  category: 'Food',
  note: 'Test transaction',
  tags: ['test'],
  paymentMix: [{ mode: 'Cash', amount: 1000 }],
  splitWith: [],
  isPartialRent: false,
  isSplit: false,
  ...overrides,
});

export const createMockGoal = (overrides: any = {}) => ({
  id: 'mock-goal-id',
  name: 'Test Goal',
  slug: 'test-goal',
  type: 'Short' as const,
  targetAmount: 50000,
  targetDate: new Date('2024-12-31'),
  currentAmount: 10000,
  notes: 'Test goal notes',
  ...overrides,
});

export const createMockInvestment = (overrides: any = {}) => ({
  id: 'mock-investment-id',
  type: 'MF-Growth' as const,
  name: 'Test Mutual Fund',
  currentNav: 100,
  units: 100,
  investedValue: 10000,
  currentValue: 12000,
  startDate: new Date('2024-01-01'),
  frequency: 'Monthly' as const,
  taxBenefit: false,
  familyMember: 'Self',
  notes: 'Test investment',
  ...overrides,
});

export const createMockCreditCard = (overrides: any = {}) => ({
  id: 'mock-card-id',
  issuer: 'Test Bank',
  bankName: 'Test Bank',
  last4: '1234',
  network: 'Visa' as const,
  cardVariant: 'Premium',
  productVariant: 'Rewards',
  annualFee: 1000,
  annualFeeGst: 180,
  creditLimit: 100000,
  creditLimitShared: false,
  fuelSurchargeWaiver: true,
  rewardPointsBalance: 5000,
  cycleStart: 1,
  stmtDay: 5,
  dueDay: 20,
  fxTxnFee: 3.5,
  emiConversion: true,
  ...overrides,
});

// Mock database tables with all required methods
export const createMockDb = () => ({
  // Core tables
  globalSettings: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(undefined),
      }),
      between: vi.fn().mockResolvedValue([]),
    }),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  txns: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(undefined),
      }),
      between: vi.fn().mockResolvedValue([]),
    }),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  goals: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  creditCards: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  vehicles: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  investments: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mkResolvedValue(undefined),
  },
  // New required tables
  rentalProperties: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  tenants: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  gold: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  insurance: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  loans: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  brotherRepayments: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  subscriptions: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  health: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  familyBankAccounts: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  familyTransfers: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  emergencyFunds: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  auditLogs: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  // Legacy compatibility tables
  expenses: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  incomes: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
  appSettings: {
    toArray: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue('mock-id'),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(undefined),
      }),
      between: vi.fn().mockResolvedValue([]),
    }),
    count: vi.fn().mockResolvedValue(0),
  },
  // Transaction and utility methods
  transaction: vi.fn().mockImplementation((mode: string, tables: any[], callback: any) => {
    return callback();
  }),
  open: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  savePersonalProfile: vi.fn().mockResolvedValue(undefined),
  getPersonalProfile: vi.fn().mockResolvedValue(null),
  getEmergencyFundSettings: vi.fn().mockResolvedValue({ efMonths: 6 }),
  saveEmergencyFundSettings: vi.fn().mockResolvedValue(undefined),
});

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
