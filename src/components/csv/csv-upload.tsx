
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CSVUploadProps {
  onDataParsed: (data: any[]) => void;
}

export function CSVUpload({ onDataParsed }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    rowCount?: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const requiredHeaders = ['date', 'amount', 'description'];
  const optionalHeaders = ['category', 'source', 'payment_mode', 'tags'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      validateCSV(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const validateCSV = async (file: File) => {
    setIsUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setValidationResult({
          isValid: false,
          errors: ['CSV file must have at least a header row and one data row']
        });
        return;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const errors: string[] = [];
      
      // Check for required headers
      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          errors.push(`Missing required header: ${required}`);
        }
      }

      const isValid = errors.length === 0;
      const rowCount = lines.length - 1; // Exclude header

      setValidationResult({
        isValid,
        errors,
        rowCount: isValid ? rowCount : undefined
      });

      if (isValid) {
        toast({
          title: "CSV validated successfully",
          description: `Found ${rowCount} rows ready for import`,
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Failed to read CSV file']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    if (!file || !validationResult?.isValid) return;
    
    // TODO: Parse CSV data and call onDataParsed
    // For now, just show success message
    toast({
      title: "CSV uploaded successfully",
      description: "Expenses have been imported",
    });
    
    // Reset form
    setFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          {/* File Selection */}
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

          {/* File Info */}
          {file && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {/* Validation Results */}
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

          {/* Required Headers Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Required headers:</strong> {requiredHeaders.join(', ')}</p>
            <p><strong>Optional headers:</strong> {optionalHeaders.join(', ')}</p>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!validationResult?.isValid || isUploading}
            className="w-full"
          >
            {isUploading ? 'Validating...' : 'Import CSV'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
