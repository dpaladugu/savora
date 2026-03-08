
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Trash2, Plus, Edit, CreditCard as CreditCardIcon } from "lucide-react";
import { toast } from "sonner";
import { CreditCardService } from "@/services/CreditCardService";
import { useAuth } from "@/services/auth-service";
import { formatCurrency } from "@/lib/format-utils";
import type { CreditCard } from "@/types/financial";

interface CreditCardData {
  id?: string;
  name: string;
  issuer: string;
  currentBalance: number;
  limit: number;
  billCycleDay: number;
  dueDate?: string;
  autoDebit?: boolean;
}

const emptyForm: Omit<CreditCardData, 'id'> = {
  name: '',
  issuer: '',
  currentBalance: 0,
  limit: 0,
  billCycleDay: 1,
};

export function CreditCardManager() {
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [form, setForm] = useState({ ...emptyForm, currentBalance: '', limit: '', billCycleDay: '1', name: '', issuer: '' });
  const { user } = useAuth();

  useEffect(() => { if (user) fetchCards(); }, [user]);

  const fetchCards = async () => {
    try {
      const cards = await CreditCardService.getCreditCards();
      setCreditCards(cards.map(card => ({
        id: card.id,
        name: card.name || `${card.issuer} ${card.bankName}`,
        issuer: card.issuer || "Unknown",
        limit: card.creditLimit || 0,
        currentBalance: card.currentBalance || 0,
        billCycleDay: card.cycleStart || 1,
        dueDate: card.dueDate || new Date().toISOString().split('T')[0],
      })));
    } catch (e: any) { toast.error(`Failed to load cards: ${e.message}`); }
  };

  const openAdd = () => { setEditingCard(null); setForm({ name: '', issuer: '', currentBalance: '', limit: '', billCycleDay: '1' }); setShowModal(true); };
  const openEdit = (card: CreditCardData) => {
    setEditingCard(card);
    setForm({ name: card.name, issuer: card.issuer, currentBalance: card.currentBalance.toString(), limit: card.limit.toString(), billCycleDay: card.billCycleDay.toString() });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("You must be logged in."); return; }
    const cardData: Omit<CreditCard, 'id'> = {
      name: form.name,
      issuer: form.issuer || "Unknown",
      bankName: form.issuer || "Unknown",
      last4: "0000",
      network: 'Visa' as const,
      cardVariant: "Standard",
      productVariant: "Regular",
      annualFee: 0,
      annualFeeGst: 0,
      creditLimit: parseFloat(form.limit) || 0,
      creditLimitShared: false,
      fuelSurchargeWaiver: false,
      rewardPointsBalance: 0,
      cycleStart: parseInt(form.billCycleDay) || 1,
      stmtDay: 1,
      dueDay: 1,
      fxTxnFee: 0,
      emiConversion: false,
      currentBalance: parseFloat(form.currentBalance) || 0,
      limit: parseFloat(form.limit) || 0,
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      if (editingCard?.id) {
        await CreditCardService.updateCreditCard(editingCard.id, cardData);
        toast.success("Card updated!");
      } else {
        await CreditCardService.addCreditCard(cardData);
        toast.success("Card added!");
      }
      await fetchCards();
      setShowModal(false);
    } catch (e: any) { toast.error(`Failed to save: ${e.message}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    try {
      await CreditCardService.deleteCreditCard(id);
      await fetchCards();
      toast.success("Card deleted.");
    } catch (e: any) { toast.error(`Failed to delete: ${e.message}`); }
  };

  const totalBalance = creditCards.reduce((s, c) => s + c.currentBalance, 0);
  const totalLimit   = creditCards.reduce((s, c) => s + c.limit, 0);
  const utilization  = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credit Cards"
        subtitle="Balances, limits & utilization"
        icon={CreditCardIcon}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Card
          </Button>
        }
      />

      {/* Summary */}
      {creditCards.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Balance', value: formatCurrency(totalBalance), cls: 'value-negative' },
            { label: 'Total Limit',   value: formatCurrency(totalLimit),   cls: 'text-foreground' },
            { label: 'Utilization',   value: `${utilization}%`,            cls: utilization > 30 ? 'text-warning' : 'value-positive' },
          ].map(({ label, value, cls }) => (
            <Card key={label} className="glass">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-bold tabular-nums ${cls}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Card list */}
      <div className="space-y-2">
        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CreditCardIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No credit cards added yet.</p>
              <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Add first card
              </Button>
            </CardContent>
          </Card>
        ) : creditCards.map(card => {
          const util = card.limit > 0 ? Math.round((card.currentBalance / card.limit) * 100) : 0;
          return (
            <Card key={card.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <CreditCardIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.issuer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${util > 30 ? 'border-warning/40 text-warning' : 'border-success/40 text-success'}`}>
                      {util}% used
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(card)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(card.id!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Balance: </span><span className="font-medium value-negative">{formatCurrency(card.currentBalance)}</span></div>
                  <div><span className="text-muted-foreground">Limit: </span><span className="font-medium">{formatCurrency(card.limit)}</span></div>
                  <div><span className="text-muted-foreground">Cycle Day: </span><span className="font-medium">{card.billCycleDay}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editingCard ? 'Edit Credit Card' : 'Add Credit Card'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { id: 'name',           label: 'Card Name *',       key: 'name',           type: 'text',   required: true  },
              { id: 'issuer',         label: 'Issuer / Bank *',   key: 'issuer',         type: 'text',   required: true  },
              { id: 'limit',          label: 'Credit Limit (₹) *',key: 'limit',          type: 'number', required: true  },
              { id: 'currentBalance', label: 'Current Balance (₹)',key: 'currentBalance', type: 'number', required: false },
              { id: 'billCycleDay',   label: 'Bill Cycle Day',    key: 'billCycleDay',   type: 'number', required: false },
            ].map(({ id, label, key, type, required }) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs">{label}</Label>
                <Input
                  id={id} type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="h-9 text-sm" required={required}
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingCard ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
