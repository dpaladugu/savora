
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CreditCard, TrendingUp, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/layout/global-header";
import { CSVParser } from "@/services/csv-parser";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

export function CSVImports() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({});
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(importType);
    
    try {
      const text = await file.text();
      
      if (importType === 'axio-expenses') {
        const expenses = CSVParser.parseAxioExpenses(text);
        
        if (expenses.length === 0) {
          throw new Error('No valid expenses found in CSV');
        }
        
        const firestoreExpenses = expenses.map(expense => ({
          ...expense,
          userId: user.uid,
          source: 'csv' as const,
          createdAt: new Date().toISOString()
        }));
        
        await FirestoreService.addExpenses(firestoreExpenses);
        
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
            userId: user.uid,
            date: tx.date,
            amount: tx.amount,
            category: tx.category,
            paymentMode: 'Credit Card',
            description: `${tx.merchant} - ${tx.description}`,
            tags: `Credit Card - ${tx.merchant}`,
            account: `Card ending ${tx.cardLastFour}`,
            source: 'csv' as const,
            createdAt: new Date().toISOString()
          }));
        
        if (expenseFormat.length > 0) {
          await FirestoreService.addExpenses(expenseFormat);
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
        
        const firestoreInvestments = investments.map(investment => ({
          ...investment,
          userId: user.uid,
          source: 'csv' as const,
          createdAt: new Date().toISOString()
        }));
        
        await FirestoreService.addInvestments(firestoreInvestments);
        
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="CSV Imports" />
      
      <div className="pt-20 px-4 space-y-6">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg font-medium">
            Import data from various financial platforms
          </p>
        </div>

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

                <Button
                  onClick={() => triggerFileInput(importType.id)}
                  disabled={uploading === importType.id}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === importType.id ? 'Uploading...' : 'Upload CSV'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="metric-card border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Upload Guidelines</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Ensure your CSV files have headers in the first row</li>
              <li>• Remove any summary rows or footers from bank statements</li>
              <li>• Date format should be DD/MM/YYYY or YYYY-MM-DD</li>
              <li>• Amount values should be numeric (without currency symbols)</li>
              <li>• Files are processed and stored securely in Firebase</li>
              <li>• Duplicate transactions are automatically filtered out</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
