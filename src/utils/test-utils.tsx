import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { generateRandomTransaction } from './mock-data';
import { Transaction } from '@/types';

// Mock the indexedDB for testing
export const createMockDb = async () => {
  vi.spyOn(db, 'open').mockImplementation(async () => {
    // Optionally seed the database here if needed
    return true;
  });

  vi.spyOn(db, 'addTransaction').mockImplementation(async (transaction: Transaction) => {
    // Mock implementation for adding a transaction
    return transaction.id; // Return a mock ID
  });

  vi.spyOn(db, 'getTransactions').mockImplementation(async () => {
    // Mock implementation for getting transactions
    const transactions = Array.from({ length: 5 }, () => generateRandomTransaction());
    return transactions;
  });

  vi.spyOn(db, 'deleteTransaction').mockImplementation(async (id: string) => {
    // Mock implementation for deleting a transaction
    return true;
  });

  vi.spyOn(db, 'updateTransaction').mockImplementation(async (id: string, updates: Partial<Transaction>) => {
    // Mock implementation for updating a transaction
    return { id, ...updates } as Transaction;
  });

  vi.spyOn(db, 'getAllCategories').mockImplementation(async () => {
    return ['Food', 'Travel', 'Shopping'];
  });

  vi.spyOn(db, 'addCategory').mockImplementation(async (category: string) => {
    return category;
  });

  vi.spyOn(db, 'deleteCategory').mockImplementation(async (category: string) => {
    return true;
  });

  vi.spyOn(db, 'updateCategory').mockImplementation(async (oldCategory: string, newCategory: string) => {
    return newCategory;
  });

  return db;
};

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
      <BrowserRouter initialEntries={initialEntries} >
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
  })
}
