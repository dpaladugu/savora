
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CSVDataPreviewProps {
  previewData: any[];
  csvType: string;
  onConfirmImport: () => void;
  onCancel: () => void;
}

export function CSVDataPreview({ 
  previewData, 
  csvType, 
  onConfirmImport, 
  onCancel 
}: CSVDataPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Preview Data ({csvType})</span>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
        <pre className="text-xs text-foreground whitespace-pre-wrap">
          {JSON.stringify(previewData, null, 2)}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button onClick={onConfirmImport} className="flex-1">
          Import {previewData.length} Records
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
