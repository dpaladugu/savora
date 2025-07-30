
/**
 * src/services/TransactionService.ts
 *
 * A unified service for handling operations that involve the Universal Transaction model.
 */

import { db } from '@/lib/db';
import type { Txn } from '@/lib/db';

export class TransactionService {

  /**
   * Retrieves all transactions sorted by date descending.
   * @returns A promise that resolves to an array of transactions.
   */
  static async getTransactions(): Promise<Txn[]> {
    try {
      const transactions = await db.txns.toArray();

      // Sort by date, most recent first
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      return transactions;
    } catch (error) {
      console.error(`Error in TransactionService.getTransactions:`, error);
      throw error;
    }
  }

  /**
   * Adds a new transaction.
   * @param transactionData The transaction data to add.
   * @returns The id of the newly added record.
   */
  static async addTransaction(transactionData: Omit<Txn, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: Txn = {
        ...transactionData,
        id: newId,
        currency: 'INR', // Hard-coded as per requirements
        paymentMix: transactionData.paymentMix || [],
        splitWith: transactionData.splitWith || [],
        tags: transactionData.tags || [],
        isPartialRent: transactionData.isPartialRent || false,
        isSplit: transactionData.isSplit || false
      };
      await db.txns.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in TransactionService.addTransaction:", error);
      throw error;
    }
  }

  /**
   * Updates an existing transaction.
   * @param id The id of the transaction to update.
   * @param updates A partial object of the transaction data to update.
   * @returns The number of updated records.
   */
  static async updateTransaction(id: string, updates: Partial<Txn>): Promise<number> {
    try {
      const updatedCount = await db.txns.update(id, updates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in TransactionService.updateTransaction for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a transaction.
   * @param id The id of the transaction to delete.
   */
  static async deleteTransaction(id: string): Promise<void> {
    try {
      await db.txns.delete(id);
    } catch (error) {
      console.error(`Error in TransactionService.deleteTransaction for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets transactions by category.
   * @param category The category to filter by.
   * @returns A promise that resolves to an array of transactions.
   */
  static async getTransactionsByCategory(category: string): Promise<Txn[]> {
    try {
      const transactions = await db.txns.where('category').equals(category).toArray();
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error(`Error in TransactionService.getTransactionsByCategory for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Gets transactions by date range.
   * @param startDate The start date.
   * @param endDate The end date.
   * @returns A promise that resolves to an array of transactions.
   */
  static async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Txn[]> {
    try {
      const transactions = await db.txns.where('date').between(startDate, endDate, true, true).toArray();
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error(`Error in TransactionService.getTransactionsByDateRange:`, error);
      throw error;
    }
  }

  /**
   * Gets transactions by goal ID.
   * @param goalId The goal ID to filter by.
   * @returns A promise that resolves to an array of transactions.
   */
  static async getTransactionsByGoal(goalId: string): Promise<Txn[]> {
    try {
      const transactions = await db.txns.where('goalId').equals(goalId).toArray();
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error(`Error in TransactionService.getTransactionsByGoal for goal ${goalId}:`, error);
      throw error;
    }
  }
}
