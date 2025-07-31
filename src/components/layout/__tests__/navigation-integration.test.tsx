
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AuthProvider } from '@/services/auth-service';
import { MainContentRouter } from '../main-content-router';
import { useNavigationRouter } from '../navigation-router';

// Mock all the components that might cause issues
vi.mock('@/components/dashboard/dashboard', () => ({
  Dashboard: () => React.createElement('div', { 'data-testid': 'dashboard' }, 'Dashboard Content')
}));

vi.mock('@/components/expenses/expense-tracker', () => ({
  ExpenseTracker: () => React.createElement('div', { 'data-testid': 'expense-tracker' }, 'Expense Tracker')
}));

vi.mock('@/components/more/more-screen', () => ({
  MoreScreen: ({ onNavigate }: { onNavigate: (id: string) => void }) => 
    React.createElement('div', { 'data-testid': 'more-screen' }, 
      React.createElement('button', { onClick: () => onNavigate('vehicles') }, 'Navigate to Vehicles')
    )
}));

vi.mock('@/components/investments/investments-tracker', () => ({
  InvestmentsTracker: () => React.createElement('div', { 'data-testid': 'investments-tracker' }, 'Investments Tracker')
}));

vi.mock('@/components/goals/simple-goals-tracker', () => ({
  SimpleGoalsTracker: () => React.createElement('div', { 'data-testid': 'goals-tracker' }, 'Goals Tracker')
}));

vi.mock('@/components/imports/csv-imports', () => ({
  CSVImports: () => React.createElement('div', { 'data-testid': 'csv-imports' }, 'CSV Imports')
}));

vi.mock('@/components/settings/settings-screen', () => ({
  SettingsScreen: () => React.createElement('div', { 'data-testid': 'settings-screen' }, 'Settings Screen')
}));

vi.mock('@/components/credit-cards/credit-card-flow-tracker', () => ({
  CreditCardFlowTracker: () => React.createElement('div', { 'data-testid': 'credit-cards-tracker' }, 'Credit Cards Tracker')
}));

vi.mock('./more-module-router', () => ({
  MoreModuleRouter: ({ activeModule }: { activeModule: string }) => 
    React.createElement('div', { 'data-testid': 'more-module-router' }, `Module: ${activeModule}`)
}));

vi.mock('@/services/logger', () => ({
  Logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
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
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(AuthProvider, null,
        React.createElement(BrowserRouter, null, children)
      )
    );
};

function NavigationTestComponent() {
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  
  return React.createElement('div', null,
    React.createElement('div', { 'data-testid': 'current-tab' }, `Active Tab: ${activeTab}`),
    React.createElement('div', { 'data-testid': 'current-module' }, `Active Module: ${activeMoreModule || 'none'}`),
    React.createElement('button', { 
      'data-testid': 'switch-to-expenses',
      onClick: () => handleTabChange('expenses') 
    }, 'Switch to Expenses'),
    React.createElement('button', { 
      'data-testid': 'switch-to-more',
      onClick: () => handleTabChange('more') 
    }, 'Switch to More'),
    React.createElement('button', { 
      'data-testid': 'navigate-to-vehicles',
      onClick: () => handleMoreNavigation('vehicles') 
    }, 'Navigate to Vehicles'),
    React.createElement(MainContentRouter, {
      activeTab,
      activeMoreModule,
      onMoreNavigation: handleMoreNavigation,
      onTabChange: handleTabChange
    })
  );
}

describe('Navigation Integration', () => {
  it('should render dashboard by default', () => {
    render(React.createElement(NavigationTestComponent), { wrapper: createWrapper() });
    
    expect(screen.getByTestId('current-tab')).toHaveTextContent('Active Tab: dashboard');
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should switch between tabs correctly', () => {
    render(React.createElement(NavigationTestComponent), { wrapper: createWrapper() });
    
    // Initially on dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    
    // Switch to expenses
    fireEvent.click(screen.getByTestId('switch-to-expenses'));
    expect(screen.getByTestId('current-tab')).toHaveTextContent('Active Tab: expenses');
    expect(screen.getByTestId('expense-tracker')).toBeInTheDocument();
  });

  it('should handle more module navigation correctly', () => {
    render(React.createElement(NavigationTestComponent), { wrapper: createWrapper() });
    
    // Navigate to more tab
    fireEvent.click(screen.getByTestId('switch-to-more'));
    expect(screen.getByTestId('current-tab')).toHaveTextContent('Active Tab: more');
    expect(screen.getByTestId('more-screen')).toBeInTheDocument();
    
    // Navigate to vehicles module
    fireEvent.click(screen.getByTestId('navigate-to-vehicles'));
    expect(screen.getByTestId('current-module')).toHaveTextContent('Active Module: vehicles');
    expect(screen.getByTestId('more-module-router')).toBeInTheDocument();
  });
});
