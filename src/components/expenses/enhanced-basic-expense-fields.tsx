
import { Input } from "@/components/ui/input";
import { ValidationErrors } from "@/hooks/use-enhanced-expense-validation";
import { AlertCircle, CheckCircle } from "lucide-react";

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
  const getFieldStatus = (fieldName: string) => {
    const hasError = !!errors[fieldName];
    const hasValue = !!formData[fieldName as keyof typeof formData];
    const isValid = hasValue && !hasError;
    
    return { hasError, hasValue, isValid };
  };

  const renderFieldIcon = (fieldName: string) => {
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
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Amount (₹) *
        </label>
        <div className="relative">
          <Input
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
        {!errors.amount && formData.amount && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid amount
          </p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Date *
        </label>
        <div className="relative">
          <Input
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
        {!errors.date && formData.date && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid date
          </p>
        )}
      </div>
      
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Tag/Merchant *
        </label>
        <div className="relative">
          <Input
            value={formData.tag}
            onChange={(e) => onFormDataChange({ tag: e.target.value })}
            onBlur={(e) => onFieldBlur('tag', e.target.value)}
            placeholder="e.g., Zomato, Amazon"
            required
            className={`pr-10 ${errors.tag ? "border-red-500 focus:ring-red-500" : getFieldStatus('tag').isValid ? "border-green-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {renderFieldIcon('tag')}
          </div>
        </div>
        {errors.tag && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.tag}
          </p>
        )}
        {!errors.tag && formData.tag && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid tag
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Enter a descriptive name for this expense (2-100 characters)
        </p>
      </div>
    </div>
  );
}
