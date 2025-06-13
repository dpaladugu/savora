
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, Trash2, Car, Settings } from "lucide-react";
import { Expense } from "./expense-tracker";

interface AddExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

const categories = [
  'Food', 'Bills', 'Fuel', 'EMI', 'Shopping', 'Entertainment', 
  'Health', 'Travel', 'Education', 'Other', 'Servicing', 'Maintenance', 'RTO', 'Vehicle Insurance'
];

const paymentModes: Array<'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet'> = [
  'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'
];

// Mock vehicle data - in real app, this would come from the Vehicle Manager
const mockVehicles = [
  { id: '1', name: 'My Swift', number: 'TS09AB1234' },
  { id: '2', name: 'Activa', number: 'TS10XY5678' }
];

interface LineItem {
  id: string;
  title: string;
  amount: number;
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
    merchant: '',
    linkedVehicle: ''
  });

  const [showItemization, setShowItemization] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const vehicleCategories = ['Fuel', 'Servicing', 'Maintenance', 'RTO', 'Vehicle Insurance'];
  const isVehicleRelated = vehicleCategories.includes(formData.category);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      title: '',
      amount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: 'title' | 'amount', value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const mainAmount = parseFloat(formData.amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.tag) {
      return;
    }

    // Check if itemization totals match
    if (showItemization && lineItems.length > 0 && Math.abs(lineItemsTotal - mainAmount) > 0.01) {
      alert('Line items total must match the main amount');
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
      merchant: formData.merchant || formData.tag,
      linkedVehicle: formData.linkedVehicle || undefined,
      lineItems: showItemization && lineItems.length > 0 ? lineItems : undefined
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

          {/* Smart Vehicle Suggestion */}
          {isVehicleRelated && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  This seems like a vehicle-related expense. Want to link it?
                </span>
              </div>
              <select
                value={formData.linkedVehicle}
                onChange={(e) => setFormData({ ...formData, linkedVehicle: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-blue-300 bg-background text-foreground text-sm"
              >
                <option value="">Select a vehicle (optional)</option>
                {mockVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expense Itemization */}
          <Collapsible open={showItemization} onOpenChange={setShowItemization}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <span>Itemize Expense (Optional)</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Item description"
                      value={item.title}
                      onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.amount || ''}
                      onChange={(e) => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Line Item
              </Button>

              {lineItems.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Line items total: ₹{lineItemsTotal.toFixed(2)}
                  {mainAmount > 0 && Math.abs(lineItemsTotal - mainAmount) > 0.01 && (
                    <span className="text-red-600 ml-2">
                      (Doesn't match main amount: ₹{mainAmount.toFixed(2)})
                    </span>
                  )}
                </div>
              )}
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
              {!isVehicleRelated && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Link to Vehicle (Optional)
                  </label>
                  <select
                    value={formData.linkedVehicle}
                    onChange={(e) => setFormData({ ...formData, linkedVehicle: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select a vehicle (optional)</option>
                    {mockVehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.number})
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
