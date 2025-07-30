
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId: string | null;
}

export function TenantModal({ isOpen, onClose, rentalId }: TenantModalProps) {
  const [formData, setFormData] = useState({
    tenantName: '',
    roomNo: '',
    monthlyRent: '',
    depositPaid: '',
    joinDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rentalId) return;

    try {
      await db.tenants.add({
        id: crypto.randomUUID(),
        propertyId: rentalId,
        tenantName: formData.tenantName,
        roomNo: formData.roomNo || undefined,
        monthlyRent: parseFloat(formData.monthlyRent),
        depositPaid: parseFloat(formData.depositPaid),
        joinDate: new Date(formData.joinDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      });

      toast.success('Tenant added successfully!');
      setFormData({
        tenantName: '',
        roomNo: '',
        monthlyRent: '',
        depositPaid: '',
        joinDate: new Date().toISOString().split('T')[0],
        endDate: ''
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
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              value={formData.tenantName}
              onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
              placeholder="Enter tenant name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roomNo">Room Number</Label>
            <Input
              id="roomNo"
              value={formData.roomNo}
              onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
              placeholder="Room number (optional)"
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
            <Label htmlFor="depositPaid">Deposit Paid</Label>
            <Input
              id="depositPaid"
              type="number"
              value={formData.depositPaid}
              onChange={(e) => setFormData({ ...formData, depositPaid: e.target.value })}
              placeholder="Security deposit amount"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
