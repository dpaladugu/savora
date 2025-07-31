
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionService } from '../TransactionService';
import { createMockDb, createMockTxn } from '@/utils/test-utils';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

describe('TransactionService', () => {
  const mockDb = createMockDb();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return transactions sorted by date descending', async () => {
      const mockTransactions = [
        createMockTxn({ id: '1', date: new Date('2024-01-01') }),
        createMockTxn({ id: '2', date: new Date('2024-01-02') }),
      ];
      mockDb.txns.toArray.mockResolvedValue(mockTransactions);

      const result = await TransactionService.getTransactions();

      expect(mockDb.txns.toArray).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      // Should be sorted by date descending
      expect(result[0].date.getTime()).toBeGreaterThan(result[1].date.getTime());
    });

    it('should handle empty result', async () => {
      mockDb.txns.toArray.mockResolvedValue([]);

      const result = await TransactionService.getTransactions();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.txns.toArray.mockRejectedValue(new Error('Database error'));

      await expect(TransactionService.getTransactions()).rejects.toThrow('Database error');
    });
  });

  describe('addTransaction', () => {
    it('should add a new transaction with required fields', async () => {
      const transactionData = createMockTxn();
      delete transactionData.id; // Remove id as it should be generated
      
      mockDb.txns.add.mockResolvedValue('new-id');

      const result = await TransactionService.addTransaction(transactionData);

      expect(result).toBe('new-id');
      expect(mockDb.txns.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...transactionData,
          id: expect.any(String),
          currency: 'INR',
          paymentMix: expect.any(Array),
          splitWith: expect.any(Array),
          tags: expect.any(Array),
          isPartialRent: false,
          isSplit: false,
        })
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update an existing transaction', async () => {
      mockDb.txns.update.mockResolvedValue(1);

      const updates = { amount: -2000, note: 'Updated note' };
      const result = await TransactionService.updateTransaction('test-id', updates);

      expect(result).toBe(1);
      expect(mockDb.txns.update).toHaveBeenCalledWith('test-id', updates);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
      mockDb.txns.delete.mockResolvedValue(undefined);

      await TransactionService.deleteTransaction('test-id');

      expect(mockDb.txns.delete).toHaveBeenCalledWith('test-id');
    });
  });
});
