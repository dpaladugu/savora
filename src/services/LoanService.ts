/**
 * src/services/LoanService.ts
 *
 * A dedicated service for handling all CRUD operations for loans/EMIs
 * in the Dexie database.
 */

import { db } from "@/db";
import type { DexieLoanEMIRecord as AppLoan } from "@/db";

export class LoanService {

  /**
   * Adds a new loan record to the database.
   * @param loanData The loan data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added loan.
   */
  static async addLoan(loanData: Omit<AppLoan, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppLoan = {
        ...loanData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.loans.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in LoanService.addLoan:", error);
      throw error;
    }
  }

  /**
   * Updates an existing loan record.
   * @param id The id of the loan to update.
   * @param updates A partial object of the loan data to update.
   * @returns The number of updated records.
   */
  static async updateLoan(id: string, updates: Partial<AppLoan>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.loans.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in LoanService.updateLoan for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a loan record from the database.
   * @param id The id of the loan to delete.
   */
  static async deleteLoan(id: string): Promise<void> {
    try {
      await db.loans.delete(id);
    } catch (error) {
      console.error(`Error in LoanService.deleteLoan for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all loans for a given user.
   * @param userId The ID of the user whose loans to fetch.
   * @returns A promise that resolves to an array of loans.
   */
  static async getLoans(userId: string): Promise<AppLoan[]> {
    try {
      if (!userId) return [];
      const loans = await db.loans.where('user_id').equals(userId).sortBy('loanType');
      return loans;
    } catch (error) {
      console.error(`Error in LoanService.getLoans for user ${userId}:`, error);
      throw error;
    }
  }
}
