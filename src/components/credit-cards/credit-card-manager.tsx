
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, CreditCard, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, isValid as isDateValid } from 'date-fns';

export interface DexieCreditCardRecord {
  id: string;
  user_id?: string;
  card_name: string;
  card_number_last_four: string;
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  interest_rate: number;
  annual_fee: number;
  due_date: string;
  minimum_payment: number;
  payment_due_date: string;
  bank_name: string;
  created_at?: string;
  updated_at?: string;
}

export function CreditCardManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<DexieCreditCardRecord | null>(null);

  const creditCards = useLiveQuery(() => db.creditCards.toArray(), []);

  const [formData, setFormData] = useState<Omit<DexieCreditCardRecord, 'id' | 'created_at' | 'updated_at'>>({
    user_id: user?.id || '',
    card_name: '',
    card_number_last_four: '',
    credit_limit: 0,
    current_balance: 0,
    available_credit: 0,
    interest_rate: 0,
    annual_fee: 0,
    due_date: new Date().toISOString().split('T')[0],
    minimum_payment: 0,
    payment_due_date: new Date().toISOString().split('T')[0],
    bank_name: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available credit when credit limit or current balance changes
      if (field === 'credit_limit' || field === 'current_balance') {
        const creditLimit = field === 'credit_limit' ? parseFloat(value) || 0 : prev.credit_limit;
        const currentBalance = field === 'current_balance' ? parseFloat(value) || 0 : prev.current_balance;
        updated.available_credit = Math.max(0, creditLimit - currentBalance);
      }
      
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      user_id: user?.id || '',
      card_name: '',
      card_number_last_four: '',
      credit_limit: 0,
      current_balance: 0,
      available_credit: 0,
      interest_rate: 0,
      annual_fee: 0,
      due_date: new Date().toISOString().split('T')[0],
      minimum_payment: 0,
      payment_due_date: new Date().toISOString().split('T')[0],
      bank_name: '',
    });
    setEditingCard(null);
    setSelectedDate(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.card_name || !formData.bank_name) {
      toast({
        title: "Validation Error",
        description: "Card name and bank name are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cardData = {
        ...formData,
        user_id: user?.id || '',
        available_credit: Math.max(0, formData.credit_limit - formData.current_balance),
      };

      if (editingCard) {
        await db.creditCards.update(editingCard.id, {
          ...cardData,
          updated_at: new Date().toISOString(),
        });
        toast({
          title: "Card Updated",
          description: "Credit card information has been updated successfully.",
        });
      } else {
        await db.creditCards.add({
          ...cardData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        toast({
          title: "Card Added",
          description: "New credit card has been added successfully.",
        });
      }

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving credit card:', error);
      toast({
        title: "Error",
        description: "Failed to save credit card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (card: DexieCreditCardRecord) => {
    setEditingCard(card);
    setFormData({
      user_id: card.user_id || user?.id || '',
      card_name: card.card_name,
      card_number_last_four: card.card_number_last_four,
      credit_limit: card.credit_limit,
      current_balance: card.current_balance,
      available_credit: card.available_credit,
      interest_rate: card.interest_rate,
      annual_fee: card.annual_fee,
      due_date: card.due_date,
      minimum_payment: card.minimum_payment,
      payment_due_date: card.payment_due_date,
      bank_name: card.bank_name,
    });
    setSelectedDate(isDateValid(parseISO(card.due_date)) ? parseISO(card.due_date) : new Date());
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.creditCards.delete(id);
      toast({
        title: "Card Deleted",
        description: "Credit card has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: "Error",
        description: "Failed to delete credit card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCards = creditCards || [];
  const totalCreditLimit = filteredCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
  const totalCurrentBalance = filteredCards.reduce((sum, card) => sum + (card.current_balance || 0), 0);
  const totalAvailableCredit = filteredCards.reduce((sum, card) => sum + (card.available_credit || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingCard ? 'Edit Credit Card' : 'Add New Credit Card'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card_name">Card Name *</Label>
                  <Input
                    id="card_name"
                    value={formData.card_name}
                    onChange={(e) => handleInputChange('card_name', e.target.value)}
                    placeholder="e.g., Chase Sapphire Preferred"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank_name">Bank Name *</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="e.g., Chase Bank"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="card_number_last_four">Last 4 Digits</Label>
                  <Input
                    id="card_number_last_four"
                    value={formData.card_number_last_four}
                    onChange={(e) => handleInputChange('card_number_last_four', e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Credit Limit</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    step="0.01"
                    value={formData.credit_limit || ''}
                    onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="current_balance">Current Balance</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    value={formData.current_balance || ''}
                    onChange={(e) => handleInputChange('current_balance', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="available_credit">Available Credit (Auto-calculated)</Label>
                  <Input
                    id="available_credit"
                    type="number"
                    value={formData.available_credit || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || ''}
                    onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_fee">Annual Fee</Label>
                  <Input
                    id="annual_fee"
                    type="number"
                    step="0.01"
                    value={formData.annual_fee || ''}
                    onChange={(e) => handleInputChange('annual_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={selectedDate} onSelect={(date) => { if (date) { setSelectedDate(date); handleInputChange('due_date', format(date, 'yyyy-MM-dd')); } }} /></PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="minimum_payment">Minimum Payment</Label>
                  <Input
                    id="minimum_payment"
                    type="number"
                    step="0.01"
                    value={formData.minimum_payment || ''}
                    onChange={(e) => handleInputChange('minimum_payment', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_due_date">Payment Due Date</Label>
                  <Input
                    id="payment_due_date"
                    type="date"
                    value={formData.payment_due_date}
                    onChange={(e) => handleInputChange('payment_due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCard ? 'Update Card' : 'Add Card'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!user && (
        <div className="p-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900 dark:text-yellow-300" role="alert">
          <AlertTriangle className="inline w-4 h-4 mr-2" />
          You are not logged in. Credit card data will not be saved until you log in.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Credit Limit</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCreditLimit)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCurrentBalance)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Available Credit</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAvailableCredit)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Credit Card
        </Button>
      </div>

      {/* Credit Cards List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Credit Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCards.map((card) => (
              <Card key={card.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{card.card_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {card.bank_name} •••• {card.card_number_last_four}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {((card.current_balance / card.credit_limit) * 100).toFixed(1)}% used
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {format(parseISO(card.due_date), 'MMM dd')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold">{formatCurrency(card.current_balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(card.credit_limit)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(card)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(card.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredCards.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No credit cards found. Add your first credit card to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
