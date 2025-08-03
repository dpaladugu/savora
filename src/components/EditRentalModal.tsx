import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface EditRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId: string | null;
}

export function EditRentalModal({ isOpen, onClose, rentalId }: EditRentalModalProps) {
  const [formData, setFormData] = useState({
    address: '',
    owner: 'Me' as 'Me' | 'Mother' | 'Grandmother',
    type: 'Apartment' as 'Apartment' | 'House' | 'Commercial' | 'Plot',
    squareYards: '',
    monthlyRent: '',
    dueDay: '',
    escalationPercent: ''
  });

  useEffect(() => {
    if (rentalId && isOpen) {
      loadRentalData();
    }
  }, [rentalId, isOpen]);

  const loadRentalData = async () => {
    if (!rentalId) return;
    
    try {
      const rental = await db.rentalProperties.get(rentalId);
      if (rental) {
        setFormData({
          address: rental.address,
          owner: rental.owner,
          type: rental.type,
          squareYards: rental.squareYards.toString(),
          monthlyRent: rental.monthlyRent.toString(),
          dueDay: rental.dueDay.toString(),
          escalationPercent: rental.escalationPercent?.toString() || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load rental data');
      console.error('Error loading rental:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rentalId) return;

    try {
      await db.rentalProperties.update(rentalId, {
        owner: formData.owner,
        type: formData.type,
        squareYards: parseInt(formData.squareYards),
        monthlyRent: parseFloat(formData.monthlyRent),
        dueDay: parseInt(formData.dueDay),
        escalationPercent: formData.escalationPercent ? parseFloat(formData.escalationPercent) : 0
      });

      toast.success('Rental property updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update rental property');
      console.error('Error updating rental:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Rental Property</DialogTitle>
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
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Apartment' | 'House' | 'Commercial' | 'Plot' })}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
              required
            >
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Plot">Plot</option>
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
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
