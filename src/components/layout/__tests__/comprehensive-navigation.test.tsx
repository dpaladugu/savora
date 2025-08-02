
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { PersistentNavigation } from '../persistent-navigation';
import { MainContentRouter } from '../main-content-router';
import { useNavigationRouter } from '../navigation-router';

// Mock all external dependencies
vi.mock('@/db', () => ({
  db: {
    expenses: { toArray: vi.fn(() => Promise.resolve([])) },
    incomes: { toArray: vi.fn(() => Promise.resolve([])) },
    investments: { toArray: vi.fn(() => Promise.resolve([])) },
    creditCards: { toArray: vi.fn(() => Promise.resolve([])) },
    goals: { toArray: vi.fn(() => Promise.resolve([])) },
    getEmergencyFundSettings: vi.fn(() => Promise.resolve({ efMonths: 6 }))
  }
}));

vi.mock('@/services/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('@/hooks/use-optimized-dashboard-data', () => ({
  useOptimizedDashboardData: () => ({
    dashboardData: null,
    loading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn(() => ({ isUnlocked: true }))
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 }
    }
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
};

// Test Component that uses navigation hook
function TestNavigationApp() {
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  
  return React.createElement(
    'div',
    null,
    React.createElement(MainContentRouter, {
      activeTab,
      activeMoreModule,
      onMoreNavigation: handleMoreNavigation,
      onTabChange: handleTabChange
    }),
    React.createElement(PersistentNavigation, {
      activeTab,
      onTabChange: handleTabChange,
      activeMoreModule,
      onMoreNavigation: handleMoreNavigation
    })
  );
}

describe('Comprehensive Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render main navigation tabs correctly', () => {
    render(React.createElement(TestNavigationApp), { wrapper: createWrapper() });

    // Check that main navigation tabs are present
    expect(screen.getByLabelText('Navigate to dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to expenses')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to credit cards')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to investments')).toBeInTheDocument();
    expect(screen.getByLabelText('Open more options menu')).toBeInTheDocument();
  });

  it('should handle tab switching correctly', async () => {
    render(React.createElement(TestNavigationApp), { wrapper: createWrapper() });

    // Click on expenses tab
    const expensesTab = screen.getByLabelText('Navigate to expenses');
    fireEvent.click(expensesTab);

    await waitFor(() => {
      // Should show expenses content
      expect(screen.getByText('Expenses')).toBeInTheDocument();
    });

    // Click on investments tab
    const investmentsTab = screen.getByLabelText('Navigate to investments');
    fireEvent.click(investmentsTab);

    await waitFor(() => {
      // Should show investments content
      expect(screen.getByText('Investments')).toBeInTheDocument();
    });
  });

  it('should handle more menu navigation', async () => {
    render(React.createElement(TestNavigationApp), { wrapper: createWrapper() });

    // Click on more button
    const moreButton = screen.getByLabelText('Open more options menu');
    fireEvent.click(moreButton);

    await waitFor(() => {
      // Should open more menu
      expect(screen.getByText('More Features')).toBeInTheDocument();
    });
  });

  it('should handle error boundaries correctly', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(React.createElement(TestNavigationApp), { wrapper: createWrapper() });

    // Navigation should still render even with potential errors
    expect(screen.getByLabelText('Navigate to dashboard')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should maintain navigation state correctly', async () => {
    render(React.createElement(TestNavigationApp), { wrapper: createWrapper() });

    // Start at dashboard (default)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Navigate to expenses
    fireEvent.click(screen.getByLabelText('Navigate to expenses'));

    await waitFor(() => {
      expect(screen.getByText('Expenses')).toBeInTheDocument();
    });

    // Navigate back to dashboard
    fireEvent.click(screen.getByLabelText('Navigate to dashboard'));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
