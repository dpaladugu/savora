
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVParser } from "@/services/csv-parser";

interface ColumnMapping {
  [key: string]: string;
}

interface EnhancedCSVProcessorProps {
  onDataProcessed: (data: any[], type: string) => void;
}

export function EnhancedCSVProcessor({ onDataProcessed }: EnhancedCSVProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [csvType, setCsvType] = useState<'axio' | 'kuvera' | 'credit-card' | null>(null);
  const { toast } = useToast();

  const requiredFields = {
    axio: ['date', 'amount', 'category', 'description'],
    kuvera: ['date', 'fund_name', 'amount', 'units'],
    'credit-card': ['date', 'description', 'amount', 'type']
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setProcessing(true);

    try {
      const text = await selectedFile.text();
      const detectedType = detectCSVType(text);
      setCsvType(detectedType);

      let parsedData: any[] = [];
      
      if (detectedType === 'axio') {
        parsedData = CSVParser.parseAxioExpenses(text);
      } else if (detectedType === 'kuvera') {
        parsedData = CSVParser.parseKuveraInvestments(text);
      } else if (detectedType === 'credit-card') {
        parsedData = CSVParser.parseCreditCardStatement(text);
      }

      if (parsedData.length === 0) {
        setShowMapping(true);
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Initialize mapping with best guesses
        const initialMapping: ColumnMapping = {};
        headers.forEach(header => {
          if (header.includes('date')) initialMapping['date'] = header;
          if (header.includes('amount') || header.includes('value')) initialMapping['amount'] = header;
          if (header.includes('description') || header.includes('desc')) initialMapping['description'] = header;
          if (header.includes('category')) initialMapping['category'] = header;
        });
        setColumnMapping(initialMapping);
      } else {
        setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows for preview
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const detectCSVType = (csvText: string): 'axio' | 'kuvera' | 'credit-card' | null => {
    const lowerText = csvText.toLowerCase();
    
    if (lowerText.includes('payment mode') || lowerText.includes('axio')) {
      return 'axio';
    }
    if (lowerText.includes('fund house') || lowerText.includes('kuvera') || lowerText.includes('folio')) {
      return 'kuvera';
    }
    if (lowerText.includes('credit') || lowerText.includes('debit') || lowerText.includes('merchant')) {
      return 'credit-card';
    }
    
    return null;
  };

  const handleConfirmImport = () => {
    if (previewData.length > 0 && csvType) {
      onDataProcessed(previewData, csvType);
      resetForm();
      toast({
        title: "Success",
        description: `Imported ${previewData.length} records successfully!`,
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setShowMapping(false);
    setColumnMapping({});
    setCsvType(null);
  };

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Enhanced CSV Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Select CSV File
          </label>
          <div
            className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to select CSV file or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports Axio, Kuvera, and Credit Card formats
            </p>
          </div>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Processing Indicator */}
        {processing && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Processing CSV...</p>
          </div>
        )}

        {/* Column Mapping Interface */}
        {showMapping && csvType && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-warning">
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
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Select column...</option>
                  {/* This would be populated with actual CSV headers */}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Preview Data */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Preview Data ({csvType})</span>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmImport} className="flex-1">
                Import {previewData.length} Records
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Supported formats:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Axio/Walnut expense exports</li>
            <li>• Kuvera mutual fund statements</li>
            <li>• Credit card transaction statements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
