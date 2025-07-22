
/**
 * src/services/RecurringTransactionService.ts
 *
 * A dedicated service for handling all CRUD operations for recurring transactions
 * in the Dexie database.
 */

import { db } from "@/db";
import type { RecurringTransactionRecord as DbRecurringTransaction } from "@/db";
import type { RecurringTransactionRecord as AppRecurringTransaction } from "@/types/recurring-transaction";

export class RecurringTransactionService {

  /**
   * Adds a new recurring transaction record to the database.
   * @param transactionData The transaction data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added record.
   */
  static async addRecurringTransaction(transactionData: Omit<AppRecurringTransaction, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      
      // Convert AppRecurringTransaction to DbRecurringTransaction format
      const recordToAdd: DbRecurringTransaction = {
        ...transactionData,
        id: newId,
        frequency: transactionData.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
        next_occurrence_date: transactionData.next_date,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await db.recurringTransactions.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in RecurringTransactionService.addRecurringTransaction:", error);
      throw error;
    }
  }

  /**
   * Creates a new recurring transaction record to the database.
   * @param transactionData The transaction data to add.
   * @returns The id of the newly added record.
   */
  static async create(transactionData: Omit<AppRecurringTransaction, 'id'>): Promise<string> {
    return this.addRecurringTransaction(transactionData);
  }

  /**
   * Updates an existing recurring transaction record.
   * @param id The id of the record to update.
   * @param updates A partial object of the record data to update.
   * @returns The number of updated records.
   */
  static async updateRecurringTransaction(id: string, updates: Partial<AppRecurringTransaction>): Promise<number> {
    try {
      // Convert AppRecurringTransaction updates to DbRecurringTransaction format
      const dbUpdates: Partial<DbRecurringTransaction> = {
        ...updates,
        updated_at: new Date(),
        next_occurrence_date: updates.next_date,
        frequency: updates.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined,
      };
      
      const updatedCount = await db.recurringTransactions.update(id, dbUpdates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in RecurringTransactionService.updateRecurringTransaction for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing recurring transaction record.
   * @param id The id of the record to update.
   * @param updates A partial object of the record data to update.
   * @returns The number of updated records.
   */
  static async update(id: string, updates: Partial<AppRecurringTransaction>): Promise<number> {
    return this.updateRecurringTransaction(id, updates);
  }

  /**
   * Deletes a recurring transaction record from the database.
   * @param id The id of the record to delete.
   */
  static async deleteRecurringTransaction(id: string): Promise<void> {
    try {
      await db.recurringTransactions.delete(id);
    } catch (error) {
      console.error(`Error in RecurringTransactionService.deleteRecurringTransaction for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a recurring transaction record from the database.
   * @param id The id of the record to delete.
   */
  static async delete(id: string): Promise<void> {
    return this.deleteRecurringTransaction(id);
  }

  /**
   * Retrieves all recurring transactions for a given user.
   * @param userId The ID of the user whose records to fetch.
   * @returns A promise that resolves to an array of recurring transactions.
   */
  static async getRecurringTransactions(userId: string): Promise<AppRecurringTransaction[]> {
    try {
      if (!userId) return [];
      const transactions = await db.recurringTransactions.where('user_id').equals(userId).sortBy('next_occurrence_date');
      
      // Convert DbRecurringTransaction to AppRecurringTransaction format
      return transactions.map(transaction => ({
        ...transaction,
        next_date: transaction.next_occurrence_date || transaction.start_date,
      }));
    } catch (error) {
      console.error(`Error in RecurringTransactionService.getRecurringTransactions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all recurring transactions for a given user.
   * @param userId The ID of the user whose records to fetch.
   * @returns A promise that resolves to an array of recurring transactions.
   */
  static async getAll(userId: string): Promise<AppRecurringTransaction[]> {
    return this.getRecurringTransactions(userId);
  }
}
