
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { GlobalHeader } from "@/components/layout/global-header"; // Removed
import { CSVParser, ParsedCreditCard } from "@/services/csv-parser";
import { useAuth } from "@/contexts/auth-context";

export function CreditCardStatements() {
  const [statements, setStatements] = useState<ParsedCreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const text = await file.text();
      const creditCardTransactions = CSVParser.parseCreditCardStatement(text);
      
      if (creditCardTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV');
      }
      
      setStatements(prev => [...prev, ...creditCardTransactions]);
      
      toast({
        title: "Success",
        description: `Imported ${creditCardTransactions.length} credit card transactions!`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  const totalSpent = statements.filter(s => s.type === 'debit').reduce((sum, s) => sum + s.amount, 0);
  const totalCredits = statements.filter(s => s.type === 'credit').reduce((sum, s) => sum + s.amount, 0);

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // These are expected to be handled by the parent router using ModuleHeader.
    <div className="space-y-6">
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {/* Title "Credit Card Statements" would come from ModuleHeader.
                This CardTitle can be more specific or removed if redundant.
                For now, keeping it as a sub-header for the card itself.
            */}
            <span>Statement Details</span>
            <Button onClick={triggerFileInput} disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="metric-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                </div>
                <div className="text-2xl font-bold text-foreground">₹{totalSpent.toLocaleString()}</div>
              </div>
              <div className="metric-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Credits/Refunds</span>
                </div>
                <div className="text-2xl font-bold text-foreground">₹{totalCredits.toLocaleString()}</div>
              </div>
              <div className="metric-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Transactions</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{statements.length}</div>
              </div>
            </div>

            {statements.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Statements Uploaded</h3>
                <p className="text-muted-foreground mb-4">Upload your credit card CSV statements to track expenses</p>
                <Button onClick={triggerFileInput}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Statement
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {statements.map((statement, index) => (
                  <Card key={index} className="metric-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-2 h-2 rounded-full ${statement.type === 'debit' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <h4 className="font-semibold text-foreground">
                              {statement.merchant}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statement.type === 'debit' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {statement.category}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {statement.type === 'debit' ? '-' : '+'}₹{statement.amount.toLocaleString()}
                              </span>
                              <span>•</span>
                              <span>{new Date(statement.date).toLocaleDateString('en-IN')}</span>
                              <span>•</span>
                              <span>{statement.cardLastFour}</span>
                            </div>
                            
                            {statement.description && (
                              <p className="text-sm text-muted-foreground">{statement.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
