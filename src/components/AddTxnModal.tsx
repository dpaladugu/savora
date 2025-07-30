
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { useCreditCards } from '@/hooks/useLiveData';

interface AddTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTxnModal({ isOpen, onClose }: AddTxnModalProps) {
  const creditCards = useCreditCards();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    cardId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await db.txns.add({
        id: crypto.randomUUID(),
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        currency: 'INR',
        category: formData.category,
        note: '',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        cardId: formData.cardId || undefined,
        paymentMix: [{ method: 'UPI', amount: parseFloat(formData.amount) }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      });

      toast.success('Transaction added successfully!');
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        cardId: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error('Error adding transaction:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Groceries">Groceries</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Dining">Dining</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Enter tags (comma-separated)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="creditCard">Credit Card</Label>
            <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select credit card (optional)" />
              </SelectTrigger>
              <SelectContent>
                {creditCards?.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.issuer} - {card.last4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
