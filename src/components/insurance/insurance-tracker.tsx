
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Search, Trash2, Edit, AlertCircle as AlertIcon, Loader2, CalendarDays } from "lucide-react"; // Renamed AlertCircle to avoid conflict, Added Loader2, CalendarDays
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { db, DexieInsurancePolicyRecord, DexieLoanEMIRecord } from "@/db";
import { InsuranceService } from "@/services/InsuranceService";
import { LoanService } from "@/services/LoanService";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from '@/contexts/auth-context';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { formatCurrency } from "@/lib/format-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Form Data Types (derived from Dexie Record Types)
export type InsuranceFormData = Partial<Omit<DexieInsurancePolicyRecord, 'premium' | 'coverageAmount' | 'created_at' | 'updated_at'>> & {
  premium?: string; // For form input
  coverageAmount?: string; // For form input
};

export type EMIFormData = Partial<Omit<DexieLoanEMIRecord, 'principalAmount' | 'emiAmount' | 'interestRate' | 'tenureMonths' | 'remainingAmount' | 'created_at' | 'updated_at'>> & {
  principalAmount?: string;
  emiAmount?: string;
  interestRate?: string;
  tenureMonths?: string;
  remainingAmount?: string;
};

// Options for Select components
const INSURANCE_TYPES = ['life', 'health', 'vehicle', 'home', 'other'] as const;
const INSURANCE_FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const;
const INSURANCE_STATUSES = ['active', 'expired', 'cancelled'] as const;
const EMI_STATUSES = ['active', 'completed', 'defaulted'] as const;


