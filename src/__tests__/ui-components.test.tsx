
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Mock services
vi.mock('@/services/VehicleService', () => ({
  VehicleService: {
    getAllVehicles: vi.fn(() => Promise.resolve([])),
    createVehicle: vi.fn(() => Promise.resolve('test-id')),
    updateVehicle: vi.fn(() => Promise.resolve()),
    deleteVehicle: vi.fn(() => Promise.resolve()),
  }
}));

vi.mock('@/services/GoldService', () => ({
  GoldService: {
    getAllGold: vi.fn(() => Promise.resolve([])),
    createGold: vi.fn(() => Promise.resolve('test-id')),
  }
}));

vi.mock('@/services/LoanService', () => ({
  LoanService: {
    getAllLoans: vi.fn(() => Promise.resolve([])),
    createLoan: vi.fn(() => Promise.resolve('test-id')),
  }
}));

vi.mock('@/services/InsuranceService', () => ({
  InsuranceService: {
    getAllPolicies: vi.fn(() => Promise.resolve([])),
    createPolicy: vi.fn(() => Promise.resolve('test-id')),
  }
}));

describe('UI Components', () => {
  it('renders LoadingSpinner correctly', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders EmptyState with message', () => {
    render(<EmptyState message="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders ConfirmationDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();
    
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });
});

describe('Module Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders VehicleManager correctly', async () => {
    render(<VehicleManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Manager')).toBeInTheDocument();
    });
  });

  it('renders GoldTracker correctly', async () => {
    render(<GoldTracker />);
    
    await waitFor(() => {
      expect(screen.getByText('Gold Investment Tracker')).toBeInTheDocument();
    });
  });
});
