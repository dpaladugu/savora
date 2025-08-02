
import { db } from "@/db";
import type { Investment } from "@/db";

export class GoldInvestmentService {
  static async addGoldInvestment(investmentData: Omit<Investment, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: Investment = {
        ...investmentData,
        id: newId,
        type: 'Gold-Coin',
      };
      await db.investments.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in GoldInvestmentService.addGoldInvestment:", error);
      throw error;
    }
  }

  static async updateGoldInvestment(id: string, updates: Partial<Investment>): Promise<number> {
    try {
      const updatedCount = await db.investments.update(id, updates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in GoldInvestmentService.updateGoldInvestment for id ${id}:`, error);
      throw error;
    }
  }

  static async deleteGoldInvestment(id: string): Promise<void> {
    try {
      await db.investments.delete(id);
    } catch (error) {
      console.error(`Error in GoldInvestmentService.deleteGoldInvestment for id ${id}:`, error);
      throw error;
    }
  }

  static async getGoldInvestments(): Promise<Investment[]> {
    try {
      const investments = await db.investments
        .where('type')
        .anyOf(['Gold-Coin', 'Gold-ETF', 'SGB'])
        .toArray();
      return investments;
    } catch (error) {
      console.error(`Error in GoldInvestmentService.getGoldInvestments:`, error);
      throw error;
    }
  }

  static async getAll(): Promise<Investment[]> {
    return this.getGoldInvestments();
  }
}
