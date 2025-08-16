import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/services/auth-service';
import { ThemeProvider } from '@/contexts/theme-context';
import { GlobalErrorBoundary } from '@/components/ui/global-error-boundary';
import { Navigation } from '@/components/layout/navigation';
import { DashboardScreen } from '@/components/dashboard/dashboard-screen';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import * as VehicleService from '@/services/VehicleService';
import { vi } from 'vitest';

describe('UI Components', () => {
  it('renders the AuthProvider', () => {
    render(
      <AuthProvider>
        <div>Auth Content</div>
      </AuthProvider>
    );
    expect(screen.getByText('Auth Content')).toBeInTheDocument();
  });

  it('renders the ThemeProvider', () => {
    render(
      <ThemeProvider>
        <div>Theme Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Theme Content')).toBeInTheDocument();
  });

  it('renders the GlobalErrorBoundary', () => {
    render(
      <GlobalErrorBoundary>
        <div>Error Boundary Content</div>
      </GlobalErrorBoundary>
    );
    expect(screen.getByText('Error Boundary Content')).toBeInTheDocument();
  });

  it('renders the Navigation component', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </ThemeProvider>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the DashboardScreen component', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <DashboardScreen />
        </AuthProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

describe('VehicleManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vehicle manager with empty state', async () => {
    vi.mocked(VehicleService.getVehicles).mockResolvedValue([]);

    render(<VehicleManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Manager')).toBeInTheDocument();
    });

    expect(screen.getByText('No vehicles recorded yet. Add your first vehicle to get started!')).toBeInTheDocument();
  });

  it('displays vehicles when data is loaded', async () => {
    const mockVehicles = [
      {
        id: '1',
        owner: 'Me' as const,
        regNo: 'MH01AB1234',
        type: 'Car' as const,
        make: 'Honda',
        model: 'City',
        fuelType: 'Petrol' as const,
        purchaseDate: new Date('2020-01-01'),
        insuranceExpiry: new Date('2024-12-31'),
        pucExpiry: new Date('2024-06-30'),
        odometer: 50000,
        fuelEfficiency: 15,
        vehicleValue: 800000,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 5
      }
    ];

    vi.mocked(VehicleService.getVehicles).mockResolvedValue(mockVehicles);

    render(<VehicleManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Honda City')).toBeInTheDocument();
    });

    expect(screen.getByText('MH01AB1234')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });
});
