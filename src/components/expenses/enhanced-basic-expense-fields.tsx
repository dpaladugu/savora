
import { Input } from "@/components/ui/input";
import { ValidationErrors } from "@/hooks/use-enhanced-expense-validation";
import { AlertCircle, CheckCircle } from "lucide-react";

interface EnhancedBasicExpenseFieldsProps {
  formData: {
    amount: string;
    date: string;
    description: string; // Changed from tag
  };
  onFormDataChange: (updates: Partial<EnhancedBasicExpenseFieldsProps['formData']>) => void;
  onFieldBlur: (fieldName: keyof EnhancedBasicExpenseFieldsProps['formData'], value: string) => void; // fieldName is now typed
  errors: Pick<ValidationErrors, 'amount' | 'date' | 'description'>; // Errors specific to these fields
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
    
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
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
            className={`pr-10 ${errors.amount ? "border-red-500 focus:ring-red-500" : getFieldStatus('amount').isValid ? "border-green-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('amount')}
          </div>
        </div>
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.amount}
          </p>
        )}
        {!errors.amount && getFieldStatus('amount').isValid && ( // Show valid message only if validated and no error
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
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
            className={`pr-10 ${errors.date ? "border-red-500 focus:ring-red-500" : getFieldStatus('date').isValid ? "border-green-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('date')}
          </div>
        </div>
        {errors.date && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.date}
          </p>
        )}
        {!errors.date && getFieldStatus('date').isValid && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid date
          </p>
        )}
      </div>
      
      {/* Description Field (formerly Tag/Merchant) */}
      <div className="md:col-span-2">
        <label htmlFor="expenseDescription" className="text-sm font-medium text-foreground mb-2 block">
          Description *
        </label>
        <div className="relative">
          <Input
            id="expenseDescription"
            value={formData.description} // Changed from formData.tag
            onChange={(e) => onFormDataChange({ description: e.target.value })} // Changed from tag
            onBlur={(e) => onFieldBlur('description', e.target.value)} // Changed from tag
            placeholder="e.g., Lunch with client, Groceries"
            required
            className={`pr-10 ${errors.description ? "border-red-500 focus:ring-red-500" : getFieldStatus('description').isValid ? "border-green-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('description')}
          </div>
        </div>
        {errors.description && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.description}
          </p>
        )}
        {!errors.description && getFieldStatus('description').isValid && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
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
