
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

const incomeSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ required_error: "Amount is required.", invalid_type_error: "Amount must be a number."}).positive()
  ),
  source_name: z.string().min(1, "Source/Title is required."),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  date: z.string().min(1, "Date is required."),
  frequency: z.string().min(1, "Frequency is required."),
  account_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type AddIncomeFormData = z.infer<typeof incomeSchema>;

interface AddIncomeFormProps {
  initialData?: AppIncome | null;
  onClose: () => void;
}

function AddIncomeForm({ initialData, onClose }: AddIncomeFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<AddIncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: undefined,
      source_name: '',
      description: '',
      category: 'Salary',
      date: format(new Date(), 'yyyy-MM-dd'),
      frequency: 'monthly',
      account_id: '',
      tags: [],
    }
  });

  const accountList = useLiveQuery(() => user?.uid ? db.accounts.where('user_id').equals(user.uid).and(acc => acc.isActive === true).toArray() : [], [user?.uid], []);

  useEffect(() => {
    if (initialData) {
      reset({
        amount: initialData.amount,
        source_name: initialData.source_name,
        description: initialData.description,
        category: initialData.category,
        date: initialData.date ? format(parseISO(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        frequency: initialData.frequency,
        account_id: initialData.account_id,
        tags: initialData.tags_flat ? initialData.tags_flat.split(',').filter(Boolean) : [],
      });
    } else {
      reset({
        amount: undefined, source_name: '', description: '', category: 'Salary',
        date: format(new Date(), 'yyyy-MM-dd'), frequency: 'monthly', account_id: '', tags: [],
      });
    }
  }, [initialData, reset]);

  const processSubmit = async (data: AddIncomeFormData) => {
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save income.", variant: "destructive" });
      return;
    }

    const recordData: Omit<AppIncome, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      ...data,
      tags_flat: data.tags?.join(',').toLowerCase() || '',
    };

    try {
      if (initialData?.id) {
        await db.incomes.update(initialData.id, { ...recordData, user_id: user.uid, updated_at: new Date().toISOString() });
        toast({ title: "Success", description: `Income from "${recordData.source_name}" updated.` });
      } else {
        const newId = self.crypto.randomUUID();
        await db.incomes.add({
          ...recordData,
          id: newId,
          user_id: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as AppIncome);
        toast({ title: "Success", description: `Income from "${recordData.source_name}" added.` });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save income record:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save income record.", variant: "destructive"});
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="add-income-description">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit' : 'Add New'} Income</DialogTitle>
          <DialogDescription id="add-income-description">
            {initialData?.id ? 'Update the details of your income entry.' : 'Add a new income entry to your records.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} />
            {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="source_name">Source/Title *</Label>
            <Input id="source_name" placeholder="e.g., Monthly Salary" {...register('source_name')} />
            {errors.source_name && <p className="mt-1 text-xs text-destructive">{errors.source_name.message}</p>}
          </div>
           <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" placeholder="More details..." {...register('description')} />
          </div>
           <div>
            <Label htmlFor="category">Category *</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INCOME_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
               <Input id="date" type="date" {...register('date')} />
               {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INCOME_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
              {errors.frequency && <p className="mt-1 text-xs text-destructive">{errors.frequency.message}</p>}
            </div>
          </div>
           <div>
            <Label htmlFor="account_id">Credited To Account (Optional)</Label>
            <Controller
              name="account_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select account..."/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value=""><em>None/Not Specified</em></SelectItem>
                        {accountList?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.provider})</SelectItem>)}
                    </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                    <TagsInput
                        tags={field.value || []}
                        onTagsChange={field.onChange}
                        userId={user?.uid}
                        placeholder="Add relevant tags..."
                    />
                )}
            />
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (initialData?.id ? 'Update Income' : 'Save Income')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
