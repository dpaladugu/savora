/**
 * src/services/IncomeSourceService.ts
 *
 * A dedicated service for handling all CRUD operations for income sources
 * in the Dexie database.
 */

import { db } from "@/db";
import type { IncomeSourceData as AppIncomeSource } from "@/types/jsonPreload";

export class IncomeSourceService {

  /**
   * Adds a new income source record to the database.
   * @param sourceData The income source data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added income source.
   */
  static async addIncomeSource(sourceData: Omit<AppIncomeSource, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppIncomeSource = {
        ...sourceData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.incomeSources.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in IncomeSourceService.addIncomeSource:", error);
      throw error;
    }
  }

  /**
   * Updates an existing income source record.
   * @param id The id of the income source to update.
   * @param updates A partial object of the income source data to update.
   * @returns The number of updated records.
   */
  static async updateIncomeSource(id: string, updates: Partial<AppIncomeSource>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.incomeSources.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in IncomeSourceService.updateIncomeSource for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an income source record from the database.
   * @param id The id of the income source to delete.
   */
  static async deleteIncomeSource(id: string): Promise<void> {
    try {
      await db.incomeSources.delete(id);
    } catch (error) {
      console.error(`Error in IncomeSourceService.deleteIncomeSource for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all income sources for a given user.
   * @param userId The ID of the user whose income sources to fetch.
   * @returns A promise that resolves to an array of income sources.
   */
  static async getIncomeSources(userId: string): Promise<AppIncomeSource[]> {
    try {
      if (!userId) return [];
      const sources = await db.incomeSources.where('user_id').equals(userId).sortBy('name');
      return sources;
    } catch (error) {
      console.error(`Error in IncomeSourceService.getIncomeSources for user ${userId}:`, error);
      throw error;
    }
  }
}
