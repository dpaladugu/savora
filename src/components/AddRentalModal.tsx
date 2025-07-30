
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface AddRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRentalModal({ isOpen, onClose }: AddRentalModalProps) {
  const [formData, setFormData] = useState({
    address: '',
    owner: 'Me' as 'Me' | 'Mother' | 'Grandmother',
    type: 'Apartment' as 'Apartment' | 'House' | 'Commercial' | 'Land',
    squareYards: '',
    monthlyRent: '',
    deposit: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await db.rentalProperties.add({
        id: crypto.randomUUID(),
        address: formData.address,
        owner: formData.owner,
        type: formData.type,
        squareYards: parseInt(formData.squareYards),
        monthlyRent: parseFloat(formData.monthlyRent),
        dueDay: 1,
        escalationPercent: 10,
        escalationDate: new Date(),
        lateFeeRate: 5,
        noticePeriodDays: 30,
        depositRefundPending: false,
        propertyTaxAnnual: 0,
        propertyTaxDueDay: 1,
        waterTaxAnnual: 0,
        waterTaxDueDay: 1
      });

      toast.success('Rental property added successfully!');
      setFormData({
        address: '',
        owner: 'Me',
        type: 'Apartment',
        squareYards: '',
        monthlyRent: '',
        deposit: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add rental property');
      console.error('Error adding rental:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Rental Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter property address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <select
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value as 'Me' | 'Mother' | 'Grandmother' })}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              required
            >
              <option value="Me">Me</option>
              <option value="Mother">Mother</option>
              <option value="Grandmother">Grandmother</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Apartment' | 'House' | 'Commercial' | 'Land' })}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              required
            >
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="squareYards">Square Yards</Label>
            <Input
              id="squareYards"
              type="number"
              value={formData.squareYards}
              onChange={(e) => setFormData({ ...formData, squareYards: e.target.value })}
              placeholder="Property size"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent</Label>
            <Input
              id="monthlyRent"
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
              placeholder="Monthly rent amount"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit</Label>
            <Input
              id="deposit"
              type="number"
              value={formData.deposit}
              onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
              placeholder="Security deposit"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
