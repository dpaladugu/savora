
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";

interface AdvancedExpenseOptionsProps {
interface AdvancedExpenseOptionsProps {
  formData: {
    merchant: string;
    note: string;
    account: string;
    tags: string[]; // Added for tag input, expects array from parent
  };
  // onFormDataChange needs to handle updates for 'tags' as string[]
  onFormDataChange: (updates: Partial<Omit<AdvancedExpenseOptionsProps['formData'], 'tags'> & { tags?: string[] | string }>) => void;
}

export function AdvancedExpenseOptions({ formData, onFormDataChange }: AdvancedExpenseOptionsProps) {
// Local state for the comma-separated tags input string
  const [tagsInput, setTagsInput] = useState<string>(formData.tags.join(', '));

  useEffect(() => {
    // Sync local tagsInput when formData.tags from parent changes (e.g., on form reset or initialData load)
    setTagsInput(formData.tags.join(', '));
  }, [formData.tags]);

  const handleTagsInputChange = (value: string) => {
    setTagsInput(value);
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    onFormDataChange({ tags: tagsArray });
  };
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  return (
    <>
      <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Advanced Options</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Merchant (Optional)
            </label>
            <Input
              value={formData.merchant}
              onChange={(e) => onFormDataChange({ merchant: e.target.value })}
              placeholder="Merchant name..."
            />
          </div>
          <div>
            <label htmlFor="expenseAccount" className="text-sm font-medium text-foreground mb-2 block">
              Account (Optional)
            </label>
            <Input
              id="expenseAccount"
              value={formData.account}
              onChange={(e) => onFormDataChange({ account: e.target.value })}
              placeholder="e.g., Checking, Credit Card X"
            />
          </div>
          <div>
            <label htmlFor="expenseTags" className="text-sm font-medium text-foreground mb-2 block">
              Tags (Optional, comma-separated)
            </label>
            <Input
              id="expenseTags"
              value={tagsInput}
              onChange={(e) => handleTagsInputChange(e.target.value)}
              placeholder="e.g., work, personal, travel"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div>
        <label htmlFor="expenseNote" className="text-sm font-medium text-foreground mb-2 block">
          Note (Optional)
        </label>
        <Input
          id="expenseNote"
          value={formData.note}
          onChange={(e) => onFormDataChange({ note: e.target.value })}
          placeholder="Additional details..."
        />
      </div>
    </>
  );
}
