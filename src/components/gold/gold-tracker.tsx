
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
    form: 'Jewelry' as 'Jewelry' | 'Coin' | 'Bar' | 'Biscuit',
    description: '',
    grossWeight: '',
    netWeight: '',
    stoneWeight: '',
    purity: '24K' as '24K' | '22K' | '20K' | '18K',
    purchasePrice: '',
    makingCharge: '',
    gstPaid: '',
    hallmarkCharge: '',
    karatPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    merchant: '',
    storageLocation: '',
    storageCost: '',
    familyMember: ''
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
        form: formData.form,
        description: formData.description,
        grossWeight: parseFloat(formData.grossWeight),
        netWeight: parseFloat(formData.netWeight),
        stoneWeight: parseFloat(formData.stoneWeight),
        purity: formData.purity,
        purchasePrice: parseFloat(formData.purchasePrice),
        makingCharge: parseFloat(formData.makingCharge),
        gstPaid: parseFloat(formData.gstPaid),
        hallmarkCharge: parseFloat(formData.hallmarkCharge),
        karatPrice: parseFloat(formData.karatPrice),
        purchaseDate: new Date(formData.purchaseDate),
        merchant: formData.merchant,
        storageLocation: formData.storageLocation,
        storageCost: parseFloat(formData.storageCost),
        familyMember: formData.familyMember
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
      form: gold.form,
      description: gold.description,
      grossWeight: gold.grossWeight.toString(),
      netWeight: gold.netWeight.toString(),
      stoneWeight: gold.stoneWeight.toString(),
      purity: gold.purity,
      purchasePrice: gold.purchasePrice.toString(),
      makingCharge: gold.makingCharge.toString(),
      gstPaid: gold.gstPaid.toString(),
      hallmarkCharge: gold.hallmarkCharge.toString(),
      karatPrice: gold.karatPrice.toString(),
      purchaseDate: gold.purchaseDate.toISOString().split('T')[0],
      merchant: gold.merchant,
      storageLocation: gold.storageLocation,
      storageCost: gold.storageCost.toString(),
      familyMember: gold.familyMember
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this gold holding?')) {
      try {
        await GoldService.updateGold(id, { saleDate: new Date() });
        toast.success('Gold holding marked as sold');
        loadGoldHoldings();
      } catch (error) {
        toast.error('Failed to update gold holding');
        console.error('Error updating gold:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      form: 'Jewelry',
      description: '',
      grossWeight: '',
      netWeight: '',
      stoneWeight: '',
      purity: '24K',
      purchasePrice: '',
      makingCharge: '',
      gstPaid: '',
      hallmarkCharge: '',
      karatPrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      merchant: '',
      storageLocation: '',
      storageCost: '',
      familyMember: ''
    });
  };

  const calculateTotalValue = async () => {
    const currentGoldRate = 6000; // Placeholder rate
    const goldValue = await GoldService.calculateCurrentGoldValue(currentGoldRate);
    return goldValue;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading gold holdings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Gold Investments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Holdings, weights & valuations</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="h-9 gap-1.5 shrink-0 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Gold
        </Button>
      </div>

      {/* Gold Holdings List */}
      <div className="space-y-2">
        {goldHoldings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <p className="text-sm text-muted-foreground">No gold holdings yet. Add your first holding.</p>
            </CardContent>
          </Card>
        ) : (
          goldHoldings.map((gold) => (
            <Card key={gold.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{gold.form} Gold</h3>
                    <Badge variant="outline" className="text-[10px]">{gold.purity}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{gold.netWeight}g</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(gold)} aria-label="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(gold.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {gold.description && <p className="text-xs text-muted-foreground mb-2">{gold.description}</p>}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Price: </span><span className="font-medium">{formatCurrency(gold.purchasePrice)}</span></div>
                  <div><span className="text-muted-foreground">Weight: </span><span className="font-medium">{gold.netWeight}g net</span></div>
                  <div><span className="text-muted-foreground">Member: </span><span className="font-medium">{gold.familyMember}</span></div>
                  <div><span className="text-muted-foreground">Storage: </span><span className="font-medium">{gold.storageLocation}</span></div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGold ? 'Edit Gold Holding' : 'Add Gold Holding'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="form">Form</Label>
              <Select value={formData.form} onValueChange={(value: any) => setFormData({...formData, form: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jewelry">Jewelry</SelectItem>
                  <SelectItem value="Coin">Coin</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Biscuit">Biscuit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Gold chain, earrings, etc."
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="grossWeight">Gross Weight (g)</Label>
                <Input
                  id="grossWeight"
                  type="number"
                  step="0.01"
                  value={formData.grossWeight}
                  onChange={(e) => setFormData({...formData, grossWeight: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="netWeight">Net Weight (g)</Label>
                <Input
                  id="netWeight"
                  type="number"
                  step="0.01"
                  value={formData.netWeight}
                  onChange={(e) => setFormData({...formData, netWeight: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stoneWeight">Stone Weight (g)</Label>
                <Input
                  id="stoneWeight"
                  type="number"
                  step="0.01"
                  value={formData.stoneWeight}
                  onChange={(e) => setFormData({...formData, stoneWeight: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purity">Purity</Label>
              <Select value={formData.purity} onValueChange={(value: any) => setFormData({...formData, purity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24K">24K</SelectItem>
                  <SelectItem value="22K">22K</SelectItem>
                  <SelectItem value="20K">20K</SelectItem>
                  <SelectItem value="18K">18K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
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
                <Label htmlFor="makingCharge">Making Charge (₹)</Label>
                <Input
                  id="makingCharge"
                  type="number"
                  step="0.01"
                  value={formData.makingCharge}
                  onChange={(e) => setFormData({...formData, makingCharge: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="familyMember">Family Member</Label>
              <Input
                id="familyMember"
                value={formData.familyMember}
                onChange={(e) => setFormData({...formData, familyMember: e.target.value})}
                placeholder="Self, Mother, etc."
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
