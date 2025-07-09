
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, Search, Filter, Trash2, Edit, Loader2, AlertTriangle as AlertTriangleIcon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/db";
import { Income as AppIncome } from '@/components/income/income-tracker'; // Using self-defined AppIncome
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO, isValidDate } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";

// This is the type for records in db.incomes (defined in SavoraDB class in db.ts)
// It should align with AppIncome interface if AppIncome is the intended structure for Dexie.
// Assuming AppIncome is the structure for db.incomes.
// export interface AppIncome {
//   id: string;
//   user_id?: string;
//   amount: number;
//   source: string;
//   category: 'salary' | 'rental' | 'side-business' | 'investment' | 'other' | string;
//   date: string; // ISO YYYY-MM-DD
//   frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly' | string;
//   note?: string;
//   created_at?: Date;
//   updated_at?: Date;
// }

// Form data type
type IncomeFormData = Partial<Omit<AppIncome, 'amount' | 'created_at' | 'updated_at'>> & {
  amount?: string; // Amount as string for form input
};

const INCOME_CATEGORIES = ['salary', 'rental', 'side-business', 'investment', 'freelance', 'dividends', 'gifts', 'other'] as const;
const INCOME_FREQUENCIES = ['one-time', 'monthly', 'quarterly', 'yearly', 'bi-weekly', 'weekly'] as const;


