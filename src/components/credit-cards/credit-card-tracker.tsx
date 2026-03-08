/**
 * CreditCardTracker — Dexie-backed, replaces old localStorage version.
 * Uses CreditCardService for all persistence so data flows to
 * Net Worth, Debt Strike, and Dashboard calculations.
 */
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, CreditCard, Percent, Trash2, Edit3, X,
  Calendar, IndianRupee, CalendarDays, AlertTriangle,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format-utils";
import { toast } from "sonner";
import { CreditCardService } from "@/services/CreditCardService";
import type { CreditCard as CreditCardType } from "@/types/financial";

// ─── helpers ─────────────────────────────────────────────────────────────────
function daysUntilDue(dueDay: number): number {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth <= today) thisMonth.setMonth(thisMonth.getMonth() + 1);
  return Math.ceil((thisMonth.getTime() - today.getTime()) / 86_400_000);
}

function dueBadge(dueDay: number) {
  const d = daysUntilDue(dueDay);
  if (d <= 3)  return <Badge variant="destructive" className="text-[10px]">Due in {d}d</Badge>;
  if (d <= 7)  return <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30 border">Due in {d}d</Badge>;
  return <Badge variant="outline" className="text-[10px] text-muted-foreground">{d}d to due</Badge>;
}

const PAYMENT_METHODS = ['UPI', 'NEFT', 'NACH Auto-Pay', 'In App', 'Cheque'] as const;
const NETWORKS = ['Visa', 'Mastercard', 'Rupay', 'Amex', 'Diners'] as const;

// ─── empty form ──────────────────────────────────────────────────────────────
const emptyForm = {
  bankName: '',
  cardName: '',
  network: 'Visa',
  lastFourDigits: '',
  creditLimit: '',
  currentBalance: '',
  annualFee: '',
  feeWaiverRule: '',
  dueDate: '',
  anniversaryDate: '',
  paymentMethod: 'UPI' as string,
  isActive: true,
};

