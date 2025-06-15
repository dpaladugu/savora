import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, Trash2, Car, Settings, Receipt } from "lucide-react";
import { Expense } from "@/services/expense-manager";
import { SmartEntityLinking } from "./smart-entity-linking";
import { ExpenseItemization, ExpenseLineItem } from "./expense-itemization";

interface AddExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

const categories = [
  'Food', 'Bills', 'Fuel', 'EMI', 'Shopping', 'Entertainment', 
  'Health', 'Travel', 'Education', 'Other', 'Servicing', 'Maintenance', 'RTO', 'Vehicle Insurance',
  'Insurance', 'Recurring', 'Water Tax', 'Property Tax', 'Repairs', 'Annual Fee', 'Joining Fee', 'Cashback'
];

const paymentModes: Array<'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet'> = [
  'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'
];

export function AddExpenseForm({ onSubmit, onCancel }: AddExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    tag: '',
    paymentMode: 'UPI' as const,
    note: '',
    linkedGoal: '',
    merchant: ''
  });

  const [showItemization, setShowItemization] = useState(false);
  const [lineItems, setLineItems] = useState<ExpenseLineItem[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [linkedEntities, setLinkedEntities] = useState<Record<string, string>>({});

  const handleEntityLinkChange = (entityType: string, entityId: string) => {
    setLinkedEntities(prev => ({
      ...prev,
      [entityType]: entityId
    }));
  };

  const handleItemsChange = (items: ExpenseLineItem[]) => {
    setLineItems(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.tag) {
      return;
    }

    const mainAmount = parseFloat(formData.amount);

    // Check if itemization totals match
    if (showItemization && lineItems.length > 0) {
      const itemsTotal = lineItems.reduce((sum, item) => sum + (item.cost * (item.quantity || 1)), 0);
      if (Math.abs(itemsTotal - mainAmount) > 0.01) {
        alert('Line items total must match the main amount');
        return;
      }
    }

    // Convert line items to expense format
    const convertedLineItems = lineItems.length > 0 ? lineItems.map(item => ({
      id: item.id,
      title: item.name,
      amount: item.cost * (item.quantity || 1)
    })) : undefined;

    onSubmit({
      amount: mainAmount,
      date: formData.date,
      category: formData.category,
      description: formData.tag, // Use description instead of tag
      type: 'expense' as const,
      paymentMethod: formData.paymentMode,
      tags: formData.tag ? [formData.tag] : undefined, // Convert tag to tags array
      // Note: Other properties like linkedGoal, merchant, etc. are not part of the base Expense interface
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
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as typeof formData.paymentMode })}
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

          {/* Smart Entity Linking */}
          <SmartEntityLinking
            category={formData.category}
            tag={formData.tag}
            onLinkChange={handleEntityLinkChange}
            linkedEntities={linkedEntities}
          />

          {/* Expense Itemization */}
          <Collapsible open={showItemization} onOpenChange={setShowItemization}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>Itemize Expense (Optional)</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <ExpenseItemization
                totalAmount={parseFloat(formData.amount) || 0}
                onItemsChange={handleItemsChange}
                initialItems={lineItems}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Advanced Options */}
          <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Advanced Options</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Merchant (Optional)
                </label>
                <Input
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="Merchant name..."
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
          
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
