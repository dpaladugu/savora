
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoalService } from '../goal-service';
import { db } from '@/db';
import type { Goal, Dependent } from '@/db';

// Mock database
vi.mock('@/db', () => ({
  db: {
    goals: {
      add: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn()
        }))
      })),
      orderBy: vi.fn(() => ({
        toArray: vi.fn()
      })),
      get: vi.fn(),
      update: vi.fn(),
      toArray: vi.fn()
    },
    investments: {
      toArray: vi.fn(() => Promise.resolve([]))
    },
    creditCards: {
      toArray: vi.fn(() => Promise.resolve([]))
    },
    globalSettings: {
      limit: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve({
          dependents: [
            {
              id: '1',
              relation: 'Child',
              name: 'Test Child',
              dob: new Date('2020-01-01'),
              gender: 'F',
              chronic: false,
              isNominee: false
            }
          ]
        }))
      }))
    }
  }
}));

vi.mock('@/services/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('GoalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should create a goal with auto-generated slug and ID', async () => {
      const mockGoal = {
        name: 'Test Goal',
        type: 'Short' as const,
        targetAmount: 10000,
        targetDate: new Date('2024-12-31'),
        notes: 'Test goal'
      };

      vi.mocked(db.goals.add).mockResolvedValue('test-id');

      const result = await GoalService.createGoal(mockGoal);

      expect(result.id).toBeDefined();
      expect(result.slug).toBe('test-goal-short');
      expect(result.currentAmount).toBe(0);
      expect(result.name).toBe('Test Goal');
      expect(db.goals.add).toHaveBeenCalled();
    });
  });

  describe('createAutoGoals', () => {
    it('should create child education goals for dependents', async () => {
      vi.mocked(db.investments.toArray).mockResolvedValue([]);
      vi.mocked(db.creditCards.toArray).mockResolvedValue([]);
      vi.mocked(db.goals.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null) // No existing goal
        })
      } as any);

      await GoalService.createAutoGoals();

      expect(db.goals.add).toHaveBeenCalled();
    });

    it('should create NPS goal when NPS investment exists', async () => {
      vi.mocked(db.investments.toArray).mockResolvedValue([
        { type: 'NPS-T1' } as any
      ]);
      vi.mocked(db.creditCards.toArray).mockResolvedValue([]);
      vi.mocked(db.goals.where).mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      } as any);

      await GoalService.createAutoGoals();

      expect(db.goals.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NPS-T1 80CCD(1B)',
          targetAmount: 50000
        })
      );
    });
  });

  describe('updateGoalProgress', () => {
    it('should update goal progress correctly', async () => {
      const mockGoal = {
        id: 'test-id',
        currentAmount: 5000
      };

      vi.mocked(db.goals.get).mockResolvedValue(mockGoal as Goal);
      vi.mocked(db.goals.update).mockResolvedValue(1);

      await GoalService.updateGoalProgress('test-id', 1000);

      expect(db.goals.update).toHaveBeenCalledWith('test-id', {
        currentAmount: 6000
      });
    });
  });

  describe('getAllGoals', () => {
    it('should return all goals ordered by target date', async () => {
      const mockGoals = [
        { id: '1', name: 'Goal 1', targetDate: new Date('2024-12-31') },
        { id: '2', name: 'Goal 2', targetDate: new Date('2024-06-30') }
      ];

      vi.mocked(db.goals.orderBy).mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockGoals)
      } as any);

      const result = await GoalService.getAllGoals();

      expect(result).toEqual(mockGoals);
      expect(db.goals.orderBy).toHaveBeenCalledWith('targetDate');
    });
  });
});
