/**
 * src/services/IncomeService.ts
 *
 * A dedicated service for handling all CRUD operations for income transactions
 * in the Dexie database.
 */

import { db } from "@/db";
import type { AppIncome } from "@/components/income/income-tracker";

export class IncomeService {

  /**
   * Adds a new income record to the database.
   * @param incomeData The income data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added income record.
   */
  static async addIncome(incomeData: Omit<AppIncome, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppIncome = {
        ...incomeData,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await db.incomes.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in IncomeService.addIncome:", error);
      throw error;
    }
  }

  /**
   * Updates an existing income record.
   * @param id The id of the income record to update.
   * @param updates A partial object of the income data to update.
   * @returns The number of updated records.
   */
  static async updateIncome(id: string, updates: Partial<AppIncome>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date().toISOString() };
      const updatedCount = await db.incomes.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in IncomeService.updateIncome for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an income record from the database.
   * @param id The id of the income record to delete.
   */
  static async deleteIncome(id: string): Promise<void> {
    try {
      await db.incomes.delete(id);
    } catch (error) {
      console.error(`Error in IncomeService.deleteIncome for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all income records for a given user.
   * @param userId The ID of the user whose income to fetch.
   * @returns A promise that resolves to an array of income records.
   */
  static async getIncomes(userId: string): Promise<AppIncome[]> {
    try {
      if (!userId) return [];
      const incomes = await db.incomes.where('user_id').equals(userId).toArray();
      return incomes;
    } catch (error) {
      console.error(`Error in IncomeService.getIncomes for user ${userId}:`, error);
      throw error;
    }
  }
}
