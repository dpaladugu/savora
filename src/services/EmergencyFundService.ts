
import { db } from "@/lib/db";
import type { EmergencyFund } from "@/lib/db";
import { Logger } from './logger';

export class EmergencyFundService {
  private static readonly DEFAULT_TARGET_MONTHS = 12;
  private static readonly MEDICAL_SUB_BUCKET = 200000; // ₹2,00,000 as per spec

  static async getEmergencyFund(): Promise<EmergencyFund> {
    try {
      const funds = await db.emergencyFunds.toArray();
      
      if (funds.length === 0) {
        // Create default emergency fund if none exists
        const defaultFund: EmergencyFund = {
          id: self.crypto.randomUUID(),
          targetMonths: EmergencyFundService.DEFAULT_TARGET_MONTHS,
          targetAmount: 0, // Will be calculated based on expenses
          currentAmount: 0,
          lastReviewDate: new Date(),
          status: 'Under-Target',
        };
        
        await db.emergencyFunds.add(defaultFund);
        Logger.info('Created default emergency fund');
        return defaultFund;
      }
      
      return funds[0]; // Should only be one emergency fund
    } catch (error) {
      Logger.error('Error in EmergencyFundService.getEmergencyFund:', error);
      throw error;
    }
  }

  static async updateEmergencyFund(updates: Partial<Omit<EmergencyFund, 'id'>>): Promise<void> {
    try {
      const existingFund = await EmergencyFundService.getEmergencyFund();
      
      const updatedFund: EmergencyFund = {
        ...existingFund,
        ...updates,
        lastReviewDate: new Date(),
      };

      // Recalculate status based on current vs target amount
      if (updates.currentAmount !== undefined || updates.targetAmount !== undefined) {
        updatedFund.status = EmergencyFundService.calculateStatus(
          updatedFund.currentAmount,
          updatedFund.targetAmount
        );
      }

      await db.emergencyFunds.put(updatedFund);
      Logger.info('Updated emergency fund', updates);
    } catch (error) {
      Logger.error('Error in EmergencyFundService.updateEmergencyFund:', error);
      throw error;
    }
  }

  static async calculateTargetAmount(monthlyExpenses: number): Promise<number> {
    try {
      const fund = await EmergencyFundService.getEmergencyFund();
      const targetAmount = monthlyExpenses * fund.targetMonths;
      
      await EmergencyFundService.updateEmergencyFund({ targetAmount });
      
      Logger.info('Calculated emergency fund target', { monthlyExpenses, targetAmount });
      return targetAmount;
    } catch (error) {
      Logger.error('Error in EmergencyFundService.calculateTargetAmount:', error);
      throw error;
    }
  }

  static async addToEmergencyFund(amount: number): Promise<void> {
    try {
      const fund = await EmergencyFundService.getEmergencyFund();
      const newAmount = fund.currentAmount + amount;
      
      await EmergencyFundService.updateEmergencyFund({ currentAmount: newAmount });
      Logger.info('Added to emergency fund', { amount, newTotal: newAmount });
    } catch (error) {
      Logger.error('Error in EmergencyFundService.addToEmergencyFund:', error);
      throw error;
    }
  }

  static async withdrawFromEmergencyFund(amount: number, reason: string): Promise<void> {
    try {
      const fund = await EmergencyFundService.getEmergencyFund();
      
      if (fund.currentAmount < amount) {
        throw new Error('Insufficient emergency fund balance');
      }
      
      const newAmount = fund.currentAmount - amount;
      
      await EmergencyFundService.updateEmergencyFund({ currentAmount: newAmount });
      
      // Log the withdrawal for audit purposes
      Logger.info('Withdrawal from emergency fund', { amount, reason, newTotal: newAmount });
    } catch (error) {
      Logger.error('Error in EmergencyFundService.withdrawFromEmergencyFund:', error);
      throw error;
    }
  }

  static async setTargetMonths(months: number): Promise<void> {
    try {
      if (months < 3 || months > 24) {
        throw new Error('Target months must be between 3 and 24');
      }
      
      await EmergencyFundService.updateEmergencyFund({ targetMonths: months });
      Logger.info('Updated emergency fund target months', months);
    } catch (error) {
      Logger.error('Error in EmergencyFundService.setTargetMonths:', error);
      throw error;
    }
  }

  static async getEmergencyFundStatus(): Promise<{
    fund: EmergencyFund;
    progressPercentage: number;
    medicalSubBucket: number;
    medicalSubBucketUsed: number;
    recommendedAction: string;
  }> {
    try {
      const fund = await EmergencyFundService.getEmergencyFund();
      const progressPercentage = fund.targetAmount > 0 
        ? Math.min((fund.currentAmount / fund.targetAmount) * 100, 100)
        : 0;

      let recommendedAction = '';
      if (fund.status === 'Under-Target') {
        const shortfall = fund.targetAmount - fund.currentAmount;
        recommendedAction = `Increase emergency fund by ₹${shortfall.toLocaleString('en-IN')}`;
      } else if (fund.status === 'Over-Target') {
        const excess = fund.currentAmount - fund.targetAmount;
        recommendedAction = `Consider investing excess ₹${excess.toLocaleString('en-IN')} in low-risk instruments`;
      } else {
        recommendedAction = 'Emergency fund is on target. Review monthly.';
      }

      return {
        fund,
        progressPercentage,
        medicalSubBucket: EmergencyFundService.MEDICAL_SUB_BUCKET,
        medicalSubBucketUsed: 0, // This would be tracked separately
        recommendedAction,
      };
    } catch (error) {
      Logger.error('Error in EmergencyFundService.getEmergencyFundStatus:', error);
      throw error;
    }
  }

  private static calculateStatus(currentAmount: number, targetAmount: number): 'Under-Target' | 'On-Target' | 'Over-Target' {
    if (targetAmount === 0) return 'Under-Target';
    
    const ratio = currentAmount / targetAmount;
    
    if (ratio < 0.95) return 'Under-Target';
    if (ratio > 1.1) return 'Over-Target';
    return 'On-Target';
  }
}
