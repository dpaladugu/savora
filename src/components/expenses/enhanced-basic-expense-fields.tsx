
import { Input } from "@/components/ui/input";
import { ValidationErrors } from "@/hooks/use-enhanced-expense-validation";
import { AlertCircle, CheckCircle } from "lucide-react";

interface EnhancedBasicExpenseFieldsProps {
  formData: {
    amount: string;
    date: string;
    description: string;
  };
  onFormDataChange: (updates: Partial<EnhancedBasicExpenseFieldsProps['formData']>) => void;
  onFieldBlur: (fieldName: keyof EnhancedBasicExpenseFieldsProps['formData'], value: string) => void;
  errors: Pick<ValidationErrors, 'amount' | 'date' | 'description'>;
}

export function EnhancedBasicExpenseFields({ 
  formData, 
  onFormDataChange, 
  onFieldBlur,
  errors 
}: EnhancedBasicExpenseFieldsProps) {
  const getFieldStatus = (fieldName: keyof EnhancedBasicExpenseFieldsProps['formData']) => {
    const hasError = !!errors[fieldName];
    const hasValue = !!formData[fieldName];
    const isValid = hasValue && !hasError;
    return { hasError, hasValue, isValid };
  };

  const renderFieldIcon = (fieldName: keyof EnhancedBasicExpenseFieldsProps['formData']) => {
    const { hasError, isValid } = getFieldStatus(fieldName);
    if (hasError) return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (isValid)  return <CheckCircle  className="w-4 h-4 text-success"     />;
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Amount Field */}
      <div>
        <label htmlFor="expenseAmount" className="text-sm font-medium text-foreground mb-2 block">
          Amount (₹) *
        </label>
        <div className="relative">
          <Input
            id="expenseAmount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => onFormDataChange({ amount: e.target.value })}
            onBlur={(e) => onFieldBlur('amount', e.target.value)}
            placeholder="0.00"
            required
            className={`pr-10 ${errors.amount ? "border-destructive focus:ring-destructive" : getFieldStatus('amount').isValid ? "border-success" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('amount')}
          </div>
        </div>
        {errors.amount && (
          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.amount}
          </p>
        )}
        {!errors.amount && getFieldStatus('amount').isValid && (
          <p className="text-success text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid amount
          </p>
        )}
      </div>
      
      {/* Date Field */}
      <div>
        <label htmlFor="expenseDate" className="text-sm font-medium text-foreground mb-2 block">
          Date *
        </label>
        <div className="relative">
          <Input
            id="expenseDate"
            type="date"
            value={formData.date}
            onChange={(e) => onFormDataChange({ date: e.target.value })}
            onBlur={(e) => onFieldBlur('date', e.target.value)}
            required
            className={`pr-10 ${errors.date ? "border-destructive focus:ring-destructive" : getFieldStatus('date').isValid ? "border-success" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('date')}
          </div>
        </div>
        {errors.date && (
          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.date}
          </p>
        )}
        {!errors.date && getFieldStatus('date').isValid && (
          <p className="text-success text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid date
          </p>
        )}
      </div>
      
      {/* Description Field */}
      <div className="md:col-span-2">
        <label htmlFor="expenseDescription" className="text-sm font-medium text-foreground mb-2 block">
          Description *
        </label>
        <div className="relative">
          <Input
            id="expenseDescription"
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            onBlur={(e) => onFieldBlur('description', e.target.value)}
            placeholder="e.g., Lunch with client, Groceries"
            required
            className={`pr-10 ${errors.description ? "border-destructive focus:ring-destructive" : getFieldStatus('description').isValid ? "border-success" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('description')}
          </div>
        </div>
        {errors.description && (
          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.description}
          </p>
        )}
        {!errors.description && getFieldStatus('description').isValid && (
          <p className="text-success text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid description
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Enter a clear description for this expense (2-100 characters).
        </p>
      </div>
    </div>
  );
}
