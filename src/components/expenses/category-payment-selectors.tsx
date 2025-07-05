
// Define the specific payment method type for clarity and reusability
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet';

interface CategoryPaymentSelectorsProps {
  formData: {
    category: string;
    payment_method: PaymentMethod; // Changed from paymentMode
    // linkedGoal: string; // Temporarily removed
  };
  onFormDataChange: (updates: Partial<Pick<CategoryPaymentSelectorsProps['formData'], 'category' | 'payment_method'>>) => void;
}

const categories = [
  'Food', 'Bills', 'Fuel', 'EMI', 'Shopping', 'Entertainment', 
  'Health', 'Travel', 'Education', 'Other', 'Servicing', 'Maintenance', 'RTO', 'Vehicle Insurance',
  'Insurance', 'Recurring', 'Water Tax', 'Property Tax', 'Repairs', 'Annual Fee', 'Joining Fee', 'Cashback'
];

const paymentMethodsList: PaymentMethod[] = [ // Renamed and typed
  'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'
];

export function CategoryPaymentSelectors({ formData, onFormDataChange }: CategoryPaymentSelectorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="expenseCategory" className="text-sm font-medium text-foreground mb-2 block">
          Category *
        </label>
        <select
          id="expenseCategory"
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
        <label htmlFor="expensePaymentMethod" className="text-sm font-medium text-foreground mb-2 block">
          Payment Method *
        </label>
        <select
          id="expensePaymentMethod"
          value={formData.payment_method} // Changed from paymentMode
          onChange={(e) => onFormDataChange({ payment_method: e.target.value as PaymentMethod })} // Changed from paymentMode
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
          required
        >
          {paymentMethodsList.map(mode => ( // Changed from paymentModes
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
      
      {/* linkedGoal field removed for now */}
      {/* <div className="md:col-span-2">
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
      </div> */}
    </div>
  );
}
