/**
 * src/services/ExpenseService.ts
 *
 * A dedicated service for handling all CRUD (Create, Read, Update, Delete)
 * operations for expenses in the Dexie database. This abstracts the direct
 * database interaction logic from the UI components.
 */

import { db } from "@/db";
import type { Expense as AppExpense } from '@/services/supabase-data-service'; // Aligning with the type used in db.ts

export class ExpenseService {

  /**
   * Adds a new expense record to the database.
   * @param expenseData The expense data to add. Note: The 'id' and 'user_id' should be set before calling this.
   * @returns The id of the newly added expense.
   */
  static async addExpense(expenseData: AppExpense): Promise<string> {
    try {
      const id = await db.expenses.add(expenseData);
      return id;
    } catch (error) {
      console.error("Error in ExpenseService.addExpense:", error);
      throw error; // Re-throw to be handled by the calling component
    }
  }

  /**
   * Updates an existing expense record in the database.
   * @param id The id of the expense to update.
   * @param updates A partial object of the expense data to update.
   * @returns The number of updated records (should be 1).
   */
  static async updateExpense(id: string, updates: Partial<AppExpense>): Promise<number> {
    try {
      // It's good practice to add an 'updated_at' timestamp
      const updateData = { ...updates, updated_at: new Date().toISOString() };
      const updatedCount = await db.expenses.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in ExpenseService.updateExpense for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk adds an array of expense records to the database.
   * @param expensesData An array of expense data to add.
   * @returns A promise that resolves when the operation is complete.
   */
  static async bulkAddExpenses(expensesData: AppExpense[]): Promise<void> {
    try {
      await db.expenses.bulkAdd(expensesData);
    } catch (error) {
      console.error("Error in ExpenseService.bulkAddExpenses:", error);
      throw error;
    }
  }

  /**
   * Bulk adds an array of expense records to the database.
   * @param expensesData An array of expense data to add.
   * @returns A promise that resolves when the operation is complete.
   */
  static async bulkAddExpenses(expensesData: AppExpense[]): Promise<void> {
    try {
      await db.expenses.bulkAdd(expensesData);
      console.log(`Bulk added ${expensesData.length} expenses.`);
    } catch (error) {
      console.error("Error in ExpenseService.bulkAddExpenses:", error);
      throw error;
    }
  }

  /**
   * Deletes an expense record from the database.
   * @param id The id of the expense to delete.
   */
  static async deleteExpense(id: string): Promise<void> {
    try {
      await db.expenses.delete(id);
    } catch (error) {
      console.error(`Error in ExpenseService.deleteExpense for id ${id}:`, error);
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
      console.log(`Bulk added ${investmentsData.length} investments.`);
    } catch (error) {
      console.error("Error in InvestmentService.bulkAddInvestments:", error);
      throw error;
    }
  }

  /**
   * Retrieves all expenses for a given user.
   * In a real app, this might include pagination, filtering, and sorting options.
   * @param userId The ID of the user whose expenses to fetch.
   * @returns A promise that resolves to an array of expenses.
   */
  static async getExpenses(userId: string): Promise<AppExpense[]> {
    try {
      if (!userId) {
        console.warn("getExpenses called without a userId.");
        return [];
      }
      const expenses = await db.expenses.where('user_id').equals(userId).toArray();
      return expenses;
    } catch (error) {
      console.error(`Error in ExpenseService.getExpenses for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single expense by its ID.
   * @param id The ID of the expense to fetch.
   * @returns A promise that resolves to the expense record or undefined if not found.
   */
  static async getExpenseById(id: string): Promise<AppExpense | undefined> {
    try {
      const expense = await db.expenses.get(id);
      return expense;
    } catch (error)      {
      console.error(`Error in ExpenseService.getExpenseById for id ${id}:`, error);
      throw error;
    }
  }
}
