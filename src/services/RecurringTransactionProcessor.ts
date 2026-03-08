/**
 * Processes all active recurring transactions whose next_date has passed.
 * - Handles catch-up: if multiple periods have elapsed, creates a txn for each.
 * - Returns a summary so the caller can show a toast.
 * - Idempotent: uses date check to avoid duplicates within the same day.
 */
import { db } from '@/lib/db';
import { RecurringTransactionService } from './RecurringTransactionService';

export interface RecurringProcessResult {
  processed: number;   // total txns created
  items: string[];     // human-readable labels e.g. "EMI (×2)"
}

export async function processRecurringTransactions(): Promise<RecurringProcessResult> {
  const result: RecurringProcessResult = { processed: 0, items: [] };

  try {
    const records = await db.recurringTransactions.toArray();
    const today   = new Date().toISOString().split('T')[0];

    for (const item of records) {
      if (!item.is_active) continue;
      if (item.end_date && item.end_date < today) continue;

      let nextDate = item.next_date;
      let count    = 0;

      // Catch-up loop: keep posting txns until next_date is in the future
      while (nextDate <= today) {
        if (item.end_date && nextDate > item.end_date) break;

        await db.txns.add({
          id: crypto.randomUUID(),
          amount: item.type === 'income' ? Math.abs(item.amount) : -Math.abs(item.amount),
          category: item.category,
          note: `[Auto] ${item.description}`,
          date: new Date(nextDate),
          currency: 'INR',
          tags: [],
          isPartialRent: false,
          paymentMix: [],
          isSplit: false,
          splitWith: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        nextDate = RecurringTransactionService.calcNextDate(
          nextDate,
          item.frequency,
          item.interval,
        );
        count++;

        // Safety cap: never auto-post more than 36 instances per item
        if (count >= 36) break;
      }

      if (count > 0) {
        // Persist the advanced next_date
        await db.recurringTransactions.update(item.id, {
          next_date: nextDate,
          updatedAt: new Date(),
        });
        result.processed += count;
        result.items.push(count > 1 ? `${item.description} (×${count})` : item.description);
      }
    }
  } catch (err) {
    console.warn('processRecurringTransactions error:', err);
  }

  return result;
}
