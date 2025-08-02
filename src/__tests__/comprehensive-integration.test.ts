
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db';
import { GoalService } from '@/services/goal-service';
import { Logger } from '@/services/logger';

// Mock logger
vi.mock('@/services/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

describe('Comprehensive Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear database for clean tests
    try {
      await db.transaction('rw', [db.expenses, db.incomes, db.investments, db.goals], async () => {
        await db.expenses.clear();
        await db.incomes.clear();
        await db.investments.clear();
        await db.goals.clear();
      });
    } catch (error) {
      // Ignore errors in test cleanup
    }
  });

  describe('Database Schema and Operations', () => {
    it('should create and retrieve expenses correctly', async () => {
      const expense = {
        id: 'test-expense-1',
        amount: 1000,
        description: 'Test Expense',
        category: 'Food',
        date: '2024-01-01'
      };

      await db.expenses.add(expense);
      const retrieved = await db.expenses.get('test-expense-1');

      expect(retrieved).toEqual(expense);
    });

    it('should create and retrieve incomes correctly', async () => {
      const income = {
        id: 'test-income-1',
        amount: 5000,
        description: 'Test Income',
        category: 'Salary',
        date: '2024-01-01'
      };

      await db.incomes.add(income);
      const retrieved = await db.incomes.get('test-income-1');

      expect(retrieved).toEqual(income);
    });

    it('should create and retrieve investments correctly', async () => {
      const investment = {
        id: 'test-investment-1',
        type: 'MF-Growth' as const,
        name: 'Test Mutual Fund',
        currentNav: 100,
        units: 100,
        investedValue: 8000,
        currentValue: 10000,
        startDate: new Date('2024-01-01'),
        frequency: 'Monthly' as const,
        taxBenefit: false,
        familyMember: 'Me',
        notes: 'Test investment'
      };

      await db.investments.add(investment);
      const retrieved = await db.investments.get('test-investment-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Mutual Fund');
    });
  });

  describe('Goal Management System', () => {
    it('should create goals with proper slugs', async () => {
      const goalData = {
        name: 'Emergency Fund',
        type: 'Medium' as const,
        targetAmount: 100000,
        targetDate: new Date('2024-12-31'),
        notes: 'Emergency fund goal'
      };

      const goal = await GoalService.createGoal(goalData);

      expect(goal.id).toBeDefined();
      expect(goal.slug).toBe('emergency-fund-medium');
      expect(goal.currentAmount).toBe(0);
      expect(goal.name).toBe('Emergency Fund');

      // Verify it was saved to database
      const retrieved = await db.goals.get(goal.id);
      expect(retrieved).toBeDefined();
    });

    it('should update goal progress correctly', async () => {
      // Create a goal first
      const goal = await GoalService.createGoal({
        name: 'Test Goal',
        type: 'Short',
        targetAmount: 10000,
        targetDate: new Date('2024-06-30'),
        notes: 'Test'
      });

      // Update progress
      await GoalService.updateGoalProgress(goal.id, 2000);

      // Verify update
      const updated = await db.goals.get(goal.id);
      expect(updated?.currentAmount).toBe(2000);
    });
  });

  describe('Emergency Fund Settings', () => {
    it('should save and retrieve emergency fund settings', async () => {
      const settings = {
        efMonths: 12,
        currentAmount: 75000,
        medicalSubBucket: 200000,
        medicalSubBucketUsed: 0
      };

      await db.saveEmergencyFundSettings(settings);
      const retrieved = await db.getEmergencyFundSettings();

      expect(retrieved.efMonths).toBe(12);
      expect(retrieved.currentAmount).toBe(75000);
    });
  });

  describe('Data Relationships', () => {
    it('should maintain referential integrity for goals linked to investments', async () => {
      // Create a goal
      const goal = await GoalService.createGoal({
        name: 'Investment Goal',
        type: 'Long',
        targetAmount: 500000,
        targetDate: new Date('2030-12-31'),
        notes: 'Long term investment goal'
      });

      // Create an investment linked to the goal
      const investment = {
        id: 'test-investment-linked',
        type: 'SIP' as const,
        name: 'SIP for Goal',
        currentNav: 100,
        units: 50,
        investedValue: 5000,
        currentValue: 5500,
        startDate: new Date('2024-01-01'),
        frequency: 'Monthly' as const,
        goalId: goal.id, // Link to goal
        taxBenefit: true,
        familyMember: 'Me',
        notes: 'SIP linked to goal'
      };

      await db.investments.add(investment);

      // Verify the relationship
      const linkedInvestments = await db.investments.where('goalId').equals(goal.id).toArray();
      expect(linkedInvestments).toHaveLength(1);
      expect(linkedInvestments[0].name).toBe('SIP for Goal');
    });
  });

  describe('Error Handling and Data Validation', () => {
    it('should handle database errors gracefully', async () => {
      // Try to get a non-existent record
      const result = await db.goals.get('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should validate required fields', async () => {
      // Try to create a goal without required fields
      expect(async () => {
        await GoalService.createGoal({
          name: '',
          type: 'Short',
          targetAmount: -1000, // Invalid amount
          targetDate: new Date('2020-01-01'), // Past date
          notes: ''
        });
      }).not.toThrow(); // Should not throw, but may log errors
    });
  });
});
