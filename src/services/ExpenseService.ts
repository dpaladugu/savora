
import { db } from "@/lib/db";
import type { Txn } from '@/lib/db';

// Expense type for backward compatibility
export interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  source: string;
  tags: string[];
  account: string;
}

export class ExpenseService {

  static async addExpense(expenseData: Omit<Expense, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      
      // Convert expense to transaction format
      const txnData: Txn = {
        id: newId,
        date: new Date(expenseData.date),
        amount: -Math.abs(expenseData.amount), // Expenses are negative
        currency: 'INR',
        category: expenseData.category,
        note: expenseData.description,
        tags: expenseData.tags,
        paymentMix: [{
          mode: expenseData.payment_method as any,
          amount: expenseData.amount
        }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false,
      };
      
      await db.txns.add(txnData);
      return newId;
    } catch (error) {
      console.error("Error in ExpenseService.addExpense:", error);
      throw error;
    }
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<number> {
    try {
      const txnUpdates: Partial<Txn> = {};
      
      if (updates.date) txnUpdates.date = new Date(updates.date);
      if (updates.amount) txnUpdates.amount = -Math.abs(updates.amount);
      if (updates.description) txnUpdates.note = updates.description;
      if (updates.category) txnUpdates.category = updates.category;
      if (updates.tags) txnUpdates.tags = updates.tags;
      
      const updatedCount = await db.txns.update(id, txnUpdates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in ExpenseService.updateExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async bulkAddExpenses(expensesData: Expense[]): Promise<void> {
    try {
      const txns = expensesData.map(expense => ({
        id: expense.id || self.crypto.randomUUID(),
        date: new Date(expense.date),
        amount: -Math.abs(expense.amount),
        currency: 'INR',
        category: expense.category,
        note: expense.description,
        tags: expense.tags,
        paymentMix: [{
          mode: expense.payment_method as any,
          amount: expense.amount
        }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false,
      }));
      
      await db.txns.bulkAdd(txns);
      console.log(`Bulk added ${expensesData.length} expenses.`);
    } catch (error) {
      console.error("Error in ExpenseService.bulkAddExpenses:", error);
      throw error;
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      await db.txns.delete(id);
    } catch (error) {
      console.error(`Error in ExpenseService.deleteExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async getExpenses(): Promise<Expense[]> {
    try {
      const txns = await db.txns.toArray();
      // Convert transactions to expense format (only negative amounts)
      return txns
        .filter(txn => txn.amount < 0)
        .map(txn => ({
          id: txn.id,
          date: txn.date.toISOString().split('T')[0],
          amount: Math.abs(txn.amount),
          description: txn.note,
          category: txn.category,
          payment_method: txn.paymentMix[0]?.mode || 'Cash',
          source: 'manual',
          tags: txn.tags,
          account: '',
        }));
    } catch (error) {
      console.error(`Error in ExpenseService.getExpenses:`, error);
      throw error;
    }
  }

  static async getExpenseById(id: string): Promise<Expense | undefined> {
    try {
      const txn = await db.txns.get(id);
      if (!txn || txn.amount >= 0) return undefined;
      
      return {
        id: txn.id,
        date: txn.date.toISOString().split('T')[0],
        amount: Math.abs(txn.amount),
        description: txn.note,
        category: txn.category,
        payment_method: txn.paymentMix[0]?.mode || 'Cash',
        source: 'manual',
        tags: txn.tags,
        account: '',
      };
    } catch (error) {
      console.error(`Error in ExpenseService.getExpenseById for id ${id}:`, error);
      throw error;
    }
  }
}
