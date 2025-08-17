
import { db } from '@/lib/db';
import type { EmergencyFund } from '@/types/financial';

export class EmergencyFundService {
  static async getEmergencyFund(id: string): Promise<EmergencyFund | undefined> {
    try {
      return await db.emergencyFunds.get(id);
    } catch (error) {
      console.error('Error fetching emergency fund:', error);
      throw error;
    }
  }

  static async createEmergencyFund(fund: Omit<EmergencyFund, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const fundToAdd: EmergencyFund = {
        ...fund,
        id: newId,
        lastReviewDate: new Date(),
        status: 'Under-Target',
        medicalSubBucket: 0,
        medicalSubBucketUsed: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.emergencyFunds.add(fundToAdd);
      return newId;
    } catch (error) {
      console.error('Error creating emergency fund:', error);
      throw error;
    }
  }

  static async updateCurrentAmount(id: string, currentAmount: number): Promise<void> {
    try {
      await db.emergencyFunds.update(id, { 
        currentAmount: currentAmount,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating current amount:', error);
      throw error;
    }
  }

  static async updateTargetAmount(id: string, targetAmount: number): Promise<void> {
    try {
      await db.emergencyFunds.update(id, { 
        targetAmount: targetAmount,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating target amount:', error);
      throw error;
    }
  }

  static async getAllEmergencyFunds(): Promise<EmergencyFund[]> {
    try {
      return await db.emergencyFunds.toArray();
    } catch (error) {
      console.error('Error fetching all emergency funds:', error);
      throw error;
    }
  }

  static async deleteEmergencyFund(id: string): Promise<void> {
    try {
      await db.emergencyFunds.delete(id);
    } catch (error) {
      console.error('Error deleting emergency fund:', error);
      throw error;
    }
  }

  static calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount <= 0) return 0;
    return Math.min(100, (currentAmount / targetAmount) * 100);
  }

  static calculateMonthsOfExpenses(currentAmount: number, monthlyExpenses: number): number {
    if (monthlyExpenses <= 0) return 0;
    return currentAmount / monthlyExpenses;
  }
}
