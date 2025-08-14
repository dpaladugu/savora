
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GlobalSettingsManager } from '../global-settings-manager';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { useAppStore } from '@/store/appStore';

// Mock the dependencies
vi.mock('@/services/GlobalSettingsService');
vi.mock('@/store/appStore');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockSettings = {
  id: 'global-settings-singleton',
  taxRegime: 'New' as const,
  autoLockMinutes: 5,
  birthdayBudget: 0,
  birthdayAlertDays: 7,
  emergencyContacts: [],
  dependents: [],
  salaryCreditDay: 1,
  annualBonus: 0,
  medicalInflationRate: 8.0,
  educationInflation: 10.0,
  vehicleInflation: 6.0,
  maintenanceInflation: 7.0,
  privacyMask: false,
  failedPinAttempts: 0,
  maxFailedAttempts: 10,
  darkMode: false,
  timeZone: 'Asia/Kolkata',
  isTest: false,
  theme: 'light',
  deviceThemes: {},
  revealSecret: '',
};

describe('GlobalSettingsManager', () => {
  const mockSetPrivacyMask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the store
    (useAppStore as any).mockReturnValue({
      setPrivacyMask: mockSetPrivacyMask
    });

    // Mock the service
    vi.mocked(GlobalSettingsService.getGlobalSettings).mockResolvedValue(mockSettings);
    vi.mocked(GlobalSettingsService.updateGlobalSettings).mockResolvedValue();
  });

  it('renders loading state initially', () => {
    render(<GlobalSettingsManager />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays settings', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Global Settings')).toBeInTheDocument();
    });

    expect(GlobalSettingsService.getGlobalSettings).toHaveBeenCalled();
  });

  it('updates privacy mask setting', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Privacy Mask')).toBeInTheDocument();
    });

    const privacySwitch = screen.getByRole('switch', { name: /privacy mask/i });
    fireEvent.click(privacySwitch);

    await waitFor(() => {
      expect(GlobalSettingsService.updateGlobalSettings).toHaveBeenCalledWith({
        privacyMask: true
      });
      expect(mockSetPrivacyMask).toHaveBeenCalledWith(true);
    });
  });

  it('updates tax regime setting', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tax Regime')).toBeInTheDocument();
    });

    // This would test the select component interaction
    // Implementation depends on the specific select component used
  });

  it('handles financial settings updates', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Financial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Financial'));

    await waitFor(() => {
      expect(screen.getByLabelText(/salary credit day/i)).toBeInTheDocument();
    });
  });

  it('handles emergency contacts', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Personal'));

    await waitFor(() => {
      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
      expect(screen.getByText('No emergency contacts added')).toBeInTheDocument();
    });
  });

  it('displays all configuration tabs', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('App')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  it('handles inflation rate updates', async () => {
    render(<GlobalSettingsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Financial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Financial'));

    await waitFor(() => {
      const medicalInflationInput = screen.getByLabelText(/medical inflation/i);
      expect(medicalInflationInput).toHaveValue(8);
    });
  });
});
