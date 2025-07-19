import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CreditCard, TrendingUp, Shield, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CSVParser } from "@/services/csv-parser";
import { ExpenseService } from "@/services/ExpenseService";
import { InvestmentService } from "@/services/InvestmentService";
import { EnhancedCSVProcessor } from "@/components/csv/enhanced-csv-processor";

export function CSVImports() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({});
  const { toast } = useToast();

  const importTypes = [
    {
      id: 'axio-expenses',
      title: 'Axio (Walnut) Expenses',
      description: 'Import expense transactions from Axio/Walnut CSV',
      icon: FileText,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      fields: ['Date', 'Amount', 'Category', 'Payment Method', 'Tags'],
      sampleFormat: 'Date, Amount, Category, Payment Method, Description, Tags'
    },
    {
      id: 'credit-cards',
      title: 'Credit Card Statements',
      description: 'Import credit card transaction statements',
      icon: CreditCard,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      fields: ['Date', 'Description', 'Amount', 'Type'],
      sampleFormat: 'Date, Description, Amount, Transaction Type'
    },
    {
      id: 'kuvera-mf',
      title: 'Kuvera Mutual Funds',
      description: 'Import mutual fund investments from Kuvera',
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      fields: ['Fund House', 'Scheme', 'Folio', 'Units', 'NAV', 'Date'],
      sampleFormat: 'Date, Fund House, Scheme Name, Folio Number, Units, NAV, Amount'
    },
    {
      id: 'nps-statement',
      title: 'NPS Statement',
      description: 'Import NPS Tier 1 & Tier 2 contributions',
      icon: Shield,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      fields: ['Tier', 'Contribution', 'Employer Share', 'Interest', 'Date'],
      sampleFormat: 'Date, Tier, Contribution, Employer Share, Interest, Balance'
    }
  ];

  const handleFileUpload = async (importType: string, file: File) => {
    setUploading(importType);
    
    try {
      const text = await file.text();
      
      if (importType === 'axio-expenses') {
        const expenses = CSVParser.parseAxioExpenses(text);
        
        if (expenses.length === 0) {
          throw new Error('No valid expenses found in CSV. Please check the format or use the enhanced processor.');
        }
        
        const expensesToSave = expenses.map(expense => ({
          ...expense,
          id: self.crypto.randomUUID(), // Services don't auto-gen ID for bulk ops
          source: 'csv',
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await ExpenseService.bulkAddExpenses(expensesToSave as any); // Use bulkAdd
        
        toast({
          title: "Success",
          description: `Imported ${expenses.length} expenses successfully!`,
        });
        
        setUploadStatus(prev => ({ ...prev, [importType]: 'success' }));
        
      } else if (importType === 'credit-cards') {
        const creditCardTransactions = CSVParser.parseCreditCardStatement(text);
        
        if (creditCardTransactions.length === 0) {
          throw new Error('No valid credit card transactions found in CSV');
        }
        
        // Convert credit card transactions to expenses format for now
        const expenseFormat = creditCardTransactions
          .filter(tx => tx.type === 'debit') // Only debits are expenses
          .map(tx => ({
            date: tx.date,
            amount: tx.amount,
            category: tx.category,
            payment_method: 'Credit Card',
            description: `${tx.merchant} - ${tx.description} (Card ...${tx.cardLastFour})`, // Added card info to description
            tags_flat: `credit-card,${tx.merchant}`, // Changed to string
            type: 'expense' as const,
            source: 'csv' as const,
            created_at: new Date().toISOString()
          }));
        
        if (expenseFormat.length > 0) {
          await ExpenseService.bulkAddExpenses(expenseFormat as any);
        }
        
        toast({
          title: "Success",
          description: `Imported ${creditCardTransactions.length} credit card transactions (${expenseFormat.length} expenses)!`,
        });
        
        setUploadStatus(prev => ({ ...prev, [importType]: 'success' }));
        
      } else if (importType === 'kuvera-mf') {
        const investments = CSVParser.parseKuveraInvestments(text);
        
        if (investments.length === 0) {
          throw new Error('No valid investments found in CSV');
        }
        
        const investmentsToSave = investments.map(investment => ({
          ...investment,
          id: self.crypto.randomUUID(),
          purchaseDate: investment.date,
          investment_type: investment.type, // Map field name
          fund_name: investment.name, // Map field name
        }));
        
        await InvestmentService.bulkAddInvestments(investmentsToSave as any);
        
        toast({
          title: "Success",
          description: `Imported ${investments.length} investments successfully!`,
        });
        
        setUploadStatus(prev => ({ ...prev, [importType]: 'success' }));
        
      } else {
        // For other types, just show success for now
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully! (Processing logic coming soon)`,
        });
        
        setUploadStatus(prev => ({ ...prev, [importType]: 'success' }));
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      
      setUploadStatus(prev => ({ ...prev, [importType]: 'error' }));
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (importType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(importType, file);
      }
    };
    input.click();
  };

  const downloadTemplate = (templateType: string) => {
    let csvContent = '';
    
    switch (templateType) {
      case 'axio-expenses':
        csvContent = 'Date,Amount,Category,Payment Method,Description,Tags\n2024-01-15,250,Food,UPI,Lunch at restaurant,dining\n2024-01-16,50,Transport,Card,Metro card recharge,transport';
        break;
      case 'credit-cards':
        csvContent = 'Date,Description,Amount,Type\n2024-01-15,AMAZON PURCHASE,1250,debit\n2024-01-16,PAYMENT RECEIVED,5000,credit';
        break;
      case 'kuvera-mf':
        csvContent = 'Date,Fund House,Scheme Name,Folio Number,Units,NAV,Amount\n2024-01-15,HDFC,HDFC Top 100 Fund,12345678,10.5,650.25,6827.63';
        break;
      default:
        csvContent = 'Please select a valid template type';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to format your data correctly.",
    });
  };

  const handleEnhancedDataProcessed = async (data: any[], type: string) => {
    try {
      if (type === 'axio') {
        const expensesToSave = data.map(expense => ({
          ...expense,
          id: self.crypto.randomUUID(),
          source: 'csv',
        }));
        
        await ExpenseService.bulkAddExpenses(expensesToSave as any);
      } else if (type === 'kuvera') {
        const investmentsToSave = data.map(investment => ({
          ...investment,
          id: self.crypto.randomUUID(),
          purchaseDate: investment.date,
          investment_type: investment.type,
          fund_name: investment.name,
        }));
        
        await InvestmentService.bulkAddInvestments(investmentsToSave as any);
      }
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.length} records via enhanced processor.`,
      });
    } catch (error) {
      console.error('Enhanced import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // These are expected to be handled by the parent router using ModuleHeader.
    <div className="space-y-6">
        <div className="mb-4"> {/* Adjusted margin */}
          {/* This title/description can be part of the page content if ModuleHeader handles the main page title */}
          <h2 className="text-xl font-semibold text-foreground">Import Options</h2>
          <p className="text-sm text-muted-foreground">
            Import data from various financial platforms
          </p>
        </div>

        {/* Enhanced CSV Processor */}
        <EnhancedCSVProcessor onDataProcessed={handleEnhancedDataProcessed} />

        {/* Quick Import Options */}
        <div className="grid gap-4">
          {importTypes.map((importType) => (
            <Card key={importType.id} className="metric-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${importType.color} text-white`}>
                    <importType.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{importType.title}</h3>
                    <p className="text-sm text-muted-foreground font-normal">{importType.description}</p>
                  </div>
                  {uploadStatus[importType.id] === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {uploadStatus[importType.id] === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Expected Fields:</h4>
                  <div className="flex flex-wrap gap-2">
                    {importType.fields.map((field) => (
                      <span key={field} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Sample Format:</h4>
                  <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {importType.sampleFormat}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => triggerFileInput(importType.id)}
                    disabled={uploading === importType.id}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading === importType.id ? 'Uploading...' : 'Quick Upload'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplate(importType.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="metric-card border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Import Guidelines</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use Enhanced Processor for complex files with headers/footers</li>
              <li>• Quick Upload works for standard format files</li>
              <li>• Date format should be DD/MM/YYYY or YYYY-MM-DD</li>
              <li>• Amount values should be numeric (commas are automatically handled)</li>
              <li>• Files are processed and stored securely in Firebase</li>
              <li>• Duplicate transactions are automatically filtered out</li>
              <li>• Download templates if you need to format your data</li>
            </ul>
          </CardContent>
        </Card>
      {/* Removed extra closing </div> tag that was here */}
    </div>
  );
}
