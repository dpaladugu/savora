
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import type { RentalProperty } from '@/types/financial';

interface AddRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentalAdded: () => void;
}

export function AddRentalModal({ isOpen, onClose, onRentalAdded }: AddRentalModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    address: '',
    owner: 'Me' as 'Me' | 'Mother' | 'Grandmother',
    type: 'Apartment' as 'Apartment' | 'House' | 'Commercial' | 'Plot',
    squareYards: '',
    monthlyRent: '',
    dueDay: '5',
    escalationPercent: '5',
    propertyTaxAnnual: '',
    waterTaxAnnual: '',
    maintenanceReserve: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const rentalProperty: Omit<RentalProperty, 'id'> = {
        address: formData.address,
        owner: formData.owner,
        type: formData.type,
        squareYards: Number(formData.squareYards),
        monthlyRent: Number(formData.monthlyRent),
        dueDay: Number(formData.dueDay),
        escalationPercent: Number(formData.escalationPercent),
        escalationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        lateFeeRate: 100, // Default late fee
        noticePeriodDays: 30, // Default notice period
        depositRefundPending: false,
        propertyTaxAnnual: Number(formData.propertyTaxAnnual) || 0,
        propertyTaxDueDay: 31, // Default to March 31
        waterTaxAnnual: Number(formData.waterTaxAnnual) || 0,
        waterTaxDueDay: 15, // Default to 15th
        maintenanceReserve: Number(formData.maintenanceReserve) || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.rentalProperties.add(rentalProperty);
      
      toast({
        title: "Rental Property Added",
        description: "Property has been successfully added to your portfolio.",
      });
      
      onRentalAdded();
      onClose();
      
      // Reset form
      setFormData({
        address: '',
        owner: 'Me',
        type: 'Apartment',
        squareYards: '',
        monthlyRent: '',
        dueDay: '5',
        escalationPercent: '5',
        propertyTaxAnnual: '',
        waterTaxAnnual: '',
        maintenanceReserve: ''
      });
    } catch (error) {
      console.error('Error adding rental property:', error);
      toast({
        title: "Error",
        description: "Failed to add rental property. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Rental Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="owner">Owner</Label>
            <Select value={formData.owner} onValueChange={(value: any) => setFormData({ ...formData, owner: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Me">Me</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Grandmother">Grandmother</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Property Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Plot">Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="squareYards">Square Yards</Label>
              <Input
                id="squareYards"
                type="number"
                value={formData.squareYards}
                onChange={(e) => setFormData({ ...formData, squareYards: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDay">Rent Due Day</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="escalationPercent">Escalation %</Label>
              <Input
                id="escalationPercent"
                type="number"
                step="0.1"
                value={formData.escalationPercent}
                onChange={(e) => setFormData({ ...formData, escalationPercent: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propertyTaxAnnual">Property Tax (Annual)</Label>
              <Input
                id="propertyTaxAnnual"
                type="number"
                value={formData.propertyTaxAnnual}
                onChange={(e) => setFormData({ ...formData, propertyTaxAnnual: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="waterTaxAnnual">Water Tax (Annual)</Label>
              <Input
                id="waterTaxAnnual"
                type="number"
                value={formData.waterTaxAnnual}
                onChange={(e) => setFormData({ ...formData, waterTaxAnnual: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maintenanceReserve">Maintenance Reserve</Label>
            <Input
              id="maintenanceReserve"
              type="number"
              value={formData.maintenanceReserve}
              onChange={(e) => setFormData({ ...formData, maintenanceReserve: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
