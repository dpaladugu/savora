
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
    owner: '',
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
        type: 'Residential',
        squareYards: parseInt(formData.squareYards),
        maxTenants: 1,
        monthlyRent: parseFloat(formData.monthlyRent),
        dueDay: 1,
        escalationPercent: 10
      });

      toast.success('Rental property added successfully!');
      setFormData({
        address: '',
        owner: '',
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
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="Property owner"
              required
            />
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
