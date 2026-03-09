
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Plus, Receipt, X, AlertTriangle, ChevronLeft, ChevronRight, BarChart3, Sparkles } from 'lucide-react';
import { ExpenseService, type Expense } from '@/services/ExpenseService';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format-utils';
import { PageHeader } from '@/components/layout/page-header';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/categories';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { suggestCategory } from '@/lib/expense-autocategory';

// ─── Month nav helpers ────────────────────────────────────────────────────────
function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// ─── Spending Limits Bar ──────────────────────────────────────────────────────
function SpendingLimitsBar({ monthlyTotal }: { monthlyTotal: number }) {
  const limits = useLiveQuery(() => db.spendingLimits.toArray().catch(() => []), []) ?? [];
  if (!limits.length) return null;
  const totalCap = limits.reduce((s, l) => s + l.monthlyCap, 0);
  if (totalCap === 0) return null;
  const pct = Math.min(100, Math.round((monthlyTotal / totalCap) * 100));
  const alertPct = Math.min(...limits.map(l => l.alertAt ?? 80));
  const isWarning = pct >= alertPct;
  const isOver    = pct >= 100;
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs ${
      isOver    ? 'border-destructive/40 bg-destructive/5'
      : isWarning ? 'border-warning/40 bg-warning/5'
      : 'border-border/40 bg-muted/30'
    }`}>
      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${isOver ? 'text-destructive' : isWarning ? 'text-warning' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className={`font-medium ${isOver ? 'text-destructive' : isWarning ? 'text-warning' : 'text-foreground'}`}>
            {isOver ? 'Over budget!' : isWarning ? `${pct}% of budget used` : `${pct}% of budget`}
          </span>
          <span className="text-muted-foreground tabular-nums">{formatCurrency(monthlyTotal)} / {formatCurrency(totalCap)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Category breakdown mini chart ───────────────────────────────────────────
function CategoryChart({ expenses }: { expenses: Expense[] }) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

  if (data.length === 0) return null;

  const COLORS = [
    'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))',
    'hsl(24 90% 55%)', 'hsl(280 65% 60%)', 'hsl(48 90% 50%)',
    'hsl(173 58% 40%)', 'hsl(350 75% 55%)',
  ];

  return (
    <Card className="glass border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary" /> By Category
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
              tickFormatter={v => v.length > 8 ? v.slice(0, 7) + '…' : v} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
              tickFormatter={v => `₹${v >= 1000 ? Math.round(v/1000) + 'k' : v}`} />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Spent']}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ExpenseTracker() {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showForm, setShowForm]   = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const { toast } = useToast();

  const emptyForm = { amount: '', description: '', category: '', date: now.toISOString().split('T')[0], tags: '', paymentMethod: 'UPI' };
  const [form, setForm] = useState(emptyForm);

  // Live reactive query for expenses
  const allExpenses = useLiveQuery(
    () => ExpenseService.getExpenses().catch(() => []),
    []
  ) ?? [];

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const expenses = useMemo(
    () => allExpenses
      .filter(e => e.date.startsWith(monthStr))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allExpenses, monthStr]
  );

  const monthlyTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.category) {
      toast({ title: 'Required fields missing', variant: 'destructive' }); return;
    }
    try {
      const payload = {
        amount: parseFloat(form.amount), description: form.description,
        category: form.category, date: form.date,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        payment_method: form.paymentMethod, source: 'manual', account: 'default',
      };
      if (editingExpense) {
        await ExpenseService.updateExpense(editingExpense.id, payload);
        toast({ title: 'Expense updated' });
      } else {
        await ExpenseService.addExpense(payload);
        toast({ title: 'Expense added' });
      }
      setForm(emptyForm); setShowForm(false); setEditingExpense(null);
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
  };

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({ amount: exp.amount.toString(), description: exp.description, category: exp.category, date: exp.date, tags: exp.tags.join(', '), paymentMethod: exp.payment_method });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await ExpenseService.deleteExpense(id);
      toast({ title: 'Deleted' });
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        subtitle={`${monthLabel(viewYear, viewMonth)}: ${formatCurrency(monthlyTotal)}`}
        icon={Receipt}
        action={
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setShowChart(s => !s)} aria-label="Toggle chart">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="h-9 gap-1.5 rounded-xl text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2 border border-border/30">
        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">{monthLabel(viewYear, viewMonth)}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={nextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Spending Limits Bar */}
      {isCurrentMonth && <SpendingLimitsBar monthlyTotal={monthlyTotal} />}

      {/* Category chart (toggle) */}
      {showChart && <CategoryChart expenses={expenses} />}

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="glass border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{editingExpense ? 'Edit Expense' : 'New Expense'}</h3>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => { setShowForm(false); setEditingExpense(null); setForm(emptyForm); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (₹) *</Label>
                  <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description *</Label>
                <div className="relative">
                  <Input
                    placeholder="What was this for?"
                    value={form.description}
                    onChange={e => {
                      const desc = e.target.value;
                      const suggested = suggestCategory(desc);
                      setForm(f => ({
                        ...f,
                        description: desc,
                        // Auto-fill category only if not already set by user
                        category: f.category || suggested,
                      }));
                    }}
                    required
                    className="h-10"
                  />
                  {form.description.length >= 3 && suggestCategory(form.description) && !form.category && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-primary font-medium pointer-events-none">
                      <Sparkles className="h-2.5 w-2.5" /> auto
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment</Label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm({...form, paymentMethod: v})}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tags (comma-separated)</Label>
                <Input placeholder="grocery, family, urgent" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="h-10" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 h-10 text-xs" onClick={() => { setShowForm(false); setEditingExpense(null); setForm(emptyForm); }}>Cancel</Button>
                <Button type="submit" className="flex-1 h-10 text-xs">{editingExpense ? 'Update' : 'Save Expense'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No expenses in {monthLabel(viewYear, viewMonth)}</p>
            {isCurrentMonth && (
              <Button size="sm" onClick={() => setShowForm(true)} className="mt-3 h-9 text-xs rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first expense
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <Card key={exp.id} className="glass">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{exp.description}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">{exp.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{exp.date}</p>
                      {exp.payment_method && <p className="text-xs text-muted-foreground">· {exp.payment_method}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold value-negative tabular-nums">−{formatCurrency(exp.amount)}</span>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(exp)} aria-label="Edit"><Edit3 className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(exp.id)} aria-label="Delete"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