export function IncomeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<AppIncome | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<AppIncome | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch incomes using useLiveQuery
  const liveIncomes = useLiveQuery(async () => {
    const userIdToQuery = user?.uid || 'default_user'; // Fallback for local-only if user is null
    let query = db.incomes.where({ user_id: userIdToQuery });
    
    if (searchTerm) {
      query = query.filter(income =>
        income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort by date descending after filtering
    const result = await query.toArray();
    return result.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [user?.uid, searchTerm], []); // Dependencies

  const incomes = liveIncomes || [];

  const handleAddNew = () => {
    setEditingIncome(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (income: AppIncome) => {
    setEditingIncome(income);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (income: AppIncome) => {
    setIncomeToDelete(income);
  };

  const handleDeleteIncomeExecute = async () => {
    if (!incomeToDelete || !incomeToDelete.id) return;
    try {
      await db.incomes.delete(incomeToDelete.id);
      toast({ title: "Success", description: `Income "${incomeToDelete.source}" deleted.` });
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({ title: "Error", description: "Could not delete income.", variant: "destructive" });
    } finally {
      setIncomeToDelete(null);
    }
  };

  const totalMonthlyIncome = incomes
    .filter(inc => inc.frequency === 'monthly') // Consider only active if status field is added
    .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Income Tracker</h1>
          <p className="text-muted-foreground">Manage and review your income entries.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-green text-white">
              <DollarSign aria-hidden="true" className="w-4 h-4" />
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
          <Search aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search income sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search income by source or category"
          />
        </div>
        <Button variant="outline" aria-label="Filter income entries">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Income List */}
      <div className="space-y-3">
        {incomes.map((income, index) => ( // Changed filteredIncomes to incomes to match state
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
                        Date: {income.date && isValidDate(parseISO(income.date)) ? format(parseISO(income.date), 'PPP') : 'N/A'}
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
                      onClick={() => handleOpenEditForm(income)}
                      aria-label={`Edit income from ${income.source}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openDeleteConfirm(income)}
                      aria-label={`Delete income from ${income.source}`}
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

      {/* Delete Confirmation Dialog */}
      {incomeToDelete && (
        <AlertDialog open={!!incomeToDelete} onOpenChange={() => setIncomeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="flex items-center">
                <AlertTriangleIcon aria-hidden="true" className="w-5 h-5 mr-2 text-destructive"/>Are you sure?
              </AlertDialogTitleComponent>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the income from "{incomeToDelete.source}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteIncomeExecute} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// --- AddIncomeForm Sub-Component ---
interface AddIncomeFormProps {
  initialData?: AppIncome | null;
  onClose: () => void;
  userId?: string; // Pass userId for saving
}

function AddIncomeForm({ initialData, onClose, userId }: AddIncomeFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<IncomeFormData>(() => {
    const defaults: IncomeFormData = {
        amount: '', source: '', category: 'salary',
        date: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'monthly', note: '', user_id: userId || 'default_user'
    };
    if (initialData) {
      return {
        ...initialData,
        amount: initialData.amount?.toString() || '',
        date: initialData.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : defaults.date,
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof IncomeFormData, string>>>({});


  useEffect(() => {
    const defaults: IncomeFormData = {
        amount: '', source: '', category: 'salary',
        date: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'monthly', note: '', user_id: userId || 'default_user'
    };
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        amount: initialData.amount?.toString() || '',
        date: initialData.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : defaults.date,
      });
    } else {
      setFormData(defaults);
    }
    setFormErrors({}); // Clear errors when initialData changes or form opens for new
  }, [initialData, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof IncomeFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof IncomeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
     if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (date?: Date) => {
    setFormData(prev => ({ ...prev, date: date ? format(date, 'yyyy-MM-dd') : undefined }));
    if (formErrors.date) {
      setFormErrors(prev => ({ ...prev, date: undefined }));
    }
  };

  const validateCurrentForm = (): boolean => {
    const newErrors: Partial<Record<keyof IncomeFormData, string>> = {};
    if (!formData.source?.trim()) newErrors.source = "Source name is required.";
    if (!formData.amount?.trim()) newErrors.amount = "Amount is required.";
    else {
        const amountNum = parseFloat(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) newErrors.amount = "Amount must be a positive number.";
    }
    if (!formData.date) newErrors.date = "Date is required.";
    else if (!isValidDate(parseISO(formData.date))) newErrors.date = "Invalid date format.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.frequency) newErrors.frequency = "Frequency is required.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentForm()) {
      toast({ title: "Validation Error", description: "Please correct the errors in the form.", variant: "destructive", duration: 2000 });
      return;
    }
    setIsSaving(true);

    const amountNum = parseFloat(formData.amount!); // Already validated

    const recordData: Omit<AppIncome, 'id' | 'created_at' | 'updated_at'> = {
      amount: amountNum,
      source: formData.source!,
      category: formData.category! as AppIncome['category'],
      date: formData.date!,
      frequency: formData.frequency! as AppIncome['frequency'],
      note: formData.note || '',
      user_id: userId || 'default_user',
    };

    try {
      if (formData.id) { // Update
        await db.incomes.update(formData.id, { ...recordData, updated_at: new Date() });
        toast({ title: "Success", description: "Income record updated." });
      } else { // Add
        const newId = self.crypto.randomUUID();
        await db.incomes.add({ ...recordData, id: newId, created_at: new Date(), updated_at: new Date() });
        toast({ title: "Success", description: "Income record added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save income record:", error);
      toast({ title: "Database Error", description: "Could not save income record.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add New'} Income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</Label>
            <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} required
                   className={formErrors.amount ? 'border-red-500' : ''}
                   aria-required="true"
                   aria-invalid={!!formErrors.amount}
                   aria-describedby={formErrors.amount ? "amount-error-income" : undefined}
            />
            {formErrors.amount && <p id="amount-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.amount}</p>}
          </div>
          <div>
            <Label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source *</Label>
            <Input id="source" name="source" value={formData.source || ''} onChange={handleChange} placeholder="e.g., Salary, Freelance Project" required
                   className={formErrors.source ? 'border-red-500' : ''}
                   aria-required="true"
                   aria-invalid={!!formErrors.source}
                   aria-describedby={formErrors.source ? "source-error-income" : undefined}
            />
            {formErrors.source && <p id="source-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.source}</p>}
          </div>
           <div>
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</Label>
            <Select name="category" value={formData.category || 'salary'} onValueChange={v => handleSelectChange('category', v as string)}>
              <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}
                             aria-required="true"
                             aria-invalid={!!formErrors.category}
                             aria-describedby={formErrors.category ? "category-error-income" : undefined}
              ><SelectValue /></SelectTrigger>
              <SelectContent>{INCOME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
            {formErrors.category && <p id="category-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.category}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.date ? 'border-red-500' : ''}`}
                          aria-required="true"
                          aria-invalid={!!formErrors.date}
                          aria-describedby={formErrors.date ? "date-error-income" : undefined}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {(formData.date && isValidDate(parseISO(formData.date))) ? format(parseISO(formData.date), 'PPP') : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date ? parseISO(formData.date) : undefined} onSelect={handleDateChange} initialFocus /></PopoverContent>
              </Popover>
              {formErrors.date && <p id="date-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.date}</p>}
            </div>
            <div>
              <Label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency *</Label>
              <Select name="frequency" value={formData.frequency || 'monthly'} onValueChange={v => handleSelectChange('frequency', v as string)}>
                <SelectTrigger className={formErrors.frequency ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!formErrors.frequency}
                               aria-describedby={formErrors.frequency ? "frequency-error-income" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.frequency && <p id="frequency-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.frequency}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</Label>
            <Textarea id="note" name="note" value={formData.note || ''} onChange={handleChange} placeholder="Additional details..."/>
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Income' : 'Save Income')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
