
import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Txn } from '@/types/financial';

interface AddTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (txn: Omit<Txn, 'id'>) => Promise<void>;
}

export function AddTxnModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: AddTxnModalProps) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [goalId, setGoalId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTxn: Omit<Txn, 'id'> = {
      date: new Date(date),
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      currency: 'INR',
      category,
      note,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      goalId: goalId || undefined,
      paymentMix: [{ mode: paymentMethod as any, amount: Math.abs(amount) }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await onAdd(newTxn);
      // Reset form
      setAmount(0);
      setCategory('');
      setNote('');
      setDate('');
      setTags('');
      setPaymentMethod('Cash');
      setGoalId('');
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Add Transaction</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Input
                type="text"
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="goalId">Goal (Optional)</Label>
              <Input
                type="text"
                id="goalId"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              />
            </div>
            <Button type="submit">Add Transaction</Button>
          </form>
        </ModalBody>
        <ModalFooter>
          <ModalCloseButton />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
