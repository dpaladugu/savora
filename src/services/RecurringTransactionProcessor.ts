
/**
 * Processes all active recurring transactions whose next_date has passed,
 * creates a real Txn for each, and advances next_date forward.
 * Called once on app start (idempotent — duplicate guard via date check).
 */
import { db } from '@/lib/db';
import { RecurringTransactionService } from './RecurringTransactionService';

export async function processRecurringTransactions(): Promise<void> {
  try {
    const items = await db.recurringTransactions.toArray();
    const today = new Date().toISOString().split('T')[0];

    for (const item of items) {
      if (!item.is_active) continue;
      if (item.next_date > today) continue;
      if (item.end_date && item.next_date > item.end_date) continue;

      // Create the real transaction
      await db.txns.add({
        id: crypto.randomUUID(),
        amount: item.type === 'income' ? Math.abs(item.amount) : -Math.abs(item.amount),
        category: item.category,
        note: `[Auto] ${item.description}`,
        date: new Date(item.next_date),
        currency: 'INR',
        tags: [],
        isPartialRent: false,
        paymentMix: [],
        isSplit: false,
        splitWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Advance next_date
      const nextDate = RecurringTransactionService.calcNextDate(
        item.next_date,
        item.frequency,
        item.interval
      );
      await db.recurringTransactions.update(item.id, {
        next_date: nextDate,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.warn('processRecurringTransactions error:', err);
  }
}
