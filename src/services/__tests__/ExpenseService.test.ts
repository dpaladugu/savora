
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
      
      mockDb.txns.add.mockResolvedValue('new-id');

      const result = await ExpenseService.addExpense(expenseData);

      expect(result).toBe('new-id');
      expect(mockDb.txns.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          amount: -1000, // Expenses are negative
          note: expenseData.description,
          category: expenseData.category,
        })
      );
    });

    it('should handle database errors', async () => {
      mockDb.txns.add.mockRejectedValue(new Error('Database error'));

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
    it('should return all expenses (negative transactions)', async () => {
      const mockTxns = [
        { id: '1', amount: -1000, note: 'Test 1', category: 'Food', date: new Date('2024-01-01'), tags: [], paymentMix: [{ method: 'Cash', amount: 1000 }] },
        { id: '2', amount: -2000, note: 'Test 2', category: 'Transport', date: new Date('2024-01-02'), tags: [], paymentMix: [{ method: 'Card', amount: 2000 }] },
        { id: '3', amount: 1500, note: 'Income', category: 'Salary', date: new Date('2024-01-03'), tags: [], paymentMix: [] }, // This should be filtered out
      ];
      mockDb.txns.toArray.mockResolvedValue(mockTxns);

      const result = await ExpenseService.getExpenses();

      expect(result).toHaveLength(2); // Only negative amounts
      expect(result[0].amount).toBe(1000); // Converted to positive
      expect(result[1].amount).toBe(2000);
      expect(mockDb.txns.toArray).toHaveBeenCalled();
    });
  });

  describe('updateExpense', () => {
    it('should update an existing expense', async () => {
      mockDb.txns.update.mockResolvedValue(1);

      const updates = { amount: 1500, description: 'Updated expense' };
      const result = await ExpenseService.updateExpense('test-id', updates);

      expect(result).toBe(1);
      expect(mockDb.txns.update).toHaveBeenCalledWith('test-id', {
        amount: -1500, // Converted to negative
        note: 'Updated expense'
      });
    });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      mockDb.txns.delete.mockResolvedValue(undefined);

      await ExpenseService.deleteExpense('test-id');

      expect(mockDb.txns.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('bulkAddExpenses', () => {
    it('should add multiple expenses at once', async () => {
      const expenses = [
        { id: '1', date: '2024-01-01', amount: 1000, description: 'Test 1', category: 'Food', payment_method: 'Cash', source: 'manual', tags: [], account: '' },
        { id: '2', date: '2024-01-02', amount: 2000, description: 'Test 2', category: 'Transport', payment_method: 'Card', source: 'manual', tags: [], account: '' },
      ];
      
      mockDb.txns.bulkAdd.mockResolvedValue(['1', '2']);

      await ExpenseService.bulkAddExpenses(expenses);

      expect(mockDb.txns.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ amount: -1000 }),
          expect.objectContaining({ amount: -2000 })
        ])
      );
    });
  });

  describe('getExpenseById', () => {
    it('should return a specific expense', async () => {
      const mockTxn = { 
        id: '1', 
        amount: -1000, 
        note: 'Test', 
        category: 'Food',
        date: new Date('2024-01-01'),
        tags: [],
        paymentMix: [{ method: 'Cash', amount: 1000 }]
      };
      mockDb.txns.get.mockResolvedValue(mockTxn);

      const result = await ExpenseService.getExpenseById('1');

      expect(result).toEqual({
        id: '1',
        amount: 1000, // Converted to positive
        description: 'Test',
        category: 'Food',
        date: '2024-01-01',
        payment_method: 'Cash',
        source: 'manual',
        tags: [],
        account: ''
      });
    });

    it('should return undefined for non-existent expense', async () => {
      mockDb.txns.get.mockResolvedValue(undefined);

      const result = await ExpenseService.getExpenseById('non-existent');

      expect(result).toBeUndefined();
    });

    it('should return undefined for positive transactions (income)', async () => {
      const mockTxn = { 
        id: '1', 
        amount: 1000, // Positive amount (income)
        note: 'Test', 
        category: 'Salary',
        date: new Date('2024-01-01'),
        tags: [],
        paymentMix: []
      };
      mockDb.txns.get.mockResolvedValue(mockTxn);

      const result = await ExpenseService.getExpenseById('1');

      expect(result).toBeUndefined();
    });
  });
});