export function InsuranceTracker() {
  const [activeTab, setActiveTab] = useState<'insurance' | 'emi'>('insurance');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DexieInsurancePolicyRecord | DexieLoanEMIRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DexieInsurancePolicyRecord | DexieLoanEMIRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth(); // Get user

  const liveInsurances = useLiveQuery(
    async () => {
      if (!user?.uid) return [];
      const userInsurances = await InsuranceService.getPolicies(user.uid);
      if (searchTerm && activeTab === 'insurance') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userInsurances.filter(p =>
            p.policyName.toLowerCase().includes(lowerSearchTerm) ||
            p.insurer.toLowerCase().includes(lowerSearchTerm) ||
            (p.policyNumber && p.policyNumber.toLowerCase().includes(lowerSearchTerm))
        );
      }
      return userInsurances;
    },
    [searchTerm, activeTab, user?.uid],
    []
  );

  const liveEMIs = useLiveQuery(
    async () => {
      if (!user?.uid) return [];
      const userEMIs = await LoanService.getLoans(user.uid);
       if (searchTerm && activeTab === 'emi') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userEMIs.filter(e =>
            e.loanType.toLowerCase().includes(lowerSearchTerm) ||
            e.lender.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return userEMIs;
    },
    [searchTerm, activeTab, user?.uid],
    []
  );

  const insurances = liveInsurances || [];
  const emis = liveEMIs || [];

  const handleAddNew = () => {
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (item: DexieInsurancePolicyRecord | DexieLoanEMIRecord) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (item: DexieInsurancePolicyRecord | DexieLoanEMIRecord) => {
    setItemToDelete(item);
  };

  const handleDeleteExecute = async () => {
    if (!itemToDelete || !itemToDelete.id) return;

    try {
      if (activeTab === 'insurance') {
        await InsuranceService.deletePolicy(itemToDelete.id);
        toast({ title: "Success", description: `Insurance policy "${(itemToDelete as DexieInsurancePolicyRecord).policyName}" deleted.` });
      } else {
        await LoanService.deleteLoan(itemToDelete.id);
        toast({ title: "Success", description: `EMI for "${(itemToDelete as DexieLoanEMIRecord).loanType}" deleted.` });
      }
    } catch (error) {
      console.error(`Failed to delete ${activeTab} item:`, error);
      toast({ title: "Error", description: (error as Error).message || `Failed to delete ${activeTab === 'insurance' ? 'policy' : 'EMI'}.`, variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  // Summary calculations
  const totalMonthlyPremiums = insurances
    .filter(ins => ins.frequency === 'monthly' && ins.status === 'active')
    .reduce((sum, ins) => sum + ins.premium, 0);

  const totalMonthlyEMIs = emis
    .filter(emi => emi.status === 'active')
    .reduce((sum, emi) => sum + emi.emiAmount, 0);


  if (liveInsurances === undefined || liveEMIs === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-lg text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Insurance & EMI Tracker</h1>
          <p className="text-muted-foreground">Manage your policies and loan installments.</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'insurance' ? 'Insurance' : 'EMI / Loan'}
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`px-4 py-3 text-sm font-medium transition-colors focus:outline-none ${
            activeTab === 'insurance'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
          }`}
        >
          Insurance Policies ({insurances.length})
        </button>
        <button
          onClick={() => setActiveTab('emi')}
          className={`px-4 py-3 text-sm font-medium transition-colors focus:outline-none ${
            activeTab === 'emi'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
          }`}
        >
          EMIs / Loans ({emis.length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Monthly Premiums</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPremiums)}</div>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Monthly EMIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyEMIs)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Forms - Conditionally rendered in a Dialog within the respective form components */}
      {showAddForm && activeTab === 'insurance' && (
        <AddInsuranceForm
          initialData={editingItem as DexieInsurancePolicyRecord | null} // Cast based on activeTab
          onClose={() => { setShowAddForm(false); setEditingItem(null); }}
        />
      )}

      {showAddForm && activeTab === 'emi' && (
        <AddEMIForm
          initialData={editingItem as DexieLoanEMIRecord | null} // Cast based on activeTab
          onClose={() => { setShowAddForm(false); setEditingItem(null); }}
        />
      )}

      {/* Search */}
      <div className="mt-6">
        <Label htmlFor="search-insurance-emi" className="sr-only">Search</Label>
        <Input
          id="search-insurance-emi"
          placeholder={`Search ${activeTab === 'insurance' ? 'insurance policies' : 'EMIs / loans'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          icon={<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'insurance' ? (
        <InsuranceList
            insurances={insurances}
            onEdit={handleOpenEditForm as (item: DexieInsurancePolicyRecord) => void}
            onDelete={openDeleteConfirm as (item: DexieInsurancePolicyRecord) => void}
        />
      ) : (
        <EMIList
            emis={emis}
            onEdit={handleOpenEditForm as (item: DexieLoanEMIRecord) => void}
            onDelete={openDeleteConfirm as (item: DexieLoanEMIRecord) => void}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center"><AlertTriangle aria-hidden="true" className="w-5 h-5 mr-2 text-destructive"/>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the record for
                "{activeTab === 'insurance' ? (itemToDelete as DexieInsurancePolicyRecord).policyName : (itemToDelete as DexieLoanEMIRecord).loanType}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExecute} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// --- InsuranceList Sub-Component ---
interface InsuranceListProps {
  insurances: DexieInsurancePolicyRecord[];
  onEdit: (insurance: DexieInsurancePolicyRecord) => void;
  onDelete: (insurance: DexieInsurancePolicyRecord) => void;
}
function InsuranceList({ insurances, onEdit, onDelete }: InsuranceListProps) {
  const getTypeColor = (type: string) => {
    // ... (same as original)
    const colors: Record<string, string> = {
      'life': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'health': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'vehicle': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'home': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type.toLowerCase()] || colors['other'];
  };

  if (insurances.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No insurance policies found.</p>;
  }

  return (
    <div className="space-y-4">
      {insurances.map((insurance) => (
        <Card key={insurance.id} className={`shadow-sm transition-all hover:shadow-md ${insurance.status !== 'active' ? 'opacity-70' : ''}`}>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">{insurance.policyName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(insurance.type)}`}>
                    {insurance.type}
                  </span>
                   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        insurance.status === 'active' ? 'bg-green-100 text-green-800' :
                        insurance.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                      {insurance.status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{insurance.insurer} - {insurance.policyNumber}</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                  <div><span className="font-medium">Premium:</span> {formatCurrency(insurance.premium)}/{insurance.frequency}</div>
                  {insurance.coverageAmount && <div><span className="font-medium">Coverage:</span> {formatCurrency(insurance.coverageAmount)}</div>}
                  {insurance.startDate && <div><span className="font-medium">Starts:</span> {format(parseISO(insurance.startDate), 'PPP')}</div>}
                  {insurance.endDate && <div><span className="font-medium">Ends:</span> {format(parseISO(insurance.endDate), 'PPP')}</div>}
                  {insurance.nextDueDate && <div><span className="font-medium">Next Due:</span> {format(parseISO(insurance.nextDueDate), 'PPP')}</div>}
                </div>
                {insurance.note && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">Note: {insurance.note}</p>}
              </div>

              <div className="flex sm:flex-col items-end sm:items-center gap-2 sm:gap-1 shrink-0 pt-2 sm:pt-0">
                <Button size="icon" variant="ghost" onClick={() => onEdit(insurance)} className="h-8 w-8" aria-label={`Edit policy ${insurance.policyName}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(insurance)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete policy ${insurance.policyName}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- EMIList Sub-Component ---
interface EMIListProps {
  emis: DexieLoanEMIRecord[];
  onEdit: (emi: DexieLoanEMIRecord) => void;
  onDelete: (emi: DexieLoanEMIRecord) => void;
}
function EMIList({ emis, onEdit, onDelete }: EMIListProps) {
   if (emis.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No EMIs or loans found.</p>;
  }
  return (
    <div className="space-y-4">
      {emis.map((emi) => (
         <Card key={emi.id} className={`shadow-sm transition-all hover:shadow-md ${emi.status !== 'active' ? 'opacity-70' : ''}`}>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">{emi.loanType}</h3>
                   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        emi.status === 'active' ? 'bg-green-100 text-green-800' :
                        emi.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {emi.status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{emi.lender}</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                    <div><span className="font-medium">EMI:</span> {formatCurrency(emi.emiAmount)}/month</div>
                    {emi.principalAmount && <div><span className="font-medium">Principal:</span> {formatCurrency(emi.principalAmount)}</div>}
                    {emi.remainingAmount !== undefined && <div><span className="font-medium">Remaining:</span> {formatCurrency(emi.remainingAmount)}</div>}
                    {emi.interestRate !== undefined && <div><span className="font-medium">Rate:</span> {emi.interestRate}% p.a.</div>}
                    {emi.tenureMonths && <div><span className="font-medium">Tenure:</span> {emi.tenureMonths} months</div>}
                    {emi.nextDueDate && <div><span className="font-medium">Next Due:</span> {format(parseISO(emi.nextDueDate), 'PPP')}</div>}
                    {emi.startDate && <div><span className="font-medium">Starts:</span> {format(parseISO(emi.startDate), 'PPP')}</div>}
                    {emi.endDate && <div><span className="font-medium">Ends:</span> {format(parseISO(emi.endDate), 'PPP')}</div>}
                 </div>
                 {emi.note && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">Note: {emi.note}</p>}
              </div>
              <div className="flex sm:flex-col items-end sm:items-center gap-2 sm:gap-1 shrink-0 pt-2 sm:pt-0">
                <Button size="icon" variant="ghost" onClick={() => onEdit(emi)} className="h-8 w-8" aria-label={`Edit EMI for ${emi.loanType}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(emi)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete EMI for ${emi.loanType}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


// --- AddInsuranceForm Sub-Component ---
interface AddInsuranceFormProps {
  initialData?: DexieInsurancePolicyRecord | null;
  onClose: () => void;
}
function AddInsuranceForm({ initialData, onClose }: AddInsuranceFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user
  const [formData, setFormData] = useState<InsuranceFormData>(() => {
    const defaults: InsuranceFormData = {
        policyName: '', policyNumber: '', insurer: '', type: 'life', premium: '', frequency: 'yearly',
        startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', coverageAmount: '',
        nextDueDate: '', status: 'active', note: '', user_id: user?.uid // Initialize with user?.uid
    };
    if (initialData) {
      return {
        ...initialData,
        premium: initialData.premium?.toString() || '',
        coverageAmount: initialData.coverageAmount?.toString() || '',
        startDate: initialData.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : defaults.startDate,
        endDate: initialData.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : defaults.endDate,
        nextDueDate: initialData.nextDueDate ? format(parseISO(initialData.nextDueDate), 'yyyy-MM-dd') : defaults.nextDueDate,
        user_id: initialData.user_id || user?.uid, // Ensure user_id is set
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<InsuranceFormData>>({}); // Added for form errors

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        premium: initialData.premium?.toString() || '',
        coverageAmount: initialData.coverageAmount?.toString() || '',
        startDate: initialData.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        endDate: initialData.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : undefined,
        nextDueDate: initialData.nextDueDate ? format(parseISO(initialData.nextDueDate), 'yyyy-MM-dd') : undefined,
        user_id: initialData.user_id || user?.uid, // Prioritize initialData, then current user
      });
    } else {
      // For new form, ensure user_id is from current auth context
      setFormData({
        policyName: '', policyNumber: '', insurer: '', type: 'life', premium: '', frequency: 'yearly',
        startDate: format(new Date(), 'yyyy-MM-dd'), endDate: undefined, coverageAmount: '',
        nextDueDate: undefined, status: 'active', note: '', user_id: user?.uid
      });
    }
    setFormErrors({}); // Clear errors when data changes
  }, [initialData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelectChange = (name: keyof InsuranceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (name: keyof InsuranceFormData, date?: Date) => {
    setFormData(prev => ({ ...prev, [name]: date ? format(date, 'yyyy-MM-dd') : undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Basic Validation (can be enhanced with Zod or similar)
    const currentErrors: Partial<InsuranceFormData> = {};
    if (!formData.policyName?.trim()) currentErrors.policyName = "Policy Name is required.";
    if (!formData.insurer?.trim()) currentErrors.insurer = "Insurer is required.";
    if (!formData.type) currentErrors.type = "Policy Type is required.";
    if (!formData.premium?.trim() || isNaN(parseFloat(formData.premium)) || parseFloat(formData.premium) <= 0) currentErrors.premium = "Valid Premium is required.";
    if (formData.coverageAmount && (isNaN(parseFloat(formData.coverageAmount)) || parseFloat(formData.coverageAmount) <=0)) currentErrors.coverageAmount = "Coverage must be a valid positive number.";
    // Add more specific date validations if needed

    setFormErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) {
      toast({ title: "Validation Error", description: "Please correct the highlighted fields.", variant: "destructive" });
      setIsSaving(false); return;
    }

    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      setIsSaving(false); return;
    }

    const premiumNum = parseFloat(formData.premium!); // Already validated
    const coverageNum = formData.coverageAmount ? parseFloat(formData.coverageAmount) : undefined;

    const record: Omit<DexieInsurancePolicyRecord, 'id' | 'created_at' | 'updated_at'> = {
        policyName: formData.policyName!, insurer: formData.insurer!, type: formData.type!,
        premium: premiumNum, frequency: formData.frequency! as DexieInsurancePolicyRecord['frequency'],
        startDate: formData.startDate, endDate: formData.endDate, coverageAmount: coverageNum,
        nextDueDate: formData.nextDueDate, status: formData.status! as DexieInsurancePolicyRecord['status'],
        note: formData.note || '', user_id: user.uid, // Use authenticated user's ID
        policyNumber: formData.policyNumber || ''
    };

    try {
      if (formData.id) {
        await InsuranceService.updatePolicy(formData.id, record);
        toast({ title: "Success", description: "Insurance policy updated." });
      } else {
        await InsuranceService.addPolicy(record as Omit<DexieInsurancePolicyRecord, 'id'>);
        toast({ title: "Success", description: "Insurance policy added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save insurance policy:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save insurance policy.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}> {/* Form is now a dialog itself */}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add'} Insurance Policy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Policy Name, Number, Insurer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Name *</Label>
              <Input id="policyName" name="policyName" value={formData.policyName || ''} onChange={handleChange} required
                     className={formErrors.policyName ? 'border-red-500': ''}
                     aria-invalid={!!formErrors.policyName}
                     aria-describedby={formErrors.policyName ? "policyName-error-insurance" : undefined}
              />
              {formErrors.policyName && <p id="policyName-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.policyName}</p>}
            </div>
            <div>
              <Label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Number</Label>
              <Input id="policyNumber" name="policyNumber" value={formData.policyNumber || ''} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="insurer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurer *</Label>
            <Input id="insurer" name="insurer" value={formData.insurer || ''} onChange={handleChange} required
                   className={formErrors.insurer ? 'border-red-500': ''}
                   aria-invalid={!!formErrors.insurer}
                   aria-describedby={formErrors.insurer ? "insurer-error-insurance" : undefined}
            />
            {formErrors.insurer && <p id="insurer-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.insurer}</p>}
          </div>

          {/* Type, Premium, Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</Label>
              <Select name="type" value={formData.type || 'other'} onValueChange={v => handleSelectChange('type', v as string)}>
                <SelectTrigger className={formErrors.type ? 'border-red-500': ''}
                               aria-invalid={!!formErrors.type}
                               aria-describedby={formErrors.type ? "type-error-insurance" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>{INSURANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.type && <p id="type-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.type}</p>}
            </div>
            <div>
              <Label htmlFor="premium" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium (₹) *</Label>
              <Input id="premium" name="premium" type="number" step="0.01" value={formData.premium || ''} onChange={handleChange} required
                     className={formErrors.premium ? 'border-red-500': ''}
                     aria-invalid={!!formErrors.premium}
                     aria-describedby={formErrors.premium ? "premium-error-insurance" : undefined}
              />
              {formErrors.premium && <p id="premium-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.premium}</p>}
            </div>
            <div>
              <Label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency *</Label>
              <Select name="frequency" value={formData.frequency || 'yearly'} onValueChange={v => handleSelectChange('frequency', v as string)}>
                <SelectTrigger className={formErrors.frequency ? 'border-red-500': ''}
                               aria-invalid={!!formErrors.frequency}
                               aria-describedby={formErrors.frequency ? "frequency-error-insurance" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>{INSURANCE_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.frequency && <p id="frequency-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.frequency}</p>}
            </div>
          </div>

          {/* Start Date, End Date, Coverage Amount */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.startDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.startDate} aria-describedby={formErrors.startDate ? "startDate-error-insurance" : undefined}
                ><CalendarDays className="mr-2 h-4 w-4" />{formData.startDate && isValidDate(parseISO(formData.startDate)) ? format(parseISO(formData.startDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.startDate ? parseISO(formData.startDate) : undefined} onSelect={d => handleDateChange('startDate', d)} /></PopoverContent></Popover>
                {formErrors.startDate && <p id="startDate-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.startDate}</p>}
            </div>
            <div>
                <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.endDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.endDate} aria-describedby={formErrors.endDate ? "endDate-error-insurance" : undefined}
                ><CalendarDays className="mr-2 h-4 w-4" />{formData.endDate && isValidDate(parseISO(formData.endDate)) ? format(parseISO(formData.endDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.endDate ? parseISO(formData.endDate) : undefined} onSelect={d => handleDateChange('endDate', d)} /></PopoverContent></Popover>
                {formErrors.endDate && <p id="endDate-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.endDate}</p>}
            </div>
            <div>
              <Label htmlFor="coverageAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coverage (₹)</Label>
              <Input id="coverageAmount" name="coverageAmount" type="number" step="0.01" value={formData.coverageAmount || ''} onChange={handleChange}
                     className={formErrors.coverageAmount ? 'border-red-500': ''}
                     aria-invalid={!!formErrors.coverageAmount}
                     aria-describedby={formErrors.coverageAmount ? "coverageAmount-error-insurance" : undefined}
              />
              {formErrors.coverageAmount && <p id="coverageAmount-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.coverageAmount}</p>}
            </div>
          </div>

          {/* Next Due Date, Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.nextDueDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.nextDueDate} aria-describedby={formErrors.nextDueDate ? "nextDueDate-error-insurance" : undefined}
                ><CalendarDays className="mr-2 h-4 w-4" />{formData.nextDueDate && isValidDate(parseISO(formData.nextDueDate)) ? format(parseISO(formData.nextDueDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.nextDueDate ? parseISO(formData.nextDueDate) : undefined} onSelect={d => handleDateChange('nextDueDate', d)} /></PopoverContent></Popover>
                {formErrors.nextDueDate && <p id="nextDueDate-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.nextDueDate}</p>}
            </div>
            <div>
              <Label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</Label>
              <Select name="status" value={formData.status || 'active'} onValueChange={v => handleSelectChange('status', v as string)}>
                <SelectTrigger className={formErrors.status ? 'border-red-500': ''}
                               aria-invalid={!!formErrors.status}
                               aria-describedby={formErrors.status ? "status-error-insurance" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>{INSURANCE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.status && <p id="status-error-insurance" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.status}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</Label>
            <Textarea id="note" name="note" value={formData.note || ''} onChange={handleChange} placeholder="Any additional notes..."/>
          </div>

          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Policy' : 'Save Policy')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- AddEMIForm Sub-Component ---
interface AddEMIFormProps {
  initialData?: DexieLoanEMIRecord | null;
  onClose: () => void;
}
function AddEMIForm({ initialData, onClose }: AddEMIFormProps) {
   const { toast } = useToast();
   const { user } = useAuth(); // Get user
  const [formData, setFormData] = useState<EMIFormData>(() => {
    const defaults: EMIFormData = {
        loanType: '', lender: '', principalAmount: '', emiAmount: '', interestRate: '', tenureMonths: '',
        startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', nextDueDate: '', remainingAmount: '',
        status: 'active', account: '', note: '', user_id: user?.uid // Initialize with user?.uid
    };
    if (initialData) {
      return {
        ...initialData,
        principalAmount: initialData.principalAmount?.toString() || '',
        emiAmount: initialData.emiAmount?.toString() || '',
        interestRate: initialData.interestRate?.toString() || '',
        tenureMonths: initialData.tenureMonths?.toString() || '',
        remainingAmount: initialData.remainingAmount?.toString() || '',
        startDate: initialData.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : defaults.startDate,
        endDate: initialData.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : defaults.endDate,
        nextDueDate: initialData.nextDueDate ? format(parseISO(initialData.nextDueDate), 'yyyy-MM-dd') : defaults.nextDueDate,
        user_id: initialData.user_id || user?.uid, // Ensure user_id is set
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<EMIFormData>>({}); // Added for form errors

   useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        principalAmount: initialData.principalAmount?.toString() || '',
        emiAmount: initialData.emiAmount?.toString() || '',
        interestRate: initialData.interestRate?.toString() || '',
        tenureMonths: initialData.tenureMonths?.toString() || '',
        remainingAmount: initialData.remainingAmount?.toString() || '',
        startDate: initialData.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        endDate: initialData.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : undefined,
        nextDueDate: initialData.nextDueDate ? format(parseISO(initialData.nextDueDate), 'yyyy-MM-dd') : undefined,
        user_id: initialData.user_id || user?.uid, // Prioritize initialData, then current user
      });
    } else {
      // For new form, ensure user_id is from current auth context
      setFormData({
        loanType: '', lender: '', principalAmount: '', emiAmount: '', interestRate: '', tenureMonths: '',
        startDate: format(new Date(), 'yyyy-MM-dd'), endDate: undefined, nextDueDate: undefined, remainingAmount: '',
        status: 'active', account: '', note: '', user_id: user?.uid
      });
    }
    setFormErrors({}); // Clear errors when data changes
  }, [initialData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelectChange = (name: keyof EMIFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
   const handleDateChange = (name: keyof EMIFormData, date?: Date) => {
    setFormData(prev => ({ ...prev, [name]: date ? format(date, 'yyyy-MM-dd') : undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Basic Validation (can be enhanced)
    const currentErrors: Partial<EMIFormData> = {};
    if (!formData.loanType?.trim()) currentErrors.loanType = "Loan Type is required.";
    if (!formData.lender?.trim()) currentErrors.lender = "Lender is required.";
    if (!formData.principalAmount?.trim() || isNaN(parseFloat(formData.principalAmount)) || parseFloat(formData.principalAmount) <= 0) currentErrors.principalAmount = "Valid Principal Amount is required.";
    if (!formData.emiAmount?.trim() || isNaN(parseFloat(formData.emiAmount)) || parseFloat(formData.emiAmount) <= 0) currentErrors.emiAmount = "Valid EMI Amount is required.";
    if (!formData.status) currentErrors.status = "Status is required.";
    // Add more validations as needed

    setFormErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) {
      toast({ title: "Validation Error", description: "Please correct the highlighted fields.", variant: "destructive" });
      setIsSaving(false); return;
    }

    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      setIsSaving(false); return;
    }

    const principalNum = parseFloat(formData.principalAmount!);
    const emiNum = parseFloat(formData.emiAmount!);
    const interestNum = formData.interestRate ? parseFloat(formData.interestRate) : undefined;
    const tenureNum = formData.tenureMonths ? parseInt(formData.tenureMonths) : undefined; // Should be number
    const remainingNum = formData.remainingAmount ? parseFloat(formData.remainingAmount) : undefined;


    const record: Omit<DexieLoanEMIRecord, 'id' | 'created_at' | 'updated_at'> = {
        loanType: formData.loanType!, lender: formData.lender!, principalAmount: principalNum,
        emiAmount: emiNum, interestRate: interestNum,
        tenureMonths: tenureNum!, // Ensure this is parsed as number if string input
        startDate: formData.startDate, endDate: formData.endDate, nextDueDate: formData.nextDueDate,
        remainingAmount: remainingNum, status: formData.status! as DexieLoanEMIRecord['status'],
        account: formData.account || '', note: formData.note || '', user_id: user.uid, // Use authenticated user's ID
    };

    try {
      if (formData.id) {
        await LoanService.updateLoan(formData.id, record);
        toast({ title: "Success", description: "EMI/Loan details updated." });
      } else {
        await LoanService.addLoan(record as Omit<DexieLoanEMIRecord, 'id'>);
        toast({ title: "Success", description: "EMI/Loan added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save EMI/Loan:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save EMI/Loan details.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
     <Dialog open={true} onOpenChange={onClose}> {/* Form is now a dialog itself */}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add'} EMI / Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Loan Type, Lender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loanType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Type *</Label>
              <Input id="loanType" name="loanType" value={formData.loanType || ''} onChange={handleChange} required
                     className={formErrors.loanType ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.loanType}
                     aria-describedby={formErrors.loanType ? "loanType-error-emi" : undefined}
              />
              {formErrors.loanType && <p id="loanType-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.loanType}</p>}
            </div>
            <div>
              <Label htmlFor="lender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lender *</Label>
              <Input id="lender" name="lender" value={formData.lender || ''} onChange={handleChange} required
                     className={formErrors.lender ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.lender}
                     aria-describedby={formErrors.lender ? "lender-error-emi" : undefined}
              />
              {formErrors.lender && <p id="lender-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.lender}</p>}
            </div>
          </div>

          {/* Principal, EMI Amount, Interest Rate, Tenure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal (₹) *</Label>
              <Input id="principalAmount" name="principalAmount" type="number" step="0.01" value={formData.principalAmount || ''} onChange={handleChange} required
                     className={formErrors.principalAmount ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.principalAmount}
                     aria-describedby={formErrors.principalAmount ? "principalAmount-error-emi" : undefined}
              />
              {formErrors.principalAmount && <p id="principalAmount-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.principalAmount}</p>}
            </div>
            <div>
              <Label htmlFor="emiAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Amount (₹) *</Label>
              <Input id="emiAmount" name="emiAmount" type="number" step="0.01" value={formData.emiAmount || ''} onChange={handleChange} required
                     className={formErrors.emiAmount ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.emiAmount}
                     aria-describedby={formErrors.emiAmount ? "emiAmount-error-emi" : undefined}
              />
              {formErrors.emiAmount && <p id="emiAmount-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.emiAmount}</p>}
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</Label>
              <Input id="interestRate" name="interestRate" type="number" step="0.01" value={formData.interestRate || ''} onChange={handleChange}
                     className={formErrors.interestRate ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.interestRate}
                     aria-describedby={formErrors.interestRate ? "interestRate-error-emi" : undefined}
              />
              {formErrors.interestRate && <p id="interestRate-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.interestRate}</p>}
            </div>
            <div>
              <Label htmlFor="tenureMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenure (Months)</Label>
              <Input id="tenureMonths" name="tenureMonths" type="number" value={formData.tenureMonths || ''} onChange={handleChange}
                     className={formErrors.tenureMonths ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.tenureMonths}
                     aria-describedby={formErrors.tenureMonths ? "tenureMonths-error-emi" : undefined}
              />
              {formErrors.tenureMonths && <p id="tenureMonths-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.tenureMonths}</p>}
            </div>
          </div>

          {/* Start Date, End Date, Next Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.startDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.startDate} aria-describedby={formErrors.startDate ? "startDate-error-emi" : undefined}
              ><CalendarDays className="mr-2 h-4 w-4" />{formData.startDate && isValidDate(parseISO(formData.startDate)) ? format(parseISO(formData.startDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.startDate ? parseISO(formData.startDate) : undefined} onSelect={d => handleDateChange('startDate',d)}/></PopoverContent></Popover>
              {formErrors.startDate && <p id="startDate-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.startDate}</p>}
            </div>
            <div>
              <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.endDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.endDate} aria-describedby={formErrors.endDate ? "endDate-error-emi" : undefined}
              ><CalendarDays className="mr-2 h-4 w-4" />{formData.endDate && isValidDate(parseISO(formData.endDate)) ? format(parseISO(formData.endDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.endDate ? parseISO(formData.endDate) : undefined} onSelect={d => handleDateChange('endDate',d)}/></PopoverContent></Popover>
              {formErrors.endDate && <p id="endDate-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.endDate}</p>}
            </div>
            <div>
              <Label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.nextDueDate ? 'border-red-500' : ''}`}
                                                         aria-invalid={!!formErrors.nextDueDate} aria-describedby={formErrors.nextDueDate ? "nextDueDate-error-emi" : undefined}
              ><CalendarDays className="mr-2 h-4 w-4" />{formData.nextDueDate && isValidDate(parseISO(formData.nextDueDate)) ? format(parseISO(formData.nextDueDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.nextDueDate ? parseISO(formData.nextDueDate) : undefined} onSelect={d => handleDateChange('nextDueDate',d)}/></PopoverContent></Popover>
              {formErrors.nextDueDate && <p id="nextDueDate-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.nextDueDate}</p>}
            </div>
          </div>

          {/* Remaining Amount, Status, Account */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="remainingAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remaining (₹)</Label>
              <Input id="remainingAmount" name="remainingAmount" type="number" step="0.01" value={formData.remainingAmount || ''} onChange={handleChange}
                     className={formErrors.remainingAmount ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.remainingAmount}
                     aria-describedby={formErrors.remainingAmount ? "remainingAmount-error-emi" : undefined}
              />
              {formErrors.remainingAmount && <p id="remainingAmount-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.remainingAmount}</p>}
            </div>
            <div>
              <Label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</Label>
              <Select name="status" value={formData.status || 'active'} onValueChange={v => handleSelectChange('status', v as string)}>
                <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}
                               aria-invalid={!!formErrors.status}
                               aria-describedby={formErrors.status ? "status-error-emi" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>{EMI_STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.status && <p id="status-error-emi" className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.status}</p>}
            </div>
            <div>
              <Label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account (Optional)</Label>
              <Input id="account" name="account" value={formData.account || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</Label>
            <Textarea id="note" name="note" value={formData.note || ''} onChange={handleChange} placeholder="Any additional notes..."/>
          </div>

          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update EMI/Loan' : 'Save EMI/Loan')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
  policyNumber: string;
  insurer: string;
  type: 'life' | 'health' | 'vehicle' | 'home' | 'other';
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  coverageAmount: number;
  nextDueDate: string;
  status: 'active' | 'expired' | 'cancelled';
  note?: string;
}

export interface EMI {
  id: string;
  loanType: string;
  lender: string;
  principalAmount: number;
  emiAmount: number;
  interestRate: number;
  tenure: number;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  remainingAmount: number;
  status: 'active' | 'completed' | 'defaulted';
  note?: string;
}

const mockInsurances: Insurance[] = [
  {
    id: '1',
    policyName: 'Term Life Insurance',
    policyNumber: 'LI001234567',
    insurer: 'LIC of India',
    type: 'life',
    premium: 25000,
    frequency: 'yearly',
    startDate: '2023-01-15',
    endDate: '2043-01-15',
    coverageAmount: 5000000,
    nextDueDate: '2024-01-15',
    status: 'active'
  }
];

const mockEMIs: EMI[] = [
  {
    id: '1',
    loanType: 'Home Loan',
    lender: 'SBI',
    principalAmount: 5000000,
    emiAmount: 45000,
    interestRate: 8.5,
    tenure: 240,
    startDate: '2023-06-01',
    endDate: '2043-06-01',
    nextDueDate: '2024-02-01',
    remainingAmount: 4800000,
    status: 'active'
  }
];

export function InsuranceTracker() {
  const [insurances, setInsurances] = useState<Insurance[]>(mockInsurances);
  const [emis, setEMIs] = useState<EMI[]>(mockEMIs);
  const [activeTab, setActiveTab] = useState<'insurance' | 'emi'>('insurance');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddInsurance = (newInsurance: Omit<Insurance, 'id'>) => {
    const insurance: Insurance = {
      ...newInsurance,
      id: Date.now().toString()
    };
    
    setInsurances([insurance, ...insurances]);
    setShowAddForm(false);
    
    // Logic to save to Firestore would go here
    
    toast({
      title: "Insurance policy added",
      description: `${newInsurance.policyName} added successfully`,
    });
  };

  const handleAddEMI = (newEMI: Omit<EMI, 'id'>) => {
    const emi: EMI = {
      ...newEMI,
      id: Date.now().toString()
    };
    
    setEMIs([emi, ...emis]);
    setShowAddForm(false);
    
    // Logic to save to Firestore would go here
    
    toast({
      title: "EMI added",
      description: `${newEMI.loanType} EMI added successfully`,
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalMonthlyPremiums = insurances
    .filter(ins => ins.frequency === 'monthly')
    .reduce((sum, ins) => sum + ins.premium, 0);

  const totalMonthlyEMIs = emis
    .filter(emi => emi.status === 'active')
    .reduce((sum, emi) => sum + emi.emiAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Insurance & EMI</h2>
          <p className="text-muted-foreground">Manage your policies and loans</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'insurance' ? 'Insurance' : 'EMI'}
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'insurance' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Insurance
        </button>
        <button
          onClick={() => setActiveTab('emi')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'emi' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EMI
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-purple text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Premiums</p>
                <p className="text-lg font-bold text-foreground">₹{totalMonthlyPremiums.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-orange text-white">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly EMIs</p>
                <p className="text-lg font-bold text-foreground">₹{totalMonthlyEMIs.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Forms */}
      {showAddForm && activeTab === 'insurance' && (
        <AddInsuranceForm 
          onSubmit={handleAddInsurance}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showAddForm && activeTab === 'emi' && (
        <AddEMIForm 
          onSubmit={handleAddEMI}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'insurance' ? (
        <InsuranceList insurances={insurances} />
      ) : (
        <EMIList emis={emis} />
      )}
    </div>
  );
}

function InsuranceList({ insurances }: { insurances: Insurance[] }) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'life': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'health': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'vehicle': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'home': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || colors['other'];
  };

  return (
    <div className="space-y-3">
      {insurances.map((insurance, index) => (
        <motion.div
          key={insurance.id}
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
                      {insurance.policyName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(insurance.type)}`}>
                      {insurance.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Premium:</span>
                      <span className="font-medium text-foreground">₹{insurance.premium.toLocaleString()}/{insurance.frequency}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Coverage:</span>
                      <span className="font-medium text-foreground">₹{insurance.coverageAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className="font-medium text-foreground">{new Date(insurance.nextDueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{insurance.insurer} • {insurance.policyNumber}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EMIList({ emis }: { emis: EMI[] }) {
  return (
    <div className="space-y-3">
      {emis.map((emi, index) => (
        <motion.div
          key={emi.id}
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
                      {emi.loanType}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {emi.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">EMI:</span>
                      <span className="font-medium text-foreground">₹{emi.emiAmount.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="font-medium text-foreground">₹{emi.remainingAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-medium text-foreground">{emi.interestRate}% p.a.</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className="font-medium text-foreground">{new Date(emi.nextDueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{emi.lender}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AddInsuranceForm({ onSubmit, onCancel }: {
  onSubmit: (insurance: Omit<Insurance, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    policyName: '',
    policyNumber: '',
    insurer: '',
    type: 'life' as Insurance['type'],
    premium: '',
    frequency: 'yearly' as Insurance['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    coverageAmount: '',
    nextDueDate: '',
    status: 'active' as Insurance['status'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.policyName || !formData.premium || !formData.coverageAmount) {
      return;
    }

    onSubmit({
      policyName: formData.policyName,
      policyNumber: formData.policyNumber,
      insurer: formData.insurer,
      type: formData.type,
      premium: parseFloat(formData.premium),
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate,
      coverageAmount: parseFloat(formData.coverageAmount),
      nextDueDate: formData.nextDueDate,
      status: formData.status,
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
          <CardTitle>Add Insurance Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Policy Name *
                </label>
                <Input
                  value={formData.policyName}
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                  placeholder="Term Life Insurance"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Policy Number
                </label>
                <Input
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="LI001234567"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Insurance['type'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="life">Life</option>
                  <option value="health">Health</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Premium (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                  placeholder="25000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Coverage Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.coverageAmount}
                  onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                  placeholder="5000000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Insurance['frequency'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Insurance
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

function AddEMIForm({ onSubmit, onCancel }: {
  onSubmit: (emi: Omit<EMI, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    loanType: '',
    lender: '',
    principalAmount: '',
    emiAmount: '',
    interestRate: '',
    tenure: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nextDueDate: '',
    remainingAmount: '',
    status: 'active' as EMI['status'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loanType || !formData.emiAmount || !formData.principalAmount) {
      return;
    }

    onSubmit({
      loanType: formData.loanType,
      lender: formData.lender,
      principalAmount: parseFloat(formData.principalAmount),
      emiAmount: parseFloat(formData.emiAmount),
      interestRate: parseFloat(formData.interestRate),
      tenure: parseInt(formData.tenure),
      startDate: formData.startDate,
      endDate: formData.endDate,
      nextDueDate: formData.nextDueDate,
      remainingAmount: parseFloat(formData.remainingAmount || formData.principalAmount),
      status: formData.status,
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
          <CardTitle>Add EMI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Loan Type *
                </label>
                <Input
                  value={formData.loanType}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                  placeholder="Home Loan"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Lender *
                </label>
                <Input
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder="SBI"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Principal Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.principalAmount}
                  onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                  placeholder="5000000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  EMI Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                  placeholder="45000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Interest Rate (% p.a.)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="8.5"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tenure (months)
                </label>
                <Input
                  type="number"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  placeholder="240"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add EMI
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
