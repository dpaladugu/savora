
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CreditCard, Calendar, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    <div className="space-y-6">
      {/* Header section removed. Title/subtitle ("Credit Cards", "Manage your credit cards and limits")
          would come from ModuleHeader via router config.
          The "Add Card" button is also a candidate for a header action.
          For now, placing it at the top of the content.
      */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{totalCreditLimit.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Limit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{activeCards.length}</div>
                <div className="text-sm text-muted-foreground">Active Cards</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {cards.length === 0 ? (
          <Card className="metric-card border-border/50">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Credit Cards Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your credit cards to track limits and due dates
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${card.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <h3 className="text-lg font-semibold text-foreground">
                        {card.bankName} {card.cardName}
                      </h3>
                      <span className="text-sm text-muted-foreground">****{card.lastFourDigits}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Credit Limit:</span>
                        <div className="font-semibold text-foreground">₹{card.creditLimit.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div className="font-semibold text-foreground">{card.dueDate}th of month</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Annual Fee:</span>
                        <div className="font-semibold text-foreground">₹{card.annualFee}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fee Waiver:</span>
                        <div className="font-semibold text-foreground text-xs">{card.feeWaiverRule}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCardStatus(card.id)}
                  >
                    {card.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
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
    paymentMethod: 'UPI' as const,
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
    </div>
  );
}
