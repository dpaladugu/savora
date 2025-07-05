import { db, Expense, YearlySummary } from '@/db';
import { Logger } from './logger';

// Note: This service handles data retention for cleaned up version
// MaintenanceRecord and FuelRecord are not part of the current schema

/**
 * Data Retention Service
 * Manages automatic cleanup of old data based on retention policies
 */

interface RetentionPolicy {
  table: string;
  retentionMonths: number;
  enabled: boolean;
}

export class DataRetentionService {
  private static policies: RetentionPolicy[] = [
    { table: 'expenses', retentionMonths: 36, enabled: true }, // Keep 3 years of expenses
    { table: 'yearlySummaries', retentionMonths: 60, enabled: true }, // Keep 5 years of summaries
  ];

  /**
   * Execute all enabled retention policies
   */
  static async executeRetentionPolicies(): Promise<void> {
    Logger.info('Starting data retention process...');
    
    for (const policy of this.policies) {
      if (policy.enabled) {
        try {
          await this.executePolicy(policy);
        } catch (error) {
          Logger.error(`Failed to execute retention policy for ${policy.table}:`, error);
        }
      }
    }
    
    Logger.info('Data retention process completed.');
  }

  /**
   * Execute a specific retention policy
   */
  private static async executePolicy(policy: RetentionPolicy): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - policy.retentionMonths);
    
    Logger.info(`Executing retention policy for ${policy.table} (keeping ${policy.retentionMonths} months)`);
    
    try {
      let deletedCount = 0;
      
      switch (policy.table) {
        case 'expenses':
          deletedCount = await this.cleanupExpenses(cutoffDate);
          break;
        case 'yearlySummaries':
          deletedCount = await this.cleanupYearlySummaries(cutoffDate);
          break;
        default:
          Logger.warn(`Unknown table in retention policy: ${policy.table}`);
          return;
      }
      
      Logger.info(`Retention policy for ${policy.table}: removed ${deletedCount} records`);
    } catch (error) {
      Logger.error(`Error executing retention policy for ${policy.table}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old expense records
   */
  private static async cleanupExpenses(cutoffDate: Date): Promise<number> {
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const oldExpenses = await db.expenses
      .where('date')
      .below(cutoffDateString)
      .toArray();
    
    if (oldExpenses.length > 0) {
      await db.expenses
        .where('date')
        .below(cutoffDateString)
        .delete();
    }
    
    return oldExpenses.length;
  }

  /**
   * Clean up old yearly summary records
   */
  private static async cleanupYearlySummaries(cutoffDate: Date): Promise<number> {
    const cutoffYear = cutoffDate.getFullYear();
    
    const oldSummaries = await db.yearlySummaries
      .where('year')
      .below(cutoffYear)
      .toArray();
    
    if (oldSummaries.length > 0) {
      await db.yearlySummaries
        .where('year')
        .below(cutoffYear)
        .delete();
    }
    
    return oldSummaries.length;
  }

  /**
   * Get retention policy for a specific table
   */
  static getPolicy(tableName: string): RetentionPolicy | undefined {
    return this.policies.find(policy => policy.table === tableName);
  }

  /**
   * Update retention policy for a table
   */
  static updatePolicy(tableName: string, retentionMonths: number, enabled: boolean): void {
    const policyIndex = this.policies.findIndex(policy => policy.table === tableName);
    
    if (policyIndex !== -1) {
      this.policies[policyIndex] = { table: tableName, retentionMonths, enabled };
    } else {
      this.policies.push({ table: tableName, retentionMonths, enabled });
    }
    
    Logger.info(`Updated retention policy for ${tableName}: ${retentionMonths} months, enabled: ${enabled}`);
  }

  /**
   * Get statistics about data that would be affected by retention policies
   */
  static async getRetentionStats(): Promise<{[table: string]: {totalRecords: number, eligibleForDeletion: number}}> {
    const stats: {[table: string]: {totalRecords: number, eligibleForDeletion: number}} = {};
    
    for (const policy of this.policies) {
      if (!policy.enabled) continue;
      
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - policy.retentionMonths);
      
      try {
        let totalRecords = 0;
        let eligibleForDeletion = 0;
        
        switch (policy.table) {
          case 'expenses':
            totalRecords = await db.expenses.count();
            eligibleForDeletion = await db.expenses
              .where('date')
              .below(cutoffDate.toISOString().split('T')[0])
              .count();
            break;
          case 'yearlySummaries':
            totalRecords = await db.yearlySummaries.count();
            eligibleForDeletion = await db.yearlySummaries
              .where('year')
              .below(cutoffDate.getFullYear())
              .count();
            break;
        }
        
        stats[policy.table] = { totalRecords, eligibleForDeletion };
      } catch (error) {
        Logger.error(`Error getting retention stats for ${policy.table}:`, error);
        stats[policy.table] = { totalRecords: 0, eligibleForDeletion: 0 };
      }
    }
    
    return stats;
  }
}