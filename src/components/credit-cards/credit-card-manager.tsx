
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

// Use the actual DexieCreditCardRecord from db.ts
import type { DexieCreditCardRecord } from '@/db';

export function CreditCardManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<DexieCreditCardRecord | null>(null);

  const creditCards = useLiveQuery(() => db.creditCards.toArray(), []);

  const [formData, setFormData] = useState<Omit<DexieCreditCardRecord, 'id' | 'created_at' | 'updated_at'>>({
    user_id: user?.uid || '',
    name: '',
    issuer: '',
    last4Digits: '',
    limit: 0,
    currentBalance: 0,
    billCycleDay: 1,
    dueDate: new Date().toISOString().split('T')[0],
    autoDebit: false,
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      user_id: user?.uid || '',
      name: '',
      issuer: '',
      last4Digits: '',
      limit: 0,
      currentBalance: 0,
      billCycleDay: 1,
      dueDate: new Date().toISOString().split('T')[0],
      autoDebit: false,
    });
    setEditingCard(null);
    setSelectedDate(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.issuer) {
      toast({
        title: "Validation Error",
        description: "Card name and issuer are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cardData = {
        ...formData,
        user_id: user?.uid || '',
      };

      if (editingCard) {
        await db.creditCards.update(editingCard.id, cardData);
        toast({
          title: "Card Updated",
          description: "Credit card information has been updated successfully.",
        });
      } else {
        await db.creditCards.add({
          ...cardData,
          id: crypto.randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
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
      user_id: card.user_id || user?.uid || '',
      name: card.name,
      issuer: card.issuer,
      last4Digits: card.last4Digits || '',
      limit: card.limit,
      currentBalance: card.currentBalance,
      billCycleDay: card.billCycleDay,
      dueDate: card.dueDate,
      autoDebit: card.autoDebit,
    });
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
  const totalCreditLimit = filteredCards.reduce((sum, card) => sum + (card.limit || 0), 0);
  const totalCurrentBalance = filteredCards.reduce((sum, card) => sum + (card.currentBalance || 0), 0);
  const totalAvailableCredit = totalCreditLimit - totalCurrentBalance;

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
                  <Label htmlFor="name">Card Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Chase Sapphire Preferred"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">Issuer *</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => handleInputChange('issuer', e.target.value)}
                    placeholder="e.g., Chase Bank"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last4Digits">Last 4 Digits</Label>
                  <Input
                    id="last4Digits"
                    value={formData.last4Digits || ''}
                    onChange={(e) => handleInputChange('last4Digits', e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="limit">Credit Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    value={formData.limit || ''}
                    onChange={(e) => handleInputChange('limit', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance || ''}
                    onChange={(e) => handleInputChange('currentBalance', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="billCycleDay">Bill Cycle Day</Label>
                  <Input
                    id="billCycleDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.billCycleDay || ''}
                    onChange={(e) => handleInputChange('billCycleDay', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
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
                        <h3 className="font-semibold">{card.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {card.issuer} •••• {card.last4Digits}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {((card.currentBalance / card.limit) * 100).toFixed(1)}% used
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {card.billCycleDay}th
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold">{formatCurrency(card.currentBalance)}</p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(card.limit)}
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
