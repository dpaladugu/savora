
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataIntegrityService } from '../DataIntegrityService';
import { createMockDb, createMockTxn, createMockGoal, createMockInvestment } from '@/utils/test-utils';

vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

describe('DataIntegrityService', () => {
  const mockDb = createMockDb();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performIntegrityCheck', () => {
    it('should identify transactions with missing required fields', async () => {
      const invalidTxn = createMockTxn({
        id: undefined, // Missing required field
        amount: undefined, // Missing required field
      });

      mockDb.txns.toArray.mockResolvedValue([invalidTxn]);
      mockDb.goals.toArray.mockResolvedValue([]);
      mockDb.investments.toArray.mockResolvedValue([]);
      mockDb.rentalProperties.toArray.mockResolvedValue([]);
      mockDb.tenants.toArray.mockResolvedValue([]);

      const report = await DataIntegrityService.performIntegrityCheck();

      expect(report.missingRequiredFields.length).toBeGreaterThan(0);
      expect(report.missingRequiredFields[0]).toContain('Missing required fields');
    });

    it('should identify duplicate transactions', async () => {
      const txn1 = createMockTxn({ id: 'txn1', date: new Date('2024-01-01'), amount: -1000, category: 'Groceries' });
      const txn2 = createMockTxn({ id: 'txn2', date: new Date('2024-01-01'), amount: -1000, category: 'Groceries' });

      mockDb.txns.toArray.mockResolvedValue([txn1, txn2]);
      mockDb.goals.toArray.mockResolvedValue([]);
      mockDb.investments.toArray.mockResolvedValue([]);
      mockDb.rentalProperties.toArray.mockResolvedValue([]);
      mockDb.tenants.toArray.mockResolvedValue([]);

      const report = await DataIntegrityService.performIntegrityCheck();

      expect(report.duplicateRecords.length).toBe(1);
      expect(report.duplicateRecords[0]).toContain('Duplicate transactions');
    });

    it('should identify orphaned investment-goal references', async () => {
      const investment = createMockInvestment({ goalId: 'non-existent-goal' });

      mockDb.txns.toArray.mockResolvedValue([]);
      mockDb.goals.toArray.mockResolvedValue([]);
      mockDb.investments.toArray.mockResolvedValue([investment]);
      mockDb.rentalProperties.toArray.mockResolvedValue([]);
      mockDb.tenants.toArray.mockResolvedValue([]);
      mockDb.goals.get.mockResolvedValue(null); // Goal doesn't exist

      const report = await DataIntegrityService.performIntegrityCheck();

      expect(report.orphanedRecords.length).toBe(1);
      expect(report.orphanedRecords[0]).toContain('References non-existent goal');
    });
  });

  describe('performAutoFix', () => {
    it('should fix missing array fields in transactions', async () => {
      const invalidTxn = createMockTxn({
        id: 'test-txn',
        paymentMix: null as any,
        splitWith: null as any,
        tags: null as any,
      });

      mockDb.txns.toArray.mockResolvedValue([invalidTxn]);
      mockDb.investments.toArray.mockResolvedValue([]);
      mockDb.txns.update.mockResolvedValue(1);

      const result = await DataIntegrityService.performAutoFix();

      expect(result.fixed).toBe(1);
      expect(mockDb.txns.update).toHaveBeenCalledWith('test-txn', {
        paymentMix: [],
        splitWith: [],
        tags: [],
        isPartialRent: false,
        isSplit: false,
      });
    });
  });
});
