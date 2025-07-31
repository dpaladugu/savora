
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmergencyFund } from '../use-emergency-fund';
import { createMockDb } from '@/utils/test-utils';

// Mock the database and live data hooks
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

vi.mock('@/hooks/useLiveData', () => ({
  useTxns: () => [],
  useEmergencyFunds: () => [],
  useInsurance: () => [],
  useRentalProperties: () => [],
}));

describe('useEmergencyFund', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    expect(result.current.data.monthlyExpenses).toBe(0);
    expect(result.current.data.emergencyMonths).toBe(6);
    expect(result.current.data.dependents).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should calculate emergency fund requirements correctly', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    // Update data to trigger calculation
    result.current.updateData('monthlyExpenses', 50000);
    result.current.updateData('dependents', 2);
    result.current.updateData('monthlyEMIs', 15000);
    result.current.updateData('bufferPercentage', 20);
    
    const calculation = result.current.calculation;
    
    // Monthly requirement should include buffer
    const expectedMonthlyRequired = (50000 * 1.2) + 15000; // expenses with buffer + EMIs
    expect(calculation.monthlyRequired).toBe(expectedMonthlyRequired);
    
    // Emergency fund should be monthly requirement * months
    expect(calculation.emergencyFundRequired).toBe(expectedMonthlyRequired * 6);
  });

  it('should calculate shortfall correctly', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    result.current.updateData('monthlyExpenses', 50000);
    result.current.updateData('emergencyMonths', 6);
    result.current.updateData('currentCorpus', 100000);
    
    const calculation = result.current.calculation;
    const expectedShortfall = Math.max(0, calculation.emergencyFundRequired - 100000);
    
    expect(calculation.shortfall).toBe(expectedShortfall);
  });

  it('should handle missing data detection', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    // With default values (mostly 0), should detect missing data
    expect(result.current.missingData.length).toBeGreaterThan(0);
    expect(result.current.missingData).toContain('Monthly expenses not set');
  });
});
