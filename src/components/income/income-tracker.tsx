
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Trash2, Plus, TrendingUp, Edit2, Wallet } from "lucide-react";
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
  description: string;
}

const initialForm: IncomeFormData = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
  category: 'Salary',
  description: '',
};

const CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Bonus', 'Other'];

export function IncomeTracker() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form, setForm] = useState<IncomeFormData>(initialForm);

  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray(), []) || [];

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const thisMonth = incomes.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + i.amount, 0);

  const openAdd = () => { setEditingIncome(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setForm({
      date: income.date instanceof Date ? income.date.toISOString().split('T')[0] : String(income.date).split('T')[0],
      amount: income.amount.toString(),
      category: income.category,
      description: income.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.date || !amount || !form.category) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    try {
      const data: Omit<Income, 'id'> = {
        date: new Date(form.date),
        amount,
        category: form.category,
        description: form.description,
      };
      if (editingIncome) {
        await db.incomes.update(editingIncome.id!, data);
        toast({ title: "Income Updated" });
      } else {
        await db.incomes.add({ ...data, id: crypto.randomUUID() });
        toast({ title: "Income Added" });
      }
      setShowModal(false);
      setEditingIncome(null);
    } catch {
      toast({ title: "Error", description: "Failed to save income.", variant: "destructive" });
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
        subtitle="Track all income sources"
        icon={TrendingUp}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Income
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="glass">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">This Month</p>
            <p className="text-sm font-bold tabular-nums value-positive">
              <MaskedAmount amount={thisMonth} permission="showSalary" />
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">All Time</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              <MaskedAmount amount={totalIncome} permission="showSalary" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income list */}
      <div className="space-y-2">
        {incomes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No income entries yet.</p>
              <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Add first income
              </Button>
            </CardContent>
          </Card>
        ) : incomes.map(income => (
          <Card key={income.id} className="glass">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{income.description || income.category}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(income.date)} · <Badge variant="outline" className="text-[10px] py-0">{income.category}</Badge></p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <p className="text-sm font-bold value-positive tabular-nums">+{formatCurrency(income.amount)}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(income)} aria-label="Edit">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(income.id!)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={v => { setShowModal(v); if (!v) setEditingIncome(null); }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-sm" required autoFocus />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 text-sm" placeholder="e.g. March Salary" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingIncome ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
