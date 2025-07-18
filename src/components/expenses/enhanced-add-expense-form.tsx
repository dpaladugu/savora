
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Receipt, Loader2 } from "lucide-react";
// Use AppExpense type
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
import { useEffect } from "react"; // Added useEffect
import type { PaymentMethod } from "./category-payment-selectors"; // Import PaymentMethod type

interface EnhancedAddExpenseFormProps {
  onSubmit: (expense: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: AppExpense | null; // For editing
}

export function EnhancedAddExpenseForm({ onSubmit, onCancel, initialData }: EnhancedAddExpenseFormProps) {
  const { toast } = useToast();
  const { 
    errors, 
    validateField, 
    validateForm, 
    clearErrors, 
    // hasErrors, // This will be derived or handled by validateForm's boolean return
    isValidating 
  } = useEnhancedExpenseValidation();
  
  // Internal form state - keep it flat as it is, map to AppExpense on submit
  const [formData, setFormData] = useState<{
    amount: string;
    date: string;
    category: string;
    description: string;
    payment_method: PaymentMethod; // Typed correctly
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
    payment_method: (initialData?.payment_method || 'UPI') as PaymentMethod, // Ensure type
    tags: initialData?.tags || [],
    note: initialData?.note || '',
    merchant: initialData?.merchant || '',
    account: initialData?.account || '',
    source: initialData?.source || 'manual',
    // linkedGoal was here, removing as it's removed from CategoryPaymentSelectors for now
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
        tags: initialData.tags || [],
        note: initialData.note || '',
        merchant: initialData.merchant || '',
        account: initialData.account || '',
        source: initialData.source || 'manual',
      });
    } else {
      // Reset for "add" mode
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Food',
        description: '',
        payment_method: 'UPI' as PaymentMethod, // Ensure type on reset
        tags: [],
        note: '',
        merchant: '',
        account: '',
        source: 'manual',
      });
    }
    clearErrors(); // Clear validation errors when form mode changes or data is reset
  }, [initialData, clearErrors]);

  const [showItemization, setShowItemization] = useState(false);
  const [lineItems, setLineItems] = useState<ExpenseLineItem[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up notification service
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

    // Logger.info('Starting expense form submission', formData); // formData structure changed
    
    // Validate form against the current formData state
    // const isValid = await validateForm(formData); // validateForm might need adjustment if its internal checks depend on old field names
    // For now, assuming basic validation or that validateForm is adapted separately.
    // A simple check for amount and description (previously tag)
    if (!formData.amount || !formData.description) {
       EnhancedNotificationService.validationError("Amount and Description are required.");
       return;
    }
    // if (!isValid || hasErrors) { // hasErrors was removed from useEnhancedExpenseValidation destructuring
    //   EnhancedNotificationService.validationError("Please fix the errors before submitting");
    //   return;
    // }


    const mainAmount = parseFloat(formData.amount);

    // Check if itemization totals match
    if (showItemization && lineItems.length > 0) {
      const itemsTotal = lineItems.reduce((sum, item) => sum + (item.cost * (item.quantity || 1)), 0);
      if (Math.abs(itemsTotal - mainAmount) > 0.01) {
        EnhancedNotificationService.validationError("Line items total must match the main amount");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Construct the AppExpense compatible object
      const expenseDataToSubmit: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        amount: mainAmount,
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        payment_method: formData.payment_method,
        tags: formData.tags.filter(t => t.trim() !== ''), // Ensure tags are actual strings and not empty
        note: formData.note?.trim() || undefined,
        merchant: formData.merchant?.trim() || undefined,
        account: formData.account?.trim() || undefined,
        source: formData.source,
        // itemized_items and linked_goal_id are not part of AppExpense yet
      };

      await onSubmit(expenseDataToSubmit);

      // Notification handled by parent (ExpenseTracker) after Supabase success
      // EnhancedNotificationService.expenseAdded(); // This might be redundant if parent shows toast
      Logger.info(`Expense ${isEditMode ? 'updated' : 'added'} successfully via form submission`);
      
      // Reset form only if not in edit mode, or if edit was successful (parent closes form)
      if (!isEditMode) {
        setFormData({ // Reset to initial add mode state
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
      clearErrors(); // Clear validation errors after successful submission
      
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
            onFormDataChange={handleFormDataChange} // This needs to correctly map back if field names differ
            onFieldBlur={(fieldName, value) => handleFieldBlur(fieldName as any, value)} // Cast needed if fieldName type is stricter in child
            errors={{
              amount: errors.amount,
              date: errors.date,
              description: errors.description
            }} // Pass specific errors
          />

          <CategoryPaymentSelectors 
            formData={{
              category: formData.category,
              payment_method: formData.payment_method, // No cast needed now
            }}
            onFormDataChange={handleFormDataChange} 
          />

          <SmartEntityLinking
            category={formData.category}
            description={formData.description} // Changed from tag to description
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
