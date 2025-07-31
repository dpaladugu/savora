
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ExpenseTracker } from '../expense-tracker';
import * as TransactionService from '@/services/TransactionService';

// Mock the services
vi.mock('@/services/TransactionService');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-comprehensive-loading', () => ({
  useSingleLoading: () => ({
    isLoading: false,
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  }),
}));
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [],
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ExpenseTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TransactionService.getTransactions).mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    render(
      <TestWrapper>
        <ExpenseTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
    });
  });

  it('displays expense metrics cards', async () => {
    render(
      <TestWrapper>
        <ExpenseTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Total Income (filtered period)')).toBeInTheDocument();
      expect(screen.getByText('Net Balance (filtered period)')).toBeInTheDocument();
    });
  });

  it('shows add transaction button', async () => {
    render(
      <TestWrapper>
        <ExpenseTracker />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });
  });
});
