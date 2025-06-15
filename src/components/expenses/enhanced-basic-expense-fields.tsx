
import { Input } from "@/components/ui/input";
import { ValidationErrors } from "./expense-form-validation";

interface EnhancedBasicExpenseFieldsProps {
  formData: {
    amount: string;
    date: string;
    tag: string;
  };
  onFormDataChange: (updates: Partial<EnhancedBasicExpenseFieldsProps['formData']>) => void;
  onFieldBlur: (fieldName: string, value: string) => void;
  errors: ValidationErrors;
}

export function EnhancedBasicExpenseFields({ 
  formData, 
  onFormDataChange, 
  onFieldBlur,
  errors 
}: EnhancedBasicExpenseFieldsProps) {
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
          onBlur={(e) => onFieldBlur('amount', e.target.value)}
          placeholder="0.00"
          required
          className={errors.amount ? "border-red-500" : ""}
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Date *
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => onFormDataChange({ date: e.target.value })}
          onBlur={(e) => onFieldBlur('date', e.target.value)}
          required
          className={errors.date ? "border-red-500" : ""}
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>
      
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Tag/Merchant *
        </label>
        <Input
          value={formData.tag}
          onChange={(e) => onFormDataChange({ tag: e.target.value })}
          onBlur={(e) => onFieldBlur('tag', e.target.value)}
          placeholder="e.g., Zomato, Amazon"
          required
          className={errors.tag ? "border-red-500" : ""}
        />
        {errors.tag && (
          <p className="text-red-500 text-xs mt-1">{errors.tag}</p>
        )}
      </div>
    </div>
  );
}
