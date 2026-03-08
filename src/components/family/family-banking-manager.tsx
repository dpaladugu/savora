/**
 * FamilyBankingManager — §16 + §17
 * Mother & Grandma account CRUD + transfer ledger with running balance,
 * monthly summaries, and from-account linkage.
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { MaskedAmount } from '@/components/ui/masked-value';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import {
  Users2, Plus, Trash2, ArrowRightLeft, Landmark, Edit,
  TrendingDown, CalendarDays, Wallet
} from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { FamilyBankAccount, FamilyTransfer } from '@/lib/db';
import { format, startOfMonth, isSameMonth } from 'date-fns';

const OWNERS        = ['Mother', 'Grandmother'] as const;
const ACCOUNT_TYPES = ['Savings', 'Current', 'FD', 'RD', 'Post Office'] as const;
const TRANSFER_MODES = ['NEFT', 'UPI', 'Cash', 'Cheque', 'IMPS'] as const;
const TRANSFER_TO   = ['Mother', 'Grandmother', 'Brother'] as const;
const PURPOSES      = [
  'Monthly Allowance', 'Medical Expense', 'Festival', 'Household',
  'Education', 'Emergency', 'Loan Repayment', 'Other'
];

const emptyAcctForm = {
  owner: 'Mother' as string, bankName: '', accountNo: '',
  type: 'Savings' as string, currentBalance: '',
};
const emptyTxnForm = {
  toPerson: 'Mother' as string, fromAccountId: '',
  amount: '', purpose: 'Monthly Allowance', mode: 'NEFT' as string,
  date: new Date().toISOString().split('T')[0], notes: '',
};

export function FamilyBankingManager() {
  const accounts  = useLiveQuery(() => db.familyBankAccounts?.toArray()  ?? Promise.resolve([])) || [];
  const transfers = useLiveQuery(() => db.familyTransfers?.toArray()     ?? Promise.resolve([])) || [];

  const [acctModal,  setAcctModal]  = useState(false);
  const [txnModal,   setTxnModal]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [acctForm,   setAcctForm]   = useState({ ...emptyAcctForm });
  const [txnForm,    setTxnForm]    = useState({ ...emptyTxnForm });

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalMother  = accounts.filter(a => a.owner === 'Mother').reduce((s, a) => s + a.currentBalance, 0);
  const totalGrandma = accounts.filter(a => a.owner === 'Grandmother').reduce((s, a) => s + a.currentBalance, 0);
  const totalSent    = transfers.reduce((s, t) => s + t.amount, 0);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return transfers
      .filter(t => isSameMonth(new Date(t.date), now))
      .reduce((s, t) => s + t.amount, 0);
  }, [transfers]);

  // Group transfers by month for timeline view
  const groupedTransfers = useMemo(() => {
    const sorted = [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: Record<string, FamilyTransfer[]> = {};
    sorted.forEach(t => {
      const key = format(new Date(t.date), 'MMM yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [transfers]);

  // ── Accounts CRUD ────────────────────────────────────────────────────────────
  const openAddAcct  = () => { setEditId(null); setAcctForm({ ...emptyAcctForm }); setAcctModal(true); };
  const openEditAcct = (a: FamilyBankAccount) => {
    setEditId(a.id);
    setAcctForm({ owner: a.owner, bankName: a.bankName, accountNo: a.accountNo || '', type: a.type, currentBalance: a.currentBalance.toString() });
    setAcctModal(true);
  };

  const saveAcct = async (e: React.FormEvent) => {
    e.preventDefault();
    const owner = acctForm.owner as 'Mother' | 'Grandmother';
    const data = {
      owner, bankName: acctForm.bankName, accountNo: acctForm.accountNo,
      type: acctForm.type, currentBalance: parseFloat(acctForm.currentBalance) || 0,
      updatedAt: new Date(),
    };
    try {
      if (editId) {
        await db.familyBankAccounts?.update(editId, data);
        toast.success('Account updated');
      } else {
        await db.familyBankAccounts?.add({ id: crypto.randomUUID(), ...data, createdAt: new Date() });
        toast.success('Account added');
      }
      setAcctModal(false);
    } catch { toast.error('Failed to save account'); }
  };

  const deleteAcct = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    await db.familyBankAccounts?.delete(id);
    toast.success('Account deleted');
  };

  // ── Transfers ────────────────────────────────────────────────────────────────
  const saveTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txnForm.amount) || 0;
    if (amt <= 0) { toast.error('Amount must be > 0'); return; }
    try {
      await db.familyTransfers?.add({
        id: crypto.randomUUID(),
        toPerson: txnForm.toPerson as 'Mother' | 'Grandmother' | 'Brother',
        fromAccountId: txnForm.fromAccountId || undefined,
        amount: amt,
        purpose: txnForm.purpose,
        mode: txnForm.mode,
        date: new Date(txnForm.date),
        createdAt: new Date(),
      });

      // ── Deduct from source account (keeps balances accurate) ──────────────
      if (txnForm.fromAccountId) {
        const acct = accounts.find(a => a.id === txnForm.fromAccountId);
        if (acct) {
          const newBalance = Math.max(0, acct.currentBalance - amt);
          await db.familyBankAccounts?.update(txnForm.fromAccountId, {
            currentBalance: newBalance,
            updatedAt: new Date(),
          });
        }
      }

      toast.success('Transfer recorded');
      setTxnModal(false);
      setTxnForm({ ...emptyTxnForm });
    } catch { toast.error('Failed to record transfer'); }
  };

  const deleteTransfer = async (id: string) => {
    if (!confirm('Delete this transfer?')) return;
    await db.familyTransfers?.delete(id);
    toast.success('Transfer deleted');
  };

  const getAccountLabel = (id: string) => {
    const a = accounts.find(a => a.id === id);
    return a ? `${a.bankName} (${a.owner})` : 'Unknown';
  };

  const PERSON_COLORS: Record<string, string> = {
    Mother:      'bg-pink-500/15 text-pink-600 border-pink-300/40',
    Grandmother: 'bg-violet-500/15 text-violet-600 border-violet-300/40',
    Brother:     'bg-blue-500/15 text-blue-600 border-blue-300/40',
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Family Banking"
        subtitle="§16 & §17 — Accounts + Transfer Ledger"
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

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Mother's Balance",   amt: totalMother  },
          { label: "Grandma's Balance",  amt: totalGrandma },
          { label: "This Month Out",     amt: thisMonthTotal, negative: true },
        ].map(({ label, amt, negative }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${negative ? 'value-negative' : 'text-foreground'}`}>
                <MaskedAmount amount={amt} permission="showSalary" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="w-full h-9 rounded-xl">
          <TabsTrigger value="accounts"  className="flex-1 text-xs rounded-lg">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="transfers" className="flex-1 text-xs rounded-lg">Ledger ({transfers.length})</TabsTrigger>
        </TabsList>

        {/* ── Accounts Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="accounts" className="space-y-2 mt-3">
          {accounts.length === 0 ? (
            <Card><CardContent className="py-10 text-center">
              <Landmark className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No accounts added yet.</p>
              <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1" onClick={openAddAcct}>
                <Plus className="h-3.5 w-3.5" /> Add first account
              </Button>
            </CardContent></Card>
          ) : (
            <>
              {(['Mother', 'Grandmother'] as const).map(owner => {
                const ownerAccounts = accounts.filter(a => a.owner === owner);
                if (!ownerAccounts.length) return null;
                const ownerTotal = ownerAccounts.reduce((s, a) => s + a.currentBalance, 0);
                return (
                  <div key={owner} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-semibold text-muted-foreground">{owner}</p>
                      <p className="text-xs font-bold text-foreground"><MaskedAmount amount={ownerTotal} permission="showSalary" /></p>
                    </div>
                    {ownerAccounts.map(a => (
                      <Card key={a.id} className="glass">
                        <CardContent className="p-4 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{a.bankName}</p>
                              <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                            </div>
                            {a.accountNo && <p className="text-xs text-muted-foreground mt-0.5">····{a.accountNo.slice(-4)}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-sm font-bold tabular-nums text-foreground">
                              <MaskedAmount amount={a.currentBalance} permission="showSalary" />
                            </p>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEditAcct(a)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteAcct(a.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Separator className="opacity-30" />
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* ── Transfer Ledger Tab ─────────────────────────────────────────────── */}
        <TabsContent value="transfers" className="space-y-4 mt-3">
          {transfers.length === 0 ? (
            <Card><CardContent className="py-10 text-center">
              <ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No transfers recorded yet.</p>
            </CardContent></Card>
          ) : (
            <>
              {/* Total sent */}
              <Card className="glass border-border/60">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Transferred</p>
                      <p className="text-sm font-bold value-negative">
                        <MaskedAmount amount={totalSent} permission="showSalary" />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-sm font-bold value-negative">
                      <MaskedAmount amount={thisMonthTotal} permission="showSalary" />
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly groups */}
              {Object.entries(groupedTransfers).map(([month, txns]) => {
                const monthTotal = txns.reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={month} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground">{month}</p>
                      </div>
                      <p className="text-xs font-bold value-negative">{formatCurrency(monthTotal)}</p>
                    </div>
                    {txns.map(t => (
                      <Card key={t.id} className="glass">
                        <CardContent className="p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className={`text-[10px] border ${PERSON_COLORS[t.toPerson] || 'bg-muted'}`}>
                                → {t.toPerson}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{t.mode}</Badge>
                            </div>
                            <p className="text-sm font-medium mt-0.5">{t.purpose}</p>
                            {t.fromAccountId && (
                              <p className="text-[10px] text-muted-foreground">
                                From: {getAccountLabel(t.fromAccountId)}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-sm font-bold value-negative tabular-nums">
                              <MaskedAmount amount={t.amount} permission="showSalary" />
                            </p>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => deleteTransfer(t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Account Modal ────────────────────────────────────────────────── */}
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
            <div className="space-y-1">
              <Label className="text-xs">Bank Name *</Label>
              <Input value={acctForm.bankName} onChange={e => setAcctForm(f => ({ ...f, bankName: e.target.value }))} className="h-9 text-sm" required placeholder="e.g. SBI, Post Office" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number <span className="text-muted-foreground">(last 4 digits OK)</span></Label>
              <Input value={acctForm.accountNo} onChange={e => setAcctForm(f => ({ ...f, accountNo: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Current Balance (₹)</Label>
              <Input type="number" value={acctForm.currentBalance} onChange={e => setAcctForm(f => ({ ...f, currentBalance: e.target.value }))} className="h-9 text-sm" placeholder="0" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editId ? 'Update' : 'Add Account'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setAcctModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Record Transfer Modal ─────────────────────────────────────────────── */}
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
            {accounts.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">From Account <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={txnForm.fromAccountId} onValueChange={v => setTxnForm(f => ({ ...f, fromAccountId: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select source account" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">None / Cash</SelectItem>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">{a.bankName} ({a.owner}) · {formatCurrency(a.currentBalance)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Purpose *</Label>
              <Select value={txnForm.purpose} onValueChange={v => setTxnForm(f => ({ ...f, purpose: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount (₹) *</Label>
              <Input type="number" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-sm" required placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={txnForm.date} onChange={e => setTxnForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">Record Transfer</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setTxnModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
