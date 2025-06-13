import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Search, Filter, Receipt, Upload, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseList } from "./expense-list";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  tag: string;
  paymentMode: 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet';
  note?: string;
  linkedGoal?: string;
  merchant?: string;
  receiptUploaded?: boolean;
  sourcePlatform?: string;
  recurring?: boolean;
  recurringFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  linkedVehicle?: string;
  lineItems?: Array<{ id: string; title: string; amount: number; }>;
  autoTagged?: boolean;
  linkedAccount?: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 450,
    date: '2024-01-15',
    category: 'Food',
    tag: 'Zomato',
    paymentMode: 'UPI',
    note: 'Lunch order',
    merchant: 'Zomato',
    sourcePlatform: 'Zomato App'
  },
  {
    id: '2',
    amount: 2500,
    date: '2024-01-14',
    category: 'Bills',
    tag: 'Electricity',
    paymentMode: 'Net Banking',
    note: 'Monthly electricity bill',
    recurring: true,
    recurringFrequency: 'Monthly'
  },
  {
    id: '3',
    amount: 1200,
    date: '2024-01-13',
    category: 'Fuel',
    tag: 'Shell Petrol Pump',
    paymentMode: 'Credit Card',
    note: 'Full tank',
    linkedGoal: 'Vehicle Maintenance',
    linkedVehicle: '1',
    autoTagged: true
  }
];

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");
  const [recurringDetections, setRecurringDetections] = useState<string[]>(['2']); // Mock recurring detection
  const { toast } = useToast();

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    // Auto-tagging logic (stub)
    let autoTagged = false;
    const autoTagRules: Record<string, string> = {
      'shell': 'Fuel',
      'tanishq': 'Jewelry',
      'zomato': 'Food',
      'swiggy': 'Food',
      'uber': 'Travel'
    };

    const tagLower = newExpense.tag.toLowerCase();
    for (const [pattern, category] of Object.entries(autoTagRules)) {
      if (tagLower.includes(pattern)) {
        autoTagged = true;
        break;
      }
    }

    // Check for recurring pattern (stub)
    const similarExpenses = expenses.filter(exp => 
      exp.tag.toLowerCase() === newExpense.tag.toLowerCase() &&
      Math.abs(exp.amount - newExpense.amount) < 100
    );

    const expense: Expense = {
      ...newExpense,
      id: Date.now().toString(),
      autoTagged,
      linkedAccount: getLinkedAccount(newExpense.paymentMode) // Stub account linking
    };
    
    setExpenses([expense, ...expenses]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save expense to Firestore:', expense);
    
    // Show auto-tag notification
    if (autoTagged) {
      toast({
        title: "Auto-tagged expense",
        description: `Tagged as ${newExpense.category} based on merchant pattern`,
      });
    }

    // Suggest recurring goal creation
    if (similarExpenses.length >= 2) {
      toast({
        title: "Recurring pattern detected",
        description: "Consider creating a recurring goal for this expense",
        action: {
          altText: "Create Goal",
          onClick: () => console.log('TODO: Create recurring goal')
        }
      });
    }
    
    toast({
      title: "Expense added successfully",
      description: `₹${newExpense.amount} added to ${newExpense.category}`,
    });
  };

  const getLinkedAccount = (paymentMode: string): string => {
    // Stub account linking
    const accountMapping: Record<string, string> = {
      'Credit Card': 'ICICI Credit Card',
      'Debit Card': 'ICICI Savings',
      'UPI': 'PhonePe',
      'Net Banking': 'ICICI Savings',
      'Wallet': 'Paytm Wallet',
      'Cash': 'Cash in Hand'
    };
    return accountMapping[paymentMode] || 'Unknown Account';
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete expense from Firestore:', id);
    toast({
      title: "Expense deleted",
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.merchant?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    const matchesPaymentMode = !selectedPaymentMode || expense.paymentMode === selectedPaymentMode;
    
    return matchesSearch && matchesCategory && matchesPaymentMode;
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const recurringExpenses = expenses.filter(exp => exp.recurring);
  const linkedExpenses = expenses.filter(exp => exp.linkedGoal);

  const categories = [...new Set(expenses.map(exp => exp.category))];
  const paymentModes = [...new Set(expenses.map(exp => exp.paymentMode))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
          <p className="text-muted-foreground">Track your spending</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCSVImport(true)}
            className="hidden md:flex"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-blue hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Smart Notifications */}
      {recurringDetections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">
                    Recurring Expenses Detected
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    We found {recurringDetections.length} expense(s) that might benefit from recurring goal setup
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-orange-300">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-lg font-bold text-foreground">₹{thisMonthExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-purple text-white">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Linked to Goals</p>
                <p className="text-lg font-bold text-foreground">{linkedExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-orange text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recurring</p>
                <p className="text-lg font-bold text-foreground">{recurringExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Import Modal */}
      {showCSVImport && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="metric-card border-border/50">
            <CardHeader>
              <CardTitle>Import Expenses from CSV</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Upload CSV File</h3>
                <p className="text-muted-foreground mb-4">
                  CSV upload coming soon – will support duplicate handling, auto-tagging, and account linking.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Automatic duplicate detection</p>
                  <p>• Smart merchant tagging</p>
                  <p>• Account balance updates</p>
                  <p>• Vehicle expense linking</p>
                </div>
                <Button className="bg-gradient-blue hover:opacity-90 mt-4" disabled>
                  Choose File (Coming Soon)
                </Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCSVImport(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Expense Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AddExpenseForm 
            onSubmit={handleAddExpense}
            onCancel={() => setShowAddForm(false)}
          />
        </motion.div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        
        <select
          value={selectedPaymentMode}
          onChange={(e) => setSelectedPaymentMode(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
        >
          <option value="">All Payment Modes</option>
          {paymentModes.map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
        
        <Button variant="outline">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Expense List */}
      <ExpenseList 
        expenses={filteredExpenses}
        onDelete={handleDeleteExpense}
      />

      {/* Empty State */}
      {expenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Expenses Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your expenses</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Expense
          </Button>
        </motion.div>
      )}
    </div>
  );
}
