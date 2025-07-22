
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
        id: newId,
        user_id: transactionData.user_id,
        amount: transactionData.amount,  
        description: transactionData.description,
        category: transactionData.category,
        frequency: transactionData.frequency,
        interval: transactionData.interval,
        start_date: transactionData.start_date,
        end_date: transactionData.end_date,
        day_of_week: transactionData.day_of_week,
        day_of_month: transactionData.day_of_month,
        next_occurrence_date: transactionData.next_date,
        is_active: transactionData.is_active,
        type: transactionData.type,
        payment_method: transactionData.payment_method,
        account: transactionData.account,
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
        updated_at: new Date(),
      };
      
      // Handle each field individually to avoid type conflicts
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.interval !== undefined) dbUpdates.interval = updates.interval;
      if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
      if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date;
      if (updates.day_of_week !== undefined) dbUpdates.day_of_week = updates.day_of_week;
      if (updates.day_of_month !== undefined) dbUpdates.day_of_month = updates.day_of_month;      
      if (updates.next_date !== undefined) dbUpdates.next_occurrence_date = updates.next_date;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.payment_method !== undefined) dbUpdates.payment_method = updates.payment_method;
      if (updates.account !== undefined) dbUpdates.account = updates.account;
      
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
        id: transaction.id,
        user_id: transaction.user_id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        frequency: transaction.frequency,
        interval: transaction.interval,
        start_date: transaction.start_date,
        end_date: transaction.end_date,
        day_of_week: transaction.day_of_week,
        day_of_month: transaction.day_of_month,
        next_occurrence_date: transaction.next_occurrence_date,
        next_date: transaction.next_occurrence_date || transaction.start_date,
        is_active: transaction.is_active,
        type: transaction.type,
        payment_method: transaction.payment_method,
        account: transaction.account,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
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
