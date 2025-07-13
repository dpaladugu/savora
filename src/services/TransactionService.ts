/**
 * src/services/TransactionService.ts
 *
 * A unified service for handling operations that involve multiple types of transactions,
 * like fetching a combined list of expenses and incomes.
 */

import { ExpenseService } from './ExpenseService';
import { IncomeService } from './IncomeService';
import type { Expense as AppExpense } from '@/services/supabase-data-service';
import type { AppIncome } from '@/components/income/income-tracker';
import { parseISO } from 'date-fns';

// A unified transaction type for display purposes
export type Transaction = AppExpense | AppIncome;

export class TransactionService {

  /**
   * Retrieves both expenses and incomes for a given user and returns them as a single,
   * sorted array.
   * @param userId The ID of the user whose transactions to fetch.
   * @returns A promise that resolves to a combined array of transactions, sorted by date descending.
   */
  static async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      if (!userId) return [];

      const expensesPromise = ExpenseService.getExpenses(userId);
      const incomesPromise = IncomeService.getIncomes(userId);

      const [expenses, incomes] = await Promise.all([expensesPromise, incomesPromise]);

      const combined: Transaction[] = [...expenses, ...incomes];

      // Sort by date, most recent first
      combined.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

      return combined;
    } catch (error) {
      console.error(`Error in TransactionService.getTransactions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a transaction, delegating to the appropriate service based on type.
   * @param id The id of the transaction to delete.
   * @param type The type of transaction ('expense' or 'income').
   */
  static async deleteTransaction(id: string, type: 'expense' | 'income'): Promise<void> {
    try {
      if (type === 'expense') {
        await ExpenseService.deleteExpense(id);
      } else if (type === 'income') {
        await IncomeService.deleteIncome(id);
      } else {
        throw new Error(`Unknown transaction type: ${type}`);
      }
      console.log(`Transaction with id: ${id} (type: ${type}) deleted.`);
    } catch (error) {
      console.error(`Error in TransactionService.deleteTransaction for id ${id}:`, error);
      throw error;
    }
  }
}
