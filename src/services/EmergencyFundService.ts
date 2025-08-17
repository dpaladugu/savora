
import { db } from '@/lib/db';
import type { EmergencyFund } from '@/lib/db';

export class EmergencyFundService {
  static async getEmergencyFund(): Promise<EmergencyFund | null> {
    try {
      const fund = await db.emergencyFunds.limit(1).first();
      return fund || null;
    } catch (error) {
      console.error('Error fetching emergency fund:', error);
      return null;
    }
  }

  static async createEmergencyFund(data: {
    targetMonths: number;
    targetAmount: number;
    currentAmount: number;
  }): Promise<EmergencyFund> {
    try {
      const id = crypto.randomUUID();
      const emergencyFund: EmergencyFund = {
        id,
        targetMonths: data.targetMonths,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        lastUpdated: new Date()
      };

      await db.emergencyFunds.add(emergencyFund);
      return emergencyFund;
    } catch (error) {
      console.error('Error creating emergency fund:', error);
      throw error;
    }
  }

  static async updateCurrentAmount(id: string, amount: number): Promise<void> {
    try {
      await db.emergencyFunds.update(id, {
        currentAmount: amount,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating emergency fund amount:', error);
      throw error;
    }
  }

  static async updateTargetAmount(id: string, targetAmount: number, targetMonths: number): Promise<void> {
    try {
      await db.emergencyFunds.update(id, {
        targetAmount,
        targetMonths,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating emergency fund target:', error);
      throw error;
    }
  }

  static calculateMonthlyTarget(monthlyExpenses: number, targetMonths: number): number {
    return monthlyExpenses * targetMonths;
  }

  static calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount === 0) return 0;
    return Math.min(100, (currentAmount / targetAmount) * 100);
  }
}
