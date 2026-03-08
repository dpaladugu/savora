
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Plus } from 'lucide-react';
import { ExpenseService, type Expense } from '@/services/ExpenseService';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    paymentMethod: 'Cash',
  });

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await ExpenseService.getExpenses();
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch {
      toast({ title: 'Error', description: 'Failed to load expenses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0], tags: '', paymentMethod: 'Cash' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.category) {
      toast({ title: 'Required fields missing', variant: 'destructive' }); return;
    }
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        payment_method: formData.paymentMethod,
        source: 'manual',
        account: 'default',
      };
      if (editingExpense) {
        await ExpenseService.updateExpense(editingExpense.id, payload);
        toast({ title: 'Expense updated' });
      } else {
        await ExpenseService.addExpense(payload);
        toast({ title: 'Expense added' });
      }
      resetForm(); setShowAddForm(false); setEditingExpense(null); loadExpenses();
    } catch {
      toast({ title: 'Failed to save expense', variant: 'destructive' });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ amount: expense.amount.toString(), description: expense.description, category: expense.category, date: expense.date, tags: expense.tags.join(', '), paymentMethod: expense.payment_method });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await ExpenseService.deleteExpense(id); toast({ title: 'Expense deleted' }); loadExpenses(); }
    catch { toast({ title: 'Failed to delete expense', variant: 'destructive' }); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total: <span className="tabular-nums font-semibold text-foreground">₹{totalExpenses.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9 gap-1.5 shrink-0 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Expense
        </Button>
      </div>

      {/* ── Add / Edit form ── */}
      {showAddForm && (
        <Card className="glass border-primary/20">
          <CardContent className="p-4 pt-4">
            <h2 className="text-sm font-semibold mb-3">{editingExpense ? 'Edit Expense' : 'New Expense'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹) *</label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="h-9 text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Category *</label>
                  <Input value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="Food, Transport…" className="h-9 text-sm" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description *</label>
                <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" className="h-9 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="h-9 text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Payment</label>
                  <Select value={formData.paymentMethod} onValueChange={v => setFormData(p => ({ ...p, paymentMethod: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Cash', 'Card', 'UPI', 'Bank'].map(m => <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                <Input value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))} placeholder="work, personal…" className="h-9 text-sm" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" className="h-9 text-xs flex-1">{editingExpense ? 'Update' : 'Add'}</Button>
                <Button type="button" size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={() => { setShowAddForm(false); setEditingExpense(null); resetForm(); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── List ── */}
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
              <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl" onClick={() => setShowAddForm(true)}>Add your first expense</Button>
            </CardContent>
          </Card>
        ) : expenses.map(expense => (
          <Card key={expense.id} className="glass">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-sm font-bold tabular-nums text-foreground">₹{expense.amount.toLocaleString('en-IN')}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{expense.category}</Badge>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{expense.payment_method}</Badge>
                  </div>
                  <p className="text-xs text-foreground truncate">{expense.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(expense.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(expense)} aria-label="Edit expense"><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(expense.id)} aria-label="Delete expense"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
