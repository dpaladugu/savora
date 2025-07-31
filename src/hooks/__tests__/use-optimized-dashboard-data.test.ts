
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useOptimizedDashboardData } from '../use-optimized-dashboard-data';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    expenses: {
      toArray: vi.fn(() => Promise.resolve([
        { id: 1, amount: 1000, category: 'Food', date: '2024-01-15', description: 'Groceries' },
        { id: 2, amount: 500, category: 'Transport', date: '2024-01-10', description: 'Gas' }
      ]))
    },
    incomes: {
      toArray: vi.fn(() => Promise.resolve([
        { id: 1, amount: 5000, category: 'Salary', date: '2024-01-01', description: 'Monthly salary' }
      ]))
    },
    investments: {
      toArray: vi.fn(() => Promise.resolve([
        { id: 1, current_value: 10000, invested_value: 8000, name: 'Test Investment' }
      ]))
    },
    creditCards: {
      toArray: vi.fn(() => Promise.resolve([
        { id: 1, name: 'Test Card', currentBalance: 2000, limit: 10000 }
      ]))
    },
    appSettings: {
      get: vi.fn(() => Promise.resolve(undefined))
    }
  }
}));

vi.mock('@/services/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useOptimizedDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and transform dashboard data correctly', async () => {
    const { result } = renderHook(() => useOptimizedDashboardData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.dashboardData).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dashboardData).toBeDefined();
    expect(result.current.dashboardData?.totalExpenses).toBeGreaterThan(0);
    expect(result.current.dashboardData?.monthlyIncome).toBeGreaterThan(0);
    expect(result.current.dashboardData?.totalInvestments).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Mock database to throw an error
    vi.doMock('@/lib/db', () => ({
      db: {
        expenses: {
          toArray: vi.fn(() => Promise.reject(new Error('Database error')))
        },
        incomes: {
          toArray: vi.fn(() => Promise.reject(new Error('Database error')))
        },
        investments: {
          toArray: vi.fn(() => Promise.reject(new Error('Database error')))
        },
        creditCards: {
          toArray: vi.fn(() => Promise.reject(new Error('Database error')))
        },
        appSettings: {
          get: vi.fn(() => Promise.reject(new Error('Database error')))
        }
      }
    }));

    const { result } = renderHook(() => useOptimizedDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should return fallback data instead of crashing
    expect(result.current.dashboardData).toBeDefined();
    expect(result.current.dashboardData?.totalExpenses).toBe(0);
  });
});
