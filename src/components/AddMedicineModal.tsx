
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import type { Health } from '@/types/financial';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string | null;
}

export function AddMedicineModal({ isOpen, onClose, profileId }: AddMedicineModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    refillQty: '',
    refillAlertDays: '',
    prescribedBy: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId) return;

    try {
      const healthRecord: Omit<Health, 'id'> = {
        refillAlertDays: parseInt(formData.refillAlertDays),
        familyHistory: [],
        vaccinations: [],
        vitals: [],
        prescriptions: [{
          date: new Date(formData.startDate),
          doctor: formData.prescribedBy || 'Unknown',
          medicines: [formData.name],
          amount: 0
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.health.add(healthRecord);

      toast.success('Medicine added successfully!');
      setFormData({
        name: '',
        dosage: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        refillQty: '',
        refillAlertDays: '',
        prescribedBy: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add medicine');
      console.error('Error adding medicine:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Medicine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medicine Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter medicine name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 500mg twice daily"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
          
          <div className="space-y-2">
            <Label htmlFor="refillQty">Refill Quantity</Label>
            <Input
              id="refillQty"
              type="number"
              value={formData.refillQty}
              onChange={(e) => setFormData({ ...formData, refillQty: e.target.value })}
              placeholder="Number of tablets/doses"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refillAlertDays">Refill Alert Days</Label>
            <Input
              id="refillAlertDays"
              type="number"
              value={formData.refillAlertDays}
              onChange={(e) => setFormData({ ...formData, refillAlertDays: e.target.value })}
              placeholder="Days before refill needed"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prescribedBy">Prescribed By</Label>
            <Input
              id="prescribedBy"
              value={formData.prescribedBy}
              onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
              placeholder="Doctor name"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Medicine
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
