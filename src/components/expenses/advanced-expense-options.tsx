
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";

interface AdvancedExpenseOptionsProps {
  formData: {
    merchant: string;
    note: string;
  };
  onFormDataChange: (updates: Partial<typeof formData>) => void;
}

export function AdvancedExpenseOptions({ formData, onFormDataChange }: AdvancedExpenseOptionsProps) {
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
        </CollapsibleContent>
      </Collapsible>
      
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Note (Optional)
        </label>
        <Input
          value={formData.note}
          onChange={(e) => onFormDataChange({ note: e.target.value })}
          placeholder="Additional details..."
        />
      </div>
    </>
  );
}
