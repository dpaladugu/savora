
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus, TrendingDown, Calendar, AlertCircle } from "lucide-react";
import { ModuleHeader } from "@/components/layout/module-header";
import { ExpenseService } from "@/services/ExpenseService";
import { formatCurrency } from "@/lib/format-utils";
import { Expense } from "@/services/supabase-data-service";
import { useToast } from "@/hooks/use-toast";

interface CreditCardInfo {
  id: string;
  nickname: string;
  lastFourDigits: string;
  creditLimit?: number;
  dueDate?: string; // Should ideally be a specific day number or full date
  statementDate?: string; // Should ideally be a specific day number or full date
}

// This is the single, correct definition of AddCardForm, defined outside CreditCardFlowTracker
function AddCardForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<CreditCardInfo, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nickname: '',
    lastFourDigits: '',
    creditLimit: '',
    dueDate: '', // Consider making this a number input for day of month, or full date
    statementDate: '' // Same as above
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.nickname || !formData.lastFourDigits) {
        // Or use toast to notify user
        console.error("Nickname and Last Four Digits are required.");
        return;
    }
    onSubmit({
      nickname: formData.nickname,
      lastFourDigits: formData.lastFourDigits,
      creditLimit: formData.creditLimit ? Number(formData.creditLimit) : undefined,
      dueDate: formData.dueDate || undefined,
      statementDate: formData.statementDate || undefined
    });
  };

  return (
    // This form is now rendered within a layout provided by CreditCardFlowTracker's showAddCard state,
    // which includes a ModuleHeader. So, no GlobalHeader or full-page layout here.
    <Card className="metric-card border-border/50">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">Card Nickname</label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              placeholder="e.g., ICICI Amazon Pay"
              required
            />
          </div>

          <div>
            <label htmlFor="lastFourDigits" className="block text-sm font-medium text-foreground mb-2">Last 4 Digits</label>
            <Input
              id="lastFourDigits"
              value={formData.lastFourDigits}
              onChange={(e) => setFormData({...formData, lastFourDigits: e.target.value})}
              placeholder="e.g., 1234"
              maxLength={4}
              minLength={4}
              pattern="\d{4}"
              title="Must be 4 digits"
              required
            />
          </div>

          <div>
            <label htmlFor="creditLimit" className="block text-sm font-medium text-foreground mb-2">Credit Limit (Optional)</label>
            <Input
              id="creditLimit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
              placeholder="e.g., 100000"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-2">Due Date (e.g., YYYY-MM-DD or Day of Month)</label>
            <Input
              id="dueDate"
              type="text" // Changed to text to allow for "DD" or "YYYY-MM-DD"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              placeholder="e.g., 15 or 2024-08-15"
            />
          </div>

          <div>
            <label htmlFor="statementDate" className="block text-sm font-medium text-foreground mb-2">Statement Date (e.g., YYYY-MM-DD or Day of Month)</label>
            <Input
              id="statementDate"
              type="text" // Changed to text
              value={formData.statementDate}
              onChange={(e) => setFormData({...formData, statementDate: e.target.value})}
              placeholder="e.g., 25 or 2024-07-25"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Card
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


export function CreditCardFlowTracker() {
  const { toast } = useToast();
  const [cards, setCards] = useState<CreditCardInfo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const expenseData = await ExpenseService.getExpenses();
      setExpenses(expenseData);
      
      const savedCards = localStorage.getItem('credit-cards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: "Error", description: "Failed to load card or expense data.", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  const addCard = (cardData: Omit<CreditCardInfo, 'id'>) => {
    const newCard: CreditCardInfo = {
      ...cardData,
      id: Date.now().toString()
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    localStorage.setItem('credit-cards', JSON.stringify(updatedCards));
    setShowAddCard(false);
    toast({
      title: "Success",
      description: "Credit card added successfully!",
    });
  };

  const getCardExpenses = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return [];
    
    return expenses.filter(expense => 
      expense.payment_method === 'Credit Card' &&
      (expense.description?.includes(card.lastFourDigits) ||
       expense.tags?.includes(card.nickname))
    );
  };

  const getCurrentMonthSpend = (cardId: string) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const cardExpenses = getCardExpenses(cardId);
    return cardExpenses
      .filter(expense => expense.date.startsWith(currentMonth))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  };

  const getCategoryBreakdown = (cardId: string) => {
    const cardExpenses = getCardExpenses(cardId);
    const categories = cardExpenses.reduce((acc, expense) => {
      const amount = Number(expense.amount || 0);
      acc[expense.category] = (acc[expense.category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categories)
      .sort(([,a], [,b]) => Number(b) - Number(a))
      .slice(0, 5);
  };

  if (showAddCard) {
    return (
      <>
        <ModuleHeader
          title="Add New Credit Card"
          showBackButton
          onBack={() => setShowAddCard(false)}
        />
        <div className="px-4 py-4 space-y-6">
          <AddCardForm onSubmit={addCard} onCancel={() => setShowAddCard(false)} />
        </div>
      </>
    );
  }

  // Main content for CreditCardFlowTracker
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-base">
            View and manage your credit card flows and details.
          </p>
        </div>
        <Button onClick={() => setShowAddCard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading credit card data...</p>
        </div>
      ) : cards.length === 0 ? (
        <Card className="metric-card border-border/50">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Credit Cards Added</h3>
            <p className="text-muted-foreground mb-4">
              Add your credit cards to track spending and manage payments
            </p>
            <Button onClick={() => setShowAddCard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {cards.map((card) => {
            const monthlySpend = getCurrentMonthSpend(card.id);
            const categoryBreakdown = getCategoryBreakdown(card.id);
            const utilizationPercent = card.creditLimit ? (monthlySpend / card.creditLimit) * 100 : 0;

            return (
              <Card key={card.id} className="metric-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <div>
                        <span className="text-lg">{card.nickname}</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          •••• •••• •••• {card.lastFourDigits}
                        </p>
                      </div>
                    </div>
                    {utilizationPercent > 80 && (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="metric-card p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">This Month</span>
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {formatCurrency(monthlySpend)}
                      </div>
                      {card.creditLimit && (
                        <div className="text-xs text-muted-foreground">
                          {utilizationPercent.toFixed(1)}% of limit
                        </div>
                      )}
                    </div>

                    <div className="metric-card p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Due Date</span>
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {/* Ensure card.dueDate is handled if it's a string like "15" or a full date */}
                        {card.dueDate ? (card.dueDate.includes('-') ? new Date(card.dueDate).toLocaleDateString('en-IN', {day: 'numeric'}) : card.dueDate) : 'Not Set'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {card.dueDate ? 'of every month' : 'Add due date'}
                      </div>
                    </div>
                  </div>

                  {card.creditLimit && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Credit Utilization</span>
                        <span className={utilizationPercent > 80 ? 'text-orange-500' : 'text-muted-foreground'}>
                          {utilizationPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            utilizationPercent > 80 ? 'bg-orange-500' :
                            utilizationPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {categoryBreakdown.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Top Categories</h4>
                      <div className="space-y-2">
                        {categoryBreakdown.map(([category, amount]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{category}</span>
                            <span className="font-medium text-foreground">{formatCurrency(Number(amount))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
