
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CreditCard, Calendar, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-utils";
import { ModuleHeader } from "@/components/layout/module-header"; // Import ModuleHeader
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

interface CreditCardData {
  id: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  creditLimit: number;
  annualFee: number;
  feeWaiverRule: string;
  dueDate: number;
  anniversaryDate: string;
  isActive: boolean;
  paymentMethod: 'UPI' | 'NEFT' | 'In App';
}

export function CreditCardTracker() {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved cards from localStorage
    const savedCards = localStorage.getItem('savora-credit-cards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
  }, []);

  const saveCards = (updatedCards: CreditCardData[]) => {
    localStorage.setItem('savora-credit-cards', JSON.stringify(updatedCards));
    setCards(updatedCards);
  };

  const handleAddCard = (cardData: Omit<CreditCardData, 'id'>) => {
    const newCard: CreditCardData = {
      ...cardData,
      id: Date.now().toString(),
    };
    
    const updatedCards = [...cards, newCard];
    saveCards(updatedCards);
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Credit card added successfully!",
    });
  };

  const toggleCardStatus = (cardId: string) => {
    const updatedCards = cards.map(card => 
      card.id === cardId ? { ...card, isActive: !card.isActive } : card
    );
    saveCards(updatedCards);
  };

  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const activeCards = cards.filter(card => card.isActive);

  if (showAddForm) {
    // When showing AddCreditCardForm, render it with its own ModuleHeader
    return (
      <>
        <ModuleHeader
          title="Add New Credit Card"
          showBackButton
          onBack={() => setShowAddForm(false)}
        />
        <div className="px-4 py-4 space-y-6"> {/* Content padding for form */}
          <AddCreditCardForm onSubmit={handleAddCard} onCancel={() => setShowAddForm(false)} />
        </div>
      </>
    );
  }

  // Main view of CreditCardTracker
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Credit Cards</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Limits, due dates & fee waivers</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9 gap-1.5 rounded-xl text-xs shrink-0">
          <Plus className="h-3.5 w-3.5" /> Add Card
        </Button>
      </div>

      {/* Summary — 2 equal cols, no text overflow */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Total Limit</p>
            </div>
            <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(totalCreditLimit)}</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 shrink-0">
                <Percent className="w-3.5 h-3.5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Active Cards</p>
            </div>
            <p className="text-base font-bold text-foreground tabular-nums">{activeCards.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {cards.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No cards added yet</p>
              <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9 text-xs rounded-xl gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${card.isActive ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                      <h3 className="text-sm font-semibold text-foreground truncate">{card.bankName} {card.cardName}</h3>
                      <span className="text-xs text-muted-foreground">****{card.lastFourDigits}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0 rounded-lg" onClick={() => toggleCardStatus(card.id)}>
                    {card.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Limit',     val: formatCurrency(card.creditLimit) },
                    { label: 'Due Date',  val: `${card.dueDate}th` },
                    { label: 'Annual Fee',val: formatCurrency(card.annualFee) },
                    { label: 'Fee Waiver',val: card.feeWaiverRule || '—' },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground text-[10px]">{label}</p>
                      <p className="font-medium truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AddCreditCardForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<CreditCardData, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    creditLimit: '',
    annualFee: '',
    feeWaiverRule: '',
    dueDate: '',
    anniversaryDate: '',
    paymentMethod: 'UPI' as 'UPI' | 'NEFT' | 'In App',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      bankName: formData.bankName,
      cardName: formData.cardName,
      lastFourDigits: formData.lastFourDigits,
      creditLimit: Number(formData.creditLimit),
      annualFee: Number(formData.annualFee),
      feeWaiverRule: formData.feeWaiverRule,
      dueDate: Number(formData.dueDate),
      anniversaryDate: formData.anniversaryDate,
      paymentMethod: formData.paymentMethod,
      isActive: formData.isActive
    });
  };

  return (
    // The AddCreditCardForm no longer renders its own header.
    // It relies on the parent (CreditCardTracker when showAddForm is true) to render ModuleHeader.
    // Removed the outer space-y-6 div as well, assuming parent provides padding.
    <Card className="metric-card border-border/50">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bank Name</label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Card Name</label>
                <Input
                  value={formData.cardName}
                  onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Last 4 Digits</label>
                <Input
                  value={formData.lastFourDigits}
                  onChange={(e) => setFormData({...formData, lastFourDigits: e.target.value})}
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Credit Limit</label>
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Annual Fee</label>
                <Input
                  type="number"
                  value={formData.annualFee}
                  onChange={(e) => setFormData({...formData, annualFee: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Due Date (Day of Month)</label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fee Waiver Rule</label>
              <Input
                value={formData.feeWaiverRule}
                onChange={(e) => setFormData({...formData, feeWaiverRule: e.target.value})}
                placeholder="e.g., Spend ₹2L annually"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Anniversary Date</label>
              <Input
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({...formData, anniversaryDate: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({...formData, paymentMethod: value as 'UPI' | 'NEFT' | 'In App'})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="In App">In App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Add Credit Card
            </Button>
          </form>
        </CardContent>
      </Card>
    // Removed extra closing </div> tag that was here
  );
}
