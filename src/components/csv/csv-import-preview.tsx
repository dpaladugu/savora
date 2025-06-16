
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { EnhancedCSVImportValidator } from "./enhanced-csv-import-validator";
import { SmartCSVTransformer } from "@/services/smart-csv-transformer";

interface CSVImportPreviewProps {
  onImport: (data: any[]) => void;
  onCancel: () => void;
}

const templateTypes = [
  {
    id: 'axio',
    name: 'Axio Bank Statement',
    columns: ['Date', 'Amount', 'Mode', 'Notes', 'Category', 'Tag'],
    sample: 'date,amount,mode,notes,category,tag\n2024-01-15,450,UPI,Lunch order,Food,Zomato',
    dataType: 'expense'
  },
  {
    id: 'kuvera',
    name: 'Kuvera Portfolio',
    columns: ['Fund Name', 'Date', 'Units', 'NAV', 'Amount'],
    sample: 'fund_name,date,units,nav,amount\nAxis Bluechip Fund,2024-01-15,10.5,45.67,479.54',
    dataType: 'investment'
  },
  {
    id: 'nps',
    name: 'NPS Statement',
    columns: ['Scheme', 'PRAN', 'NAV', 'Transaction Date', 'Amount'],
    sample: 'scheme,pran,nav,transaction_date,amount\nTier 1,123456789012,25.45,2024-01-15,5000',
    dataType: 'investment'
  },
  {
    id: 'cards',
    name: 'Credit Cards',
    columns: ['Bank', 'Card Name', 'Last Digits', 'Credit Limit', 'Payment Mode', 'Fee Waiver'],
    sample: 'bank,card_name,last_digits,credit_limit,payment_mode,fee_waiver\nICICI,Amazon Pay,1234,150000,Auto Debit,Yes',
    dataType: 'other'
  }
];

export function CSVImportPreview({ onImport, onCancel }: CSVImportPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(templateTypes[0]);
  const [csvData, setCsvData] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const downloadTemplate = (template: typeof templateTypes[0]) => {
    const blob = new Blob([template.sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return rows;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      
      try {
        const rows = parseCSV(text);
        setParsedData(rows);
        
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          
          // Auto-map columns based on selected template
          const mapping: Record<string, string> = {};
          selectedTemplate.columns.forEach(templateCol => {
            const matchingHeader = headers.find(header => {
              const headerLower = header.toLowerCase();
              const templateLower = templateCol.toLowerCase();
              return headerLower.includes(templateLower) || templateLower.includes(headerLower);
            });
            if (matchingHeader) {
              mapping[templateCol] = matchingHeader;
            }
          });
          
          setColumnMapping(mapping);
          setShowPreview(true);
          setIsValidated(false);
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      let transformedData: any[] = [];
      
      if (selectedTemplate.dataType === 'expense') {
        transformedData = SmartCSVTransformer.transformExpenseData(parsedData, columnMapping);
      } else if (selectedTemplate.dataType === 'investment') {
        transformedData = SmartCSVTransformer.transformInvestmentData(parsedData, columnMapping);
      } else {
        // For other types, use basic transformation
        transformedData = parsedData.map(row => {
          const transformed: Record<string, any> = {};
          Object.entries(columnMapping).forEach(([templateCol, csvCol]) => {
            if (csvCol && row[csvCol] !== undefined) {
              transformed[templateCol.toLowerCase().replace(' ', '_')] = row[csvCol];
            }
          });
          return transformed;
        });
      }

      onImport(transformedData);
    } catch (error) {
      console.error('Error transforming data:', error);
    }
  };

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Select Data Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templateTypes.map(template => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {template.columns.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Download */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => downloadTemplate(selectedTemplate)}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {selectedTemplate.name} Template
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Upload CSV File
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-sm text-foreground hover:text-primary"
            >
              Click to upload CSV file
            </label>
          </div>
        </div>

        {/* Column Mapping */}
        {showPreview && (
          <>
            <div>
              <h4 className="font-medium text-foreground mb-3">Column Mapping</h4>
              <div className="space-y-3">
                {selectedTemplate.columns.map(templateCol => (
                  <div key={templateCol} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium">{templateCol}:</div>
                    <select
                      value={columnMapping[templateCol] || ''}
                      onChange={(e) => {
                        setColumnMapping({
                          ...columnMapping,
                          [templateCol]: e.target.value
                        });
                        setIsValidated(false);
                      }}
                      className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                    >
                      <option value="">Select column</option>
                      {Object.keys(parsedData[0] || {}).map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {columnMapping[templateCol] && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Validation */}
            {parsedData.length > 0 && Object.keys(columnMapping).some(key => columnMapping[key]) && (
              <EnhancedCSVImportValidator
                data={parsedData}
                templateType={selectedTemplate.id}
                columnMapping={columnMapping}
              />
            )}

            {/* Preview Table */}
            <div>
              <h4 className="font-medium text-foreground mb-3">
                Preview ({parsedData.length} rows)
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {selectedTemplate.columns.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t">
                          {selectedTemplate.columns.map(col => (
                            <td key={col} className="px-3 py-2">
                              {columnMapping[col] ? row[columnMapping[col]] || '-' : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {parsedData.length > 5 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Showing first 5 of {parsedData.length} rows
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {showPreview && (
            <Button onClick={handleImport} className="flex-1">
              Import {parsedData.length} Records
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
