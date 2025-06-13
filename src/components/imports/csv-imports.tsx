
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CreditCard, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CSVImports() {
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  const importTypes = [
    {
      id: 'axio-expenses',
      title: 'Axio (Walnut) Expenses',
      description: 'Import expense transactions from Axio/Walnut CSV',
      icon: FileText,
      color: 'bg-gradient-blue',
      fields: ['Date', 'Amount', 'Category', 'Payment Method', 'Tags'],
      sampleFormat: 'Date, Amount, Category, Payment Method, Description, Tags'
    },
    {
      id: 'kuvera-mf',
      title: 'Kuvera Mutual Funds',
      description: 'Import mutual fund investments from Kuvera',
      icon: TrendingUp,
      color: 'bg-gradient-green',
      fields: ['Fund House', 'Scheme', 'Folio', 'Units', 'NAV', 'Date'],
      sampleFormat: 'Date, Fund House, Scheme Name, Folio Number, Units, NAV, Amount'
    },
    {
      id: 'nps-statement',
      title: 'NPS Statement',
      description: 'Import NPS Tier 1 & Tier 2 contributions',
      icon: Shield,
      color: 'bg-gradient-purple',
      fields: ['Tier', 'Contribution', 'Employer Share', 'Interest', 'Date'],
      sampleFormat: 'Date, Tier, Contribution, Employer Share, Interest, Balance'
    },
    {
      id: 'credit-cards',
      title: 'Credit Cards List',
      description: 'Import credit card details and limits',
      icon: CreditCard,
      color: 'bg-gradient-orange',
      fields: ['Bank', 'Card Name', 'Last 4 Digits', 'Credit Limit', 'Due Date'],
      sampleFormat: 'Bank, Card Name, Last 4 Digits, Credit Limit, Annual Fee, Due Date'
    }
  ];

  const handleFileUpload = async (importType: string, file: File) => {
    setUploading(importType);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `${file.name} uploaded successfully!`,
      });
      
      console.log(`Processing ${importType} file:`, file.name);
      // TODO: Implement actual CSV parsing and Firebase storage
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
      });
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
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          CSV Imports
        </h1>
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
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{importType.title}</h3>
                  <p className="text-sm text-muted-foreground font-normal">{importType.description}</p>
                </div>
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
            <li>• Files will be processed and stored securely in Firebase</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
