
import { describe, it, expect } from 'vitest';
import { parseISO, isValid } from 'date-fns';

// Helper function to safely parse dates (same as in expense-tracker)
const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }
  
  if (typeof dateValue === 'string') {
    try {
      const parsed = parseISO(dateValue);
      return isValid(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Failed to parse date string:', dateValue, error);
      return null;
    }
  }
  
  if (typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isValid(parsed) ? parsed : null;
  }
  
  return null;
};

describe('safeParseDate', () => {
  it('handles null and undefined', () => {
    expect(safeParseDate(null)).toBeNull();
    expect(safeParseDate(undefined)).toBeNull();
  });

  it('handles valid Date objects', () => {
    const date = new Date('2024-01-01');
    expect(safeParseDate(date)).toEqual(date);
  });

  it('handles invalid Date objects', () => {
    const invalidDate = new Date('invalid');
    expect(safeParseDate(invalidDate)).toBeNull();
  });

  it('handles valid date strings', () => {
    const result = safeParseDate('2024-01-01');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('handles invalid date strings', () => {
    expect(safeParseDate('invalid-date')).toBeNull();
    expect(safeParseDate('')).toBeNull();
  });

  it('handles timestamp numbers', () => {
    const timestamp = Date.now();
    const result = safeParseDate(timestamp);
    expect(result).toBeInstanceOf(Date);
  });

  it('handles other data types', () => {
    expect(safeParseDate({})).toBeNull();
    expect(safeParseDate([])).toBeNull();
    expect(safeParseDate(true)).toBeNull();
  });
});
