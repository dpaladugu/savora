
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, DollarSign, Search, Filter, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface Income {
  id: string;
  amount: number;
  source: string;
  category: 'salary' | 'rental' | 'side-business' | 'investment' | 'other';
  date: string;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  note?: string;
}

const mockIncomes: Income[] = [
  {
    id: '1',
    amount: 85000,
    source: 'Software Engineer Salary',
    category: 'salary',
    date: '2024-01-01',
    frequency: 'monthly'
  },
  {
    id: '2',
    amount: 15000,
    source: 'Apartment Rent',
    category: 'rental',
    date: '2024-01-05',
    frequency: 'monthly'
  }
];

export function IncomeTracker() {
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddIncome = (newIncome: Omit<Income, 'id'>) => {
    const income: Income = {
      ...newIncome,
      id: Date.now().toString()
    };
    
    setIncomes([income, ...incomes]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save income to Firestore:', income);
    
    toast({
      title: "Income added successfully",
      description: `₹${newIncome.amount.toLocaleString()} from ${newIncome.source}`,
    });
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes(incomes.filter(inc => inc.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete income from Firestore:', id);
    toast({
      title: "Income deleted",
    });
  };

  const filteredIncomes = incomes.filter(income =>
    income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMonthlyIncome = incomes
    .filter(inc => inc.frequency === 'monthly')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'salary': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'rental': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'side-business': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'investment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category] || colors['other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Income</h2>
          <p className="text-muted-foreground">Track your income sources</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="metric-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-green text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-lg font-bold text-foreground">₹{totalMonthlyIncome.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Income Form */}
      {showAddForm && (
        <AddIncomeForm 
          onSubmit={handleAddIncome}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search income sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Income List */}
      <div className="space-y-3">
        {filteredIncomes.map((income, index) => (
          <motion.div
            key={income.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground text-lg">
                        ₹{income.amount.toLocaleString()}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(income.category)}`}>
                        {income.category}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {income.frequency}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{income.source}</p>
                      <p className="text-sm text-muted-foreground">
                        Since {new Date(income.date).toLocaleDateString('en-IN')}
                      </p>
                      {income.note && (
                        <p className="text-sm text-muted-foreground">{income.note}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteIncome(income.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AddIncomeForm({ onSubmit, onCancel }: {
  onSubmit: (income: Omit<Income, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    category: 'salary' as Income['category'],
    date: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as Income['frequency'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.source) {
      return;
    }

    onSubmit({
      amount: parseFloat(formData.amount),
      source: formData.source,
      category: formData.category,
      date: formData.date,
      frequency: formData.frequency,
      note: formData.note || undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add New Income</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Amount (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="50000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Source *
                </label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Salary, Freelance"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Income['category'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="salary">Salary</option>
                  <option value="rental">Rental</option>
                  <option value="side-business">Side Business</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Income['frequency'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Note (Optional)
              </label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Income
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
