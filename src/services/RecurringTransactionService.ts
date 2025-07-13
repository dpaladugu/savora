/**
 * src/services/RecurringTransactionService.ts
 *
 * A dedicated service for handling all CRUD operations for recurring transactions
 * in the Dexie database.
 */

import { db } from "@/db";
import type { RecurringTransactionRecord as AppRecurringTransaction } from "@/db";

export class RecurringTransactionService {

  /**
   * Adds a new recurring transaction record to the database.
   * @param transactionData The transaction data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added record.
   */
  static async addRecurringTransaction(transactionData: Omit<AppRecurringTransaction, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppRecurringTransaction = {
        ...transactionData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.recurringTransactions.add(recordToAdd);
      console.log(`Recurring transaction added with id: ${newId}`);
      return newId;
    } catch (error) {
      console.error("Error in RecurringTransactionService.addRecurringTransaction:", error);
      throw error;
    }
  }

  /**
   * Updates an existing recurring transaction record.
   * @param id The id of the record to update.
   * @param updates A partial object of the record data to update.
   * @returns The number of updated records.
   */
  static async updateRecurringTransaction(id: string, updates: Partial<AppRecurringTransaction>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.recurringTransactions.update(id, updateData);
      console.log(`Updated ${updatedCount} recurring transaction(s).`);
      return updatedCount;
    } catch (error) {
      console.error(`Error in RecurringTransactionService.updateRecurringTransaction for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a recurring transaction record from the database.
   * @param id The id of the record to delete.
   */
  static async deleteRecurringTransaction(id: string): Promise<void> {
    try {
      await db.recurringTransactions.delete(id);
      console.log(`Recurring transaction with id: ${id} deleted.`);
    } catch (error) {
      console.error(`Error in RecurringTransactionService.deleteRecurringTransaction for id ${id}:`, error);
      throw error;
    }
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
      return transactions;
    } catch (error) {
      console.error(`Error in RecurringTransactionService.getRecurringTransactions for user ${userId}:`, error);
      throw error;
    }
  }
}
