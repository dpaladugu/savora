
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import {
  Trash2, Plus, Edit, CreditCard as CreditCardIcon,
  Gift, ShieldAlert, Calendar, Zap, TrendingUp, Star,
  AlertTriangle, CheckCircle2, Info, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { formatCurrency } from "@/lib/format-utils";
import type { CreditCard } from "@/types/financial";
import { format, differenceInDays, addDays } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nextDueDate(dueDay: number): Date {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return d;
}

function utilizationColor(pct: number) {
  if (pct >= 80) return 'text-destructive';
  if (pct >= 30) return 'text-warning';
  return 'text-success';
}

function dueUrgency(daysAway: number) {
  if (daysAway <= 3)  return { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' };
  if (daysAway <= 7)  return { color: 'text-warning',     bg: 'bg-warning/10 border-warning/30' };
  return               { color: 'text-muted-foreground',  bg: 'bg-muted/30 border-border/40' };
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const emptyForm = {
  name: '', bankName: '', last4: '', network: 'Visa',
  creditLimit: '', currentBalance: '', dueDay: '5', stmtDay: '28',
  annualFee: '', feeWaiverSpend: '', feeWaiverRule: '',
  rewardPointsBalance: '', rewardCategory: '',
  milestone1Spend: '', milestone1Reward: '',
  milestone2Spend: '', milestone2Reward: '',
  paymentMethod: 'NACH Auto-Pay',
  notes: '',
};

type FormState = typeof emptyForm;

// ─── Log Payment inline button ────────────────────────────────────────────────
function LogPaymentButton({ card }: { card: CreditCard }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      const newBal = Math.max(0, (card.currentBalance ?? 0) - amt);
      await db.creditCards.update(card.id, { currentBalance: newBal, updatedAt: new Date() });
      // Also add as an expense entry so balance sheet stays consistent
      await db.expenses.add({
        id: crypto.randomUUID(),
        description: `CC Payment — ${card.name}`,
        amount: amt,
        category: 'Credit Card Payment',
        date: new Date() as any,
        paymentMethod: card.paymentMethod ?? 'Bank Transfer',
        tags: [],
        account: card.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success(`₹${amt.toLocaleString('en-IN')} payment logged for ${card.name}`);
      setAmount('');
      setOpen(false);
    } catch (e: any) { toast.error(`Failed: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs gap-1.5 border-success/30 text-success hover:bg-success/5"
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 className="h-3 w-3" /> Log Payment
      </Button>
      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Log Payment — {card.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Amount (₹)</Label>
              <Input
                type="number"
                placeholder={`Outstanding: ₹${(card.currentBalance ?? 0).toLocaleString('en-IN')}`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 h-9 text-xs" disabled={saving}>
                {saving ? 'Saving…' : 'Log Payment'}
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CreditCardManager() {
  const cards = useLiveQuery(() => db.creditCards.toArray().catch(() => []), []) ?? [];

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<FormState>({ ...emptyForm });
  const [tab,       setTab]       = useState('cards');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (c: CreditCard) => {
    setEditId(c.id);
    setForm({
      name: c.name ?? '',
      bankName: c.bankName ?? '',
      last4: c.last4 ?? c.lastFourDigits ?? '',
      network: c.network ?? 'Visa',
      creditLimit: String(c.creditLimit ?? ''),
      currentBalance: String(c.currentBalance ?? ''),
      dueDay: String(c.dueDay ?? c.dueDate?.slice(8, 10) ?? '5'),
      stmtDay: String(c.stmtDay ?? '28'),
      annualFee: String(c.annualFee ?? ''),
      feeWaiverSpend: String((c as any).feeWaiverSpend ?? ''),
      feeWaiverRule: c.feeWaiverRule ?? '',
      rewardPointsBalance: String(c.rewardPointsBalance ?? ''),
      rewardCategory: (c as any).rewardCategory ?? '',
      milestone1Spend: String((c as any).milestone1Spend ?? ''),
      milestone1Reward: (c as any).milestone1Reward ?? '',
      milestone2Spend: String((c as any).milestone2Spend ?? ''),
      milestone2Reward: (c as any).milestone2Reward ?? '',
      paymentMethod: c.paymentMethod ?? 'NACH Auto-Pay',
      notes: (c as any).notes ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name: form.name,
      bankName: form.bankName,
      issuer: form.bankName,
      last4: form.last4 || '0000',
      lastFourDigits: form.last4 || '0000',
      network: form.network,
      creditLimit: parseFloat(form.creditLimit) || 0,
      limit: parseFloat(form.creditLimit) || 0,
      currentBalance: parseFloat(form.currentBalance) || 0,
      dueDay: parseInt(form.dueDay) || 5,
      stmtDay: parseInt(form.stmtDay) || 28,
      annualFee: parseFloat(form.annualFee) || 0,
      feeWaiverSpend: parseFloat(form.feeWaiverSpend) || 0,
      feeWaiverRule: form.feeWaiverRule,
      rewardPointsBalance: parseFloat(form.rewardPointsBalance) || 0,
      rewardCategory: form.rewardCategory,
      milestone1Spend: parseFloat(form.milestone1Spend) || 0,
      milestone1Reward: form.milestone1Reward,
      milestone2Spend: parseFloat(form.milestone2Spend) || 0,
      milestone2Reward: form.milestone2Reward,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      isActive: true,
      updatedAt: new Date(),
    };
    try {
      if (editId) {
        await db.creditCards.update(editId, data);
        toast.success('Card updated');
      } else {
        await db.creditCards.add({ ...data, id: crypto.randomUUID(), createdAt: new Date() });
        toast.success('Card added');
      }
      setShowModal(false);
    } catch (e: any) { toast.error(`Failed: ${e.message}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    await db.creditCards.delete(id);
    toast.success('Card deleted');
  };

  // ── Sync balance from expenses in current billing cycle ──────────────────────
  const [syncing, setSyncing] = useState(false);
  const handleSyncBalances = async () => {
    setSyncing(true);
    try {
      const now = new Date();
      let updated = 0;
      for (const card of cards) {
        const stmtDay = card.stmtDay ?? 28;
        // Billing cycle: from last statement day to next statement day
        let cycleStart = new Date(now.getFullYear(), now.getMonth(), stmtDay);
        if (cycleStart > now) cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, stmtDay);

        const allExp   = await db.expenses.toArray().catch(() => []);
        const allTxns2 = await db.txns.toArray().catch(() => []);

        const cycleSpend = [
          ...allExp.filter(e => {
            const d = e.date instanceof Date ? e.date : new Date(e.date as any);
            return d >= cycleStart && d <= now && (e.account === card.name || e.account === card.last4 || e.account?.includes(card.bankName ?? ''));
          }).map(e => Math.abs(e.amount)),
          ...allTxns2.filter(t => {
            const d = t.date instanceof Date ? t.date : new Date(t.date as any);
            return t.amount < 0 && d >= cycleStart && d <= now && (t.account === card.name || t.account === card.last4);
          }).map(t => Math.abs(t.amount)),
        ].reduce((s, a) => s + a, 0);

        if (cycleSpend > 0) {
          await db.creditCards.update(card.id, { currentBalance: cycleSpend, updatedAt: new Date() });
          updated++;
        }
      }
      toast.success(updated > 0 ? `✓ Synced ${updated} card balance${updated > 1 ? 's' : ''} from expenses` : 'No matching expense entries found for billing cycles');
    } catch (e: any) { toast.error(`Sync failed: ${e.message}`); }
    finally { setSyncing(false); }
  };

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const totalBalance     = cards.reduce((s, c) => s + (c.currentBalance ?? 0), 0);
  const totalLimit       = cards.reduce((s, c) => s + (c.creditLimit ?? c.limit ?? 0), 0);
  const totalAnnualFees  = cards.reduce((s, c) => s + (c.annualFee ?? 0), 0);
  const overallUtil      = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  const totalPoints      = cards.reduce((s, c) => s + (c.rewardPointsBalance ?? 0), 0);

  // Due this week
  const dueThisWeek = cards.filter(c => {
    const dd = c.dueDay ?? 5;
    const due = nextDueDate(dd);
    return differenceInDays(due, new Date()) <= 7;
  });

  // Fee waiver at-risk cards
  const feeWaiverAtRisk = cards.filter(c => {
    const waiver = (c as any).feeWaiverSpend ?? 0;
    return c.annualFee > 0 && waiver > 0 && (c.currentBalance ?? 0) < waiver;
  });

  const activeCards = cards.filter(c => c.isActive !== false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credit Cards"
        subtitle={`${activeCards.length} cards · ${formatCurrency(totalLimit)} total limit`}
        icon={CreditCardIcon}
        action={
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={handleSyncBalances} disabled={syncing} className="h-9 text-xs gap-1 rounded-xl">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync
            </Button>
            <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add Card
            </Button>
          </div>
        }
      />

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      {cards.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Total Balance',  value: formatCurrency(totalBalance),  cls: totalBalance > 0 ? 'text-destructive' : 'text-success' },
            { label: 'Total Limit',    value: formatCurrency(totalLimit),    cls: 'text-foreground' },
            { label: 'Utilization',    value: `${overallUtil}%`,             cls: utilizationColor(overallUtil) },
            { label: 'Reward Points',  value: totalPoints.toLocaleString('en-IN'), cls: 'text-primary' },
          ].map(({ label, value, cls }) => (
            <Card key={label} className="glass">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                <p className={`text-sm font-bold tabular-nums ${cls}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {dueThisWeek.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/25 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>{dueThisWeek.length} card{dueThisWeek.length > 1 ? 's' : ''} due within 7 days:</strong>{' '}
            {dueThisWeek.map(c => c.name).join(', ')}
          </p>
        </div>
      )}
      {feeWaiverAtRisk.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-warning/8 border border-warning/25 text-xs text-warning">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>Fee waiver at risk:</strong>{' '}
            {feeWaiverAtRisk.map(c => `${c.name} (₹${((c as any).feeWaiverSpend ?? 0).toLocaleString('en-IN')} spend req.)`).join(', ')}
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="cards"    className="flex-1 text-xs">Cards ({activeCards.length})</TabsTrigger>
          <TabsTrigger value="rewards"  className="flex-1 text-xs">Rewards & Fees</TabsTrigger>
          <TabsTrigger value="dues"     className="flex-1 text-xs">Due Dates</TabsTrigger>
        </TabsList>

        {/* ── Cards tab ────────────────────────────────────────────────────── */}
        <TabsContent value="cards" className="mt-3 space-y-2">
          {activeCards.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CreditCardIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No cards added yet.</p>
                <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
                  <Plus className="h-3.5 w-3.5" /> Add first card
                </Button>
              </CardContent>
            </Card>
          ) : activeCards.map(card => {
            const limit = card.creditLimit ?? card.limit ?? 0;
            const bal   = card.currentBalance ?? 0;
            const util  = limit > 0 ? Math.round((bal / limit) * 100) : 0;
            const dd    = card.dueDay ?? 5;
            const due   = nextDueDate(dd);
            const daysAway = differenceInDays(due, new Date());
            const urgency  = dueUrgency(daysAway);

            return (
              <Card key={card.id} className="glass">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <CreditCardIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.bankName}{card.last4 ? ` ···${card.last4}` : ''} · {card.network}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${utilizationColor(util)} border-current/40`}>
                        {util}% used
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(card)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(card.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="space-y-1">
                    <Progress value={Math.min(util, 100)} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                      <span>Balance: <span className="font-medium text-foreground">{formatCurrency(bal)}</span></span>
                      <span>Limit: <span className="font-medium text-foreground">{formatCurrency(limit)}</span></span>
                    </div>
                  </div>

                  {/* Due date + reward points + fee */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${urgency.bg} ${urgency.color}`}>
                      <Calendar className="h-3 w-3" />
                      Due {format(due, 'dd MMM')} ({daysAway}d)
                    </span>
                    {(card.rewardPointsBalance ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border bg-primary/8 border-primary/25 text-primary">
                        <Star className="h-3 w-3" />
                        {(card.rewardPointsBalance ?? 0).toLocaleString('en-IN')} pts
                      </span>
                    )}
                    {card.annualFee > 0 && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border bg-muted/30 border-border/40 text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        ₹{card.annualFee.toLocaleString('en-IN')} fee
                        {card.feeWaiverRule && <span className="text-success font-medium ml-0.5">· Waivable</span>}
                      </span>
                    )}
                  </div>

                  {/* Fee waiver progress */}
                  {card.annualFee > 0 && (card as any).feeWaiverSpend > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Fee waiver progress</span>
                        <span>{formatCurrency(bal)} / {formatCurrency((card as any).feeWaiverSpend)} spent</span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.round((bal / (card as any).feeWaiverSpend) * 100))}
                        className="h-1"
                      />
                      <p className="text-[10px] text-muted-foreground">{card.feeWaiverRule}</p>
                    </div>
                  )}

                  {/* Log Payment button */}
                  {bal > 0 && (
                    <LogPaymentButton card={card} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Rewards & Fees tab ───────────────────────────────────────────── */}
        <TabsContent value="rewards" className="mt-3 space-y-3">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-xs text-primary">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>Total annual fees: <strong>{formatCurrency(totalAnnualFees)}</strong> · Total reward points: <strong>{totalPoints.toLocaleString('en-IN')}</strong></p>
          </div>
          {cards.map(card => {
            const hasMilestone = (card as any).milestone1Spend > 0 || (card as any).milestone2Spend > 0;
            return (
              <Card key={card.id} className="glass">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{card.name}</p>
                    {card.annualFee > 0
                      ? <Badge variant="outline" className="text-[10px] text-warning border-warning/40">₹{card.annualFee.toLocaleString('en-IN')} fee</Badge>
                      : <Badge className="text-[10px] bg-success/15 text-success border-success/30">No fee</Badge>
                    }
                  </div>
                  {(card as any).rewardCategory && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Best for: <strong className="text-foreground">{(card as any).rewardCategory}</strong>
                    </p>
                  )}
                  {(card.rewardPointsBalance ?? 0) > 0 && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Star className="h-3 w-3" /> {(card.rewardPointsBalance ?? 0).toLocaleString('en-IN')} reward points
                    </p>
                  )}
                  {card.feeWaiverRule && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Waiver: {card.feeWaiverRule}
                    </p>
                  )}
                  {hasMilestone && (
                    <div className="space-y-1 pt-1 border-t border-border/30">
                      {(card as any).milestone1Spend > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          🎯 Milestone 1: Spend {formatCurrency((card as any).milestone1Spend)} → {(card as any).milestone1Reward}
                        </p>
                      )}
                      {(card as any).milestone2Spend > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          🎯 Milestone 2: Spend {formatCurrency((card as any).milestone2Spend)} → {(card as any).milestone2Reward}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Due Dates tab ────────────────────────────────────────────────── */}
        <TabsContent value="dues" className="mt-3 space-y-2">
          {[...cards]
            .sort((a, b) => {
              const da = differenceInDays(nextDueDate(a.dueDay ?? 5), new Date());
              const db_ = differenceInDays(nextDueDate(b.dueDay ?? 5), new Date());
              return da - db_;
            })
            .map(card => {
              const dd       = card.dueDay ?? 5;
              const due      = nextDueDate(dd);
              const daysAway = differenceInDays(due, new Date());
              const urgency  = dueUrgency(daysAway);
              const bal      = card.currentBalance ?? 0;
              return (
                <Card key={card.id} className={`glass border ${urgency.bg}`}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{card.name}</p>
                      <p className={`text-xs ${urgency.color}`}>
                        Due {format(due, 'dd MMM yyyy')} · {daysAway === 0 ? 'Today!' : `${daysAway}d away`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${bal > 0 ? 'text-destructive' : 'text-success'}`}>
                        {bal > 0 ? formatCurrency(bal) : 'Nil'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{card.paymentMethod ?? '—'}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          }
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editId ? 'Edit Card' : 'Add Credit Card'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            {/* Identity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Card Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HDFC Regalia" required className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bank / Issuer *</Label>
                <Input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="HDFC" required className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last 4 Digits</Label>
                <Input value={form.last4} onChange={e => set('last4', e.target.value)} placeholder="1234" maxLength={4} className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Network</Label>
                <Select value={form.network} onValueChange={v => set('network', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Visa', 'Mastercard', 'Rupay', 'Amex', 'Diners'].map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => set('paymentMethod', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['NACH Auto-Pay', 'UPI', 'NEFT', 'In App', 'Cheque'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Limits & Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Credit Limit (₹) *</Label>
                <Input type="number" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} required className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Current Balance (₹)</Label>
                <Input type="number" value={form.currentBalance} onChange={e => set('currentBalance', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due Day (1-31)</Label>
                <Input type="number" min="1" max="31" value={form.dueDay} onChange={e => set('dueDay', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Statement Day</Label>
                <Input type="number" min="1" max="31" value={form.stmtDay} onChange={e => set('stmtDay', e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Annual Fee (₹)</Label>
                <Input type="number" value={form.annualFee} onChange={e => set('annualFee', e.target.value)} placeholder="0 = free" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fee Waiver Spend (₹)</Label>
                <Input type="number" value={form.feeWaiverSpend} onChange={e => set('feeWaiverSpend', e.target.value)} placeholder="e.g. 200000" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Fee Waiver Condition</Label>
                <Input value={form.feeWaiverRule} onChange={e => set('feeWaiverRule', e.target.value)} placeholder="e.g. Spend ₹2L/yr" className="h-8 text-sm" />
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Reward Points Balance</Label>
                <Input type="number" value={form.rewardPointsBalance} onChange={e => set('rewardPointsBalance', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Best Rewards Category</Label>
                <Input value={form.rewardCategory} onChange={e => set('rewardCategory', e.target.value)} placeholder="e.g. Travel, Dining" className="h-8 text-sm" />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-1 border-t border-border/30 pt-2">
              <Label className="text-xs text-muted-foreground">Milestone Rewards (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={form.milestone1Spend} onChange={e => set('milestone1Spend', e.target.value)} placeholder="M1 spend (₹)" className="h-8 text-sm" />
                <Input value={form.milestone1Reward} onChange={e => set('milestone1Reward', e.target.value)} placeholder="M1 reward" className="h-8 text-sm" />
                <Input type="number" value={form.milestone2Spend} onChange={e => set('milestone2Spend', e.target.value)} placeholder="M2 spend (₹)" className="h-8 text-sm" />
                <Input value={form.milestone2Reward} onChange={e => set('milestone2Reward', e.target.value)} placeholder="M2 reward" className="h-8 text-sm" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any special notes…" className="text-sm resize-none" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editId ? 'Update' : 'Add Card'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
