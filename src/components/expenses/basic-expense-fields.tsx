
import { Input } from "@/components/ui/input";

interface BasicExpenseFieldsProps {
  formData: {
    amount: string;
    date: string;
    tag: string;
  };
  onFormDataChange: (updates: Partial<BasicExpenseFieldsProps['formData']>) => void;
}

export function BasicExpenseFields({ formData, onFormDataChange }: BasicExpenseFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Amount (₹) *
        </label>
        <Input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => onFormDataChange({ amount: e.target.value })}
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
          onChange={(e) => onFormDataChange({ date: e.target.value })}
          required
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Tag/Merchant *
        </label>
        <Input
          value={formData.tag}
          onChange={(e) => onFormDataChange({ tag: e.target.value })}
          placeholder="e.g., Zomato, Amazon"
          required
        />
      </div>
    </div>
  );
}
