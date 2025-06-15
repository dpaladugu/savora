
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVParser } from "@/services/csv-parser";
import { CSVFileUpload } from "./csv-file-upload";
import { CSVColumnMapping } from "./csv-column-mapping";
import { CSVDataPreview } from "./csv-data-preview";
import { CSVHelpText } from "./csv-help-text";

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
  const [headers, setHeaders] = useState<string[]>([]);
  const { toast } = useToast();

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

  const handleFileUpload = async (selectedFile: File) => {
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
        const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setHeaders(csvHeaders);
        
        // Initialize mapping with best guesses
        const initialMapping: ColumnMapping = {};
        csvHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('date')) initialMapping['date'] = header;
          if (lowerHeader.includes('amount') || lowerHeader.includes('value')) initialMapping['amount'] = header;
          if (lowerHeader.includes('description') || lowerHeader.includes('desc')) initialMapping['description'] = header;
          if (lowerHeader.includes('category')) initialMapping['category'] = header;
          if (lowerHeader.includes('fund') || lowerHeader.includes('name')) initialMapping['name'] = header;
          if (lowerHeader.includes('units')) initialMapping['units'] = header;
          if (lowerHeader.includes('type')) initialMapping['type'] = header;
        });
        setColumnMapping(initialMapping);
      } else {
        setPreviewData(parsedData.slice(0, 5));
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

  const handleManualParsing = async () => {
    if (!file || !csvType) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1);
    
    const parsedData: any[] = [];
    
    for (const line of dataLines) {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      const record: any = {};
      
      Object.entries(columnMapping).forEach(([field, headerName]) => {
        const headerIndex = headers.indexOf(headerName);
        if (headerIndex !== -1 && columns[headerIndex]) {
          if (field === 'amount' || field === 'units') {
            record[field] = parseFloat(columns[headerIndex].replace(/[^\d.-]/g, '')) || 0;
          } else {
            record[field] = columns[headerIndex];
          }
        }
      });

      if (record.date && record.amount) {
        parsedData.push(record);
      }
    }

    setPreviewData(parsedData.slice(0, 5));
    setShowMapping(false);
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
    setHeaders([]);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Enhanced CSV Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CSVFileUpload onFileSelect={handleFileUpload} processing={processing} />

        {showMapping && csvType && (
          <CSVColumnMapping
            csvType={csvType}
            headers={headers}
            columnMapping={columnMapping}
            onMappingChange={setColumnMapping}
            onConfirm={handleManualParsing}
          />
        )}

        {previewData.length > 0 && (
          <CSVDataPreview
            previewData={previewData}
            csvType={csvType || ''}
            onConfirmImport={handleConfirmImport}
            onCancel={resetForm}
          />
        )}

        <CSVHelpText />
      </CardContent>
    </Card>
  );
}
