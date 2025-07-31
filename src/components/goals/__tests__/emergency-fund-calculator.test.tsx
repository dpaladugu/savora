
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/utils/test-utils';
import { EmergencyFundCalculator } from '../emergency-fund-calculator';

// Mock the hooks
vi.mock('@/hooks/use-emergency-fund', () => ({
  useEmergencyFund: () => ({
    data: {
      monthlyExpenses: 50000,
      dependents: 2,
      monthlyEMIs: 15000,
      insurancePremiums: 24000,
      bufferPercentage: 20,
      currentCorpus: 100000,
      rentalIncome: 8000,
      emergencyMonths: 6,
    },
    updateData: vi.fn(),
    loading: false,
    missingData: [],
    calculation: {
      monthlyRequired: 60000,
      emergencyFundRequired: 360000,
      currentCoverage: 1.67,
      shortfall: 260000,
    },
    refreshData: vi.fn(),
  }),
}));

vi.mock('@/services/AiChatService', () => ({
  default: {
    isConfigured: () => false,
    initializeProvider: vi.fn(),
  },
}));

vi.mock('@/store/appStore', () => ({
  useAppStore: {
    getState: () => ({
      decryptedAiApiKey: null,
      currentAiProvider: null,
    }),
    subscribe: () => () => {},
  },
}));

describe('EmergencyFundCalculator', () => {
  it('should render emergency fund form', () => {
    render(<EmergencyFundCalculator />);
    
    expect(screen.getByText('Emergency Fund Calculator')).toBeInTheDocument();
    expect(screen.getByText('Essential Monthly Expenses')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund Months')).toBeInTheDocument();
  });

  it('should display calculation results', () => {
    render(<EmergencyFundCalculator />);
    
    expect(screen.getByText('Monthly Requirement')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund Target')).toBeInTheDocument();
    expect(screen.getByText('Current Coverage')).toBeInTheDocument();
    expect(screen.getByText('Shortfall')).toBeInTheDocument();
  });

  it('should show AI advice section', () => {
    render(<EmergencyFundCalculator />);
    
    expect(screen.getByText('AI Financial Advisor')).toBeInTheDocument();
    expect(screen.getByText('Get AI Emergency Fund Advice')).toBeInTheDocument();
  });

  it('should display SIP recommendations when there is shortfall', () => {
    render(<EmergencyFundCalculator />);
    
    expect(screen.getByText('SIP Recommendation')).toBeInTheDocument();
    expect(screen.getByText('12 months:')).toBeInTheDocument();
    expect(screen.getByText('24 months:')).toBeInTheDocument();
    expect(screen.getByText('36 months:')).toBeInTheDocument();
  });
});
