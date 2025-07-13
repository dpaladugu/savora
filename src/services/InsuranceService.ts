/**
 * src/services/InsuranceService.ts
 *
 * A dedicated service for handling all CRUD operations for insurance policies
 * in the Dexie database.
 */

import { db } from "@/db";
import type { DexieInsurancePolicyRecord as AppInsurance } from "@/db";

export class InsuranceService {

  /**
   * Adds a new insurance policy record to the database.
   * @param policyData The policy data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added policy.
   */
  static async addPolicy(policyData: Omit<AppInsurance, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppInsurance = {
        ...policyData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.insurancePolicies.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in InsuranceService.addPolicy:", error);
      throw error;
    }
  }

  /**
   * Updates an existing insurance policy record.
   * @param id The id of the policy to update.
   * @param updates A partial object of the policy data to update.
   * @returns The number of updated records.
   */
  static async updatePolicy(id: string, updates: Partial<AppInsurance>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.insurancePolicies.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in InsuranceService.updatePolicy for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an insurance policy record from the database.
   * @param id The id of the policy to delete.
   */
  static async deletePolicy(id: string): Promise<void> {
    try {
      await db.insurancePolicies.delete(id);
    } catch (error) {
      console.error(`Error in InsuranceService.deletePolicy for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all insurance policies for a given user.
   * @param userId The ID of the user whose policies to fetch.
   * @returns A promise that resolves to an array of insurance policies.
   */
  static async getPolicies(userId: string): Promise<AppInsurance[]> {
    try {
      if (!userId) return [];
      const policies = await db.insurancePolicies.where('user_id').equals(userId).sortBy('policyName');
      return policies;
    } catch (error) {
      console.error(`Error in InsuranceService.getPolicies for user ${userId}:`, error);
      throw error;
    }
  }
}
