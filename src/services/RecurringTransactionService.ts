
/**
 * src/services/RecurringTransactionService.ts
 *
 * A service for handling recurring transaction operations. Currently provides stub implementations
 * since the recurringTransactions table is not available in the current schema.
 */

import { db } from "@/db";
import type { RecurringTransactionRecord } from "@/types/recurring-transaction";

export class RecurringTransactionService {

  static async addRecurringTransaction(): Promise<string> {
    console.warn('Recurring transaction service not yet implemented - recurringTransactions table not available in current schema');
    throw new Error('Recurring transaction functionality not yet implemented');
  }

  static async updateRecurringTransaction(): Promise<number> {
    console.warn('Recurring transaction service not yet implemented - recurringTransactions table not available in current schema');
    return 0;
  }

  static async deleteRecurringTransaction(): Promise<void> {
    console.warn('Recurring transaction service not yet implemented - recurringTransactions table not available in current schema');
  }

  static async getRecurringTransactions(): Promise<any[]> {
    console.warn('Recurring transaction service not yet implemented - recurringTransactions table not available in current schema');
    return [];
  }

  static async processRecurringTransactions(): Promise<void> {
    console.warn('Recurring transaction processing not yet implemented');
  }

  // Add the missing methods that components are trying to call
  static async getAll(userId: string): Promise<RecurringTransactionRecord[]> {
    console.warn('getAll method not yet implemented - recurringTransactions table not available in current schema');
    return [];
  }

  static async create(data: Omit<RecurringTransactionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    console.warn('create method not yet implemented - recurringTransactions table not available in current schema');
    throw new Error('Recurring transaction functionality not yet implemented');
  }

  static async update(id: string, updates: Partial<RecurringTransactionRecord>): Promise<void> {
    console.warn('update method not yet implemented - recurringTransactions table not available in current schema');
    throw new Error('Recurring transaction functionality not yet implemented');
  }

  static async delete(id: string): Promise<void> {
    console.warn('delete method not yet implemented - recurringTransactions table not available in current schema');
    throw new Error('Recurring transaction functionality not yet implemented');
  }
}
