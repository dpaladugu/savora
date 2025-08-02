
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreditCardService } from '../CreditCardService';
import { createMockDb } from '@/utils/test-utils';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

describe('CreditCardService', () => {
  const mockDb = createMockDb();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCreditCard', () => {
    it('should add a new credit card with generated ID', async () => {
      const cardData = {
        issuer: 'Test Bank',
        bankName: 'Test Bank',
        last4: '1234',
        network: 'Visa' as const,
        cardVariant: 'Platinum',
        productVariant: 'Travel',
        annualFee: 5000,
        annualFeeGst: 900,
        creditLimit: 100000,
        creditLimitShared: false,
        fuelSurchargeWaiver: true,
        rewardPointsBalance: 1000,
        cycleStart: 1,
        stmtDay: 5,
        dueDay: 20,
        fxTxnFee: 3.5,
        emiConversion: false,
      };
      
      mockDb.creditCards.add.mockResolvedValue('new-card-id');

      const result = await CreditCardService.addCreditCard(cardData);

      expect(result).toBe('new-card-id');
      expect(mockDb.creditCards.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...cardData,
          id: expect.any(String),
        })
      );
    });

    it('should handle database errors', async () => {
      mockDb.creditCards.add.mockRejectedValue(new Error('Database error'));

      await expect(CreditCardService.addCreditCard({
        issuer: 'Test Bank',
        bankName: 'Test Bank',
        last4: '1234',
        network: 'Visa',
        cardVariant: 'Basic',
        productVariant: '',
        annualFee: 0,
        annualFeeGst: 0,
        creditLimit: 50000,
        creditLimitShared: false,
        fuelSurchargeWaiver: false,
        rewardPointsBalance: 0,
        cycleStart: 1,
        stmtDay: 5,
        dueDay: 20,
        fxTxnFee: 0,
        emiConversion: false,
      })).rejects.toThrow('Database error');
    });
  });

  describe('getCreditCards', () => {
    it('should return all credit cards', async () => {
      const mockCards = [
        { id: '1', issuer: 'Bank A', last4: '1234' },
        { id: '2', issuer: 'Bank B', last4: '5678' },
      ];
      mockDb.creditCards.toArray.mockResolvedValue(mockCards);

      const result = await CreditCardService.getCreditCards();

      expect(result).toEqual(mockCards);
      expect(mockDb.creditCards.toArray).toHaveBeenCalled();
    });
  });

  describe('updateCreditCard', () => {
    it('should update an existing credit card', async () => {
      mockDb.creditCards.update.mockResolvedValue(1);

      const updates = { creditLimit: 150000, rewardPointsBalance: 2000 };
      const result = await CreditCardService.updateCreditCard('test-id', updates);

      expect(result).toBe(1);
      expect(mockDb.creditCards.update).toHaveBeenCalledWith('test-id', updates);
    });
  });

  describe('deleteCreditCard', () => {
    it('should delete a credit card', async () => {
      mockDb.creditCards.delete.mockResolvedValue(undefined);

      await CreditCardService.deleteCreditCard('test-id');

      expect(mockDb.creditCards.delete).toHaveBeenCalledWith('test-id');
    });
  });
});
