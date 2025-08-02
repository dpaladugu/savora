
import { db } from "@/db";
import type { Vehicle as AppVehicle } from "@/db";

export class VehicleService {

  static async addVehicle(vehicleData: Omit<AppVehicle, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppVehicle = {
        ...vehicleData,
        id: newId,
      };
      await db.vehicles.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in VehicleService.addVehicle:", error);
      throw error;
    }
  }

  static async create(vehicleData: Omit<AppVehicle, 'id'>): Promise<string> {
    return this.addVehicle(vehicleData);
  }

  static async updateVehicle(id: string, updates: Partial<AppVehicle>): Promise<number> {
    try {
      const updatedCount = await db.vehicles.update(id, updates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in VehicleService.updateVehicle for id ${id}:`, error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<AppVehicle>): Promise<number> {
    return this.updateVehicle(id, updates);
  }

  static async deleteVehicle(id: string): Promise<void> {
    try {
      await db.vehicles.delete(id);
    } catch (error) {
      console.error(`Error in VehicleService.deleteVehicle for id ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    return this.deleteVehicle(id);
  }

  static async getVehicles(): Promise<AppVehicle[]> {
    try {
      const vehicles = await db.vehicles.toArray();
      return vehicles;
    } catch (error) {
      console.error(`Error in VehicleService.getVehicles:`, error);
      throw error;
    }
  }

  static async getAll(): Promise<AppVehicle[]> {
    return this.getVehicles();
  }

  static async getVehicleById(id: string): Promise<AppVehicle | undefined> {
    try {
      const vehicle = await db.vehicles.get(id);
      return vehicle;
    } catch (error) {
      console.error(`Error in VehicleService.getVehicleById for id ${id}:`, error);
      throw error;
    }
  }
}
