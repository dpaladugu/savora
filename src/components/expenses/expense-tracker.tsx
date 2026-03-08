
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Plus, Receipt, X } from 'lucide-react';
import { ExpenseService, type Expense } from '@/services/ExpenseService';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format-utils';
import { PageHeader } from '@/components/layout/page-header';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/categories';


export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const emptyForm = { amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0], tags: '', paymentMethod: 'UPI' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await ExpenseService.getExpenses();
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch {
      toast({ title: 'Error', description: 'Failed to load expenses', variant: 'destructive' });
    } finally { setLoading(false); }
  };

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
      setForm(emptyForm); setShowForm(false); setEditingExpense(null); load();
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
  };

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({ amount: exp.amount.toString(), description: exp.description, category: exp.category, date: exp.date, tags: exp.tags.join(', '), paymentMethod: exp.payment_method });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await ExpenseService.deleteExpense(id); toast({ title: 'Deleted' }); load(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const monthlyTotal = expenses
    .filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, e) => s + e.amount, 0);

  if (loading) return <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        subtitle={`This month: ${formatCurrency(monthlyTotal)}`}
        icon={Receipt}
        action={
          <Button size="sm" onClick={() => setShowForm(true)} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {/* Add / Edit Form — inline, not a modal */}
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
                <Input placeholder="What was this for?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
            <p className="text-sm text-muted-foreground">No expenses yet</p>
            <Button size="sm" onClick={() => setShowForm(true)} className="mt-3 h-9 text-xs rounded-xl gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add your first expense
            </Button>
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
