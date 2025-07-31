
import { db } from '@/lib/db';
import { Logger } from './logger';

export interface DataIntegrityReport {
  totalRecords: number;
  corruptedRecords: string[];
  missingRequiredFields: string[];
  orphanedRecords: string[];
  inconsistentDates: string[];
  duplicateRecords: string[];
}

export class DataIntegrityService {
  /**
   * Performs a comprehensive data integrity check across all tables
   */
  static async performIntegrityCheck(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      totalRecords: 0,
      corruptedRecords: [],
      missingRequiredFields: [],
      orphanedRecords: [],
      inconsistentDates: [],
      duplicateRecords: [],
    };

    try {
      // Check transactions
      await this.checkTransactions(report);
      
      // Check goals
      await this.checkGoals(report);
      
      // Check investments
      await this.checkInvestments(report);
      
      // Check rental properties and tenants
      await this.checkRentalData(report);

      Logger.info('Data integrity check completed', report);
      return report;
    } catch (error) {
      Logger.error('Error during data integrity check', error);
      throw error;
    }
  }

  private static async checkTransactions(report: DataIntegrityReport): Promise<void> {
    const transactions = await db.txns.toArray();
    report.totalRecords += transactions.length;

    for (const txn of transactions) {
      // Check required fields
      if (!txn.id || !txn.date || txn.amount === undefined || !txn.currency || !txn.category) {
        report.missingRequiredFields.push(`Transaction ${txn.id}: Missing required fields`);
      }

      // Check date validity
      if (txn.date && (isNaN(txn.date.getTime()) || txn.date > new Date())) {
        report.inconsistentDates.push(`Transaction ${txn.id}: Invalid date ${txn.date}`);
      }

      // Check array fields
      if (!Array.isArray(txn.paymentMix)) {
        report.corruptedRecords.push(`Transaction ${txn.id}: Invalid paymentMix format`);
      }

      if (!Array.isArray(txn.splitWith)) {
        report.corruptedRecords.push(`Transaction ${txn.id}: Invalid splitWith format`);
      }

      if (!Array.isArray(txn.tags)) {
        report.corruptedRecords.push(`Transaction ${txn.id}: Invalid tags format`);
      }
    }

    // Check for duplicate transactions (same date, amount, category)
    const seen = new Map<string, string>();
    for (const txn of transactions) {
      const key = `${txn.date.toDateString()}-${txn.amount}-${txn.category}`;
      if (seen.has(key)) {
        report.duplicateRecords.push(`Duplicate transactions: ${seen.get(key)} and ${txn.id}`);
      } else {
        seen.set(key, txn.id);
      }
    }
  }

  private static async checkGoals(report: DataIntegrityReport): Promise<void> {
    const goals = await db.goals.toArray();
    report.totalRecords += goals.length;

    for (const goal of goals) {
      // Check required fields
      if (!goal.id || !goal.name || !goal.type || goal.targetAmount === undefined) {
        report.missingRequiredFields.push(`Goal ${goal.id}: Missing required fields`);
      }

      // Check target date is in future
      if (goal.targetDate && goal.targetDate < new Date()) {
        report.inconsistentDates.push(`Goal ${goal.id}: Target date in past`);
      }

      // Check amounts are positive
      if (goal.targetAmount < 0 || goal.currentAmount < 0) {
        report.corruptedRecords.push(`Goal ${goal.id}: Negative amounts not allowed`);
      }

      // Check current amount doesn't exceed target unreasonably
      if (goal.currentAmount > goal.targetAmount * 1.1) {
        report.inconsistentDates.push(`Goal ${goal.id}: Current amount significantly exceeds target`);
      }
    }
  }

  private static async checkInvestments(report: DataIntegrityReport): Promise<void> {
    const investments = await db.investments.toArray();
    report.totalRecords += investments.length;

    for (const investment of investments) {
      // Check required fields
      if (!investment.id || !investment.name || !investment.type || investment.investedValue === undefined) {
        report.missingRequiredFields.push(`Investment ${investment.id}: Missing required fields`);
      }

      // Check dates
      if (investment.startDate && isNaN(investment.startDate.getTime())) {
        report.inconsistentDates.push(`Investment ${investment.id}: Invalid start date`);
      }

      if (investment.maturityDate && investment.maturityDate < investment.startDate) {
        report.inconsistentDates.push(`Investment ${investment.id}: Maturity date before start date`);
      }

      // Check amounts
      if (investment.investedValue < 0 || (investment.currentValue && investment.currentValue < 0)) {
        report.corruptedRecords.push(`Investment ${investment.id}: Negative values not allowed`);
      }

      // Check orphaned goal references
      if (investment.goalId) {
        const goalExists = await db.goals.get(investment.goalId);
        if (!goalExists) {
          report.orphanedRecords.push(`Investment ${investment.id}: References non-existent goal ${investment.goalId}`);
        }
      }
    }
  }

  private static async checkRentalData(report: DataIntegrityReport): Promise<void> {
    const properties = await db.rentalProperties.toArray();
    const tenants = await db.tenants.toArray();
    
    report.totalRecords += properties.length + tenants.length;

    // Check properties
    for (const property of properties) {
      if (!property.id || !property.address || !property.owner) {
        report.missingRequiredFields.push(`Property ${property.id}: Missing required fields`);
      }

      if (property.monthlyRent < 0) {
        report.corruptedRecords.push(`Property ${property.id}: Negative rent not allowed`);
      }
    }

    // Check tenants and their property references
    for (const tenant of tenants) {
      if (!tenant.id || !tenant.propertyId || !tenant.tenantName) {
        report.missingRequiredFields.push(`Tenant ${tenant.id}: Missing required fields`);
      }

      // Check if referenced property exists
      const propertyExists = await db.rentalProperties.get(tenant.propertyId);
      if (!propertyExists) {
        report.orphanedRecords.push(`Tenant ${tenant.id}: References non-existent property ${tenant.propertyId}`);
      }

      // Check date consistency
      if (tenant.endDate && tenant.joinDate && tenant.endDate < tenant.joinDate) {
        report.inconsistentDates.push(`Tenant ${tenant.id}: End date before join date`);
      }
    }
  }

  /**
   * Attempts to fix common data integrity issues
   */
  static async performAutoFix(): Promise<{ fixed: number; errors: string[] }> {
    const results = { fixed: 0, errors: [] };

    try {
      // Fix missing required array fields in transactions
      const transactions = await db.txns.toArray();
      for (const txn of transactions) {
        const updates: Partial<typeof txn> = {};
        let needsUpdate = false;

        if (!Array.isArray(txn.paymentMix)) {
          updates.paymentMix = [];
          needsUpdate = true;
        }

        if (!Array.isArray(txn.splitWith)) {
          updates.splitWith = [];
          needsUpdate = true;
        }

        if (!Array.isArray(txn.tags)) {
          updates.tags = [];
          needsUpdate = true;
        }

        if (typeof txn.isPartialRent !== 'boolean') {
          updates.isPartialRent = false;
          needsUpdate = true;
        }

        if (typeof txn.isSplit !== 'boolean') {
          updates.isSplit = false;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await db.txns.update(txn.id, updates);
          results.fixed++;
        }
      }

      // Remove orphaned investment-goal references
      const investments = await db.investments.toArray();
      for (const investment of investments) {
        if (investment.goalId) {
          const goalExists = await db.goals.get(investment.goalId);
          if (!goalExists) {
            await db.investments.update(investment.id, { goalId: undefined });
            results.fixed++;
          }
        }
      }

      Logger.info('Auto-fix completed', results);
      return results;
    } catch (error) {
      Logger.error('Error during auto-fix', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }
}
