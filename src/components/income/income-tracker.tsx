
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Trash2, Plus, TrendingUp, Edit2, Wallet, Banknote, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, Income } from "@/db";
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { MaskedAmount } from "@/components/ui/masked-value";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export type AppIncome = Income;

interface IncomeFormData {
  date: string;
  amount: string;
  category: string;
  sourceName: string;
  description: string;
}

const initialForm: IncomeFormData = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  category: 'Salary',
  sourceName: '',
  description: '',
};

const CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment Returns',
  'Rental Income', 'Bonus', 'Dividend', 'Side Income', 'Other',
];

const CATEGORY_ICONS: Record<string, string> = {
  'Salary': '💼',
  'Freelance': '💻',
  'Business': '🏢',
  'Investment Returns': '📈',
  'Rental Income': '🏠',
  'Bonus': '🎯',
  'Dividend': '💰',
  'Side Income': '⚡',
  'Other': '✦',
};

// ── 6-month trend chart ───────────────────────────────────────────────────────
function IncomeTrendChart({ incomes }: { incomes: Income[] }) {
  const chartData = useMemo(() => {
    const now   = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        label: d.toLocaleString('en-IN', { month: 'short' }),
        year:  d.getFullYear(),
        month: d.getMonth(),
        total: 0,
      };
    });
    incomes.forEach(inc => {
      const d = inc.date instanceof Date ? inc.date : new Date(inc.date);
      const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) entry.total += inc.amount;
    });
    return months;
  }, [incomes]);

  const max = Math.max(...chartData.map(d => d.total), 1);

  // MoM delta
  const last  = chartData[5].total;
  const prev  = chartData[4].total;
  const delta = prev > 0 ? ((last - prev) / prev) * 100 : 0;

  // Yearly total (last 12 months)
  const yearlyTotal = useMemo(() => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    return incomes.filter(i => {
      const d = i.date instanceof Date ? i.date : new Date(i.date);
      return d >= cutoff;
    }).reduce((s, i) => s + i.amount, 0);
  }, [incomes]);

  return (
    <Card className="glass border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">6-Month Trend</p>
          <div className="flex items-center gap-2">
            {Math.abs(delta) >= 1 && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% MoM
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              ₹{(yearlyTotal / 1_00_000).toFixed(1)}L / yr
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`} />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Income']}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={i === 5 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.35)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function IncomeTracker() {
  const { toast } = useToast();
  const [showModal, setShowModal]     = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form, setForm] = useState<IncomeFormData>(initialForm);
  const [showChart, setShowChart] = useState(false);

  const realNow    = new Date();
  // Month navigation
  const [viewYear,  setViewYear]  = useState(realNow.getFullYear());
  const [viewMonth, setViewMonth] = useState(realNow.getMonth());

  const prevMonthNav = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonthNav = () => {
    const isCurrent = viewYear === realNow.getFullYear() && viewMonth === realNow.getMonth();
    if (isCurrent) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const isCurrentMonth = viewYear === realNow.getFullYear() && viewMonth === realNow.getMonth();
  const viewMonthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray(), []) ?? [];

  const now        = new Date();
  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd   = new Date(viewYear, viewMonth + 1, 1);

  const thisMonthIncomes = incomes.filter(i => {
    const d = i.date instanceof Date ? i.date : new Date(i.date as any);
    return d >= monthStart && d < monthEnd;
  });
  const thisMonth   = thisMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  // MoM comparison (vs previous month relative to view)
  const prevMonthStart = new Date(viewYear, viewMonth - 1, 1);
  const prevMonthEnd   = new Date(viewYear, viewMonth, 1);
  const prevMonth = incomes
    .filter(i => { const d = i.date instanceof Date ? i.date : new Date(i.date as any); return d >= prevMonthStart && d < prevMonthEnd; })
    .reduce((s, i) => s + i.amount, 0);
  const momDelta = prevMonth > 0 ? ((thisMonth - prevMonth) / prevMonth) * 100 : 0;

  // Group by category for this month
  const byCat = thisMonthIncomes.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount;
    return acc;
  }, {});
  const topCategories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const openAdd  = () => { setEditingIncome(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setForm({
      date:        income.date instanceof Date ? income.date.toISOString().split('T')[0] : String(income.date).split('T')[0],
      amount:      income.amount.toString(),
      category:    income.category,
      sourceName:  (income as any).sourceName || '',
      description: income.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.date || !amount || !form.category) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    try {
      const now = new Date();
      const data = {
        date:        new Date(form.date),
        amount,
        category:    form.category,
        sourceName:  form.sourceName || undefined,
        description: form.description || form.sourceName || form.category,
        createdAt:   now,
        updatedAt:   now,
      };
      if (editingIncome) {
        await db.incomes.update(editingIncome.id!, data);
        toast({ title: "Income updated ✓" });
      } else {
        await db.incomes.add({ ...data, id: crypto.randomUUID() });
        toast({ title: "Income added ✓" });
      }
      setShowModal(false);
      setEditingIncome(null);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income entry?')) return;
    await db.incomes.delete(id);
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Income"
        subtitle={`This month: ${formatCurrency(thisMonth)}`}
        icon={TrendingUp}
        action={
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setShowChart(s => !s)} aria-label="Toggle trend chart">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        }
      />

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="glass">
          <CardContent className="p-3 text-center space-y-0.5">
            <p className="text-[10px] text-muted-foreground">This Month</p>
            <p className="text-sm font-bold tabular-nums value-positive">
              <MaskedAmount amount={thisMonth} permission="showSalary" />
            </p>
            {thisMonthIncomes.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{thisMonthIncomes.length} entr{thisMonthIncomes.length === 1 ? 'y' : 'ies'}</p>
            )}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 text-center space-y-0.5">
            <p className="text-[10px] text-muted-foreground">vs Last Month</p>
            <p className={`text-sm font-bold tabular-nums ${momDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
              {prevMonth === 0 ? '—' : `${momDelta >= 0 ? '+' : ''}${momDelta.toFixed(0)}%`}
            </p>
            {prevMonth > 0 && <p className="text-[10px] text-muted-foreground">{formatCurrency(prevMonth)}</p>}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 text-center space-y-0.5">
            <p className="text-[10px] text-muted-foreground">All Time</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              <MaskedAmount amount={totalIncome} permission="showSalary" />
            </p>
            {incomes.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{incomes.length} total</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6-month trend chart (toggle) */}
      {showChart && <IncomeTrendChart incomes={incomes} />}

      {/* ── This month by category ── */}
      {topCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {topCategories.map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-success/8 border border-success/20 text-xs">
              <span>{CATEGORY_ICONS[cat] ?? '✦'}</span>
              <span className="text-muted-foreground">{cat}</span>
              <span className="font-semibold text-success tabular-nums">{formatCurrency(amt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Income list ── */}
      <div className="space-y-2">
        {incomes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground/25" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No income recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your salary to see Monthly Surplus on the Dashboard</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs h-9" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Record first income
              </Button>
            </CardContent>
          </Card>
        ) : incomes.map(income => (
          <Card key={income.id} className="glass">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-base">
                  {CATEGORY_ICONS[income.category] ?? <TrendingUp className="h-4 w-4 text-success" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {income.description || (income as any).sourceName || income.category}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-muted-foreground">{formatDate(income.date)}</p>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">{income.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <p className="text-sm font-bold value-positive tabular-nums">
                  +<MaskedAmount amount={income.amount} permission="showSalary" />
                </p>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(income)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(income.id!)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={v => { setShowModal(v); if (!v) setEditingIncome(null); }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-success" />
              {editingIncome ? 'Edit Income' : 'Add Income'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input
                  type="number" step="1" min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="h-10 text-sm font-semibold"
                  placeholder="85000"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="h-10 text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm">
                      <span className="mr-2">{CATEGORY_ICONS[c] ?? '✦'}</span>{c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Source Name</Label>
              <Input
                value={form.sourceName}
                onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))}
                className="h-10 text-sm"
                placeholder="e.g. TCS, Google AdSense, Flat 3B"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="h-10 text-sm"
                placeholder="e.g. March salary, Q4 bonus"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 h-10 text-xs rounded-xl">
                {editingIncome ? 'Update' : 'Save Income'}
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-10 text-xs rounded-xl" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
