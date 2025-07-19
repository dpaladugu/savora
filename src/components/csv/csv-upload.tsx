
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import { db } from '@/db';
import { format, parse, isValid as isValidDate, parseISO } from 'date-fns';

interface DexieExpenseRecordToSave {
  id: string;
  user_id?: string;
  date: string;
  amount: number;
  description: string;
  category: string; // Make required to match Expense type
  payment_method?: string;
  tags_flat?: string;
  source?: string;
  merchant?: string;
  account?: string;
}

interface CSVUploadProps {
  onDataParsed?: (data: DexieExpenseRecordToSave[]) => void;
  onImportComplete?: (count: number) => void;
}

export function CSVUpload({ onDataParsed, onImportComplete }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rowCount?: number;
    dataErrors?: { rowIndex: number, message: string }[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const requiredHeaders = ['date', 'amount', 'description'];
  const optionalHeaders = ['category', 'source', 'payment_mode', 'tags', 'merchant', 'account'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        setValidationResult(null);
        validateCSVHeaders(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        setFile(null);
        setValidationResult(null);
      }
    }
  };

  const validateCSVHeaders = (csvFile: File) => {
    setIsProcessing(true);
    Papa.parse(csvFile, {
      preview: 1,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const validationErrors: string[] = [];
        if (!results.data || results.data.length === 0) {
          validationErrors.push('CSV file is empty or header row could not be read.');
        } else {
          const headers = (results.data[0] as string[]).map(h => String(h).toLowerCase().trim().replace(/"/g, ''));

          for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
              validationErrors.push(`Missing required header: ${required}`);
            }
          }
        }

        const isValid = validationErrors.length === 0;
        setValidationResult({
          isValid,
          errors: validationErrors,
        });

        if (isValid) {
          toast({
            title: "CSV Headers Validated",
            description: "Headers look good. Ready to process file content.",
          });
        } else {
            toast({
            title: "CSV Header Validation Failed",
            description: validationErrors.join('; '),
            variant: "destructive",
          });
        }
        setIsProcessing(false);
      },
      error: (error) => {
        console.error("Error validating CSV headers:", error);
        setValidationResult({ isValid: false, errors: ['Failed to read or parse CSV for header validation.'] });
        toast({ title: "Error", description: "Could not validate CSV headers.", variant: "destructive" });
        setIsProcessing(false);
      }
    });
  };

  const parseDate = (dateString: string): string | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    const trimmedDate = dateString.trim();
    const formatsToTry = [
      'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MM-dd-yyyy', 'dd-MM-yyyy',
      'yyyy/MM/dd', 'M/d/yy', 'MM/dd/yy', 'dd.MM.yyyy', 'yyyy.MM.dd'
    ];
    for (const fmt of formatsToTry) {
      try {
        const parsedDate = parse(trimmedDate, fmt, new Date());
        if (isValidDate(parsedDate)) {
          return format(parsedDate, 'yyyy-MM-dd');
        }
      } catch (e) { /* ignore parse error and try next format */ }
    }
    try {
        const parsedISO = parseISO(trimmedDate);
        if(isValidDate(parsedISO)) return format(parsedISO, 'yyyy-MM-dd');
    } catch(e) { /* ignore */ }

    return null;
  };

  const handleUploadAndProcess = () => {
    if (!file || !validationResult?.isValid) {
      toast({ title: "Cannot Process", description: "Please select a valid CSV file first." });
      return;
    }
    
    setIsProcessing(true);
    setValidationResult(prev => prev ? {...prev, dataErrors: []} : null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: header => header.toLowerCase().trim().replace(/"/g, ''),
      complete: async (results) => {
        const dataToSave: DexieExpenseRecordToSave[] = [];
        const currentDataErrors: { rowIndex: number, message: string }[] = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;

          if (!row.date || !row.amount || !row.description) {
            currentDataErrors.push({ rowIndex: i + 1, message: "Missing required data (date, amount, or description)." });
            continue;
          }

          const parsedDate = parseDate(String(row.date));
          if (!parsedDate) {
            currentDataErrors.push({ rowIndex: i + 1, message: `Invalid date format: ${row.date}` });
            continue;
          }

          const amountStr = String(row.amount).replace(/[^0-9.-]+/g,"");
          const amountNum = parseFloat(amountStr);
          if (isNaN(amountNum)) {
            currentDataErrors.push({ rowIndex: i + 1, message: `Invalid amount: ${row.amount}` });
            continue;
          }

          const tagsArray = row.tags ? String(row.tags).split(',').map(t => t.trim()).filter(Boolean) : [];

          const expenseRecord: DexieExpenseRecordToSave = {
            id: self.crypto.randomUUID(),
            date: parsedDate,
            amount: amountNum,
            description: String(row.description || '').trim(),
            category: String(row.category || 'Uncategorized').trim(), // Required field
            payment_method: String(row.payment_mode || row.payment_method || '').trim(),
            tags_flat: tagsArray.join(','),
            source: String(row.source || 'CSV Import').trim(),
            merchant: String(row.merchant || '').trim(),
            account: String(row.account || '').trim(),
          };
          dataToSave.push(expenseRecord);
        }

        if (currentDataErrors.length > 0) {
            setValidationResult(prev => ({
                ...(prev ?? { isValid: false, errors: [], rowCount: 0 }),
                isValid: dataToSave.length > 0,
                dataErrors: currentDataErrors,
                rowCount: dataToSave.length
            }));
        }

        if (dataToSave.length > 0) {
          try {
            // Cast to compatible type for bulkAdd - the interface ensures required fields are present
            await db.expenses.bulkAdd(dataToSave as any);
            toast({
              title: "Import Successful",
              description: `${dataToSave.length} expenses imported. ${currentDataErrors.length > 0 ? `${currentDataErrors.length} rows had errors and were skipped.` : ''}`,
            });
            if (onDataParsed) onDataParsed(dataToSave);
            if (onImportComplete) onImportComplete(dataToSave.length);

            setFile(null);
            if(currentDataErrors.length === 0) setValidationResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

          } catch (error) {
            console.error("Error saving expenses to Dexie:", error);
            toast({ title: "Database Error", description: "Could not save expenses to local DB.", variant: "destructive" });
            setValidationResult(prev => ({
                ...(prev ?? { isValid: false, errors: [], rowCount: 0 }),
                errors: [...(prev?.errors ?? []), "Database error during bulk add."],
            }));
          }
        } else if (currentDataErrors.length === 0) {
            toast({ title: "No Data Imported", description: "The CSV file was processed, but no valid expense data was found to import."});
        }

        setIsProcessing(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast({ title: "CSV Parsing Error", description: error.message, variant: "destructive" });
        setValidationResult(prev => ({
            ...(prev ?? { isValid: false, errors: [], rowCount: 0 }),
            errors: [...(prev?.errors ?? []), `CSV Parsing Error: ${error.message}`],
        }));
        setIsProcessing(false);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select CSV File
            </label>
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to select CSV file or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports Axis Bank, Credit Card, and Wallet formats
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {file && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {validationResult && (
            <div className={`rounded-lg p-3 ${
              validationResult.isValid 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">Valid CSV</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Validation Errors</span>
                  </>
                )}
              </div>
              
              {validationResult.isValid ? (
                <p className="text-sm text-success">
                  Ready to import {validationResult.rowCount} rows
                </p>
              ) : (
                <ul className="text-sm text-destructive space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Required headers:</strong> {requiredHeaders.join(', ')}</p>
            <p><strong>Optional headers:</strong> {optionalHeaders.join(', ')}</p>
          </div>

          <Button
            onClick={handleUploadAndProcess}
            disabled={!validationResult?.isValid || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Validating...' : 'Import CSV'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
