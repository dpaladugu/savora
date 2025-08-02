
/**
 * src/services/InsuranceService.ts
 *
 * A dedicated service for handling all CRUD operations for insurance policies
 * in the Dexie database.
 */

import { db, Insurance } from "@/db";

export class InsuranceService {

  /**
   * Adds a new insurance policy record to the database.
   * @param policyData The policy data to add. 'id' should be omitted.
   * @returns The id of the newly added policy.
   */
  static async addPolicy(policyData: Omit<Insurance, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: Insurance = {
        ...policyData,
        id: newId,
      };
      await db.insurance.add(recordToAdd);
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
  static async updatePolicy(id: string, updates: Partial<Insurance>): Promise<number> {
    try {
      const updatedCount = await db.insurance.update(id, updates);
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
      await db.insurance.delete(id);
    } catch (error) {
      console.error(`Error in InsuranceService.deletePolicy for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all insurance policies.
   * @returns A promise that resolves to an array of insurance policies.
   */
  static async getPolicies(): Promise<Insurance[]> {
    try {
      const policies = await db.insurance.orderBy('provider').toArray();
      return policies;
    } catch (error) {
      console.error(`Error in InsuranceService.getPolicies:`, error);
      throw error;
    }
  }
}
