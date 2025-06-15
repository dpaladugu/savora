
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Receipt } from "lucide-react";
import { Expense } from "@/services/expense-manager";
import { SmartEntityLinking } from "./smart-entity-linking";
import { ExpenseItemization, ExpenseLineItem } from "./expense-itemization";
import { BasicExpenseFields } from "./basic-expense-fields";
import { CategoryPaymentSelectors } from "./category-payment-selectors";
import { AdvancedExpenseOptions } from "./advanced-expense-options";

interface AddExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

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
  const [linkedEntities, setLinkedEntities] = useState<Record<string, string>>({});

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

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

    onSubmit({
      amount: mainAmount,
      date: formData.date,
      category: formData.category,
      description: formData.tag,
      type: 'expense' as const,
      paymentMethod: formData.paymentMode,
      tags: formData.tag ? [formData.tag] : undefined,
    });
  };

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <BasicExpenseFields 
            formData={formData} 
            onFormDataChange={handleFormDataChange} 
          />

          <CategoryPaymentSelectors 
            formData={formData} 
            onFormDataChange={handleFormDataChange} 
          />

          <SmartEntityLinking
            category={formData.category}
            tag={formData.tag}
            onLinkChange={handleEntityLinkChange}
            linkedEntities={linkedEntities}
          />

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

          <AdvancedExpenseOptions 
            formData={formData} 
            onFormDataChange={handleFormDataChange} 
          />
          
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
