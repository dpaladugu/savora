
interface CategoryPaymentSelectorsProps {
  formData: {
    category: string;
    paymentMode: 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet';
    linkedGoal: string;
  };
  onFormDataChange: (updates: Partial<CategoryPaymentSelectorsProps['formData']>) => void;
}

const categories = [
  'Food', 'Bills', 'Fuel', 'EMI', 'Shopping', 'Entertainment', 
  'Health', 'Travel', 'Education', 'Other', 'Servicing', 'Maintenance', 'RTO', 'Vehicle Insurance',
  'Insurance', 'Recurring', 'Water Tax', 'Property Tax', 'Repairs', 'Annual Fee', 'Joining Fee', 'Cashback'
];

const paymentModes: Array<'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet'> = [
  'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'
];

export function CategoryPaymentSelectors({ formData, onFormDataChange }: CategoryPaymentSelectorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
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
          Payment Mode *
        </label>
        <select
          value={formData.paymentMode}
          onChange={(e) => onFormDataChange({ paymentMode: e.target.value as typeof formData.paymentMode })}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
          required
        >
          {paymentModes.map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
      
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Linked Goal (Optional)
        </label>
        <input
          type="text"
          value={formData.linkedGoal}
          onChange={(e) => onFormDataChange({ linkedGoal: e.target.value })}
          placeholder="Select goal..."
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
        />
      </div>
    </div>
  );
}
