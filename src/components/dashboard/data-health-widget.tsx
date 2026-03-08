/**
 * DataHealthWidget — Dashboard card showing data completeness across all modules.
 * Flags empty buckets with "0 records" and links directly to the relevant tab.
 */
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ChevronRight, Database } from 'lucide-react';

interface BucketDef {
  label: string;
  count: number | undefined;
  navTarget: string;         // tab or module id for deep-link
  emptyTip: string;
  icon: string;
  critical: boolean;
}

interface Props {
  onNavigate: (moduleId: string) => void;
}

export function DataHealthWidget({ onNavigate }: Props) {
  // Live counts from all key tables
  const incomeCount      = useLiveQuery(() => db.incomes.count().catch(() => 0), []);
  const investmentCount  = useLiveQuery(() => db.investments.count().catch(() => 0), []);
  const insuranceCount   = useLiveQuery(() => db.insurancePolicies.count().catch(() => 0), []);
  const loanCount        = useLiveQuery(() => db.loans.where('isActive').equals(1).count().catch(() => db.loans.count().catch(() => 0)), []);
  const shopCount        = useLiveQuery(() => db.gunturShops.where('status').equals('Occupied').count().catch(() => 0), []);
  const roomCount        = useLiveQuery(() => db.gorantlaRooms.count().catch(() => 0), []);
  const efCount          = useLiveQuery(() => db.emergencyFunds.count().catch(() => 0), []);
  const expenseCount     = useLiveQuery(() => db.expenses.count().catch(() => 0), []);

  const buckets: BucketDef[] = [
    {
      label: 'Monthly Income',
      count: incomeCount,
      navTarget: 'income',
      emptyTip: 'Run Setup Wizard in Settings → enter salary',
      icon: '💰',
      critical: true,
    },
    {
      label: 'Investments',
      count: investmentCount,
      navTarget: 'investments',
      emptyTip: 'Add EPF, PPF, SGB, SIP from Investments tab',
      icon: '📈',
      critical: true,
    },
    {
      label: 'Insurance Policies',
      count: insuranceCount,
      navTarget: 'insurance',
      emptyTip: 'Add Term Life + Health policies to unlock Gap Analysis',
      icon: '🛡️',
      critical: true,
    },
    {
      label: 'Active Loans',
      count: loanCount,
      navTarget: 'debt-strike',
      emptyTip: 'Loan data auto-seeded — confirm outstanding balances',
      icon: '🏦',
      critical: false,
    },
    {
      label: 'Guntur Shops (occupied)',
      count: shopCount,
      navTarget: 'property-rental',
      emptyTip: 'Enter rent & tenant data in Property Rental Engine',
      icon: '🏪',
      critical: false,
    },
    {
      label: 'Gorantla Rooms',
      count: roomCount,
      navTarget: 'property-rental',
      emptyTip: 'Add 4 Gorantla room entries in Property Rental Engine',
      icon: '🏠',
      critical: false,
    },
    {
      label: 'Emergency Fund',
      count: efCount,
      navTarget: 'emergency-fund',
      emptyTip: 'Set up Emergency Fund corpus in Goals → Emergency Fund',
      icon: '⚡',
      critical: true,
    },
    {
      label: 'Expense Entries',
      count: expenseCount,
      navTarget: 'expenses',
      emptyTip: 'Start logging expenses to unlock budget health score',
      icon: '🧾',
      critical: false,
    },
  ];

  const empty    = buckets.filter(b => (b.count ?? 0) === 0);
  const filled   = buckets.filter(b => (b.count ?? 0) > 0);
  const criticalEmpty = empty.filter(b => b.critical);
  const pct      = Math.round((filled.length / buckets.length) * 100);

  if (pct === 100) return null; // all buckets filled — hide widget

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <Database className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="flex-1">Data Completeness</span>
          <Badge
            variant={criticalEmpty.length > 0 ? 'destructive' : 'outline'}
            className="text-[10px]"
          >
            {pct}% complete
          </Badge>
        </CardTitle>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-destructive'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {filled.length}/{buckets.length} buckets populated — {empty.length} still empty
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-1.5">
        {empty.map(b => (
          <button
            key={b.label}
            onClick={() => onNavigate(b.navTarget)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/3 transition-colors text-left group"
          >
            <span className="text-base shrink-0">{b.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-foreground">{b.label}</p>
                {b.critical && (
                  <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{b.emptyTip}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
          </button>
        ))}

        {filled.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {filled.map(b => (
              <div key={b.label} className="flex items-center gap-1 text-[10px] text-success bg-success/10 border border-success/20 rounded-lg px-2 py-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>{b.label} ({b.count})</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
