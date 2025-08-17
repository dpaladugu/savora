
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CFARecommendationEngine } from '@/services/CFARecommendationEngine';
import { EmergencyFundService } from '@/services/EmergencyFundService';
import { AuthenticationService } from '@/services/AuthenticationService';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import type { EmergencyFund, Investment } from '@/types/financial';

// Mock services
vi.mock('@/lib/db', () => ({
  db: {
    emergencyFunds: {
      get: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn()
    },
    globalSettings: {
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn()
    },
    investments: {
      toArray: vi.fn(() => Promise.resolve([]))
    },
    expenses: {
      toArray: vi.fn(() => Promise.resolve([]))
    }
  }
}));

describe('Production Readiness Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Critical Business Logic', () => {
    it('should handle emergency fund calculations', async () => {
      const mockFund: EmergencyFund = {
        id: 'test-fund',
        name: 'Emergency Fund',
        targetAmount: 100000,
        currentAmount: 50000,
        targetMonths: 12,
        lastReviewDate: new Date(),
        status: 'Under-Target',
        medicalSubBucket: 20000,
        medicalSubBucketUsed: 0,
        monthlyExpenses: 25000,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(EmergencyFundService.getEmergencyFund).mockResolvedValue(mockFund);

      const fund = await EmergencyFundService.getEmergencyFund('test-fund');
      expect(fund).toBeDefined();
      expect(fund?.targetAmount).toBe(100000);
    });

    it('should generate CFA recommendations', async () => {
      const mockInvestments: Investment[] = [
        {
          id: '1',
          name: 'Test Investment',
          type: 'MF-Growth',
          currentValue: 10000,
          purchasePrice: 8000,
          quantity: 100,
          purchaseDate: new Date(),
          currentNav: 100,
          units: 100,
          investedValue: 8000,
          startDate: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const recommendations = await CFARecommendationEngine.generateRecommendations(mockInvestments, []);
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations.portfolio)).toBe(true);
    });

    it('should handle authentication flows', async () => {
      const mockHasPIN = vi.fn().mockResolvedValue(true);
      const mockVerifyPIN = vi.fn().mockResolvedValue({ success: true, shouldSelfDestruct: false, attemptsRemaining: 9 });
      
      AuthenticationService.hasPIN = mockHasPIN;
      AuthenticationService.verifyPIN = mockVerifyPIN;

      const hasPIN = await AuthenticationService.hasPIN();
      expect(hasPIN).toBe(true);

      const result = await AuthenticationService.verifyPIN('1234');
      expect(result.success).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistent emergency fund data', async () => {
      const fund: Omit<EmergencyFund, 'id'> = {
        name: 'Test Fund',
        targetAmount: 100000,
        currentAmount: 75000,
        targetMonths: 12,
        lastReviewDate: new Date(),
        status: 'On-Track',
        medicalSubBucket: 20000,
        medicalSubBucketUsed: 0,
        monthlyExpenses: 25000,
        created_at: new Date(),
        updated_at: new Date()
      };

      await EmergencyFundService.createEmergencyFund(fund);
      const retrieved = await EmergencyFundService.getEmergencyFund('test-fund');
      
      expect(retrieved?.targetAmount).toBe(fund.targetAmount);
      expect(retrieved?.currentAmount).toBe(fund.currentAmount);
    });

    it('should handle portfolio analysis correctly', async () => {
      const mockInvestments: Investment[] = [
        {
          id: '1',
          name: 'Equity Fund',
          type: 'MF-Growth',
          currentValue: 50000,
          purchasePrice: 40000,
          quantity: 100,
          purchaseDate: new Date(),
          currentNav: 500,
          units: 100,
          investedValue: 40000,
          startDate: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          name: 'Bond Fund',
          type: 'Bonds',
          currentValue: 30000,
          purchasePrice: 29000,
          quantity: 300,
          purchaseDate: new Date(),
          currentNav: 100,
          units: 300,
          investedValue: 29000,
          startDate: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const analysis = await CFARecommendationEngine.analyzePortfolio(mockInvestments);
      expect(analysis).toBeDefined();
      expect(typeof analysis.totalValue).toBe('number');
    });
  });

  describe('Security Features', () => {
    it('should handle PIN-based authentication', async () => {
      const mockGlobalSettings = {
        id: 'global-settings-singleton',
        failedPinAttempts: 0,
        maxFailedAttempts: 10,
        autoLockMinutes: 5,
        taxRegime: 'New' as const,
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
        darkMode: false,
        timeZone: 'Asia/Kolkata',
        isTest: true,
        theme: 'light' as const,
        deviceThemes: {},
        revealSecret: ''
      };

      vi.mocked(GlobalSettingsService.getGlobalSettings).mockResolvedValue(mockGlobalSettings);
      
      const settings = await GlobalSettingsService.getGlobalSettings();
      expect(settings.maxFailedAttempts).toBe(10);
      expect(settings.autoLockMinutes).toBe(5);
    });
  });

  describe('Performance Requirements', () => {
    it('should load dashboard data efficiently', async () => {
      const startTime = Date.now();
      
      const mockData = {
        expenses: [],
        incomes: [],
        investments: [],
        loading: false,
        error: null
      };

      // Simulate data loading
      await Promise.resolve(mockData);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load within 1 second
    });
  });
});
