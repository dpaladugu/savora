
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmergencyFundService } from '../EmergencyFundService';
import { createMockDb } from '@/utils/test-utils';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

// Mock logger
vi.mock('../logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('EmergencyFundService', () => {
  const mockDb = createMockDb();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmergencyFund', () => {
    it('should return existing emergency fund', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);

      const result = await EmergencyFundService.getEmergencyFund();

      expect(result).toEqual(mockFund);
    });

    it('should create default emergency fund if none exists', async () => {
      mockDb.emergencyFunds.toArray.mockResolvedValue([]);
      mockDb.emergencyFunds.add.mockResolvedValue('new-fund-id');

      const result = await EmergencyFundService.getEmergencyFund();

      expect(result.targetMonths).toBe(12);
      expect(result.targetAmount).toBe(0);
      expect(result.currentAmount).toBe(0);
      expect(result.status).toBe('Under-Target');
      expect(mockDb.emergencyFunds.add).toHaveBeenCalled();
    });
  });

  describe('calculateTargetAmount', () => {
    it('should calculate and update target amount based on monthly expenses', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 0,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);
      mockDb.emergencyFunds.put.mockResolvedValue('fund-1');

      const monthlyExpenses = 50000;
      const result = await EmergencyFundService.calculateTargetAmount(monthlyExpenses);

      expect(result).toBe(600000); // 50000 * 12
      expect(mockDb.emergencyFunds.put).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAmount: 600000
        })
      );
    });
  });

  describe('addToEmergencyFund', () => {
    it('should add amount to current balance', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);
      mockDb.emergencyFunds.put.mockResolvedValue('fund-1');

      await EmergencyFundService.addToEmergencyFund(50000);

      expect(mockDb.emergencyFunds.put).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAmount: 350000
        })
      );
    });
  });

  describe('withdrawFromEmergencyFund', () => {
    it('should withdraw amount if sufficient balance', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);
      mockDb.emergencyFunds.put.mockResolvedValue('fund-1');

      await EmergencyFundService.withdrawFromEmergencyFund(100000, 'Medical emergency');

      expect(mockDb.emergencyFunds.put).toHaveBeenCalledWith(
        expect.objectContaining({
          currentAmount: 200000
        })
      );
    });

    it('should throw error if insufficient balance', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 50000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);

      await expect(
        EmergencyFundService.withdrawFromEmergencyFund(100000, 'Medical emergency')
      ).rejects.toThrow('Insufficient emergency fund balance');
    });
  });

  describe('setTargetMonths', () => {
    it('should update target months within valid range', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);
      mockDb.emergencyFunds.put.mockResolvedValue('fund-1');

      await EmergencyFundService.setTargetMonths(15);

      expect(mockDb.emergencyFunds.put).toHaveBeenCalledWith(
        expect.objectContaining({
          targetMonths: 15
        })
      );
    });

    it('should reject invalid target months', async () => {
      await expect(EmergencyFundService.setTargetMonths(2))
        .rejects.toThrow('Target months must be between 3 and 24');
        
      await expect(EmergencyFundService.setTargetMonths(25))
        .rejects.toThrow('Target months must be between 3 and 24');
    });
  });

  describe('getEmergencyFundStatus', () => {
    it('should return comprehensive fund status', async () => {
      const mockFund = {
        id: 'fund-1',
        targetMonths: 12,
        targetAmount: 600000,
        currentAmount: 300000,
        lastReviewDate: new Date(),
        status: 'Under-Target' as const
      };
      
      mockDb.emergencyFunds.toArray.mockResolvedValue([mockFund]);

      const result = await EmergencyFundService.getEmergencyFundStatus();

      expect(result.fund).toEqual(mockFund);
      expect(result.progressPercentage).toBe(50); // 300000/600000 * 100
      expect(result.medicalSubBucket).toBe(200000);
      expect(result.medicalSubBucketUsed).toBe(0);
      expect(result.recommendedAction).toContain('Increase emergency fund');
    });
  });
});
