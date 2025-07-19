import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Receipt, Loader2 } from "lucide-react";
import type { Expense as AppExpense } from "@/services/supabase-data-service";
import { SmartEntityLinking } from "./smart-entity-linking";
import { ExpenseItemization, ExpenseLineItem } from "./expense-itemization";
import { EnhancedBasicExpenseFields } from "./enhanced-basic-expense-fields";
import { CategoryPaymentSelectors } from "./category-payment-selectors";
import { AdvancedExpenseOptions } from "./advanced-expense-options";
import { useEnhancedExpenseValidation } from "@/hooks/use-enhanced-expense-validation";
import { useToast } from "@/hooks/use-toast";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { Logger } from "@/services/logger";
import { useEffect } from "react";
import type { PaymentMethod } from "./category-payment-selectors";

// Extended Expense type with additional properties
interface ExtendedExpense extends AppExpense {
  note?: string;
  merchant?: string;
  source?: string;
}

interface EnhancedAddExpenseFormProps {
  onSubmit: (expense: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: ExtendedExpense | null;
}

export function EnhancedAddExpenseForm({ onSubmit, onCancel, initialData }: EnhancedAddExpenseFormProps) {
  const { toast } = useToast();
  const { 
    errors, 
    validateField, 
    validateForm, 
    clearErrors, 
    isValidating,
  } = useEnhancedExpenseValidation();
  
  const [formData, setFormData<{
    amount: string;
    date: string;
    category: string;
    description: string;
    payment_method: PaymentMethod;
    tags: string[];
    note: string;
    merchant: string;
    account: string;
    source: string;
  }>({
    amount: initialData?.amount.toString() || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    category: initialData?.category || 'Food',
    description: initialData?.description || '',
    payment_method: (initialData?.payment_method || 'UPI') as PaymentMethod,
    tags: typeof initialData?.tags === 'string' ? initialData.tags.split(',').filter(Boolean) : (Array.isArray(initialData?.tags) ? initialData.tags : []),
    note: initialData?.note || '',
    merchant: initialData?.merchant || '',
    account: initialData?.account || '',
    source: initialData?.source || 'manual',
  });

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        date: initialData.date,
        category: initialData.category,
        description: initialData.description || '',
        payment_method: (initialData.payment_method || 'UPI') as PaymentMethod,
        tags: typeof initialData.tags === 'string' ? initialData.tags.split(',').filter(Boolean) : (Array.isArray(initialData.tags) ? initialData.tags : []),
        note: initialData.note || '',
        merchant: initialData.merchant || '',
        account: initialData.account || '',
        source: initialData.source || 'manual',
      });
    } else {
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Food',
        description: '',
        payment_method: 'UPI' as PaymentMethod,
        tags: [],
        note: '',
        merchant: '',
        account: '',
        source: 'manual',
      });
    }
    clearErrors();
  }, [initialData, clearErrors]);

  const [showItemization, setShowItemization] = useState(false);
  const [lineItems, setLineItems] = useState<ExpenseLineItem[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  EnhancedNotificationService.setToastFunction(toast);

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFieldBlur = async (fieldName: string, value: string) => {
    await validateField(fieldName, value, formData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isValidating) return;

    if (!formData.amount || !formData.description) {
       EnhancedNotificationService.validationError("Amount and Description are required.");
       return;
    }

    const mainAmount = parseFloat(formData.amount);

    if (showItemization && lineItems.length > 0) {
      const itemsTotal = lineItems.reduce((sum, item) => sum + (item.cost * (item.quantity || 1)), 0);
      if (Math.abs(itemsTotal - mainAmount) > 0.01) {
        EnhancedNotificationService.validationError("Line items total must match the main amount");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const expenseDataToSubmit: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        amount: mainAmount,
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        payment_method: formData.payment_method,
        tags: formData.tags.join(','), // Convert to flat string for compatibility
        type: 'expense',
      };

      await onSubmit(expenseDataToSubmit);

      Logger.info(`Expense ${isEditMode ? 'updated' : 'added'} successfully via form submission`);
      
      if (!isEditMode) {
        setFormData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: 'Food',
          description: '',
          payment_method: 'UPI',
          tags: [],
          note: '',
          merchant: '',
          account: '',
          source: 'manual',
        });
        setLineItems([]);
        setLinkedEntities({});
        setShowItemization(false);
      }
      clearErrors();
      
    } catch (error) {
      Logger.error('Failed to add expense', error);
      EnhancedNotificationService.error({
        title: "Failed to Add Expense",
        description: "Please try again. If the problem persists, check your connection.",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isValidating;

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {isEditMode ? 'Edit Expense' : 'Add New Expense'}
          {isValidating && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EnhancedBasicExpenseFields 
            formData={{
              amount: formData.amount,
              date: formData.date,
              description: formData.description,
            }}
            onFormDataChange={handleFormDataChange}
            onFieldBlur={(fieldName, value) => handleFieldBlur(fieldName as any, value)}
            errors={{
              amount: errors.amount,
              date: errors.date,
              description: errors.description
            }}
          />

          <CategoryPaymentSelectors 
            formData={{
              category: formData.category,
              payment_method: formData.payment_method,
            }}
            onFormDataChange={handleFormDataChange} 
          />

          <SmartEntityLinking
            category={formData.category}
            description={formData.description}
            onLinkChange={handleEntityLinkChange}
            linkedEntities={linkedEntities}
          />

          <Collapsible open={showItemization} onOpenChange={setShowItemization}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between" disabled={isFormDisabled}>
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
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isFormDisabled}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Expense' : 'Add Expense')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
          
          {Object.values(errors).some(e => !!e) && (
            <div className="text-sm text-red-600 mt-2">
              Please fix the errors above before submitting.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
