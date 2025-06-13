
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Car, Shield, CreditCard, Home, Target } from "lucide-react";

interface EntityLinkingProps {
  category: string;
  tag: string;
  onLinkChange: (entityType: string, entityId: string) => void;
  linkedEntities: Record<string, string>;
}

// Mock data - in real app, this would come from the respective managers
const mockVehicles = [
  { id: '1', name: 'My Swift', number: 'TS09AB1234' },
  { id: '2', name: 'Activa', number: 'TS10XY5678' }
];

const mockInsurance = [
  { id: '1', name: 'Car Insurance - ICICI Lombard', type: 'Vehicle' },
  { id: '2', name: 'Health Insurance - Star Health', type: 'Health' }
];

const mockProperties = [
  { id: '1', name: 'Shop - MG Road', type: 'Commercial' },
  { id: '2', name: 'Flat - Jubilee Hills', type: 'Residential' }
];

const mockCreditCards = [
  { id: '1', name: 'ICICI Amazon Pay', number: '****1234' },
  { id: '2', name: 'HDFC Regalia', number: '****5678' }
];

const mockGoals = [
  { id: '1', name: 'Emergency Fund', type: 'Savings' },
  { id: '2', name: 'Car Insurance Renewal', type: 'Recurring' }
];

export function SmartEntityLinking({ category, tag, onLinkChange, linkedEntities }: EntityLinkingProps) {
  const [suggestions, setSuggestions] = useState<Array<{ type: string; entities: any[]; icon: any; label: string }>>([]);

  useEffect(() => {
    const newSuggestions = [];

    // Vehicle-related categories
    if (['Fuel', 'Maintenance', 'Servicing', 'RTO', 'Vehicle Insurance'].includes(category) || 
        tag.toLowerCase().includes('vehicle') || tag.toLowerCase().includes('car') || tag.toLowerCase().includes('bike')) {
      newSuggestions.push({
        type: 'vehicle',
        entities: mockVehicles,
        icon: Car,
        label: 'Link to Vehicle'
      });
    }

    // Insurance-related
    if (category === 'Insurance' || tag.toLowerCase().includes('insurance')) {
      newSuggestions.push({
        type: 'insurance',
        entities: mockInsurance,
        icon: Shield,
        label: 'Link to Insurance Policy'
      });
    }

    // Property-related
    if (['Water Tax', 'Property Tax', 'Repairs', 'Rent', 'Maintenance'].includes(category) ||
        tag.toLowerCase().includes('property') || tag.toLowerCase().includes('rent')) {
      newSuggestions.push({
        type: 'property',
        entities: mockProperties,
        icon: Home,
        label: 'Link to Property'
      });
    }

    // Credit Card related
    if (['Annual Fee', 'Joining Fee', 'Cashback', 'Rewards'].includes(category) ||
        tag.toLowerCase().includes('card') || tag.toLowerCase().includes('credit')) {
      newSuggestions.push({
        type: 'creditCard',
        entities: mockCreditCards,
        icon: CreditCard,
        label: 'Link to Credit Card'
      });
    }

    // Recurring/Goal related
    if (category === 'Recurring' || tag.toLowerCase().includes('recurring') || tag.toLowerCase().includes('goal')) {
      newSuggestions.push({
        type: 'goal',
        entities: mockGoals,
        icon: Target,
        label: 'Link to Goal'
      });
    }

    setSuggestions(newSuggestions);
  }, [category, tag]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <div key={suggestion.type} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <suggestion.icon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {suggestion.label}
            </span>
          </div>
          <select
            value={linkedEntities[suggestion.type] || ''}
            onChange={(e) => onLinkChange(suggestion.type, e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-blue-300 bg-background text-foreground text-sm"
          >
            <option value="">Select {suggestion.label.toLowerCase()} (optional)</option>
            {suggestion.entities.map(entity => (
              <option key={entity.id} value={entity.id}>
                {entity.name} {entity.number ? `(${entity.number})` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
