
import { db } from '@/db';
import type { Goal, Dependent } from '@/db';
import { Logger } from '@/services/logger';
import { format, addYears, addDays } from 'date-fns';

export class GoalService {
  // Create goal with auto-generated slug
  static async createGoal(goalData: Omit<Goal, 'id' | 'slug' | 'currentAmount'>): Promise<Goal> {
    const id = crypto.randomUUID();
    const slug = this.generateSlug(goalData.name, goalData.type);
    
    const goal: Goal = {
      id,
      slug,
      currentAmount: 0,
      ...goalData
    };

    await db.goals.add(goal);
    Logger.info('Goal created', { goalId: id, name: goalData.name });
    return goal;
  }

  // Auto-goal creation rules from requirements spec
  static async createAutoGoals(): Promise<void> {
    try {
      const dependents = await this.getDependents();
      const investments = await db.investments.toArray();
      const creditCards = await db.creditCards.toArray();
      
      // Auto-create child education goals
      for (const dependent of dependents) {
        if (dependent.relation === 'Child') {
          await this.createChildEducationGoal(dependent);
        }
      }

      // Auto-create NPS goals if NPS investments exist
      const hasNPST1 = investments.some(inv => inv.type === 'NPS-T1');
      if (hasNPST1) {
        await this.createNPSGoal();
      }

      // Auto-create PPF goal if PPF investments exist
      const hasPPF = investments.some(inv => inv.type === 'PPF');
      if (hasPPF) {
        await this.createPPFGoal();
      }

      Logger.info('Auto-goals creation completed');
    } catch (error) {
      Logger.error('Error creating auto-goals:', error);
    }
  }

  private static async createChildEducationGoal(child: Dependent): Promise<void> {
    const existingGoal = await db.goals.where('slug').equals(`kid-ug-18-${child.id}`).first();
    if (existingGoal) return;

    const currentAge = this.calculateAge(child.dob);
    const yearsToEducation = Math.max(0, 18 - currentAge);
    
    if (yearsToEducation > 0) {
      const targetDate = addYears(new Date(), yearsToEducation);
      const targetAmount = this.calculateEducationCorpus(yearsToEducation);

      await this.createGoal({
        name: `${child.name} Education (UG@18)`,
        type: 'Long',
        targetAmount,
        targetDate,
        notes: `Auto-created education goal for ${child.name}`
      });
    }
  }

  private static async createNPSGoal(): Promise<void> {
    const existingGoal = await db.goals.where('slug').equals('nps-t1-80ccdb').first();
    if (existingGoal) return;

    const currentFY = new Date().getFullYear();
    const targetDate = new Date(currentFY + 1, 2, 31); // 31st March

    await this.createGoal({
      name: 'NPS-T1 80CCD(1B)',
      type: 'Short',
      targetAmount: 50000,
      targetDate,
      notes: 'Auto-created NPS Tier-1 tax benefit goal'
    });
  }

  private static async createPPFGoal(): Promise<void> {
    const existingGoal = await db.goals.where('slug').equals('ppf-annual').first();
    if (existingGoal) return;

    const currentFY = new Date().getFullYear();
    const targetDate = new Date(currentFY + 1, 3, 5); // 5th April

    await this.createGoal({
      name: 'PPF Annual Deposit',
      type: 'Short',
      targetAmount: 150000,
      targetDate,
      notes: 'Auto-created PPF annual deposit goal'
    });
  }

  // Helper methods
  private static generateSlug(name: string, type: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    return `${slug}-${type.toLowerCase()}`;
  }

  private static calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private static calculateEducationCorpus(years: number): number {
    // PV calculation for ₹30L in future with 7% education inflation
    const futureValue = 3000000; // ₹30L target
    const inflationRate = 0.07; // 7% as per requirements
    const presentValue = futureValue / Math.pow(1 + inflationRate, years);
    return Math.round(presentValue);
  }

  private static async getDependents(): Promise<Dependent[]> {
    try {
      const settings = await db.globalSettings.limit(1).first();
      return settings?.dependents || [];
    } catch (error) {
      Logger.error('Error fetching dependents:', error);
      return [];
    }
  }

  // Update goal progress
  static async updateGoalProgress(goalId: string, amount: number): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (goal) {
      await db.goals.update(goalId, {
        currentAmount: goal.currentAmount + amount
      });
      Logger.info('Goal progress updated', { goalId, newAmount: goal.currentAmount + amount });
    }
  }

  // Get all goals with progress
  static async getAllGoals(): Promise<Goal[]> {
    return await db.goals.orderBy('targetDate').toArray();
  }

  // Get goals by type
  static async getGoalsByType(type: Goal['type']): Promise<Goal[]> {
    return await db.goals.where('type').equals(type).toArray();
  }
}
