
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpenseService } from '../ExpenseService';
import { createMockDb } from '@/utils/test-utils';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

describe('ExpenseService', () => {
  const mockDb = createMockDb();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addExpense', () => {
    it('should add a new expense with generated ID', async () => {
      const expenseData = {
        date: '2024-01-01',
        amount: 1000,
        description: 'Test Expense',
        category: 'Food',
        payment_method: 'Cash',
        source: 'manual',
        tags: [],
        account: '',
      };
      
      mockDb.expenses.add.mockResolvedValue('new-id');

      const result = await ExpenseService.addExpense(expenseData);

      expect(result).toBe('new-id');
      expect(mockDb.expenses.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...expenseData,
          id: expect.any(String),
        })
      );
    });

    it('should handle database errors', async () => {
      mockDb.expenses.add.mockRejectedValue(new Error('Database error'));

      await expect(ExpenseService.addExpense({
        date: '2024-01-01',
        amount: 1000,
        description: 'Test',
        category: 'Food',
        payment_method: 'Cash',
        source: 'manual',
        tags: [],
        account: '',
      })).rejects.toThrow('Database error');
    });
  });

  describe('getExpenses', () => {
    it('should return all expenses', async () => {
      const mockExpenses = [
        { id: '1', amount: 1000, description: 'Test 1' },
        { id: '2', amount: 2000, description: 'Test 2' },
      ];
      mockDb.expenses.toArray.mockResolvedValue(mockExpenses);

      const result = await ExpenseService.getExpenses();

      expect(result).toEqual(mockExpenses);
      expect(mockDb.expenses.toArray).toHaveBeenCalled();
    });
  });

  describe('updateExpense', () => {
    it('should update an existing expense', async () => {
      mockDb.expenses.update.mockResolvedValue(1);

      const updates = { amount: 1500, description: 'Updated expense' };
      const result = await ExpenseService.updateExpense('test-id', updates);

      expect(result).toBe(1);
      expect(mockDb.expenses.update).toHaveBeenCalledWith('test-id', updates);
    });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      mockDb.expenses.delete.mockResolvedValue(undefined);

      await ExpenseService.deleteExpense('test-id');

      expect(mockDb.expenses.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('bulkAddExpenses', () => {
    it('should add multiple expenses at once', async () => {
      const expenses = [
        { id: '1', date: '2024-01-01', amount: 1000, description: 'Test 1', category: 'Food', payment_method: 'Cash', source: 'manual', tags: [], account: '' },
        { id: '2', date: '2024-01-02', amount: 2000, description: 'Test 2', category: 'Transport', payment_method: 'Card', source: 'manual', tags: [], account: '' },
      ];
      
      mockDb.expenses.bulkAdd.mockResolvedValue(['1', '2']);

      await ExpenseService.bulkAddExpenses(expenses);

      expect(mockDb.expenses.bulkAdd).toHaveBeenCalledWith(expenses);
    });
  });

  describe('getExpenseById', () => {
    it('should return a specific expense', async () => {
      const mockExpense = { id: '1', amount: 1000, description: 'Test' };
      mockDb.expenses.get.mockResolvedValue(mockExpense);

      const result = await ExpenseService.getExpenseById('1');

      expect(result).toEqual(mockExpense);
      expect(mockDb.expenses.get).toHaveBeenCalledWith('1');
    });

    it('should return undefined for non-existent expense', async () => {
      mockDb.expenses.get.mockResolvedValue(undefined);

      const result = await ExpenseService.getExpenseById('non-existent');

      expect(result).toBeUndefined();
    });
  });
});