// ─── Card Form (add / edit) ───────────────────────────────────────────────────
function CardForm({
  initial,
  onSubmit,
  onCancel,
  isEdit,
}: {
  initial: typeof emptyForm;
  onSubmit: (data: typeof emptyForm) => void;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const [form, setForm] = useState(initial);
  const f = (key: keyof typeof emptyForm, val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <Card className="glass border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{isEdit ? 'Edit Card' : 'Add Credit Card'}</h3>
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); onSubmit(form); }}
          className="space-y-3"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name *</Label>
              <Input value={form.bankName} onChange={e => f('bankName', e.target.value)} required className="h-10" placeholder="HDFC / ICICI / Axis" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Card Name *</Label>
              <Input value={form.cardName} onChange={e => f('cardName', e.target.value)} required className="h-10" placeholder="Regalia / Swiggy" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Last 4 Digits *</Label>
              <Input value={form.lastFourDigits} maxLength={4} onChange={e => f('lastFourDigits', e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Network</Label>
              <Select value={form.network} onValueChange={v => f('network', v)}>
                <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{NETWORKS.map(n => <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Credit Limit (₹) *</Label>
              <Input type="number" value={form.creditLimit} onChange={e => f('creditLimit', e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Current Balance (₹)</Label>
              <Input type="number" value={form.currentBalance} onChange={e => f('currentBalance', e.target.value)} className="h-10" placeholder="Outstanding" />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Annual Fee (₹)</Label>
              <Input type="number" value={form.annualFee} onChange={e => f('annualFee', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date (day of month)</Label>
              <Input type="number" min="1" max="31" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} className="h-10" placeholder="5" />
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Anniversary Date</Label>
              <Input type="date" value={form.anniversaryDate} onChange={e => f('anniversaryDate', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => f('paymentMethod', v)}>
                <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Fee Waiver */}
          <div className="space-y-1.5">
            <Label className="text-xs">Fee Waiver Rule</Label>
            <Input value={form.feeWaiverRule} onChange={e => f('feeWaiverRule', e.target.value)} className="h-10" placeholder="e.g. Spend ₹2L/yr" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 h-10 text-xs" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="flex-1 h-10 text-xs">{isEdit ? 'Update Card' : 'Add Card'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function CreditCardTracker() {
  const cards = useLiveQuery(() => db.creditCards.toArray(), []) ?? [];
  const [showForm, setShowForm]         = useState(false);
  const [editingCard, setEditingCard]   = useState<CreditCardType | null>(null);

  const totalLimit   = cards.reduce((s, c) => s + (c.creditLimit   ?? 0), 0);
  const totalBalance = cards.reduce((s, c) => s + (c.currentBalance ?? 0), 0);
  const activeCards  = cards.filter(c => c.isActive !== false);
  const utilPct      = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  const dueSoon      = cards.filter(c => c.dueDay && daysUntilDue(c.dueDay) <= 7);

  const handleAdd = async (form: typeof emptyForm) => {
    try {
      await CreditCardService.addCreditCard({
        name:            `${form.bankName} ${form.cardName}`,
        bankName:        form.bankName,
        cardName:        form.cardName,
        network:         form.network as any,
        lastFourDigits:  form.lastFourDigits,
        creditLimit:     Number(form.creditLimit) || 0,
        currentBalance:  Number(form.currentBalance) || 0,
        annualFee:       Number(form.annualFee) || 0,
        feeWaiverRule:   form.feeWaiverRule,
        dueDay:          Number(form.dueDate) || 0,
        anniversaryDate: form.anniversaryDate,
        paymentMethod:   form.paymentMethod as any,
        isActive:        true,
        statementDate:   0,
        createdAt:       new Date(),
        updatedAt:       new Date(),
      });
      toast.success('Credit card added');
      setShowForm(false);
    } catch {
      toast.error('Failed to add card');
    }
  };

  const handleUpdate = async (form: typeof emptyForm) => {
    if (!editingCard) return;
    try {
      await CreditCardService.updateCreditCard(editingCard.id, {
        bankName:        form.bankName,
        cardName:        form.cardName,
        network:         form.network as any,
        lastFourDigits:  form.lastFourDigits,
        creditLimit:     Number(form.creditLimit) || 0,
        currentBalance:  Number(form.currentBalance) || 0,
        annualFee:       Number(form.annualFee) || 0,
        feeWaiverRule:   form.feeWaiverRule,
        dueDay:          Number(form.dueDate) || 0,
        anniversaryDate: form.anniversaryDate,
        paymentMethod:   form.paymentMethod as any,
        updatedAt:       new Date(),
      });
      toast.success('Card updated');
      setEditingCard(null);
      setShowForm(false);
    } catch {
      toast.error('Failed to update card');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    await CreditCardService.deleteCreditCard(id);
    toast.success('Card deleted');
  };

  const openEdit = (card: CreditCardType) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const editInitial: typeof emptyForm = editingCard ? {
    bankName:        editingCard.bankName,
    cardName:        editingCard.cardName,
    network:         editingCard.network ?? 'Visa',
    lastFourDigits:  editingCard.lastFourDigits,
    creditLimit:     editingCard.creditLimit?.toString() ?? '',
    currentBalance:  editingCard.currentBalance?.toString() ?? '',
    annualFee:       editingCard.annualFee?.toString() ?? '',
    feeWaiverRule:   editingCard.feeWaiverRule ?? '',
    dueDate:         editingCard.dueDate?.toString() ?? '',
    anniversaryDate: editingCard.anniversaryDate ?? '',
    paymentMethod:   editingCard.paymentMethod ?? 'UPI',
    isActive:        editingCard.isActive !== false,
  } : emptyForm;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credit Cards"
        subtitle="Limits, balances & due dates"
        icon={CreditCard}
        action={
          <Button size="sm" onClick={() => { setEditingCard(null); setShowForm(true); }} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Card
          </Button>
        }
      />

      {/* Due Soon Alert */}
      {dueSoon.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/8 border border-warning/20 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Payment due soon:</strong>{' '}
            {dueSoon.map(c => `${c.bankName} ${c.cardName} (${daysUntilDue(c.dueDay!)}d)`).join(', ')}
          </span>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: IndianRupee, label: 'Total Limit',   value: formatCurrency(totalLimit),   color: 'text-foreground'   },
          { icon: CreditCard,  label: 'Outstanding',   value: formatCurrency(totalBalance), color: totalBalance > 0 ? 'value-negative' : 'text-foreground' },
          { icon: Percent,     label: 'Utilisation',   value: `${utilPct}%`,               color: utilPct > 30 ? 'text-destructive' : utilPct > 10 ? 'text-warning' : 'text-success' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{label}</p>
              </div>
              <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <CardForm
          initial={editInitial}
          onSubmit={editingCard ? handleUpdate : handleAdd}
          onCancel={() => { setShowForm(false); setEditingCard(null); }}
          isEdit={!!editingCard}
        />
      )}

      {/* Card List */}
      {cards.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No cards added yet</p>
            <Button size="sm" onClick={() => setShowForm(true)} className="h-9 text-xs rounded-xl gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map(card => {
            const bal  = card.currentBalance ?? 0;
            const util = card.creditLimit ? Math.round((bal / card.creditLimit) * 100) : 0;
            return (
              <Card key={card.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${card.isActive !== false ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                        <h3 className="text-sm font-semibold truncate">{card.bankName} {card.cardName}</h3>
                        <span className="text-xs text-muted-foreground">****{card.lastFourDigits}</span>
                        {card.network && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{card.network}</Badge>}
                      </div>
                      {card.dueDate ? dueBadge(card.dueDate) : null}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(card)} aria-label="Edit"><Edit3 className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(card.id)} aria-label="Delete"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>

                  {/* Utilisation bar */}
                  {card.creditLimit > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Used: {formatCurrency(bal)}</span>
                        <span>Limit: {formatCurrency(card.creditLimit)} · {util}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${util > 30 ? 'bg-destructive' : util > 10 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Annual Fee',  val: card.annualFee ? formatCurrency(card.annualFee) : '—' },
                      { label: 'Due Date',    val: card.dueDate ? `${card.dueDate}th` : '—' },
                      { label: 'Fee Waiver',  val: card.feeWaiverRule || '—' },
                      { label: 'Payment',     val: card.paymentMethod || '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-2 rounded-lg bg-muted/40">
                        <p className="text-muted-foreground text-[10px]">{label}</p>
                        <p className="font-medium truncate">{val}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
