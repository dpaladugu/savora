
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  validRowCount: number;
}

interface CSVValidatorProps {
  data: any[];
  templateType: string;
  columnMapping: Record<string, string>;
}

export function EnhancedCSVImportValidator({ data, templateType, columnMapping }: CSVValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateData = (): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validRowCount = 0;

    if (!data || data.length === 0) {
      errors.push("No data found in CSV file");
      return { isValid: false, errors, warnings, rowCount: 0, validRowCount: 0 };
    }

    data.forEach((row, index) => {
      const rowNumber = index + 1;
      let isRowValid = true;

      // Template-specific validations
      switch (templateType) {
        case 'axio':
          if (!row[columnMapping['Date']]) {
            errors.push(`Row ${rowNumber}: Date is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Amount']] || isNaN(parseFloat(row[columnMapping['Amount']]))) {
            errors.push(`Row ${rowNumber}: Valid amount is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Category']]) {
            warnings.push(`Row ${rowNumber}: Category is missing`);
          }
          break;

        case 'kuvera':
          if (!row[columnMapping['Fund Name']]) {
            errors.push(`Row ${rowNumber}: Fund name is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Amount']] || isNaN(parseFloat(row[columnMapping['Amount']]))) {
            errors.push(`Row ${rowNumber}: Valid amount is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Date']]) {
            errors.push(`Row ${rowNumber}: Date is required`);
            isRowValid = false;
          }
          break;

        case 'nps':
          if (!row[columnMapping['PRAN']]) {
            errors.push(`Row ${rowNumber}: PRAN is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Amount']] || isNaN(parseFloat(row[columnMapping['Amount']]))) {
            errors.push(`Row ${rowNumber}: Valid amount is required`);
            isRowValid = false;
          }
          break;

        case 'cards':
          if (!row[columnMapping['Bank']]) {
            errors.push(`Row ${rowNumber}: Bank name is required`);
            isRowValid = false;
          }
          if (!row[columnMapping['Card Name']]) {
            errors.push(`Row ${rowNumber}: Card name is required`);
            isRowValid = false;
          }
          break;
      }

      if (isRowValid) {
        validRowCount++;
      }
    });

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
      rowCount: data.length,
      validRowCount
    };

    setValidationResult(result);
    return result;
  };

  const result = validationResult || validateData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Validation Results</h4>
        <Badge variant={result.isValid ? "default" : "destructive"}>
          {result.validRowCount}/{result.rowCount} valid rows
        </Badge>
      </div>

      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Errors found:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.errors.slice(0, 5).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {result.errors.length > 5 && (
                <li>... and {result.errors.length - 5} more errors</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Warnings:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.warnings.slice(0, 3).map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
              {result.warnings.length > 3 && (
                <li>... and {result.warnings.length - 3} more warnings</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result.isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All data looks good! Ready to import {result.validRowCount} records.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
