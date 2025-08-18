
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import type { Tenant } from '@/types/financial';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId: string;
}

export function TenantModal({ isOpen, onClose, rentalId }: TenantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    leaseStart: new Date().toISOString().split('T')[0],
    leaseEnd: '',
    depositAmount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tenant: Omit<Tenant, 'id'> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        propertyId: rentalId,
        leaseStart: new Date(formData.leaseStart),
        leaseEnd: new Date(formData.leaseEnd),
        depositAmount: parseFloat(formData.depositAmount),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.tenants.add(tenant);

      toast.success('Tenant added successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: '',
        depositAmount: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add tenant');
      console.error('Error adding tenant:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter tenant name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <Input
              id="depositAmount"
              type="number"
              value={formData.depositAmount}
              onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
              placeholder="Enter deposit amount"
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
