
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coins, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Investment } from '@/db';

interface GoldInvestmentForm {
  name: string;
  type: 'Gold-Coin' | 'Gold-ETF' | 'SGB';
  investedValue: number;
  currentValue: number;
  units: number;
  startDate: Date;
  notes: string;
}

const initialFormData: GoldInvestmentForm = {
  name: '',
  type: 'Gold-Coin',
  investedValue: 0,
  currentValue: 0,
  units: 0,
  startDate: new Date(),
  notes: '',
};

export function GoldTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GoldInvestmentForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get gold investments from database
  const goldInvestments = useLiveQuery(() => 
    db.investments
      .where('type')
      .anyOf(['Gold-Coin', 'Gold-ETF', 'SGB'])
      .toArray(), 
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const investmentData: Omit<Investment, 'id'> = {
        type: formData.type,
        name: formData.name,
        currentNav: formData.currentValue / formData.units || 0,
        units: formData.units,
        investedValue: formData.investedValue,
        currentValue: formData.currentValue,
        startDate: formData.startDate,
        frequency: 'One-time',
        taxBenefit: false,
        familyMember: 'Me',
        notes: formData.notes,
        folioNo: '',
        maturityDate: undefined,
        sipAmount: undefined,
        sipDay: undefined,
        goalId: undefined,
        lockInYears: undefined,
        interestRate: undefined,
        interestCreditDate: undefined
      };

      if (editingId) {
        await db.investments.update(editingId, investmentData);
        toast.success('Gold investment updated successfully');
      } else {
        const newId = self.crypto.randomUUID();
        await db.investments.add({
          ...investmentData,
          id: newId,
        });
        toast.success('Gold investment added successfully');
      }

      setFormData(initialFormData);
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving gold investment:', error);
      toast.error('Failed to save gold investment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setFormData({
      name: investment.name,
      type: investment.type as 'Gold-Coin' | 'Gold-ETF' | 'SGB',
      investedValue: investment.investedValue,
      currentValue: investment.currentValue,
      units: investment.units,
      startDate: investment.startDate,
      notes: investment.notes,
    });
    setEditingId(investment.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.investments.delete(id);
      toast.success('Gold investment deleted successfully');
    } catch (error) {
      console.error('Error deleting gold investment:', error);
      toast.error('Failed to delete gold investment');
    }
  };

  const calculateTotalValue = () => {
    if (!goldInvestments) return { invested: 0, current: 0 };
    return goldInvestments.reduce(
      (acc, investment) => ({
        invested: acc.invested + investment.investedValue,
        current: acc.current + investment.currentValue
      }),
      { invested: 0, current: 0 }
    );
  };

  const totals = calculateTotalValue();
  const profitLoss = totals.current - totals.invested;
  const profitLossPercent = totals.invested > 0 ? (profitLoss / totals.invested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gold Investments</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Gold Investment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">₹{totals.invested.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">₹{totals.current.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{profitLoss.toLocaleString()} ({profitLossPercent.toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Gold Investment' : 'Add Gold Investment'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Investment Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gold Coins 22K"
                    required
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'Gold-Coin' | 'Gold-ETF' | 'SGB') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gold-Coin">Gold Coins</SelectItem>
                      <SelectItem value="Gold-ETF">Gold ETF</SelectItem>
                      <SelectItem value="SGB">Sovereign Gold Bonds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Invested Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.investedValue}
                    onChange={(e) => setFormData({ ...formData, investedValue: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Current Value (₹)</Label>
                  <Input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Units/Quantity</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {editingId ? 'Update Investment' : 'Add Investment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Investments List */}
      <div className="grid gap-4">
        {goldInvestments?.map((investment) => {
          const pnl = investment.currentValue - investment.investedValue;
          const pnlPercent = investment.investedValue > 0 ? (pnl / investment.investedValue) * 100 : 0;

          return (
            <Card key={investment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">{investment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {investment.type} • {investment.units} units
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₹{investment.currentValue.toLocaleString()}</p>
                      <p className={`text-sm ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()} ({pnlPercent.toFixed(1)}%)
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(investment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {investment.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{investment.notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {!goldInvestments?.length && (
          <Card>
            <CardContent className="p-8 text-center">
              <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Gold Investments</h3>
              <p className="text-muted-foreground">
                Add your first gold investment to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
