/**
 * src/services/VehicleService.ts
 *
 * A dedicated service for handling all CRUD (Create, Read, Update, Delete)
 * operations for vehicles in the Dexie database. This abstracts the direct
 * database interaction logic from the UI components.
 */

import { db } from "@/db";
import type { Vehicle as AppVehicle } from "@/db"; // Aligning with the type used in db.ts

export class VehicleService {

  /**
   * Adds a new vehicle record to the database.
   * @param vehicleData The vehicle data to add. Note: 'id' should be omitted, user_id should be set.
   * @returns The id of the newly added vehicle.
   */
  static async addVehicle(vehicleData: Omit<AppVehicle, 'id'>): Promise<string> {
    try {
      // Dexie's add() returns the key of the added item.
      // We need to provide the full object, and Dexie handles the ID if it's auto-incrementing.
      // Since our ID is a UUID string, we should generate it here before adding.
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppVehicle = {
        ...vehicleData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.vehicles.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in VehicleService.addVehicle:", error);
      throw error;
    }
  }

  /**
   * Updates an existing vehicle record in the database.
   * @param id The id of the vehicle to update.
   * @param updates A partial object of the vehicle data to update.
   * @returns The number of updated records (should be 1).
   */
  static async updateVehicle(id: string, updates: Partial<AppVehicle>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.vehicles.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in VehicleService.updateVehicle for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a vehicle record from the database.
   * @param id The id of the vehicle to delete.
   */
  static async deleteVehicle(id: string): Promise<void> {
    try {
      await db.vehicles.delete(id);
    } catch (error) {
      console.error(`Error in VehicleService.deleteVehicle for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all vehicles for a given user.
   * @param userId The ID of the user whose vehicles to fetch.
   * @returns A promise that resolves to an array of vehicles.
   */
  static async getVehicles(userId: string): Promise<AppVehicle[]> {
    try {
      if (!userId) {
        console.warn("getVehicles called without a userId.");
        return [];
      }
      // The useLiveQuery hook in the component will handle ordering.
      // This service method just provides the core query.
      const vehicles = await db.vehicles.where('user_id').equals(userId).toArray();
      return vehicles;
    } catch (error) {
      console.error(`Error in VehicleService.getVehicles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single vehicle by its ID.
   * @param id The ID of the vehicle to fetch.
   * @returns A promise that resolves to the vehicle record or undefined if not found.
   */
  static async getVehicleById(id: string): Promise<AppVehicle | undefined> {
    try {
      const vehicle = await db.vehicles.get(id);
      return vehicle;
    } catch (error)      {
      console.error(`Error in VehicleService.getVehicleById for id ${id}:`, error);
      throw error;
    }
  }
}
