/**
 * useAutoEmiSync — Auto-reduces loan outstanding by EMI principal portions.
 *
 * Runs once per app session. For each active loan:
 *   1. Reads last sync date from appSettings (key: `emi-sync-{loanId}`)
 *   2. Calculates months elapsed since last sync
 *   3. For each elapsed month: computes interest portion, deducts principal from outstanding
 *   4. Saves new outstanding to db.loans + stamps `emi-sync-{loanId}` = now
 *
 * This means the countdown widget always reflects the mathematically correct
 * outstanding without requiring manual EMI logging.
 */

import { useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { differenceInMonths } from 'date-fns';
import { toast } from 'sonner';

interface SyncResult {
  loanId: string;
  loanName: string;
  monthsApplied: number;
  principalReduced: number;
  newOutstanding: number;
}

export function useAutoEmiSync() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function sync() {
      try {
        const loans = await db.loans.toArray();
        const activeLoans = loans.filter(
          l => l.isActive !== false
            && (l.outstanding ?? l.principal) > 0
            && (l.emi ?? 0) > 0
            && (l.roi ?? 0) > 0
        );

        if (activeLoans.length === 0) return;

        const results: SyncResult[] = [];
        const now = new Date();

        for (const loan of activeLoans) {
          const syncKey = `emi-sync-${loan.id}`;
          const syncRecord = await db.appSettings.get(syncKey);

          // Determine last sync date: use saved sync OR loan startDate OR createdAt
          const lastSyncRaw = syncRecord?.value
            ?? loan.startDate
            ?? loan.createdAt
            ?? null;

          if (!lastSyncRaw) continue;

          const lastSync = new Date(lastSyncRaw);
          const monthsElapsed = differenceInMonths(now, lastSync);

          if (monthsElapsed <= 0) continue;

          // Apply each month's principal reduction sequentially
          const roi = loan.roi ?? loan.interestRate ?? 0;
          const emi = loan.emi ?? 0;
          const r = roi / 100 / 12;

          let balance = loan.outstanding ?? loan.principal;
          let totalPrincipalReduced = 0;

          for (let m = 0; m < monthsElapsed; m++) {
            if (balance <= 0) break;
            const interest = balance * r;
            const principal = Math.min(balance, emi - interest);
            if (principal <= 0) break; // EMI doesn't cover interest — stop
            balance -= principal;
            totalPrincipalReduced += principal;
          }

          if (totalPrincipalReduced <= 0) continue;

          const newOutstanding = Math.max(0, Math.round(balance));

          // Update loan outstanding
          await db.loans.update(loan.id, {
            outstanding: newOutstanding,
            isActive: newOutstanding > 0,
            updatedAt: now,
          });

          // Stamp sync date
          await db.appSettings.put({ key: syncKey, value: now.toISOString() });

          results.push({
            loanId: loan.id,
            loanName: loan.name ?? 'Loan',
            monthsApplied: monthsElapsed,
            principalReduced: Math.round(totalPrincipalReduced),
            newOutstanding,
          });
        }

        // Notify user if any EMIs were applied
        if (results.length > 0) {
          const totalReduced = results.reduce((s, r) => s + r.principalReduced, 0);
          const months = Math.max(...results.map(r => r.monthsApplied));
          toast.success(
            `${months} EMI${months !== 1 ? 's' : ''} auto-applied — ₹${totalReduced.toLocaleString('en-IN')} principal reduced across ${results.length} loan${results.length !== 1 ? 's' : ''}`,
            { duration: 5000 }
          );
        }
      } catch (e) {
        console.warn('useAutoEmiSync error:', e);
      }
    }

    // Small delay to let DB initialise first
    const timer = setTimeout(sync, 1500);
    return () => clearTimeout(timer);
  }, []);
}
