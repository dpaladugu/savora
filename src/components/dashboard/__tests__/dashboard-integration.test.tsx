
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Dashboard } from '../dashboard';

// Mock dependencies
vi.mock('@/db', () => ({
  db: {
    expenses: {
      toArray: vi.fn(() => Promise.resolve([
        { id: '1', amount: 1000, category: 'Food', date: '2024-01-15', description: 'Groceries' },
        { id: '2', amount: 500, category: 'Transport', date: '2024-01-10', description: 'Gas' }
      ]))
    },
    incomes: {
      toArray: vi.fn(() => Promise.resolve([
        { id: '1', amount: 5000, category: 'Salary', date: '2024-01-01', description: 'Monthly salary' }
      ]))
    },
    investments: {
      toArray: vi.fn(() => Promise.resolve([
        { id: '1', currentValue: 10000, investedValue: 8000, name: 'Test Investment' }
      ]))
    },
    creditCards: {
      toArray: vi.fn(() => Promise.resolve([
        { id: '1', name: 'Test Card', currentBalance: 2000, limit: 10000 }
      ]))
    },
    goals: {
      toArray: vi.fn(() => Promise.resolve([
        { 
          id: '1', 
          name: 'Emergency Fund', 
          targetAmount: 100000, 
          currentAmount: 50000, 
          targetDate: new Date('2024-12-31'),
          type: 'Medium'
        }
      ]))
    },
    getEmergencyFundSettings: vi.fn(() => Promise.resolve({ 
      efMonths: 6, 
      currentAmount: 50000 
    }))
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
      queries: { retry: false, gcTime: 0 }
    }
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with real data', async () => {
    const mockOnTabChange = vi.fn();
    const mockOnMoreNavigation = vi.fn();

    render(
      React.createElement(Dashboard, {
        onTabChange: mockOnTabChange,
        onMoreNavigation: mockOnMoreNavigation
      }),
      { wrapper: createWrapper() }
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should display dashboard content
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should display financial metrics correctly', async () => {
    const mockOnTabChange = vi.fn();
    const mockOnMoreNavigation = vi.fn();

    render(
      React.createElement(Dashboard, {
        onTabChange: mockOnTabChange,
        onMoreNavigation: mockOnMoreNavigation
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // Check if expense data is displayed
      expect(screen.getByText(/₹1,500/)).toBeInTheDocument(); // Total expenses
    }, { timeout: 3000 });
  });

  it('should handle quick actions correctly', async () => {
    const mockOnTabChange = vi.fn();
    const mockOnMoreNavigation = vi.fn();

    render(
      React.createElement(Dashboard, {
        onTabChange: mockOnTabChange,
        onMoreNavigation: mockOnMoreNavigation
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Quick actions should be rendered
    expect(screen.getByText(/Add Expense|Expense/)).toBeInTheDocument();
  });

  it('should handle loading states properly', () => {
    const mockOnTabChange = vi.fn();
    const mockOnMoreNavigation = vi.fn();

    render(
      React.createElement(Dashboard, {
        onTabChange: mockOnTabChange,
        onMoreNavigation: mockOnMoreNavigation
      }),
      { wrapper: createWrapper() }
    );

    // Should show loading initially
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('should display charts when data is available', async () => {
    const mockOnTabChange = vi.fn();
    const mockOnMoreNavigation = vi.fn();

    render(
      React.createElement(Dashboard, {
        onTabChange: mockOnTabChange,
        onMoreNavigation: mockOnMoreNavigation
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // Charts should be rendered
      expect(screen.getByText(/Expense|Chart/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
