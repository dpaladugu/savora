
import { describe, it, expect, beforeEach } from 'vitest';
import { extendedDb } from '@/lib/db-schema-extended';
import { RentalPropertyService } from '@/services/RentalPropertyService';
import { TenantService } from '@/services/TenantService';
import { GoldService } from '@/services/GoldService';
import { LoanService } from '@/services/LoanService';
import { HealthService } from '@/services/HealthService';
import { EnhancedAutoGoalEngine } from '@/services/EnhancedAutoGoalEngine';

describe('Extended Functionality Tests', () => {
  beforeEach(async () => {
    // Clear all extended tables
    await extendedDb.transaction('rw', [
      extendedDb.rentalProperties,
      extendedDb.tenants,
      extendedDb.gold,
      extendedDb.loans,
      extendedDb.brotherRepayments,
      extendedDb.health,
      extendedDb.familyBankAccounts
    ], async () => {
      await Promise.all([
        extendedDb.rentalProperties.clear(),
        extendedDb.tenants.clear(),
        extendedDb.gold.clear(),
        extendedDb.loans.clear(),
        extendedDb.brotherRepayments.clear(),
        extendedDb.health.clear(),
        extendedDb.familyBankAccounts.clear()
      ]);
    });
  });

  describe('Rental Property Management', () => {
    it('creates and manages rental properties', async () => {
      const propertyData = {
        address: 'Test Property, Mumbai',
        owner: 'Me' as const,
        type: 'Apartment' as const,
        squareYards: 1200,
        monthlyRent: 25000,
        dueDay: 5,
        escalationPercent: 5,
        escalationDate: new Date(),
        lateFeeRate: 2,
        noticePeriodDays: 30,
        depositRefundPending: false,
        propertyTaxAnnual: 15000,
        propertyTaxDueDay: 15,
        waterTaxAnnual: 3000,
        waterTaxDueDay: 20,
        maintenanceReserve: 50000
      };

      const propertyId = await RentalPropertyService.createProperty(propertyData);
      expect(propertyId).toBeDefined();

      const property = await RentalPropertyService.getPropertyById(propertyId);
      expect(property).toBeDefined();
      expect(property?.address).toBe(propertyData.address);
      expect(property?.monthlyRent).toBe(propertyData.monthlyRent);
    });

    it('calculates rental analytics correctly', async () => {
      await RentalPropertyService.createProperty({
        address: 'Property 1',
        owner: 'Me',
        type: 'Apartment',
        squareYards: 1000,
        monthlyRent: 20000,
        dueDay: 5,
        escalationPercent: 5,
        escalationDate: new Date(),
        lateFeeRate: 2,
        noticePeriodDays: 30,
        depositRefundPending: false,
        propertyTaxAnnual: 12000,
        propertyTaxDueDay: 15,
        waterTaxAnnual: 2000,
        waterTaxDueDay: 20,
        maintenanceReserve: 40000
      });

      const analytics = await RentalPropertyService.getRentalAnalytics();
      expect(analytics.totalProperties).toBe(1);
      expect(analytics.totalMonthlyIncome).toBe(20000);
      expect(analytics.totalAnnualTax).toBe(14000);
    });
  });

  describe('Tenant Management', () => {
    it('manages tenants and their repayments', async () => {
      const propertyId = await RentalPropertyService.createProperty({
        address: 'Test Property',
        owner: 'Me',
        type: 'Apartment',
        squareYards: 1000,
        monthlyRent: 20000,
        dueDay: 5,
        escalationPercent: 5,
        escalationDate: new Date(),
        lateFeeRate: 2,
        noticePeriodDays: 30,
        depositRefundPending: false,
        propertyTaxAnnual: 12000,
        propertyTaxDueDay: 15,
        waterTaxAnnual: 2000,
        waterTaxDueDay: 20,
        maintenanceReserve: 40000
      });

      const tenantData = {
        propertyId,
        tenantName: 'John Doe',
        roomNo: 'A-101',
        monthlyRent: 20000,
        depositPaid: 60000,
        joinDate: new Date(),
        depositRefundPending: false,
        tenantContact: '+91-9876543210'
      };

      const tenantId = await TenantService.addTenant(tenantData);
      expect(tenantId).toBeDefined();

      const tenants = await TenantService.getTenantsByProperty(propertyId);
      expect(tenants).toHaveLength(1);
      expect(tenants[0].tenantName).toBe('John Doe');
    });
  });

  describe('Gold Investment Tracking', () => {
    it('tracks gold investments and calculates values', async () => {
      const goldData = {
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
      };

      const goldId = await GoldService.addGold(goldData);
      expect(goldId).toBeDefined();

      const currentGoldRate = 5000; // ₹5000 per gram
      const goldValue = await GoldService.calculateCurrentGoldValue(currentGoldRate);
      
      expect(goldValue.totalWeight).toBe(45);
      expect(goldValue.totalInvestedValue).toBe(221980); // sum of all costs
      expect(goldValue.currentMarketValue).toBeGreaterThan(0);
    });
  });

  describe('Loan Management', () => {
    it('creates loans and generates amortisation schedules', async () => {
      const loanData = {
        type: 'Personal' as const,
        borrower: 'Me' as const,
        principal: 500000,
        roi: 12,
        tenureMonths: 60,
        emi: 11122,
        outstanding: 500000,
        startDate: new Date(),
        isActive: true
      };

      const loanId = await LoanService.createLoan(loanData);
      expect(loanId).toBeDefined();

      const loans = await LoanService.getAllLoans();
      expect(loans).toHaveLength(1);
      expect(loans[0].amortisationSchedule).toBeDefined();
      expect(loans[0].amortisationSchedule.length).toBe(60);
    });

    it('calculates loan analytics', async () => {
      await LoanService.createLoan({
        type: 'Personal',
        borrower: 'Me',
        principal: 500000,
        roi: 12,
        tenureMonths: 60,
        emi: 11122,
        outstanding: 500000,
        startDate: new Date(),
        isActive: true
      });

      const analytics = await LoanService.getLoanAnalytics();
      expect(analytics.totalLoans).toBe(1);
      expect(analytics.activeLoans).toBe(1);
      expect(analytics.totalOutstanding).toBe(500000);
      expect(analytics.totalEMI).toBe(11122);
    });
  });

  describe('Health Tracking', () => {
    it('manages health profiles and medical records', async () => {
      const healthData = {
        refillAlertDays: 7,
        heightCm: 175,
        weightKg: 70,
        prescriptions: [],
        familyHistory: ['Diabetes', 'Hypertension'],
        vaccinations: [],
        vitals: []
      };

      const healthId = await HealthService.saveHealthProfile(healthData);
      expect(healthId).toBeDefined();

      const health = await HealthService.getHealthProfile();
      expect(health?.heightCm).toBe(175);
      expect(health?.weightKg).toBe(70);
      expect(health?.familyHistory).toEqual(['Diabetes', 'Hypertension']);
    });

    it('calculates BMI correctly', async () => {
      const bmi = HealthService.calculateBMI(70, 175);
      expect(bmi).toBe(22.9);
    });
  });

  describe('Auto-Goal Engine', () => {
    it('executes funding priority stack', async () => {
      const surplusAmount = 100000;
      const result = await EnhancedAutoGoalEngine.executeFundingPriorityStack(surplusAmount);
      
      expect(result).toBeDefined();
      expect(result.allocations).toBeDefined();
      expect(result.remainingSurplus).toBeLessThanOrEqual(surplusAmount);
    });
  });
});
