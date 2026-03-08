
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Banknote, AlertTriangle } from 'lucide-react';
import { LoanService } from '@/services/LoanService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Loan } from '@/lib/db-extended';

const emptyForm = {
  type: 'Personal' as 'Personal' | 'Personal-Brother' | 'Education-Brother',
  borrower: 'Me' as 'Me' | 'Brother',
  principal: '', roi: '', tenureMonths: '', emi: '', outstanding: '',
  startDate: new Date().toISOString().split('T')[0],
};

export function LoanManager() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); setLoans(await LoanService.getAllLoans()); }
    catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { type: form.type, borrower: form.borrower, principal: +form.principal, roi: +form.roi, tenureMonths: +form.tenureMonths, emi: +form.emi, outstanding: +form.outstanding, startDate: new Date(form.startDate), isActive: true };
      editingLoan ? await LoanService.updateLoan(editingLoan.id, data) : await LoanService.createLoan(data);
      toast.success(editingLoan ? 'Loan updated' : 'Loan added');
      setForm({ ...emptyForm }); setShowModal(false); setEditingLoan(null); load();
    } catch { toast.error('Failed to save loan'); }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setForm({ type: loan.type, borrower: loan.borrower, principal: loan.principal.toString(), roi: loan.roi.toString(), tenureMonths: loan.tenureMonths.toString(), emi: loan.emi.toString(), outstanding: loan.outstanding.toString(), startDate: loan.startDate.toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Mark loan as inactive?')) return;
    try { await LoanService.updateLoan(id, { isActive: false }); toast.success('Loan marked inactive'); load(); }
    catch { toast.error('Failed to update loan'); }
  };

  const active = loans.filter(l => l.isActive);
  const totalOut = active.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = active.reduce((s, l) => s + l.emi, 0);
  const hiCount  = active.filter(l => l.roi > 12).length;

  if (loading) return (
    <div className="space-y-3 animate-pulse" aria-busy="true">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Loans & EMIs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track balances and repayment schedules</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)} className="h-9 gap-1.5 shrink-0 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Loan
        </Button>
      </div>

      {/* Summary — 3 equal cols */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Outstanding', value: formatCurrency(totalOut), cls: 'value-negative' },
          { label: 'Monthly EMI', value: formatCurrency(totalEMI), cls: 'text-foreground' },
          { label: 'High Rate',   value: hiCount.toString(),        cls: hiCount > 0 ? 'value-negative' : 'value-positive' },
        ].map(({ label, value, cls }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${cls}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loan List */}
      <div className="space-y-2">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Banknote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No loans recorded yet.</p>
            </CardContent>
          </Card>
        ) : loans.map(loan => (
          <Card key={loan.id} className={`glass ${!loan.isActive ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{loan.type} Loan</h3>
                  <Badge variant={loan.isActive ? 'default' : 'secondary'} className="text-[10px]">{loan.isActive ? 'Active' : 'Closed'}</Badge>
                  <Badge variant="outline" className="text-[10px]">{loan.borrower}</Badge>
                  {loan.roi > 12 && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> High
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(loan)} aria-label="Edit loan"><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(loan.id)} aria-label="Delete loan"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {/* 2-col grid — never 4 on mobile */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {[
                  { label: 'Principal',    val: formatCurrency(loan.principal)  },
                  { label: 'Rate',         val: `${loan.roi}%`                  },
                  { label: 'EMI',          val: formatCurrency(loan.emi)        },
                  { label: 'Outstanding',  val: formatCurrency(loan.outstanding) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <span className="text-muted-foreground">{label}: </span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal" className="text-xs">Personal</SelectItem>
                    <SelectItem value="Personal-Brother" className="text-xs">Personal-Brother</SelectItem>
                    <SelectItem value="Education-Brother" className="text-xs">Education-Brother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Borrower</Label>
                <Select value={form.borrower} onValueChange={(v: any) => setForm(p => ({ ...p, borrower: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Me" className="text-xs">Me</SelectItem>
                    <SelectItem value="Brother" className="text-xs">Brother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {[
              { id: 'principal',    label: 'Principal (₹)',   key: 'principal'    },
              { id: 'roi',          label: 'Interest Rate %', key: 'roi'          },
              { id: 'tenureMonths', label: 'Tenure (months)', key: 'tenureMonths' },
              { id: 'emi',          label: 'EMI (₹)',          key: 'emi'          },
              { id: 'outstanding',  label: 'Outstanding (₹)', key: 'outstanding'  },
            ].map(({ id, label, key }) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs">{label}</Label>
                <Input id={id} type="number" step="0.01" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="h-9 text-sm" required />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="h-9 text-sm" required />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingLoan ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setShowModal(false); setEditingLoan(null); setForm({ ...emptyForm }); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
