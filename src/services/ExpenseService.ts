
import { db } from "@/db";
import type { Expense as AppExpense } from '@/db';

export class ExpenseService {

  static async addExpense(expenseData: Omit<AppExpense, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppExpense = {
        ...expenseData,
        id: newId,
      };
      await db.expenses.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in ExpenseService.addExpense:", error);
      throw error;
    }
  }

  static async updateExpense(id: string, updates: Partial<AppExpense>): Promise<number> {
    try {
      const updatedCount = await db.expenses.update(id, updates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in ExpenseService.updateExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async bulkAddExpenses(expensesData: AppExpense[]): Promise<void> {
    try {
      await db.expenses.bulkAdd(expensesData);
      console.log(`Bulk added ${expensesData.length} expenses.`);
    } catch (error) {
      console.error("Error in ExpenseService.bulkAddExpenses:", error);
      throw error;
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      await db.expenses.delete(id);
    } catch (error) {
      console.error(`Error in ExpenseService.deleteExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async getExpenses(): Promise<AppExpense[]> {
    try {
      const expenses = await db.expenses.toArray();
      return expenses;
    } catch (error) {
      console.error(`Error in ExpenseService.getExpenses:`, error);
      throw error;
    }
  }

  static async getExpenseById(id: string): Promise<AppExpense | undefined> {
    try {
      const expense = await db.expenses.get(id);
      return expense;
    } catch (error) {
      console.error(`Error in ExpenseService.getExpenseById for id ${id}:`, error);
      throw error;
    }
  }
}
