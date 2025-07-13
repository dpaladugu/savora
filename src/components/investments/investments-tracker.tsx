
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, DollarSign, Edit, Trash2, Loader2, Search, CalendarDays, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/db";
import { InvestmentData } from "@/types/jsonPreload";
import { InvestmentService } from '@/services/InvestmentService'; // Import the new service
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from '@/contexts/auth-context';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent, // Renamed to avoid conflict
} from "@/components/ui/alert-dialog";


// Form data type
export type InvestmentFormData = Partial<Omit<InvestmentData, 'invested_value' | 'current_value' | 'quantity' | 'created_at' | 'updated_at'>> & {
  invested_value?: string;
  current_value?: string;
  quantity?: string;
};

const INVESTMENT_TYPES = ['Mutual Fund', 'PPF', 'EPF', 'NPS', 'Gold', 'Stock', 'Other'] as const;
// Potential categories, can be expanded or fetched dynamically in future
const INVESTMENT_CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'Retirement', 'Commodity', 'Real Estate', 'Other'] as const;


export function InvestmentsTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentData | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth(); // Get user

  const liveInvestments = useLiveQuery(
    async () => {
      if (!user?.uid) return [];

      const userInvestments = await InvestmentService.getInvestments(user.uid);

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userInvestments.filter(inv =>
          inv.fund_name.toLowerCase().includes(lowerSearchTerm) ||
          inv.investment_type.toLowerCase().includes(lowerSearchTerm) ||
          (inv.category && inv.category.toLowerCase().includes(lowerSearchTerm))
        );
      }
      // The service doesn't sort, so we sort here.
      return userInvestments.sort((a, b) => (b.purchaseDate && a.purchaseDate) ? parseISO(b.purchaseDate).getTime() - parseISO(a.purchaseDate).getTime() : 0);
    },
    [searchTerm, user?.uid],
    []
  );
  const investments = liveInvestments || [];

  const handleAddNew = () => {
    setEditingInvestment(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (investment: InvestmentData) => {
    setEditingInvestment(investment);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (investment: InvestmentData) => {
    setInvestmentToDelete(investment);
  };

  const handleDeleteExecute = async () => {
    if (!investmentToDelete || !investmentToDelete.id) return;
    try {
      await InvestmentService.deleteInvestment(investmentToDelete.id);
      toast({ title: "Success", description: `Investment "${investmentToDelete.fund_name}" deleted.` });
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not delete investment.", variant: "destructive" });
    } finally {
      setInvestmentToDelete(null);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.invested_value || 0), 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + (inv.current_value || inv.invested_value || 0), 0);
  const totalGains = totalCurrent - totalInvested;

  if (liveInvestments === undefined) {
     return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-lg text-muted-foreground">Loading investments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Investment Portfolio</h1>
          <p className="text-muted-foreground">Track and manage your diverse investments.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invested</p>
                <p className="text-lg font-bold text-foreground">₹{totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold text-foreground">₹{totalCurrent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalGains >= 0 ? 'bg-gradient-green' : 'bg-gradient-orange'} text-white`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gains/Loss</p>
                <p className={`text-lg font-bold ${totalGains >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totalGains.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="mt-6 mb-4">
          <Input
            placeholder="Search investments by name, type, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            icon={<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
          />
      </div>


      {/* Investment List / Empty State */}
      {investments.length === 0 && !showAddForm ? (
         <Card className="border-dashed">
            <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Investments Tracked Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
                Start building your portfolio by adding your first investment.
            </p>
            <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" /> Add First Investment
            </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {investments.map((investment) => (
            <motion.div
              key={investment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-lg text-primary">{investment.fund_name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {investment.investment_type} {investment.category ? `(${investment.category})` : ''}
                      </p>
                       {investment.purchaseDate && isValidDate(parseISO(investment.purchaseDate)) && (
                         <p className="text-xs text-muted-foreground">Purchased: {format(parseISO(investment.purchaseDate), 'PPP')}</p>
                       )}

                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Invested: </span>
                            <span className="font-medium">₹{investment.invested_value?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {investment.current_value !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Current: </span>
                            <span className="font-medium">₹{investment.current_value?.toLocaleString()}</span>
                          </div>
                        )}
                         {investment.quantity !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Quantity: </span>
                            <span className="font-medium">{investment.quantity}</span>
                          </div>
                        )}
                      </div>
                       {investment.notes && <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-dashed">Note: {investment.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end ml-4 space-y-1 shrink-0">
                        {investment.current_value !== undefined && investment.invested_value !== undefined && (
                            <>
                            <p className={`text-md font-semibold ${
                                investment.current_value >= investment.invested_value ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {investment.current_value >= investment.invested_value ? '+' : ''}
                                ₹{(investment.current_value - investment.invested_value).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}
                            </p>
                            {investment.invested_value > 0 &&
                                <p className={`text-xs ${investment.current_value >= investment.invested_value ? 'text-green-500' : 'text-red-500'}`}>
                                {(((investment.current_value - investment.invested_value) / investment.invested_value) * 100).toFixed(1)}%
                                </p>
                            }
                            </>
                        )}
                        <div className="flex gap-1 mt-2">
                             <Button size="icon" variant="ghost" onClick={() => handleOpenEditForm(investment)} className="h-7 w-7" aria-label={`Edit ${investment.fund_name}`}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openDeleteConfirm(investment)} className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${investment.fund_name}`}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      {showAddForm && (
        <AddInvestmentForm
          initialData={editingInvestment}
          onClose={() => { setShowAddForm(false); setEditingInvestment(null); }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {investmentToDelete && (
        <AlertDialog open={!!investmentToDelete} onOpenChange={() => setInvestmentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-destructive"/>Are you sure?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the investment: "{investmentToDelete.fund_name}".
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

// --- AddInvestmentForm Sub-Component ---
interface AddInvestmentFormProps {
  initialData?: InvestmentData | null;
  onClose: () => void;
}

function AddInvestmentForm({ initialData, onClose }: AddInvestmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user for the form
  const [formData, setFormData] = useState<InvestmentFormData>(() => {
    const defaults: InvestmentFormData = {
      fund_name: '', investment_type: 'Mutual Fund', category: '', purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      invested_value: '', current_value: '', quantity: '', notes: '', user_id: user?.uid, // Initialize with user?.uid
    };
    if (initialData) {
      return {
        ...initialData,
        invested_value: initialData.invested_value?.toString() || '',
        current_value: initialData.current_value?.toString() || '',
        quantity: initialData.quantity?.toString() || '',
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : defaults.purchaseDate,
        user_id: initialData.user_id || user?.uid, // Ensure user_id is set
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<InvestmentFormData>>({}); // Added for error display

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        invested_value: initialData.invested_value?.toString() || '',
        current_value: initialData.current_value?.toString() || '',
        quantity: initialData.quantity?.toString() || '',
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        user_id: initialData.user_id || user?.uid, // Prioritize initialData, then current user
      });
    } else {
      // For new form, ensure user_id is from current auth context
      setFormData({
        fund_name: '', investment_type: 'Mutual Fund', category: '', purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        invested_value: '', current_value: '', quantity: '', notes: '', user_id: user?.uid,
      });
    }
    setFormErrors({}); // Clear errors when data changes
  }, [initialData, user]); // Rerun if initialData or user changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelectChange = (name: keyof InvestmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (date?: Date) => {
    setFormData(prev => ({ ...prev, purchaseDate: date ? format(date, 'yyyy-MM-dd') : undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentErrors: Partial<InvestmentFormData> = {};
    if (!formData.fund_name?.trim()) currentErrors.fund_name = "Investment Name is required.";
    if (!formData.investment_type?.trim()) currentErrors.investment_type = "Investment Type is required.";

    const investedVal = formData.invested_value ? parseFloat(formData.invested_value) : undefined;
    const currentVal = formData.current_value ? parseFloat(formData.current_value) : undefined;
    const quantityVal = formData.quantity ? parseFloat(formData.quantity) : undefined;

    if (formData.invested_value && (isNaN(investedVal!) || investedVal! < 0)) currentErrors.invested_value = "Invested Amount must be a valid number.";
    if (formData.current_value && (isNaN(currentVal!) || currentVal! < 0)) currentErrors.current_value = "Current Value must be a valid number.";
    if (formData.quantity && (isNaN(quantityVal!) || quantityVal! < 0)) currentErrors.quantity = "Quantity must be a valid number.";

    setFormErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) {
      toast({ title: "Validation Error", description: "Please correct highlighted fields.", variant: "destructive" });
      return;
    }

    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const recordData: Omit<InvestmentData, 'id' | 'created_at' | 'updated_at'> = {
      fund_name: formData.fund_name!,
      investment_type: formData.investment_type!,
      category: formData.category || '',
      invested_value: investedVal,
      current_value: currentVal,
      purchaseDate: formData.purchaseDate,
      quantity: quantityVal,
      notes: formData.notes || '',
      user_id: user.uid, // Use authenticated user's ID
    };

    try {
      if (formData.id) {
        await InvestmentService.updateInvestment(formData.id, recordData);
        toast({ title: "Success", description: "Investment updated." });
      } else {
        await InvestmentService.addInvestment(recordData as Omit<InvestmentData, 'id'>);
        toast({ title: "Success", description: "Investment added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save investment:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save investment details.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add'} Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="fund_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Investment Name/Fund *</Label>
            <Input
              id="fund_name"
              name="fund_name"
              value={formData.fund_name || ''}
              onChange={handleChange}
              required
              className={formErrors.fund_name ? 'border-red-500' : ''}
              aria-invalid={!!formErrors.fund_name}
              aria-describedby={formErrors.fund_name ? "fund_name-error" : undefined}
            />
            {formErrors.fund_name && <p id="fund_name-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.fund_name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="investment_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</Label>
              <Select
                name="investment_type"
                value={formData.investment_type || ''}
                onValueChange={v => handleSelectChange('investment_type', v as string)}
              >
                <SelectTrigger
                  className={formErrors.investment_type ? 'border-red-500' : ''}
                  aria-invalid={!!formErrors.investment_type}
                  aria-describedby={formErrors.investment_type ? "investment_type-error" : undefined}
                >
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>{INVESTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {formErrors.investment_type && <p id="investment_type-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.investment_type}</p>}
            </div>
            <div>
              <Label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</Label>
               <Select name="category" value={formData.category || ''} onValueChange={v => handleSelectChange('category', v as string)}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{INVESTMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {/* Category is not mandatory, so no error display shown here, but could be added if needed */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invested_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Invested (₹)</Label>
              <Input
                id="invested_value"
                name="invested_value"
                type="number"
                step="0.01"
                value={formData.invested_value || ''}
                onChange={handleChange}
                className={formErrors.invested_value ? 'border-red-500' : ''}
                aria-invalid={!!formErrors.invested_value}
                aria-describedby={formErrors.invested_value ? "invested_value-error" : undefined}
              />
              {formErrors.invested_value && <p id="invested_value-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.invested_value}</p>}
            </div>
            <div>
              <Label htmlFor="current_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Value (₹)</Label>
              <Input
                id="current_value"
                name="current_value"
                type="number"
                step="0.01"
                value={formData.current_value || ''}
                onChange={handleChange}
                className={formErrors.current_value ? 'border-red-500' : ''}
                aria-invalid={!!formErrors.current_value}
                aria-describedby={formErrors.current_value ? "current_value-error" : undefined}
              />
              {formErrors.current_value && <p id="current_value-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.current_value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.purchaseDate ? 'border-red-500' : ''}`}
                      aria-invalid={!!formErrors.purchaseDate}
                      aria-describedby={formErrors.purchaseDate ? "purchaseDate-error" : undefined}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {(formData.purchaseDate && isValidDate(parseISO(formData.purchaseDate))) ? format(parseISO(formData.purchaseDate), 'PPP') : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.purchaseDate ? parseISO(formData.purchaseDate) : undefined} onSelect={handleDateChange} /></PopoverContent>
                </Popover>
                {formErrors.purchaseDate && <p id="purchaseDate-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.purchaseDate}</p>}
            </div>
             <div>
              <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity/Units</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="any"
                value={formData.quantity || ''}
                onChange={handleChange}
                className={formErrors.quantity ? 'border-red-500' : ''}
                aria-invalid={!!formErrors.quantity}
                aria-describedby={formErrors.quantity ? "quantity-error" : undefined}
              />
              {formErrors.quantity && <p id="quantity-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{formErrors.quantity}</p>}
              </div>
          </div>

          <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Any additional notes..."/>
          </div>

          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Investment' : 'Save Investment')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
