
import { db } from "@/db";
import type { Income as AppIncome } from "@/db";

export class IncomeService {

  static async addIncome(incomeData: Omit<AppIncome, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppIncome = {
        ...incomeData,
        id: newId,
      };
      await db.incomes.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in IncomeService.addIncome:", error);
      throw error;
    }
  }

  static async updateIncome(id: string, updates: Partial<AppIncome>): Promise<number> {
    try {
      const updatedCount = await db.incomes.update(id, updates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in IncomeService.updateIncome for id ${id}:`, error);
      throw error;
    }
  }

  static async deleteIncome(id: string): Promise<void> {
    try {
      await db.incomes.delete(id);
    } catch (error) {
      console.error(`Error in IncomeService.deleteIncome for id ${id}:`, error);
      throw error;
    }
  }

  static async getIncomes(): Promise<AppIncome[]> {
    try {
      const incomes = await db.incomes.toArray();
      return incomes;
    } catch (error) {
      console.error(`Error in IncomeService.getIncomes:`, error);
      throw error;
    }
  }
}
