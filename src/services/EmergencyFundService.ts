
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

  static async calculateRecommendedAmount(
    monthlyExpenses: number,
    targetMonths: number = 6
  ): Promise<number> {
    return monthlyExpenses * targetMonths;
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
