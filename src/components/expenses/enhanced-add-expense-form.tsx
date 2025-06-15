
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Receipt, Loader2 } from "lucide-react";
import { Expense } from "@/services/expense-manager";
import { SmartEntityLinking } from "./smart-entity-linking";
import { ExpenseItemization, ExpenseLineItem } from "./expense-itemization";
import { EnhancedBasicExpenseFields } from "./enhanced-basic-expense-fields";
import { CategoryPaymentSelectors } from "./category-payment-selectors";
import { AdvancedExpenseOptions } from "./advanced-expense-options";
import { useEnhancedExpenseValidation } from "@/hooks/use-enhanced-expense-validation";
import { useToast } from "@/hooks/use-toast";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { Logger } from "@/services/logger";

interface EnhancedAddExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function EnhancedAddExpenseForm({ onSubmit, onCancel }: EnhancedAddExpenseFormProps) {
  const { toast } = useToast();
  const { 
    errors, 
    validateField, 
    validateForm, 
    clearErrors, 
    hasErrors, 
    isValidating 
  } = useEnhancedExpenseValidation();
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    tag: '',
    paymentMode: 'UPI' as const,
    note: '',
    linkedGoal: '',
    merchant: ''
  });

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

    Logger.info('Starting expense form submission', formData);
    
    const isValid = await validateForm(formData);
    if (!isValid || hasErrors) {
      EnhancedNotificationService.validationError("Please fix the errors before submitting");
      return;
    }

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
      await onSubmit({
        amount: mainAmount,
        date: formData.date,
        category: formData.category,
        description: formData.tag,
        type: 'expense' as const,
        paymentMethod: formData.paymentMode,
        tags: formData.tag ? [formData.tag] : undefined,
      });

      EnhancedNotificationService.expenseAdded();
      Logger.info('Expense added successfully');
      
      // Reset form
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Food',
        tag: '',
        paymentMode: 'UPI' as const,
        note: '',
        linkedGoal: '',
        merchant: ''
      });
      clearErrors();
      setLineItems([]);
      setLinkedEntities({});
      setShowItemization(false);
      
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

  const isFormDisabled = isSubmitting || isValidating || hasErrors;

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Add New Expense
          {isValidating && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EnhancedBasicExpenseFields 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
            onFieldBlur={handleFieldBlur}
            errors={errors}
          />

          <CategoryPaymentSelectors 
            formData={formData} 
            onFormDataChange={handleFormDataChange} 
          />

          <SmartEntityLinking
            category={formData.category}
            tag={formData.tag}
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
              {isSubmitting ? 'Adding...' : 'Add Expense'}
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
          
          {hasErrors && (
            <div className="text-sm text-red-600 mt-2">
              Please fix the errors above before submitting.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
