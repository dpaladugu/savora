
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  Bell, 
  Edit, 
  Trash2,
  Eye,
  EyeOff 
} from 'lucide-react';
import { toast } from 'sonner';
import { CreditCardService } from '@/services/CreditCardService';
import { useAuth } from '@/contexts/auth-context';
import { PrivacyMask } from '@/components/ui/privacy-mask';

interface CreditCardData {
  id: string;
  issuer: string;
  bankName: string;
  last4: string;
  network: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  dueDate: string;
  minimumDue: number;
  statementBalance: number;
  cycleStart: number;
  interestRate: number;
  annualFee: number;
  rewardPoints: number;
}

export function CreditCardModule() {
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const { isAuthenticated } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    issuer: '',
    bankName: '',
    last4: '',
    network: 'Visa',
    creditLimit: 0,
    currentBalance: 0,
    dueDate: '',
    minimumDue: 0,
    interestRate: 0,
    annualFee: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadCreditCards();
    }
  }, [isAuthenticated]);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      const cards = await CreditCardService.getCreditCards();
      
      // Transform to our interface
      const transformedCards: CreditCardData[] = cards.map(card => ({
        id: card.id,
        issuer: card.issuer,
        bankName: card.bankName,
        last4: card.last4,
        network: card.network,
        creditLimit: card.creditLimit,
        currentBalance: card.currentBalance || 0,
        availableCredit: card.creditLimit - (card.currentBalance || 0),
        dueDate: new Date().toISOString().split('T')[0], // Default to today
        minimumDue: Math.round((card.currentBalance || 0) * 0.05), // 5% of balance
        statementBalance: card.currentBalance || 0,
        cycleStart: card.cycleStart,
        interestRate: 18, // Default rate
        annualFee: card.annualFee,
        rewardPoints: card.rewardPointsBalance
      }));

      setCreditCards(transformedCards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
      toast.error('Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cardData = {
        issuer: formData.issuer,
        bankName: formData.bankName,
        last4: formData.last4,
        network: formData.network as any,
        cardVariant: 'Standard',
        productVariant: 'Regular',
        annualFee: formData.annualFee,
        annualFeeGst: Math.round(formData.annualFee * 0.18),
        creditLimit: formData.creditLimit,
        creditLimitShared: false,
        fuelSurchargeWaiver: false,
        rewardPointsBalance: 0,
        cycleStart: 1,
        stmtDay: 5,
        dueDay: 20,
        currentBalance: formData.currentBalance,
        fxTxnFee: 3.5,
        emiConversion: false
      };

      if (editingCard) {
        await CreditCardService.updateCreditCard(editingCard.id, cardData);
        toast.success('Credit card updated successfully');
      } else {
        await CreditCardService.addCreditCard(cardData);
        toast.success('Credit card added successfully');
      }

      setShowAddDialog(false);
      setEditingCard(null);
      resetForm();
      loadCreditCards();
    } catch (error) {
      console.error('Error saving credit card:', error);
      toast.error('Failed to save credit card');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit card?')) return;

    try {
      await CreditCardService.deleteCreditCard(id);
      toast.success('Credit card deleted successfully');
      loadCreditCards();
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast.error('Failed to delete credit card');
    }
  };

  const resetForm = () => {
    setFormData({
      issuer: '',
      bankName: '',
      last4: '',
      network: 'Visa',
      creditLimit: 0,
      currentBalance: 0,
      dueDate: '',
      minimumDue: 0,
      interestRate: 0,
      annualFee: 0
    });
  };

  const handleEdit = (card: CreditCardData) => {
    setEditingCard(card);
    setFormData({
      issuer: card.issuer,
      bankName: card.bankName,
      last4: card.last4,
      network: card.network,
      creditLimit: card.creditLimit,
      currentBalance: card.currentBalance,
      dueDate: card.dueDate,
      minimumDue: card.minimumDue,
      interestRate: card.interestRate,
      annualFee: card.annualFee
    });
    setShowAddDialog(true);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return 'text-green-600';
    if (utilization < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Credit Cards
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your credit cards, track balances, and monitor due dates
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingCard(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issuer">Bank/Issuer</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                    placeholder="HDFC Bank"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="network">Network</Label>
                  <select
                    id="network"
                    value={formData.network}
                    onChange={(e) => setFormData({...formData, network: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="RuPay">RuPay</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="last4">Last 4 Digits</Label>
                <Input
                  id="last4"
                  value={formData.last4}
                  onChange={(e) => setFormData({...formData, last4: e.target.value})}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})}
                    placeholder="100000"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({...formData, currentBalance: Number(e.target.value)})}
                    placeholder="25000"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCard ? 'Update' : 'Add'} Card
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit Limit</p>
                <PrivacyMask 
                  amount={creditCards.reduce((sum, card) => sum + card.creditLimit, 0)}
                  className="text-2xl font-bold"
                />
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <PrivacyMask 
                  amount={creditCards.reduce((sum, card) => sum + card.currentBalance, 0)}
                  className="text-2xl font-bold"
                />
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Credit</p>
                <PrivacyMask 
                  amount={creditCards.reduce((sum, card) => sum + card.availableCredit, 0)}
                  className="text-2xl font-bold"
                />
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cards</p>
                <p className="text-2xl font-bold">{creditCards.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards List */}
      <div className="space-y-4">
        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Credit Cards Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your credit cards to track balances, due dates, and manage payments.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          creditCards.map((card) => {
            const utilization = (card.currentBalance / card.creditLimit) * 100;
            const daysUntilDue = getDaysUntilDue(card.dueDate);
            
            return (
              <Card key={card.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {card.issuer} {card.bankName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {card.network} •••• {card.last4}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {daysUntilDue <= 3 && daysUntilDue >= 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          <Bell className="h-3 w-3 mr-1" />
                          Due in {daysUntilDue} days
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Balance and Limit */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <PrivacyMask 
                        amount={card.currentBalance}
                        className="text-lg font-semibold"
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Limit</p>
                      <PrivacyMask 
                        amount={card.creditLimit}
                        className="text-lg font-semibold"
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <PrivacyMask 
                        amount={card.availableCredit}
                        className="text-lg font-semibold text-green-600"
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className={`text-lg font-semibold ${getUtilizationColor(utilization)}`}>
                        {utilization.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Credit Utilization</span>
                      <span className={getUtilizationColor(utilization)}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={utilization} 
                      className="h-2"
                    />
                    {utilization > 70 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          High utilization may impact your credit score. Consider paying down the balance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Next Due Date</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(card.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">Minimum Due</p>
                      <PrivacyMask 
                        amount={card.minimumDue}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
