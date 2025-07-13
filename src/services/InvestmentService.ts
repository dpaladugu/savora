/**
 * src/services/InvestmentService.ts
 *
 * A dedicated service for handling all CRUD operations for general investments
 * (MF, Stocks, etc.) in the Dexie database.
 */

import { db } from "@/db";
import type { InvestmentData as AppInvestment } from "@/types/jsonPreload";

export class InvestmentService {

  /**
   * Adds a new investment record to the database.
   * @param investmentData The investment data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added investment.
   */
  static async addInvestment(investmentData: Omit<AppInvestment, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppInvestment = {
        ...investmentData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.investments.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in InvestmentService.addInvestment:", error);
      throw error;
    }
  }

  /**
   * Bulk adds an array of investment records to the database.
   * @param investmentsData An array of investment data to add.
   * @returns A promise that resolves when the operation is complete.
   */
  static async bulkAddInvestments(investmentsData: AppInvestment[]): Promise<void> {
    try {
      await db.investments.bulkAdd(investmentsData);
    } catch (error) {
      console.error("Error in InvestmentService.bulkAddInvestments:", error);
      throw error;
    }
  }

  /**
   * Updates an existing investment record.
   * @param id The id of the investment to update.
   * @param updates A partial object of the investment data to update.
   * @returns The number of updated records.
   */
  static async updateInvestment(id: string, updates: Partial<AppInvestment>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.investments.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in InvestmentService.updateInvestment for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an investment record from the database.
   * @param id The id of the investment to delete.
   */
  static async deleteInvestment(id: string): Promise<void> {
    try {
      await db.investments.delete(id);
    } catch (error) {
      console.error(`Error in InvestmentService.deleteInvestment for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all investments for a given user.
   * @param userId The ID of the user whose investments to fetch.
   * @returns A promise that resolves to an array of investments.
   */
  static async getInvestments(userId: string): Promise<AppInvestment[]> {
    try {
      if (!userId) return [];
      const investments = await db.investments.where('user_id').equals(userId).toArray();
      return investments;
    } catch (error) {
      console.error(`Error in InvestmentService.getInvestments for user ${userId}:`, error);
      throw error;
    }
  }
}
