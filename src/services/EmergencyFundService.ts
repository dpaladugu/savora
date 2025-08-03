import { db } from '@/lib/db';
import type { EmergencyFund } from '@/lib/db';

export class EmergencyFundService {
  static async createEmergencyFund(
    targetMonths: number,
    targetAmount: number
  ): Promise<string> {
    try {
      const newFund: EmergencyFund = {
        id: self.crypto.randomUUID(),
        targetMonths,
        targetAmount,
        currentAmount: 0,
        lastReviewDate: new Date(),
        status: 'Under-Target',
        medicalSubBucket: 0,
        medicalSubBucketUsed: 0,
      };

      await db.emergencyFunds.add(newFund);
      return newFund.id;
    } catch (error) {
      console.error('Error creating emergency fund:', error);
      throw error;
    }
  }

  static async getEmergencyFunds(): Promise<EmergencyFund[]> {
    try {
      return await db.emergencyFunds.toArray();
    } catch (error) {
      console.error('Error fetching emergency funds:', error);
      throw error;
    }
  }

  static async getEmergencyFund(): Promise<EmergencyFund | undefined> {
    try {
      const funds = await db.emergencyFunds.toArray();
      return funds[0];
    } catch (error) {
      console.error('Error fetching emergency fund:', error);
      throw error;
    }
  }

  static async calculateTargetAmount(monthlyExpenses: number, targetMonths: number = 6): Promise<number> {
    return monthlyExpenses * targetMonths;
  }

  static async addToEmergencyFund(id: string, amount: number): Promise<void> {
    try {
      const fund = await db.emergencyFunds.get(id);
      if (fund) {
        await db.emergencyFunds.update(id, { 
          currentAmount: fund.currentAmount + amount 
        });
      }
    } catch (error) {
      console.error('Error adding to emergency fund:', error);
      throw error;
    }
  }

  static async withdrawFromEmergencyFund(id: string, amount: number, reason?: string): Promise<void> {
    try {
      const fund = await db.emergencyFunds.get(id);
      if (!fund) throw new Error('Emergency fund not found');
      
      if (fund.currentAmount < amount) {
        throw new Error('Insufficient emergency fund balance');
      }

      await db.emergencyFunds.update(id, { 
        currentAmount: fund.currentAmount - amount 
      });
    } catch (error) {
      console.error('Error withdrawing from emergency fund:', error);
      throw error;
    }
  }

  static async setTargetMonths(id: string, months: number): Promise<void> {
    try {
      if (months < 3 || months > 24) {
        throw new Error('Target months must be between 3 and 24');
      }
      await db.emergencyFunds.update(id, { targetMonths: months });
    } catch (error) {
      console.error('Error setting target months:', error);
      throw error;
    }
  }

  static async getEmergencyFundStatus(id: string): Promise<{
    fund: EmergencyFund;
    progressPercentage: number;
    medicalSubBucket: number;
    medicalSubBucketUsed: number;
    recommendedAction: string;
  }> {
    try {
      const fund = await db.emergencyFunds.get(id);
      if (!fund) throw new Error('Emergency fund not found');

      const progressPercentage = Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
      
      let recommendedAction = 'Continue building emergency fund';
      if (progressPercentage >= 100) {
        recommendedAction = 'Emergency fund target achieved!';
      } else if (progressPercentage >= 80) {
        recommendedAction = 'On track - maintain regular contributions';
      } else {
        recommendedAction = 'Increase emergency fund contributions';
      }

      return {
        fund,
        progressPercentage,
        medicalSubBucket: fund.medicalSubBucket || 0,
        medicalSubBucketUsed: fund.medicalSubBucketUsed || 0,
        recommendedAction,
      };
    } catch (error) {
      console.error('Error getting emergency fund status:', error);
      throw error;
    }
  }

  static async updateEmergencyFundAmount(
    fundId: string, 
    newAmount: number
  ): Promise<void> {
    try {
      const fund = await db.emergencyFunds.get(fundId);
      if (!fund) throw new Error(`Emergency fund ${fundId} not found`);

      let status: 'OnTrack' | 'Under-Target' | 'Achieved';
      if (newAmount >= fund.targetAmount) {
        status = 'Achieved';
      } else if (newAmount >= fund.targetAmount * 0.8) {
        status = 'OnTrack';
      } else {
        status = 'Under-Target';
      }

      await db.emergencyFunds.update(fundId, {
        currentAmount: newAmount,
        status,
        lastReviewDate: new Date(),
      });
    } catch (error) {
      console.error('Error updating emergency fund:', error);
      throw error;
    }
  }

  static async getProgressPercentage(fundId: string): Promise<number> {
    try {
      const fund = await db.emergencyFunds.get(fundId);
      if (!fund) return 0;
      
      return Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
    } catch (error) {
      console.error('Error calculating progress percentage:', error);
      return 0;
    }
  }

  static async deleteEmergencyFund(fundId: string): Promise<void> {
    try {
      await db.emergencyFunds.delete(fundId);
    } catch (error) {
      console.error('Error deleting emergency fund:', error);
      throw error;
    }
  }

  static async getMedicalSubBucketStatus(fundId: string): Promise<{
    allocated: number;
    used: number;
    remaining: number;
  }> {
    try {
      const fund = await db.emergencyFunds.get(fundId);
      if (!fund) {
        return { allocated: 0, used: 0, remaining: 0 };
      }

      return {
        allocated: fund.medicalSubBucket,
        used: fund.medicalSubBucketUsed,
        remaining: fund.medicalSubBucket - fund.medicalSubBucketUsed,
      };
    } catch (error) {
      console.error('Error getting medical sub-bucket status:', error);
      return { allocated: 0, used: 0, remaining: 0 };
    }
  }
}
