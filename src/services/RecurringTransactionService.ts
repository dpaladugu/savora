
/**
 * src/services/RecurringTransactionService.ts
 * Real Dexie-backed implementation for recurring transactions.
 */

import { db } from '@/lib/db';
import type { RecurringTransaction } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Re-export the DB type so components can import from one place
export type { RecurringTransaction };

// Shape expected by the page (snake_case from the original type)
export type RecurringTransactionRecord = RecurringTransaction;

export class RecurringTransactionService {

  static async getAll(): Promise<RecurringTransaction[]> {
    return db.recurringTransactions.orderBy('createdAt').reverse().toArray();
  }

  static async create(
    data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date();
    const id = uuidv4();
    await db.recurringTransactions.add({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  static async update(
    id: string,
    updates: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>
  ): Promise<void> {
    await db.recurringTransactions.update(id, { ...updates, updatedAt: new Date() });
  }

  static async delete(id: string): Promise<void> {
    await db.recurringTransactions.delete(id);
  }

  /** Calculate next occurrence date string based on frequency */
  static calcNextDate(
    fromDate: string,
    frequency: RecurringTransaction['frequency'],
    interval: number
  ): string {
    const d = new Date(fromDate);
    switch (frequency) {
      case 'daily':   d.setDate(d.getDate() + interval); break;
      case 'weekly':  d.setDate(d.getDate() + 7 * interval); break;
      case 'monthly': d.setMonth(d.getMonth() + interval); break;
      case 'yearly':  d.setFullYear(d.getFullYear() + interval); break;
    }
    return d.toISOString().split('T')[0];
  }
}
