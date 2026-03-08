
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db, Investment } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';
import { MaskedAmount } from '@/components/ui/masked-value';

export function InvestmentsTracker() {
  const investments = useLiveQuery(() => db.investments.toArray()) || [];
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'returns'>('name');
  const [showAddForm, setShowAddForm] = useState(false);

  const totalValue    = investments.reduce((s, i) => s + (i.currentValue  || 0), 0);
  const totalInvested = investments.reduce((s, i) => s + (i.investedValue || 0), 0);
  const totalReturns  = totalValue - totalInvested;
  const returnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const sorted = [...investments].sort((a, b) => {
    if (sortBy === 'value')   return (b.currentValue || 0) - (a.currentValue || 0);
    if (sortBy === 'returns') return ((b.currentValue || 0) - (b.investedValue || 0)) - ((a.currentValue || 0) - (a.investedValue || 0));
    return (a.name || '').localeCompare(b.name || '');
  });

  const sorts: { key: typeof sortBy; label: string }[] = [
    { key: 'name',    label: 'Name'    },
    { key: 'value',   label: 'Value'   },
    { key: 'returns', label: 'Returns' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Summary metrics — 1 col stacked on mobile ── */}
      <div className="grid grid-cols-1 gap-3">
        {([
          { label: 'Portfolio Value', amount: totalValue,    color: 'text-foreground',   sub: undefined as string | undefined },
          { label: 'Total Invested',  amount: totalInvested, color: 'text-foreground',   sub: undefined as string | undefined },
          { label: 'Total Returns',   amount: totalReturns,  color: totalReturns >= 0 ? 'value-positive' : 'value-negative',
            sub: `${returnsPercent >= 0 ? '+' : ''}${returnsPercent.toFixed(2)}%` as string | undefined },
        ]).map(({ label, amount, color, sub }) => (
          <Card key={label} className="glass">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="text-right">
                <p className={cn('text-lg font-bold tabular-nums', color)}>
                  <MaskedAmount amount={amount} permission="showInvestments" />
                </p>
                {sub && <p className={cn('text-xs font-medium', color)}>{sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Sort pills — wrap instead of overflow */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort investments">
          {sorts.map(({ key, label }) => (
            <Button
              key={key}
              variant={sortBy === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(key)}
              className="h-8 text-xs px-3 rounded-xl"
              aria-pressed={sortBy === key}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="h-8 text-xs px-3 rounded-xl gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
        </Button>
      </div>

      {/* ── Investment List ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(investment => {
          const ret  = (investment.currentValue || 0) - (investment.investedValue || 0);
          const retP = (investment.investedValue || 0) > 0 ? (ret / (investment.investedValue || 0)) * 100 : 0;
          return (
            <Card key={investment.id} className="glass hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-tight">{investment.name}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{investment.type || 'Investment'}</Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Current Value', val: formatCurrency(investment.currentValue || 0), cls: 'text-foreground' },
                    { label: 'Invested',       val: formatCurrency(investment.investedValue || 0), cls: 'text-foreground' },
                    { label: 'Returns',        val: `${formatCurrency(ret)} (${retP.toFixed(1)}%)`, cls: ret >= 0 ? 'value-positive' : 'value-negative' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn('font-medium tabular-nums', cls)}>{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {investments.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <BarChart2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No investments yet.</p>
            <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={() => setShowAddForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Investment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
