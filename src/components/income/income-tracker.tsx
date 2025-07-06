
import { motion } from "framer-motion";
import { useState, useEffect } from "react"; // Added useEffect
import { Plus, DollarSign, Search, Filter, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context"; // Added
import { SupabaseDataService } from "@/services/supabase-data-service"; // Added
import { db } from "@/db"; // Added Dexie db instance
import type { Income } from "@/types/entities"; // Import from central types file

// mockIncomes will be removed / is already effectively removed by useState([])
// const mockIncomes: Income[] = [ ... ];

export function IncomeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]); // Uses imported Income type
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null); // State for income being edited
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    const loadIncomes = async () => {
      if (!user) {
        setIncomes([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // 1. Try loading from Dexie first for speed
        const dexieIncomes = await db.incomes.where({ user_id: user.uid }).sortBy('date');
        // Dexie sort by date might not be directly available, might need to sort after fetching all by user_id
        // For now, let's assume a simple fetch and then sort, or rely on Supabase order for the fresh fetch.
        // const dexieIncomes = await db.incomes.where('user_id').equals(user.uid).reverse().sortBy('date');
        // Simpler: fetch all for user, then sort in JS if needed, or rely on Supabase for primary order.

        let userIncomes = await db.incomes.where({ user_id: user.uid }).toArray();
        userIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort descending by date

        if (userIncomes.length > 0) {
          setIncomes(userIncomes);
        }

        // 2. Fetch from Supabase to get latest and update Dexie
        const supabaseIncomes = await SupabaseDataService.getIncomes(user.uid);
        setIncomes(supabaseIncomes); // Update state with fresh data from Supabase

        // 3. Update Dexie with Supabase data (bulkPut for efficiency)
        // Ensure user_id is part of the objects being put into Dexie if schema requires it for query
        const incomesToCache = supabaseIncomes.map(inc => ({ ...inc, user_id: user.uid }));
        await db.incomes.bulkPut(incomesToCache);

      } catch (error) {
        console.error("Error loading incomes:", error);
        toast({ title: "Error", description: "Could not load income data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadIncomes();
  }, [user, toast]);

  const handleAddIncome = async (newIncomeData: Omit<Income, 'id' | 'user_id'>) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to add income.", variant: "destructive" });
      return;
    }
    
    const incomePayload = { ...newIncomeData, user_id: user.uid };

    try {
      const addedIncome = await SupabaseDataService.addIncome(incomePayload);
      await db.incomes.add(addedIncome); // Add to Dexie
      setIncomes(prev => [addedIncome, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setShowAddForm(false);
      toast({
        title: "Income Added",
        description: `₹${addedIncome.amount.toLocaleString()} from ${addedIncome.source} added successfully.`,
      });
    } catch (error) {
      console.error("Error adding income:", error);
      toast({ title: "Error", description: "Failed to add income.", variant: "destructive" });
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!user) return;
    try {
      await SupabaseDataService.deleteIncome(incomeId);
      await db.incomes.delete(incomeId); // Delete from Dexie
      setIncomes(prev => prev.filter(inc => inc.id !== incomeId));
      toast({ title: "Income Deleted", description: "Income record deleted successfully." });
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({ title: "Error", description: "Failed to delete income.", variant: "destructive" });
    }
  };

  const handleOpenEditForm = (income: Income) => {
    setEditingIncome(income);
    setShowAddForm(true); // Re-use the add form for editing, or trigger a separate edit modal
  };

  const handleUpdateIncome = async (incomeId: string, updatedData: Omit<Income, 'id' | 'user_id'>) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update income.", variant: "destructive" });
      return;
    }
    // Note: updatedData should not contain user_id as it's not updatable and defined by the record owner.
    // The service method also doesn't expect user_id in the 'updates' partial.
    try {
      const updatedIncomeFromSupabase = await SupabaseDataService.updateIncome(incomeId, updatedData);

      // Ensure the updated object from Supabase has the user_id for Dexie if your Dexie schema needs it for queries
      // (though for db.incomes.update, only id is strictly needed for the key).
      // SupabaseDataService.updateIncome should return the full updated record including id.
      const incomeForDexie = { ...updatedIncomeFromSupabase, user_id: user.uid };
      await db.incomes.update(incomeId, incomeForDexie);

      setIncomes(prevIncomes =>
        prevIncomes.map(inc => inc.id === incomeId ? updatedIncomeFromSupabase : inc)
                   .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setShowAddForm(false);
      setEditingIncome(null);
      toast({
        title: "Income Updated",
        description: `₹${updatedIncomeFromSupabase.amount.toLocaleString()} from ${updatedIncomeFromSupabase.source} updated.`,
      });
    } catch (error) {
      console.error("Error updating income:", error);
      toast({ title: "Error", description: "Failed to update income.", variant: "destructive" });
    }
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

      {/* Add/Edit Income Form */}
      {showAddForm && (
        <AddIncomeForm
          initialData={editingIncome} // Pass editingIncome here
          onSubmit={(incomeData) => { // Combined submit handler
            if (editingIncome) {
              handleUpdateIncome(editingIncome.id, incomeData);
            } else {
              handleAddIncome(incomeData);
            }
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingIncome(null); // Clear editing state on cancel
          }}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEditForm(income)} // Wire up edit button
                    >
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

interface AddIncomeFormProps {
  onSubmit: (income: Omit<Income, 'id' | 'user_id'>) => void; // user_id is handled by parent
  onCancel: () => void;
  initialData?: Income | null; // For editing
}

function AddIncomeForm({ onSubmit, onCancel, initialData }: AddIncomeFormProps) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount.toString() || '',
    source: initialData?.source || '',
    category: initialData?.category || 'salary' as Income['category'],
    date: initialData?.date || new Date().toISOString().split('T')[0],
    frequency: initialData?.frequency || 'monthly' as Income['frequency'],
    note: initialData?.note || ''
  });

  const isEditMode = !!initialData;

  // Effect to reset form when initialData changes (e.g. opening edit form for different item or closing it)
  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        source: initialData.source,
        category: initialData.category,
        date: initialData.date,
        frequency: initialData.frequency,
        note: initialData.note || ''
      });
    } else {
      // Reset to default for add mode if initialData becomes null (e.g. after editing)
      setFormData({
        amount: '',
        source: '',
        category: 'salary',
        date: new Date().toISOString().split('T')[0],
        frequency: 'monthly',
        note: ''
      });
    }
  }, [initialData]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.source) {
      // Basic validation, can be enhanced with Zod or similar
      // Consider using react-hook-form for more complex forms
      alert("Amount and Source are required."); // Replace with toast or better UI feedback
      return;
    }

    onSubmit({
      amount: parseFloat(formData.amount),
      source: formData.source.trim(),
      category: formData.category,
      date: formData.date,
      frequency: formData.frequency,
      note: formData.note?.trim() || undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      // Add exit animation if needed, ensure key changes if form instance needs full reset
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Income' : 'Add New Income'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input fields remain largely the same, but value and onChange are bound to formData */}
            {/* Amount */}
            <div>
              <Label htmlFor="incomeAmount" className="text-sm font-medium text-foreground mb-1 block">Amount (₹) *</Label>
              <Input
                id="incomeAmount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000"
                required
              />
            </div>

            {/* Source */}
            <div>
              <Label htmlFor="incomeSource" className="text-sm font-medium text-foreground mb-1 block">Source *</Label>
              <Input
                id="incomeSource"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Salary, Freelance"
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="incomeCategory" className="text-sm font-medium text-foreground mb-1 block">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Income['category']})}
              >
                <SelectTrigger id="incomeCategory" className="h-10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="side-business">Side Business</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="incomeFrequency" className="text-sm font-medium text-foreground mb-1 block">Frequency *</Label>
               <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value as Income['frequency']})}
              >
                <SelectTrigger id="incomeFrequency" className="h-10">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="incomeDate" className="text-sm font-medium text-foreground mb-1 block">Date *</Label>
              <Input
                id="incomeDate"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            {/* Note */}
            <div>
              <Label htmlFor="incomeNote" className="text-sm font-medium text-foreground mb-1 block">Note (Optional)</Label>
              <Input
                id="incomeNote"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {isEditMode ? 'Update Income' : 'Add Income'}
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
