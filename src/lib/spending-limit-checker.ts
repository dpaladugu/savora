/**
 * Shared utility: check if a category has crossed its spending-limit threshold
 * after a new expense is saved.  Fires a toast immediately — no navigation needed.
 *
 * Call this from any expense-save path (ExpenseService, quick-add, CSV import…).
 */
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';

/**
 * @param category  The expense category just saved
 * @param newAmount The positive amount of the new expense (before adding to DB)
 * @param expenseDate ISO date string of the expense (defaults to today)
 */
export async function checkSpendingLimitAfterExpense(
  category: string,
  newAmount: number,
  expenseDate?: string,
): Promise<void> {
  try {
    // 1. Find the limit for this category
    const limit = await db.spendingLimits
      ?.filter(l => l.category.toLowerCase() === category.toLowerCase())
      .first();

    if (!limit || limit.monthlyCap <= 0) return;

    // 2. Sum current month spend (all txns with negative amount)
    const date = expenseDate ?? new Date().toISOString().split('T')[0];
    const [year, month] = date.split('-');
    const monthStart = `${year}-${month}-01`;
    const nextMonth  = new Date(Number(year), Number(month), 1); // first day of next month
    const monthEnd   = nextMonth.toISOString().split('T')[0];

    const txns = await db.txns
      ?.where('date')
      .between(new Date(monthStart), new Date(monthEnd), true, false)
      .filter(t => t.category?.toLowerCase() === category.toLowerCase() && t.amount < 0)
      .toArray() ?? [];

    // Sum existing spend (abs) + new expense
    const existingSpend = txns.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalSpend    = existingSpend + newAmount;

    const threshold = limit.alertAt ?? 80;
    const pct       = (totalSpend / limit.monthlyCap) * 100;

    if (pct >= 100) {
      toast.error(
        `🚨 ${category} limit exceeded! Spent ${formatCurrency(totalSpend)} of ${formatCurrency(limit.monthlyCap)}`,
        { duration: 8000 },
      );
    } else if (pct >= threshold) {
      toast.warning(
        `⚠️ ${category} at ${pct.toFixed(0)}% of limit — ${formatCurrency(Math.max(0, limit.monthlyCap - totalSpend))} remaining`,
        { duration: 6000 },
      );
    }
  } catch {
    // Non-critical — never break the save flow
  }
}
