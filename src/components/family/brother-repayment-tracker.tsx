/**
 * BrotherRepaymentTracker — repayment ledger linked to Education-Brother loan.
 * Shows running outstanding, % repaid, and per-payment history.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { MaskedAmount } from '@/components/ui/masked-value';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { Globe, Plus, TrendingDown, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const PAYMENT_MODES = ['NEFT', 'Wire', 'Cash', 'UPI', 'Cheque', 'Other'] as const;

// Education-Brother loan principal (matches BrotherGlobalLiability constant)
const EDUCATION_LOAN_PRINCIPAL = 2321156;

export function BrotherRepaymentTracker() {
  const repayments = useLiveQuery(() => db.brotherRepayments?.toArray() ?? Promise.resolve([])) || [];
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], mode: 'NEFT' as string, note: '' });

  const totalRepaid   = repayments.reduce((s, r) => s + r.amount, 0);
  const outstanding   = Math.max(0, EDUCATION_LOAN_PRINCIPAL - totalRepaid);
  const pctRepaid     = EDUCATION_LOAN_PRINCIPAL > 0 ? Math.min(100, (totalRepaid / EDUCATION_LOAN_PRINCIPAL) * 100) : 0;
  const sorted        = [...repayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.brotherRepayments?.add({
        id: crypto.randomUUID(),
        amount: parseFloat(form.amount) || 0,
        date: new Date(form.date),
        mode: form.mode,
        note: form.note,
        createdAt: new Date(),
      });
      toast.success(`₹${Number(form.amount).toLocaleString('en-IN')} repayment recorded`);
      setShowModal(false);
      setForm({ amount: '', date: new Date().toISOString().split('T')[0], mode: 'NEFT', note: '' });
    } catch { toast.error('Failed to record repayment'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this repayment entry?')) return;
    await db.brotherRepayments?.delete(id);
    toast.success('Entry deleted');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Brother Repayment"
        subtitle="InCred Education Loan — repayment ledger"
        icon={Globe}
        action={
          <Button size="sm" onClick={() => setShowModal(true)} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Payment
          </Button>
        }
      />

      {/* Status card */}
      <Card className="glass border-border/40">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-destructive tabular-nums">
                <MaskedAmount amount={outstanding} permission="showBrotherUS" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-sm font-semibold text-muted-foreground tabular-nums">{formatCurrency(EDUCATION_LOAN_PRINCIPAL)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Repaid</span>
              <span className="font-semibold tabular-nums">{pctRepaid.toFixed(1)}% · {formatCurrency(totalRepaid)}</span>
            </div>
            <Progress value={pctRepaid} className="h-2.5 rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Payments',    value: repayments.length.toString() },
              { label: 'Total Repaid',value: formatCurrency(totalRepaid)  },
              { label: 'Remaining',   value: formatCurrency(outstanding)  },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-xl bg-muted/40 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {outstanding === 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs text-success font-medium">Loan fully repaid! 🎉</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Payment History</h3>
        {sorted.length === 0 ? (
          <Card><CardContent className="py-8 text-center">
            <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No repayments recorded yet.</p>
          </CardContent></Card>
        ) : sorted.map(r => (
          <Card key={r.id} className="glass">
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold tabular-nums text-success">{formatCurrency(r.amount)}</p>
                  <Badge variant="outline" className="text-[10px]">{r.mode}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {r.note && ` · ${r.note}`}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(r.id)}>
                <span className="text-xs">✕</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Record Repayment</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Amount (₹) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-sm" required autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Note</Label><Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="h-9 text-sm" placeholder="Optional" /></div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">Record</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
