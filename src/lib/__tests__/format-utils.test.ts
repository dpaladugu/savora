
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercentage } from '../format-utils';

describe('format-utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000');
      expect(formatCurrency(-100000)).toBe('-₹1,00,000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should handle decimal numbers', () => {
      expect(formatCurrency(1000.50)).toBe('₹1,001');
      expect(formatCurrency(999.49)).toBe('₹999');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should handle string dates', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(1)).toBe('100.00%');
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.05)).toBe('-5.00%');
    });
  });
});
