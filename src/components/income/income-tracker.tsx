
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
import { IncomeSourceData } from '@/types/jsonPreload';
import { DexieAccountRecord } from '@/db';
import { formatCurrency } from '@/lib/format-utils'; // Import from new utility file
import { TagsInput } from '@/components/tags/TagsInput';
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
// Define the AppIncome interface to match the new Dexie schema for 'incomes' (v16)
export interface AppIncome {
  id: string; // UUID
  user_id?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  source_name?: string; // Name of the income source (e.g., "Salary", "Freelance Project X") - previously 'source'
  description?: string; // More detailed description of the income
  frequency?: 'one-time' | 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'bi-weekly' | string;
  tags_flat?: string; // Comma-separated for Dexie FTS
  account_id?: string; // FK to Accounts table (where it was received)
  // Denormalized fields for display (optional, can be fetched via relations)
  // source_id?: string; // Optional: if you want to store relation to IncomeSources table
  // account_name?: string;
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}


// Form data type
type IncomeFormData = Partial<Omit<AppIncome, 'amount' | 'created_at' | 'updated_at' | 'user_id'>> & {
  amount?: string; // Amount as string for form input
  tags?: string[]; // For tag input component
};

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Rental', 'Bonus', 'Gift', 'Other'] as const;
const INCOME_FREQUENCIES = ['one-time', 'monthly', 'quarterly', 'yearly', 'weekly', 'bi-weekly'] as const;


export function IncomeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<AppIncome | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<AppIncome | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const liveIncomes = useLiveQuery(async () => {
    if (!user?.uid) return [];
    let query = db.incomes.where('user_id').equals(user.uid);
    
    const userIncomes = await query.toArray(); // Fetch all user incomes first

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return userIncomes.filter(income =>
        (income.source_name && income.source_name.toLowerCase().includes(lowerSearchTerm)) ||
        (income.description && income.description.toLowerCase().includes(lowerSearchTerm)) ||
        income.category.toLowerCase().includes(lowerSearchTerm)
      ).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }
    return userIncomes.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [user?.uid, searchTerm], []);

  const incomes = liveIncomes || [];

  // These handlers would be part of IncomeTracker if form submission is managed here
  // For now, AddIncomeForm handles its own submission.
  // const handleAddIncome = async (formData: Omit<AppIncome, 'id' | 'created_at' | 'updated_at'>) => { /* ... */ };
  // const handleUpdateIncome = async (id: string, formData: Omit<AppIncome, 'id' | 'created_at' | 'updated_at'>) => { /* ... */ };


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
                        {formatCurrency(income.amount)}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(income.category)}`}>
                        {income.category}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {income.frequency}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{income.source_name}</p>
                       {income.description && income.description !== income.source_name && (
                        <p className="text-xs text-muted-foreground">{income.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Date: {income.date && isValidDate(parseISO(income.date)) ? format(parseISO(income.date), 'PPP') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEditForm(income)}
                      aria-label={`Edit income from ${income.source_name}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openDeleteConfirm(income)}
                      aria-label={`Delete income from ${income.source_name}`}
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
                This action cannot be undone. This will permanently delete the income from "{incomeToDelete.source_name || 'this entry'}".
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
  // userId prop removed, will use useAuth internally
}

