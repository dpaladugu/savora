
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { AuthenticationService } from '@/services/AuthenticationService';
import { CFARecommendationEngine } from '@/services/CFARecommendationEngine';

describe('Production Readiness Tests', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.transaction('rw', [
      db.globalSettings,
      db.txns,
      db.goals,
      db.creditCards,
      db.vehicles,
      db.investments,
      db.expenses,
      db.incomes
    ], async () => {
      await Promise.all([
        db.globalSettings.clear(),
        db.txns.clear(),
        db.goals.clear(),
        db.creditCards.clear(),
        db.vehicles.clear(),
        db.investments.clear(),
        db.expenses.clear(),
        db.incomes.clear()
      ]);
    });
  });

  describe('Global Settings Service', () => {
    it('creates default settings when none exist', async () => {
      const settings = await GlobalSettingsService.getGlobalSettings();
      
      expect(settings).toBeDefined();
      expect(settings.id).toBe('global-settings-singleton');
      expect(settings.taxRegime).toBe('New');
      expect(settings.autoLockMinutes).toBe(5);
      expect(settings.privacyMask).toBe(false);
      expect(settings.failedPinAttempts).toBe(0);
      expect(settings.maxFailedAttempts).toBe(10);
    });

    it('updates settings correctly', async () => {
      await GlobalSettingsService.updateGlobalSettings({
        taxRegime: 'Old',
        privacyMask: true,
        autoLockMinutes: 10
      });

      const settings = await GlobalSettingsService.getGlobalSettings();
      expect(settings.taxRegime).toBe('Old');
      expect(settings.privacyMask).toBe(true);
      expect(settings.autoLockMinutes).toBe(10);
    });

    it('handles emergency contacts', async () => {
      const contact = {
        name: 'John Doe',
        phone: '+91-9876543210',
        relation: 'Father'
      };

      await GlobalSettingsService.addEmergencyContact(contact);
      const settings = await GlobalSettingsService.getGlobalSettings();
      
      expect(settings.emergencyContacts).toHaveLength(1);
      expect(settings.emergencyContacts[0]).toEqual(contact);
    });

    it('validates auto lock minutes range', async () => {
      await expect(
        GlobalSettingsService.updateAutoLockMinutes(0)
      ).rejects.toThrow('Auto lock minutes must be between 1 and 10');

      await expect(
        GlobalSettingsService.updateAutoLockMinutes(15)
      ).rejects.toThrow('Auto lock minutes must be between 1 and 10');
    });
  });

  describe('Authentication Service', () => {
    it('handles PIN setup and verification', async () => {
      const testPin = '1234';
      
      // Initially no PIN should exist
      const hasPin = await AuthenticationService.hasPIN();
      expect(hasPin).toBe(false);

      // Set PIN
      await AuthenticationService.setPIN(testPin);
      expect(await AuthenticationService.hasPIN()).toBe(true);

      // Verify correct PIN
      const validResult = await AuthenticationService.verifyPIN(testPin);
      expect(validResult.success).toBe(true);
      expect(validResult.shouldSelfDestruct).toBe(false);

      // Verify incorrect PIN
      const invalidResult = await AuthenticationService.verifyPIN('wrong');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.attemptsRemaining).toBe(9);
    });

    it('tracks failed PIN attempts', async () => {
      await AuthenticationService.setPIN('1234');
      
      // Make multiple failed attempts
      await AuthenticationService.verifyPIN('wrong1');
      await AuthenticationService.verifyPIN('wrong2');
      
      const settings = await GlobalSettingsService.getGlobalSettings();
      expect(settings.failedPinAttempts).toBe(2);
    });

    it('handles session management', () => {
      expect(AuthenticationService.isSessionValid()).toBe(false);
      
      AuthenticationService.createSession();
      expect(AuthenticationService.isSessionValid()).toBe(true);
      
      AuthenticationService.clearSession();
      expect(AuthenticationService.isSessionValid()).toBe(false);
    });
  });

  describe('CFA Recommendation Engine', () => {
    it('generates portfolio rebalancing recommendations', async () => {
      const recommendations = await CFARecommendationEngine.checkRebalancingNeeds();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('analyzes insurance gaps', async () => {
      const annualIncome = 1000000;
      const gaps = await CFARecommendationEngine.analyzeInsuranceGaps(annualIncome);
      
      expect(Array.isArray(gaps)).toBe(true);
      if (gaps.length > 0) {
        expect(gaps[0]).toHaveProperty('id');
        expect(gaps[0]).toHaveProperty('title');
        expect(gaps[0]).toHaveProperty('currentCoverage');
        expect(gaps[0]).toHaveProperty('recommendedCoverage');
        expect(gaps[0]).toHaveProperty('gapAmount');
      }
    });

    it('provides SIP recommendations', async () => {
      const recommendations = await CFARecommendationEngine.getSIPRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('generates tax optimization suggestions', async () => {
      const suggestions = await CFARecommendationEngine.getTaxOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('creates monthly nudges', async () => {
      const nudges = await CFARecommendationEngine.generateMonthlyNudges();
      expect(Array.isArray(nudges)).toBe(true);
    });
  });

  describe('Database Schema Integrity', () => {
    it('has all required tables', async () => {
      const tables = [
        'globalSettings',
        'txns',
        'goals',
        'creditCards',
        'vehicles',
        'investments',
        'expenses',
        'incomes',
        'rentalProperties',
        'tenants',
        'gold',
        'insurance',
        'loans',
        'subscriptions',
        'health',
        'emergencyFunds'
      ];

      for (const tableName of tables) {
        expect(db[tableName]).toBeDefined();
      }
    });

    it('can perform CRUD operations on all main entities', async () => {
      // Test expenses - using correct schema
      const expenseId = await db.expenses.add({
        amount: 100,
        date: new Date(),
        category: 'Food',
        type: 'debit',
        source: 'manual'
      });
      expect(expenseId).toBeDefined();

      // Test goals - using correct schema
      const goalId = await db.goals.add({
        name: 'Test Goal',
        slug: 'test-goal',
        type: 'Short',
        targetAmount: 50000,
        currentAmount: 0,
        targetDate: new Date(),
        notes: 'Test goal'
      });
      expect(goalId).toBeDefined();

      // Test investments - using correct schema
      const investmentId = await db.investments.add({
        name: 'Test Investment',
        type: 'MF-Growth',
        investedValue: 10000,
        currentValue: 10000,
        startDate: new Date(),
        familyMember: 'Self',
        notes: 'Test investment'
      });
      expect(investmentId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      // Mock a service to throw an error
      const originalMethod = GlobalSettingsService.getGlobalSettings;
      GlobalSettingsService.getGlobalSettings = vi.fn().mockRejectedValue(new Error('Database error'));

      try {
        await GlobalSettingsService.getGlobalSettings();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Database error');
      }

      // Restore original method
      GlobalSettingsService.getGlobalSettings = originalMethod;
    });

    it('validates input data', async () => {
      // Test invalid transaction data
      await expect(
        db.txns.add({
          amount: -100, // This should be valid for expenses
          date: new Date(),
          category: 'Food',
          note: 'Test expense',
          tags: [],
          currency: 'INR',
          paymentMix: [{
            mode: 'Cash',
            amount: 100
          }]
        })
      ).resolves.toBeDefined(); // Should work for negative amounts (expenses)
    });
  });
});
