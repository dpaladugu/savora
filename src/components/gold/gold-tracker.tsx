
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { GoldService } from '@/services/GoldService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Gold } from '@/lib/db-extended';

export function GoldTracker() {
  const [goldHoldings, setGoldHoldings] = useState<Gold[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGold, setEditingGold] = useState<Gold | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Physical' as 'Physical' | 'Digital' | 'ETF' | 'Mutual Fund',
    weight: '',
    purity: '24',
    purchasePrice: '',
    currentPrice: '',
    location: '',
    description: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadGoldHoldings();
  }, []);

  const loadGoldHoldings = async () => {
    try {
      setLoading(true);
      const holdings = await GoldService.getAllGold();
      setGoldHoldings(holdings);
    } catch (error) {
      toast.error('Failed to load gold holdings');
      console.error('Error loading gold:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const goldData = {
        type: formData.type,
        weight: parseFloat(formData.weight),
        purity: parseInt(formData.purity),
        purchasePrice: parseFloat(formData.purchasePrice),
        currentPrice: parseFloat(formData.currentPrice),
        location: formData.location,
        description: formData.description,
        purchaseDate: new Date(formData.purchaseDate)
      };

      if (editingGold) {
        await GoldService.updateGold(editingGold.id, goldData);
        toast.success('Gold holding updated successfully');
      } else {
        await GoldService.addGold(goldData);
        toast.success('Gold holding added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingGold(null);
      loadGoldHoldings();
    } catch (error) {
      toast.error('Failed to save gold holding');
      console.error('Error saving gold:', error);
    }
  };

  const handleEdit = (gold: Gold) => {
    setEditingGold(gold);
    setFormData({
      type: gold.type,
      weight: gold.weight.toString(),
      purity: gold.purity.toString(),
      purchasePrice: gold.purchasePrice.toString(),
      currentPrice: gold.currentPrice.toString(),
      location: gold.location || '',
      description: gold.description || '',
      purchaseDate: gold.purchaseDate.toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this gold holding?')) {
      try {
        await GoldService.deleteGold(id);
        toast.success('Gold holding deleted successfully');
        loadGoldHoldings();
      } catch (error) {
        toast.error('Failed to delete gold holding');
        console.error('Error deleting gold:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Physical',
      weight: '',
      purity: '24',
      purchasePrice: '',
      currentPrice: '',
      location: '',
      description: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
  };

  const totalValue = goldHoldings.reduce((sum, gold) => sum + (gold.weight * gold.currentPrice), 0);
  const totalInvestment = goldHoldings.reduce((sum, gold) => sum + (gold.weight * gold.purchasePrice), 0);
  const totalGains = totalValue - totalInvestment;
  const gainsPercentage = totalInvestment > 0 ? (totalGains / totalInvestment) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading gold holdings...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gold Tracker</h1>
          <p className="text-muted-foreground">Manage your gold investments and track their performance</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Gold
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${totalGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGains >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {formatCurrency(Math.abs(totalGains))} ({gainsPercentage.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gold Holdings List */}
      <div className="grid gap-4">
        {goldHoldings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No gold holdings recorded yet. Add your first holding to get started!</p>
            </CardContent>
          </Card>
        ) : (
          goldHoldings.map((gold) => {
            const currentValue = gold.weight * gold.currentPrice;
            const investmentValue = gold.weight * gold.purchasePrice;
            const gains = currentValue - investmentValue;
            const gainsPercent = investmentValue > 0 ? (gains / investmentValue) * 100 : 0;

            return (
              <Card key={gold.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{gold.type} Gold</h3>
                        <Badge variant="outline">{gold.purity}K</Badge>
                        <Badge variant="secondary">{gold.weight}g</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{gold.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current Value:</span>
                          <p className="font-medium">{formatCurrency(currentValue)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Investment:</span>
                          <p className="font-medium">{formatCurrency(investmentValue)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gains:</span>
                          <p className={`font-medium ${gains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(gains))} ({gainsPercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{gold.location || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(gold)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(gold.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGold ? 'Edit Gold Holding' : 'Add Gold Holding'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Digital">Digital</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="purity">Purity (Karat)</Label>
                <Select value={formData.purity} onValueChange={(value) => setFormData({...formData, purity: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24K</SelectItem>
                    <SelectItem value="22">22K</SelectItem>
                    <SelectItem value="18">18K</SelectItem>
                    <SelectItem value="14">14K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price (₹/g)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currentPrice">Current Price (₹/g)</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Bank locker, Home safe, etc."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Jewelry, coins, bars, etc."
              />
            </div>

            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingGold(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingGold ? 'Update' : 'Add'} Gold
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
