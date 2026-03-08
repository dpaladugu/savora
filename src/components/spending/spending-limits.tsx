/**
 * SpendingLimits — per-category monthly caps.
 * Auto-sums from expenses in current month and alerts at 80%.
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { Gauge, Plus, Edit, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { SpendingLimit } from '@/lib/db';

import { SPENDING_LIMIT_CATEGORIES } from '@/lib/categories';

const PRESET_CATEGORIES = SPENDING_LIMIT_CATEGORIES;


const emptyForm = { category: '', monthlyCap: '', alertAt: '80' };

function StatusIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  if (pct >= 80)  return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
}

function limitColor(pct: number): string {
  if (pct >= 100) return 'bg-destructive';
  if (pct >= 80)  return 'bg-warning';
  return 'bg-primary';
}

export function SpendingLimits() {
  const limits = useLiveQuery(() => db.spendingLimits?.toArray() ?? Promise.resolve([])) || [];

  // Live month expenses
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = useLiveQuery(() =>
    db.expenses?.where('date').aboveOrEqual(monthStart.toISOString().split('T')[0]).toArray() ?? Promise.resolve([])
  ) || [];

  const spendByCategory: Record<string, number> = {};
  monthExpenses.forEach(e => {
    spendByCategory[e.category] = (spendByCategory[e.category] || 0) + e.amount;
  });

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });

  const openAdd  = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (l: SpendingLimit) => {
    setEditId(l.id);
    setForm({ category: l.category, monthlyCap: l.monthlyCap.toString(), alertAt: (l.alertAt || 80).toString() });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { category: form.category, monthlyCap: parseFloat(form.monthlyCap) || 0, alertAt: parseInt(form.alertAt) || 80, updatedAt: new Date() };
    try {
      if (editId) { await db.spendingLimits?.update(editId, data); toast.success('Limit updated'); }
      else { await db.spendingLimits?.add({ id: crypto.randomUUID(), ...data, createdAt: new Date() }); toast.success('Limit added'); }
      setShowModal(false);
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this limit?')) return;
    await db.spendingLimits?.delete(id);
    toast.success('Limit deleted');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Spending Limits"
        subtitle="Monthly category caps with 80% alerts"
        icon={Gauge}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Limit
          </Button>
        }
      />

      {limits.length === 0 ? (
        <Card><CardContent className="py-10 text-center">
          <Gauge className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No spending limits set.</p>
          <p className="text-xs text-muted-foreground mt-1">Set per-category monthly caps to get alerted at 80%.</p>
          <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add first limit
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {limits.map(l => {
            const spent = spendByCategory[l.category] || 0;
            const pct   = l.monthlyCap > 0 ? Math.min(100, (spent / l.monthlyCap) * 100) : 0;
            const alert = pct >= (l.alertAt || 80);
            return (
              <Card key={l.id} className={`glass ${alert ? 'border-warning/40' : 'border-border/40'}`}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon pct={pct} />
                      <p className="text-sm font-semibold">{l.category}</p>
                      {pct >= 100 && <Badge variant="destructive" className="text-[10px]">Over</Badge>}
                      {pct >= (l.alertAt || 80) && pct < 100 && <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">Alert</Badge>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(l)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{formatCurrency(spent)} spent</span>
                      <span className="font-medium">{pct.toFixed(0)}% of {formatCurrency(l.monthlyCap)}</span>
                    </div>
                    <Progress value={pct} className={`h-2 rounded-full [&>div]:${limitColor(pct)}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Alert at {l.alertAt || 80}% · Remaining: {formatCurrency(Math.max(0, l.monthlyCap - spent))}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>{editId ? 'Edit Limit' : 'Add Spending Limit'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Input
                list="cats"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="h-9 text-sm"
                placeholder="Dining, Shopping…"
                required
              />
              <datalist id="cats">{PRESET_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-1"><Label className="text-xs">Monthly Cap (₹) *</Label><Input type="number" value={form.monthlyCap} onChange={e => setForm(f => ({ ...f, monthlyCap: e.target.value }))} className="h-9 text-sm" required /></div>
            <div className="space-y-1"><Label className="text-xs">Alert At (%)</Label><Input type="number" min="50" max="100" value={form.alertAt} onChange={e => setForm(f => ({ ...f, alertAt: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editId ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
