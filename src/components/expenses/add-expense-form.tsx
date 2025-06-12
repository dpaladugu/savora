
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Expense } from "./expense-tracker";

interface AddExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

const categories = [
  'Food', 'Bills', 'Fuel', 'EMI', 'Shopping', 'Entertainment', 
  'Health', 'Travel', 'Education', 'Other'
];

const paymentModes = [
  'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 
  'Wallet', 'Cash', 'Net Banking'
];

export function AddExpenseForm({ onSubmit, onCancel }: AddExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    tag: '',
    paymentMode: 'UPI',
    note: '',
    linkedGoal: '',
    merchant: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.tag) {
      return;
    }

    onSubmit({
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      tag: formData.tag,
      paymentMode: formData.paymentMode,
      note: formData.note || undefined,
      linkedGoal: formData.linkedGoal || undefined,
      merchant: formData.merchant || formData.tag
    });
  };

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Amount (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tag/Merchant *
              </label>
              <Input
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="e.g., Zomato, Amazon"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Payment Mode *
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                required
              >
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Linked Goal (Optional)
              </label>
              <Input
                value={formData.linkedGoal}
                onChange={(e) => setFormData({ ...formData, linkedGoal: e.target.value })}
                placeholder="Select goal..."
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Note (Optional)
            </label>
            <Input
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Additional details..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Expense
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
