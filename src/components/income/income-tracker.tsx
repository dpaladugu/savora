
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Trash2, Plus, TrendingUp, Edit2, Wallet, Banknote, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, Income } from "@/db";
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { MaskedAmount } from "@/components/ui/masked-value";

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

export function IncomeTracker() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form, setForm] = useState<IncomeFormData>(initialForm);

  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray(), []) ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthIncomes = incomes.filter(i => new Date(i.date) >= monthStart);
  const thisMonth  = thisMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  // Group by category for this month
  const byCat = thisMonthIncomes.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount;
    return acc;
  }, {});
  const topCategories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const openAdd = () => { setEditingIncome(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setForm({
      date: income.date instanceof Date ? income.date.toISOString().split('T')[0] : String(income.date).split('T')[0],
      amount: income.amount.toString(),
      category: income.category,
      sourceName: (income as any).sourceName || '',
      description: income.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.date || !amount || !form.category) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      const now = new Date();
      const data = {
        date: new Date(form.date),
        amount,
        category: form.category,
        sourceName: form.sourceName || undefined,
        description: form.description || form.sourceName || form.category,
        createdAt: now,
        updatedAt: now,
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
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-2">
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
            <p className="text-[10px] text-muted-foreground">All Time</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              <MaskedAmount amount={totalIncome} permission="showSalary" />
            </p>
            {incomes.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{incomes.length} total entries</p>
            )}
          </CardContent>
        </Card>
      </div>

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
                {/* Category icon bubble */}
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
