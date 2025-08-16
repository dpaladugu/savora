
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { GoldService } from '@/services/GoldService';
import { LoanService } from '@/services/LoanService';
import { VehicleService } from '@/services/VehicleService';

// Mock the services
vi.mock('@/services/GoldService');
vi.mock('@/services/LoanService');
vi.mock('@/services/VehicleService');
vi.mock('@/services/InsuranceService');

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('UI Components Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GoldTracker', () => {
    it('renders gold tracker and handles empty state', async () => {
      vi.mocked(GoldService.getAllGold).mockResolvedValue([]);
      
      render(<GoldTracker />);
      
      await waitFor(() => {
        expect(screen.getByText('Gold Tracker')).toBeInTheDocument();
        expect(screen.getByText('No gold holdings recorded yet')).toBeInTheDocument();
      });
    });

    it('displays gold holdings when available', async () => {
      const mockGold = [{
        id: '1',
        form: 'Jewelry' as const,
        description: 'Gold Chain',
        grossWeight: 50,
        netWeight: 45,
        stoneWeight: 5,
        purity: '22K' as const,
        purchasePrice: 200000,
        makingCharge: 15000,
        gstPaid: 6480,
        hallmarkCharge: 500,
        karatPrice: 4400,
        purchaseDate: new Date(),
        merchant: 'ABC Jewellers',
        storageLocation: 'Home Safe',
        storageCost: 0,
        familyMember: 'Self'
      }];

      vi.mocked(GoldService.getAllGold).mockResolvedValue(mockGold);
      
      render(<GoldTracker />);
      
      await waitFor(() => {
        expect(screen.getByText('Jewelry Gold')).toBeInTheDocument();
        expect(screen.getByText('Gold Chain')).toBeInTheDocument();
        expect(screen.getByText('45g')).toBeInTheDocument();
      });
    });

    it('opens add modal when Add Gold button is clicked', async () => {
      vi.mocked(GoldService.getAllGold).mockResolvedValue([]);
      
      render(<GoldTracker />);
      
      await waitFor(() => {
        const addButton = screen.getByText('Add Gold');
        fireEvent.click(addButton);
        expect(screen.getByText('Add Gold Holding')).toBeInTheDocument();
      });
    });
  });

  describe('LoanManager', () => {
    it('renders loan manager and handles empty state', async () => {
      vi.mocked(LoanService.getAllLoans).mockResolvedValue([]);
      
      render(<LoanManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Loan Manager')).toBeInTheDocument();
        expect(screen.getByText('No loans recorded yet')).toBeInTheDocument();
      });
    });

    it('displays loan summary correctly', async () => {
      const mockLoans = [{
        id: '1',
        type: 'Personal' as const,
        borrower: 'Me' as const,
        principal: 500000,
        roi: 12,
        tenureMonths: 60,
        emi: 11122,
        outstanding: 400000,
        startDate: new Date(),
        amortisationSchedule: [],
        isActive: true
      }];

      vi.mocked(LoanService.getAllLoans).mockResolvedValue(mockLoans);
      
      render(<LoanManager />);
      
      await waitFor(() => {
        expect(screen.getByText('₹4,00,000')).toBeInTheDocument(); // Outstanding amount
        expect(screen.getByText('₹11,122')).toBeInTheDocument(); // EMI amount
      });
    });
  });

  describe('VehicleManager', () => {
    it('renders vehicle manager and handles empty state', async () => {
      vi.mocked(VehicleService.getVehicles).mockResolvedValue([]);
      
      render(<VehicleManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Vehicle Manager')).toBeInTheDocument();
        expect(screen.getByText('No vehicles recorded yet')).toBeInTheDocument();
      });
    });

    it('shows expiry warnings for vehicles', async () => {
      const nearExpiryDate = new Date();
      nearExpiryDate.setMonth(nearExpiryDate.getMonth() + 1); // 1 month from now

      const mockVehicles = [{
        id: '1',
        owner: 'Me' as const,
        regNo: 'MH01AB1234',
        type: 'Car' as const,
        make: 'Honda',
        model: 'City',
        fuelType: 'Petrol' as const,
        insuranceExpiry: nearExpiryDate,
        pucExpiry: nearExpiryDate,
        vehicleValue: 800000
      }];

      vi.mocked(VehicleService.getVehicles).mockResolvedValue(mockVehicles);
      
      render(<VehicleManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/documents expiring within 3 months/)).toBeInTheDocument();
      });
    });
  });

  describe('InsuranceTracker', () => {
    it('renders insurance tracker with implementation notice', async () => {
      render(<InsuranceTracker />);
      
      await waitFor(() => {
        expect(screen.getByText('Insurance Tracker')).toBeInTheDocument();
        expect(screen.getByText(/Insurance service is not yet fully implemented/)).toBeInTheDocument();
      });
    });
  });
});
