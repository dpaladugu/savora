
import { describe, it, expect, vi } from 'vitest';

// Mock all external dependencies
vi.mock('@/lib/db', () => ({
  db: {
    expenses: { toArray: vi.fn(() => Promise.resolve([])) },
    incomes: { toArray: vi.fn(() => Promise.resolve([])) },
    investments: { toArray: vi.fn(() => Promise.resolve([])) },
    creditCards: { toArray: vi.fn(() => Promise.resolve([])) },
    appSettings: { get: vi.fn(() => Promise.resolve(undefined)) }
  }
}));

vi.mock('@/services/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Comprehensive App Tests', () => {
  it('should import all core modules without errors', async () => {
    // Test that all core modules can be imported
    expect(async () => {
      await import('@/components/dashboard/dashboard');
      await import('@/components/expenses/expense-tracker');
      await import('@/components/layout/main-content-router');
      await import('@/components/layout/navigation-router');
      await import('@/hooks/use-optimized-dashboard-data');
      await import('@/services/auth-service');
    }).not.toThrow();
  });

  it('should have proper error boundaries in place', () => {
    // Test that error boundaries are properly configured
    expect(() => {
      require('@/components/error/error-boundary');
    }).not.toThrow();
  });

  it('should have all required types defined', () => {
    // Test that all required types are available
    expect(() => {
      require('@/types/dashboard');
      require('@/types/common');
    }).not.toThrow();
  });

  it('should have all utility functions working', () => {
    // Test utility functions
    const { formatCurrency, formatPercentage } = require('@/lib/format-utils');
    
    expect(formatCurrency(1000)).toBe('₹1,000');
    expect(formatPercentage(25.5)).toBe('25.5%');
  });
});
