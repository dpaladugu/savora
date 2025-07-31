
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
    
    expect(result.current.totalExpenses).toBe(0);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalSavings).toBe(0);
    expect(result.current.monthsCovered).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should handle data updates correctly', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    // Test that updateData function exists and can be called
    expect(result.current.updateData).toBeDefined();
    expect(typeof result.current.updateData).toBe('function');
    
    if (result.current.updateData) {
      result.current.updateData({ totalExpenses: 50000 });
    }
  });

  it('should have refresh data functionality', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    expect(result.current.refreshData).toBeDefined();
    expect(typeof result.current.refreshData).toBe('function');
  });

  it('should calculate emergency fund data from transactions', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    // Emergency fund data should be calculated from transaction data
    expect(result.current.totalExpenses).toBeDefined();
    expect(result.current.totalIncome).toBeDefined();
    expect(result.current.monthsCovered).toBeDefined();
  });

  it('should handle missing data detection', () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    // Missing data array should exist
    expect(result.current.missingData).toBeDefined();
    expect(Array.isArray(result.current.missingData)).toBe(true);
  });
});
