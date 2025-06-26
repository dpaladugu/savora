
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Shadcn Select

interface ColumnMapping {
  [key: string]: string;
}

interface CSVColumnMappingProps {
  csvType: 'axio' | 'kuvera' | 'credit-card';
  headers: string[];
  columnMapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onConfirm: () => void;
}

const requiredFields = {
  axio: ['date', 'amount', 'category', 'description'],
  kuvera: ['date', 'name', 'amount', 'units'],
  'credit-card': ['date', 'description', 'amount', 'type']
};

export function CSVColumnMapping({ 
  csvType, 
  headers, 
  columnMapping, 
  onMappingChange, 
  onConfirm 
}: CSVColumnMappingProps) {
  const handleFieldChange = (field: string, value: string) => {
    onMappingChange({ ...columnMapping, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-orange-500">
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">Column Mapping Required</span>
      </div>
      <p className="text-xs text-muted-foreground">
        We couldn't automatically detect the columns. Please map them manually:
      </p>
      
      {requiredFields[csvType].map(field => (
        <div key={field} className="space-y-1">
          <label className="text-sm font-medium text-foreground capitalize">
            {field.replace('_', ' ')}
          </label>
          <select
            value={columnMapping[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">Select column...</option>
            {headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>
      ))}

      <Button onClick={onConfirm} className="w-full">
        Process with Manual Mapping
      </Button>
    </div>
  );
}
