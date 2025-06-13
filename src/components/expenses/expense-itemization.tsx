
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export interface ExpenseLineItem {
  id: string;
  name: string;
  cost: number;
  quantity?: number;
  notes?: string;
}

interface ExpenseItemizationProps {
  totalAmount: number;
  onItemsChange: (items: ExpenseLineItem[]) => void;
  initialItems?: ExpenseLineItem[];
}

export function ExpenseItemization({ totalAmount, onItemsChange, initialItems = [] }: ExpenseItemizationProps) {
  const [items, setItems] = useState<ExpenseLineItem[]>(initialItems);

  const addItem = () => {
    const newItem: ExpenseLineItem = {
      id: Date.now().toString(),
      name: '',
      cost: 0,
      quantity: 1
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const updateItem = (id: string, field: keyof ExpenseLineItem, value: string | number) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (item.cost * (item.quantity || 1)), 0);
  const hasDiscrepancy = Math.abs(itemsTotal - totalAmount) > 0.01;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/30 rounded-lg">
            <div className="col-span-4">
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ''}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                className="h-9 text-sm"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Cost"
                value={item.cost || ''}
                onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground text-center">
                ₹{(item.cost * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="col-span-12 mt-2">
              <Input
                placeholder="Notes (optional)"
                value={item.notes || ''}
                onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Line Item
      </Button>

      {items.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Items Total:</span>
            <span className="font-bold">₹{itemsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Expense Total:</span>
            <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
          </div>
          {hasDiscrepancy && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Discrepancy: ₹{Math.abs(itemsTotal - totalAmount).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
