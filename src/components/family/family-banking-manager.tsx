/**
 * FamilyBankingManager — Mother & Grandma account CRUD + transfer ledger.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { MaskedAmount } from '@/components/ui/masked-value';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { Users2, Plus, Trash2, ArrowRightLeft, Landmark, Edit } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { FamilyBankAccount, FamilyTransfer } from '@/lib/db';

const OWNERS  = ['Mother', 'Grandmother'] as const;
const ACCOUNT_TYPES = ['Savings', 'Current', 'FD', 'RD'] as const;
const TRANSFER_MODES = ['NEFT', 'UPI', 'Cash', 'Cheque'] as const;
const TRANSFER_TO = ['Mother', 'Grandmother', 'Brother'] as const;

const emptyAcctForm = { owner: 'Mother' as string, bankName: '', accountNo: '', type: 'Savings' as string, currentBalance: '' };
const emptyTxnForm  = { toPerson: 'Mother' as string, amount: '', purpose: '', mode: 'NEFT' as string, date: new Date().toISOString().split('T')[0] };

export function FamilyBankingManager() {
  const accounts  = useLiveQuery(() => db.familyBankAccounts?.toArray()  ?? Promise.resolve([])) || [];
  const transfers = useLiveQuery(() => db.familyTransfers?.toArray()     ?? Promise.resolve([])) || [];

  const [acctModal,  setAcctModal]  = useState(false);
  const [txnModal,   setTxnModal]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [acctForm,   setAcctForm]   = useState({ ...emptyAcctForm });
  const [txnForm,    setTxnForm]    = useState({ ...emptyTxnForm });

  // ── Accounts ────────────────────────────────────────────────────────────────
  const openAddAcct = () => { setEditId(null); setAcctForm({ ...emptyAcctForm }); setAcctModal(true); };
  const openEditAcct = (a: FamilyBankAccount) => {
    setEditId(a.id);
    setAcctForm({ owner: a.owner, bankName: a.bankName, accountNo: a.accountNo || '', type: a.type, currentBalance: a.currentBalance.toString() });
    setAcctModal(true);
  };

  const saveAcct = async (e: React.FormEvent) => {
    e.preventDefault();
    const owner = acctForm.owner as 'Mother' | 'Grandmother';
    const data = { owner, bankName: acctForm.bankName, accountNo: acctForm.accountNo, type: acctForm.type, currentBalance: parseFloat(acctForm.currentBalance) || 0, updatedAt: new Date() };
    try {
      if (editId) { await db.familyBankAccounts?.update(editId, data); toast.success('Account updated'); }
      else { await db.familyBankAccounts?.add({ id: crypto.randomUUID(), ...data, createdAt: new Date() }); toast.success('Account added'); }
      setAcctModal(false);
    } catch { toast.error('Failed to save account'); }
  };

  const deleteAcct = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    await db.familyBankAccounts?.delete(id);
    toast.success('Account deleted');
  };

  // ── Transfers ───────────────────────────────────────────────────────────────
  const saveTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.familyTransfers?.add({
        id: crypto.randomUUID(),
        toPerson: txnForm.toPerson as 'Mother' | 'Grandmother' | 'Brother',
        amount: parseFloat(txnForm.amount) || 0,
        purpose: txnForm.purpose, mode: txnForm.mode,
        date: new Date(txnForm.date), createdAt: new Date(),
      });
      toast.success('Transfer recorded');
      setTxnModal(false);
      setTxnForm({ ...emptyTxnForm });
    } catch { toast.error('Failed to record transfer'); }
  };

  const totalMother    = accounts.filter(a => a.owner === 'Mother').reduce((s, a) => s + a.currentBalance, 0);
  const totalGrandma   = accounts.filter(a => a.owner === 'Grandmother').reduce((s, a) => s + a.currentBalance, 0);
  const recentTransfers = [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Family Banking"
        subtitle="Mother & Grandma accounts + transfers"
        icon={Users2}
        action={
          <div className="flex gap-1.5">
            <Button size="sm" onClick={openAddAcct} className="h-9 text-xs gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Account
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTxnModal(true)} className="h-9 text-xs gap-1 rounded-xl">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
            </Button>
          </div>
        }
      />

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-2">
        {[{ label: "Mother's Accounts", amt: totalMother }, { label: "Grandma's Accounts", amt: totalGrandma }].map(({ label, amt }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-bold tabular-nums text-foreground"><MaskedAmount amount={amt} permission="showSalary" /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="w-full h-9 rounded-xl">
          <TabsTrigger value="accounts" className="flex-1 text-xs rounded-lg">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="transfers" className="flex-1 text-xs rounded-lg">Transfers ({transfers.length})</TabsTrigger>
        </TabsList>

        {/* ── Accounts Tab ── */}
        <TabsContent value="accounts" className="space-y-2 mt-3">
          {accounts.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <Landmark className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No accounts added yet.</p>
            </CardContent></Card>
          ) : accounts.map(a => (
            <Card key={a.id} className="glass">
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{a.bankName}</p>
                    <Badge variant="secondary" className="text-[10px]">{a.owner}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                  </div>
                  {a.accountNo && <p className="text-xs text-muted-foreground mt-0.5">····{a.accountNo.slice(-4)}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <p className="text-sm font-bold tabular-nums"><MaskedAmount amount={a.currentBalance} permission="showSalary" /></p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEditAcct(a)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteAcct(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Transfers Tab ── */}
        <TabsContent value="transfers" className="space-y-2 mt-3">
          {recentTransfers.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No transfers recorded yet.</p>
            </CardContent></Card>
          ) : recentTransfers.map(t => (
            <Card key={t.id} className="glass">
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium">To {t.toPerson}</p>
                    <Badge variant="outline" className="text-[10px]">{t.mode}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.purpose} · {new Date(t.date).toLocaleDateString('en-IN')}</p>
                </div>
                <p className="text-sm font-bold tabular-nums value-negative shrink-0"><MaskedAmount amount={t.amount} permission="showSalary" /></p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Account Modal */}
      <Dialog open={acctModal} onOpenChange={setAcctModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>{editId ? 'Edit Account' : 'Add Account'}</DialogTitle></DialogHeader>
          <form onSubmit={saveAcct} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Owner</Label>
                <Select value={acctForm.owner} onValueChange={v => setAcctForm(f => ({ ...f, owner: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{OWNERS.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Account Type</Label>
                <Select value={acctForm.type} onValueChange={v => setAcctForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Bank Name *</Label><Input value={acctForm.bankName} onChange={e => setAcctForm(f => ({ ...f, bankName: e.target.value }))} className="h-9 text-sm" required /></div>
            <div className="space-y-1"><Label className="text-xs">Account Number</Label><Input value={acctForm.accountNo} onChange={e => setAcctForm(f => ({ ...f, accountNo: e.target.value }))} className="h-9 text-sm" placeholder="Last 4 digits OK" /></div>
            <div className="space-y-1"><Label className="text-xs">Current Balance (₹)</Label><Input type="number" value={acctForm.currentBalance} onChange={e => setAcctForm(f => ({ ...f, currentBalance: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editId ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setAcctModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Transfer Modal */}
      <Dialog open={txnModal} onOpenChange={setTxnModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Record Transfer</DialogTitle></DialogHeader>
          <form onSubmit={saveTxn} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">To Person</Label>
                <Select value={txnForm.toPerson} onValueChange={v => setTxnForm(f => ({ ...f, toPerson: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSFER_TO.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={txnForm.mode} onValueChange={v => setTxnForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSFER_MODES.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Amount (₹) *</Label><Input type="number" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-sm" required /></div>
            <div className="space-y-1"><Label className="text-xs">Purpose *</Label><Input value={txnForm.purpose} onChange={e => setTxnForm(f => ({ ...f, purpose: e.target.value }))} className="h-9 text-sm" placeholder="e.g. Monthly allowance" required /></div>
            <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={txnForm.date} onChange={e => setTxnForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" /></div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">Record</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setTxnModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
