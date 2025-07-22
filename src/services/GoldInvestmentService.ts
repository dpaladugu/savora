
/**
 * src/services/GoldInvestmentService.ts
 *
 * A dedicated service for handling all CRUD operations for gold investments
 * in the Dexie database.
 */

import { db } from "@/db";
import type { DexieGoldInvestmentRecord as AppGoldInvestment } from "@/db";

export class GoldInvestmentService {

  /**
   * Adds a new gold investment record to the database.
   * @param investmentData The investment data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added record.
   */
  static async addGoldInvestment(investmentData: Omit<AppGoldInvestment, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppGoldInvestment = {
        ...investmentData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.goldInvestments.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in GoldInvestmentService.addGoldInvestment:", error);
      throw error;
    }
  }

  /**
   * Updates an existing gold investment record.
   * @param id The id of the record to update.
   * @param updates A partial object of the record data to update.
   * @returns The number of updated records.
   */
  static async updateGoldInvestment(id: string, updates: Partial<AppGoldInvestment>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.goldInvestments.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in GoldInvestmentService.updateGoldInvestment for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a gold investment record from the database.
   * @param id The id of the record to delete.
   */
  static async deleteGoldInvestment(id: string): Promise<void> {
    try {
      await db.goldInvestments.delete(id);
    } catch (error) {
      console.error(`Error in GoldInvestmentService.deleteGoldInvestment for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all gold investments for a given user.
   * @param userId The ID of the user whose records to fetch.
   * @returns A promise that resolves to an array of gold investments.
   */
  static async getGoldInvestments(userId: string): Promise<AppGoldInvestment[]> {
    try {
      if (!userId) return [];
      const investments = await db.goldInvestments.where('user_id').equals(userId).toArray();
      return investments;
    } catch (error) {
      console.error(`Error in GoldInvestmentService.getGoldInvestments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all gold investments for a given user.
   * @param userId The ID of the user whose records to fetch.
   * @returns A promise that resolves to an array of gold investments.
   */
  static async getAll(userId: string): Promise<AppGoldInvestment[]> {
    return this.getGoldInvestments(userId);
  }
}
