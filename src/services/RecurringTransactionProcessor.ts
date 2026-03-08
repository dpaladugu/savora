/**
 * RecurringTransactionProcessor — with idempotency guard.
 * On each run we check globalSettings.lastAutoRunAt.
 * If it equals today's date we skip processing entirely to prevent double-posting.
 */
import { db } from '@/lib/db';
import { RecurringTransactionService } from './RecurringTransactionService';

export interface RecurringProcessResult {
  processed: number;
  items: string[];
  skipped?: boolean;
}

export async function processRecurringTransactions(): Promise<RecurringProcessResult> {
  const result: RecurringProcessResult = { processed: 0, items: [] };

  try {
    const today = new Date().toISOString().split('T')[0];

    // ── Idempotency guard: only run once per calendar day ───────────────────────
    const settings = await db.globalSettings.limit(1).first();
    if (settings?.lastAutoRunAt === today) {
      return { ...result, skipped: true };
    }

    const records = await db.recurringTransactions.toArray();

    for (const item of records) {
      if (!item.is_active) continue;
      if (item.end_date && item.end_date < today) continue;

      let nextDate = item.next_date;
      let count    = 0;

      // Catch-up loop: keep posting txns until next_date is in the future
      while (nextDate <= today) {
        if (item.end_date && nextDate > item.end_date) break;

        // Secondary idempotency: skip if a txn with this note+date already exists
        const noteStr = `[Auto] ${item.description}`;
        const targetDate = new Date(nextDate);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayEnd   = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

        const existing = await db.txns
          .where('date').between(dayStart, dayEnd, true, false)
          .and(t => t.note === noteStr)
          .count();

        if (existing === 0) {
          await db.txns.add({
            id: crypto.randomUUID(),
            amount: item.type === 'income' ? Math.abs(item.amount) : -Math.abs(item.amount),
            category: item.category,
            note: noteStr,
            date: targetDate,
            currency: 'INR',
            tags: [],
            isPartialRent: false,
            paymentMix: [],
            isSplit: false,
            splitWith: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        nextDate = RecurringTransactionService.calcNextDate(
          nextDate,
          item.frequency,
          item.interval,
        );
        count++;
        if (count >= 36) break; // safety cap
      }

      if (count > 0) {
        await db.recurringTransactions.update(item.id, {
          next_date: nextDate,
          updatedAt: new Date(),
        });
        result.processed += count;
        result.items.push(count > 1 ? `${item.description} (×${count})` : item.description);
      }
    }

    // Stamp today as processed
    if (settings) {
      await db.globalSettings.update(settings.id, { lastAutoRunAt: today } as any);
    }
  } catch (err) {
    console.warn('processRecurringTransactions error:', err);
  }

  return result;
}
