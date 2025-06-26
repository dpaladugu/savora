import { calculateNextOccurrenceDate, RecurrenceRule } from './date-utils';

describe('calculateNextOccurrenceDate', () => {
  // Daily
  it('should calculate next date for daily recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
    expect(calculateNextOccurrenceDate('2024-07-01', rule)).toBe('2024-07-02');
  });

  it('should calculate next date for daily recurrence with interval', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 3 };
    expect(calculateNextOccurrenceDate('2024-07-01', rule)).toBe('2024-07-04');
  });

  // Weekly
  it('should calculate next date for weekly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
    expect(calculateNextOccurrenceDate('2024-07-01', rule)).toBe('2024-07-08'); // Monday to Monday
  });

  it('should calculate next date for bi-weekly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 2 };
    expect(calculateNextOccurrenceDate('2024-07-01', rule)).toBe('2024-07-15');
  });

  // Monthly
  it('should calculate next date for monthly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
    expect(calculateNextOccurrenceDate('2024-07-15', rule)).toBe('2024-08-15');
  });

  it('should calculate next date for monthly recurrence, specific day, short month', () => {
    // Recurring on the 31st, next month is April (30 days)
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, dayOfMonth: 31 };
    expect(calculateNextOccurrenceDate('2024-03-31', rule)).toBe('2024-04-30');
  });

  it('should calculate next date for monthly recurrence, maintaining day (e.g. 31st Jan to 29th Feb on leap year)', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 }; // No specific dayOfMonth, so maintain original day if possible
    expect(calculateNextOccurrenceDate('2024-01-31', rule)).toBe('2024-02-29'); // 2024 is a leap year
  });

  it('should calculate next date for monthly recurrence, specific day that exists', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', interval: 1, dayOfMonth: 15 };
    expect(calculateNextOccurrenceDate('2024-01-10', rule)).toBe('2024-02-15'); // Should jump to 15th of next month
  });


  // Yearly
  it('should calculate next date for yearly recurrence', () => {
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 1 };
    expect(calculateNextOccurrenceDate('2024-07-15', rule)).toBe('2025-07-15');
  });

  it('should handle yearly recurrence for Feb 29th on a leap year to non-leap year', () => {
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 1 };
    expect(calculateNextOccurrenceDate('2024-02-29', rule)).toBe('2025-02-28');
  });

  it('should handle yearly recurrence for Feb 29th on a leap year to another leap year', () => {
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 4 };
    expect(calculateNextOccurrenceDate('2024-02-29', rule)).toBe('2028-02-29');
  });

  it('should calculate next date for yearly recurrence with specific dayOfMonth', () => {
    const rule: RecurrenceRule = { frequency: 'yearly', interval: 1, dayOfMonth: 20 };
    // Current occurrence is Dec 15, 2024. Next year, it should be Dec 20, 2025.
    expect(calculateNextOccurrenceDate('2024-12-15', rule)).toBe('2025-12-20');
  });

});