function AddIncomeForm({ initialData, onClose }: AddIncomeFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from context

  const [formData, setFormData] = useState<IncomeFormData>(() => {
    const defaults: IncomeFormData = {
        amount: '', source_name: '', category: 'Salary', description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'monthly', tags: [], account_id: '',
    };
    if (initialData) {
      return {
        ...initialData, // Spread initialData first to get all existing fields
        amount: initialData.amount?.toString() || '',
        date: initialData.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : defaults.date,
        tags: initialData.tags_flat ? initialData.tags_flat.split(',').map(t => t.trim()) : [],
        // user_id will be handled by useEffect or if present in initialData
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof IncomeFormData, string>>>({});

  // For fetching income sources and accounts for dropdowns (if needed for source_name selection)
  // const incomeSourceList = useLiveQuery(() => user?.uid ? db.incomeSources.where('user_id').equals(user.uid).toArray() : [], [user?.uid], []);
  const accountList = useLiveQuery(() => user?.uid ? db.accounts.where('user_id').equals(user.uid).and(acc => acc.isActive === true).toArray() : [], [user?.uid], []);


  useEffect(() => {
    const defaults: IncomeFormData = {
        amount: '', source_name: '', category: 'Salary', description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'monthly', tags: [], account_id: '',
    };
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        amount: initialData.amount?.toString() || '',
        date: initialData.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        tags: initialData.tags_flat ? initialData.tags_flat.split(',').map(t => t.trim()) : [],
        // user_id from initialData will be preserved if present
      });
    } else {
      // For new form, set defaults (user_id is not part of IncomeFormData directly)
      setFormData(defaults);
    }
    setFormErrors({});
  }, [initialData]); // Removed user from deps for this specific effect to avoid loops if formState itself depends on user

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof IncomeFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof IncomeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
     if (formErrors[name]) { // Corrected: formErrors[name] instead of formErrors[name as keyof IncomeFormData]
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
    if (!formData.source_name?.trim()) newErrors.source_name = "Source Name/Title is required.";
    if (!formData.amount?.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number.";
    }
    if (!formData.date || !isValidDate(parseISO(formData.date))) newErrors.date = "A valid Date is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.frequency) newErrors.frequency = "Frequency is required.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentForm()) {
      toast({ title: "Validation Error", description: "Please correct the form errors.", variant: "destructive" });
      return;
    }
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save income.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const amountNum = parseFloat(formData.amount!);

    // Construct the record according to AppIncome and new Dexie schema
    const recordData: Omit<AppIncome, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      amount: amountNum,
      source_name: formData.source_name!,
      description: formData.description || formData.source_name, // Default description to source_name if empty
      category: formData.category!,
      date: formData.date!,
      frequency: formData.frequency as AppIncome['frequency'],
      tags_flat: formData.tags?.join(',').toLowerCase() || '',
      account_id: formData.account_id || undefined,
    };

    try {
      if (formData.id) {
        await db.incomes.update(formData.id, { ...recordData, user_id: user.uid, updated_at: new Date().toISOString() });
        toast({ title: "Success", description: `Income from "${recordData.source_name}" of ${formatCurrency(recordData.amount)} updated.` });
      } else {
        const newId = self.crypto.randomUUID();
        await db.incomes.add({
          ...recordData,
          id: newId,
          user_id: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as AppIncome);
        toast({ title: "Success", description: `Income from "${recordData.source_name}" of ${formatCurrency(recordData.amount)} added.` });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save income record:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save income record.", variant: "destructive"});
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
            <Label htmlFor="source_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source/Title *</Label>
            <Input id="source_name" name="source_name" value={formData.source_name || ''} onChange={handleChange} placeholder="e.g., Monthly Salary, Project Alpha" required
                   className={formErrors.source_name ? 'border-red-500' : ''}
                   aria-invalid={!!formErrors.source_name}
                   aria-describedby={formErrors.source_name ? "source_name-error-income" : undefined}
            />
            {formErrors.source_name && <p id="source_name-error-income" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.source_name}</p>}
          </div>
           <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</Label>
            <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="More details about the income..."/>
          </div>
           <div>
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</Label>
            <Select name="category" value={formData.category || 'Salary'} onValueChange={v => handleSelectChange('category', v as string)}>
              <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}
                             aria-required="true"
                             aria-invalid={!!formErrors.category}
                             aria-describedby={formErrors.category ? "category-error-income" : undefined}
              ><SelectValue /></SelectTrigger>
              <SelectContent>{INCOME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
            <Label htmlFor="account_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credited To Account (Optional)</Label>
            <Select name="account_id" value={formData.account_id || ''} onValueChange={v => handleSelectChange('account_id', v as string)}>
                <SelectTrigger><SelectValue placeholder="Select account..."/></SelectTrigger>
                <SelectContent>
                    <SelectItem value=""><em>None/Not Specified</em></SelectItem>
                    {accountList?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.provider})</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Optional)</Label>
            <TagsInput
              tags={formData.tags || []}
              onTagsChange={(newTags) => handleSelectChange('tags', newTags as any)} // cast as any because handleSelectChange expects string for value
              userId={user?.uid}
              placeholder="Add relevant tags..."
            />
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
