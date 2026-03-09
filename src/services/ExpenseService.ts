
import { db } from "@/lib/db";
import type { Txn } from '@/lib/db';
import { checkSpendingLimitAfterExpense } from '@/lib/spending-limit-checker';
import { auditLog } from '@/components/audit/audit-log-viewer';

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
      const now = new Date();
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
        createdAt: now,
        updatedAt: now,
      };
      
      await db.txns.add(txnData);

      // ── Audit log ────────────────────────────────────────────────────────
      await auditLog('create', `Expense:${expenseData.category}`, {
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
      });

      // ── Spending-limit check (non-blocking) ─────────────────────────────
      checkSpendingLimitAfterExpense(expenseData.category, expenseData.amount, expenseData.date);

      return newId;
    } catch (error) {
      console.error("Error in ExpenseService.addExpense:", error);
      throw error;
    }
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<number> {
    try {
      const old = await db.txns.get(id);
      const txnUpdates: Partial<Txn> = {};
      
      if (updates.date) txnUpdates.date = new Date(updates.date);
      if (updates.amount) txnUpdates.amount = -Math.abs(updates.amount);
      if (updates.description) txnUpdates.note = updates.description;
      if (updates.category) txnUpdates.category = updates.category;
      if (updates.tags) txnUpdates.tags = updates.tags;
      
      const updatedCount = await db.txns.update(id, txnUpdates);

      await auditLog('update', `Expense:${updates.category ?? old?.category}`, txnUpdates, old);

      return updatedCount;
    } catch (error) {
      console.error(`Error in ExpenseService.updateExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async bulkAddExpenses(expensesData: Expense[]): Promise<void> {
    try {
      const now = new Date();
      const txns = expensesData.map(expense => ({
        id: expense.id || self.crypto.randomUUID(),
        date: new Date(expense.date),
        amount: -Math.abs(expense.amount),
        currency: 'INR' as const,
        category: expense.category,
        note: expense.description,
        tags: expense.tags || [],
        paymentMix: expense.payment_method ? [{ mode: expense.payment_method as any, amount: expense.amount }] : [],
        splitWith: [],
        isPartialRent: false,
        isSplit: false,
        createdAt: now,
        updatedAt: now,
      }));
      await db.txns.bulkAdd(txns);
      await auditLog('create', `Expense:BulkImport`, { count: txns.length });
    } catch (error) {
      console.error("Error in ExpenseService.bulkAddExpenses:", error);
      throw error;
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      const old = await db.txns.get(id);
      await db.txns.delete(id);
      await auditLog('delete', `Expense`, undefined, old);
    } catch (error) {
      console.error(`Error in ExpenseService.deleteExpense for id ${id}:`, error);
      throw error;
    }
  }

  static async getExpenses(limit?: number): Promise<Expense[]> {
    try {
      let query = db.txns.where('amount').below(0).reverse();
      const txns = limit ? await query.limit(limit).toArray() : await query.toArray();
      
      return txns.map(txn => ({
        id: txn.id,
        date: txn.date instanceof Date ? txn.date.toISOString().split('T')[0] : String(txn.date).slice(0, 10),
        amount: Math.abs(txn.amount),
        description: txn.note || '',
        category: txn.category || 'Other',
        payment_method: txn.paymentMix?.[0]?.mode || 'Cash',
        source: 'manual',
        tags: txn.tags || [],
        account: '',
      }));
    } catch (error) {
      console.error("Error in ExpenseService.getExpenses:", error);
      return [];
    }
  }

  static async getExpensesByCategory(category: string): Promise<Expense[]> {
    try {
      const txns = await db.txns
        .where('category').equals(category)
        .and(t => t.amount < 0)
        .toArray();
      
      return txns.map(txn => ({
        id: txn.id,
        date: txn.date instanceof Date ? txn.date.toISOString().split('T')[0] : String(txn.date).slice(0, 10),
        amount: Math.abs(txn.amount),
        description: txn.note || '',
        category: txn.category || 'Other',
        payment_method: txn.paymentMix?.[0]?.mode || 'Cash',
        source: 'manual',
        tags: txn.tags || [],
        account: '',
      }));
    } catch (error) {
      console.error(`Error in ExpenseService.getExpensesByCategory for ${category}:`, error);
      return [];
    }
  }
}
