import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Plus, CreditCard, Search, Trash2, Edit, AlertCircle, Loader2, CalendarDays, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db, DexieCreditCardRecord } from "@/db";
import { CreditCardService } from "@/services/CreditCardService";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO, isValid } from 'date-fns';
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type CreditCardFormData = Partial<Omit<DexieCreditCardRecord, 'limit' | 'currentBalance' | 'billCycleDay' | 'created_at' | 'updated_at'>> & {
  limit: string;
  currentBalance: string;
  billCycleDay: string;
};

const isValidDate = (date: Date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

export function CreditCardManager() {
  const [showAddFormDialog, setShowAddFormDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<DexieCreditCardRecord | null>(null);
  const [cardToDelete, setCardToDelete] = useState<DexieCreditCardRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const cards = useLiveQuery(
    async () => {
      if (!user?.uid) return [];

      const userCards = await CreditCardService.getCreditCards(user.uid);
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userCards.filter(card =>
          card.name.toLowerCase().includes(lowerSearchTerm) ||
          card.issuer.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return userCards;
    },
    [searchTerm, user?.uid],
    []
  );

  const handleAddNew = () => {
    setEditingCard(null);
    setShowAddFormDialog(true);
  };

  const handleEdit = (card: DexieCreditCardRecord) => {
    setEditingCard(card);
    setShowAddFormDialog(true);
  };

  const openDeleteConfirm = (card: DexieCreditCardRecord) => {
    setCardToDelete(card);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete || !cardToDelete.id) return;
    try {
      await CreditCardService.deleteCreditCard(cardToDelete.id);
      toast({
        title: "Card Removed",
        description: `Credit card "${cardToDelete.name}" has been removed.`,
      });
    } catch (error) {
      console.error("Error deleting credit card:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Could not remove credit card.",
        variant: "destructive",
      });
    } finally {
        setCardToDelete(null);
    }
  };

  const totalLimit = cards?.reduce((sum, card) => sum + card.limit, 0) || 0;
  const totalUsed = cards?.reduce((sum, card) => sum + card.currentBalance, 0) || 0;
  const utilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  if (cards === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-lg text-muted-foreground">Loading credit cards...</p>
      </div>
    );
  }

  const filteredCards = cards || [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Credit Card Manager</h1>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Card
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLimit)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilization > 70 ? 'text-red-600' : utilization > 30 ? 'text-orange-500' : 'text-green-600'}`}>
                {utilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
                Total Balance: {formatCurrency(totalUsed)}
            </p>
          </CardContent>
        </Card>
      </div>

      {showAddFormDialog && (
        <AddCreditCardForm 
          onClose={() => setShowAddFormDialog(false)}
          initialData={editingCard}
        />
      )}

      <div className="mt-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search credit cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredCards.map((card, index) => (
          <motion.div
            key={card.id}
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
                        {card.name}
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {card.issuer}
                      </span>
                      {!card.autoDebit && (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Used:</span>
                        <span className="font-medium text-foreground">{formatCurrency(card.currentBalance)}</span>
                        <span className="text-muted-foreground">of</span>
                        <span className="font-medium text-foreground">{formatCurrency(card.limit)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Due:</span>
                        <span className="font-medium text-foreground">
                          {card.dueDate && isValid(parseISO(card.dueDate)) ? format(parseISO(card.dueDate), 'PPP') : 'N/A'}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Bill Cycle: {card.billCycleDay}th</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (card.currentBalance / card.limit) * 100 > 70 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((card.currentBalance / card.limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(card)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openDeleteConfirm(card)}
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

      {/* Empty State */}
      {cards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Credit Cards</h3>
          <p className="text-muted-foreground mb-4">Add your first credit card</p>
          <Button onClick={() => setShowAddFormDialog(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Card
          </Button>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{cardToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AddCreditCardFormProps {
  initialData?: DexieCreditCardRecord | null;
  onClose: () => void;
}

function AddCreditCardForm({ initialData, onClose }: AddCreditCardFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreditCardFormData>(() => {
    const defaults: CreditCardFormData = {
      name: '', limit: '', issuer: '', billCycleDay: '15', autoDebit: true,
      currentBalance: '0', dueDate: format(new Date(), 'yyyy-MM-dd'),
      last4Digits: '', user_id: user?.uid,
    };
    if (initialData) {
      return {
        ...initialData,
        limit: initialData.limit.toString(),
        currentBalance: initialData.currentBalance.toString(),
        billCycleDay: initialData.billCycleDay.toString(),
        dueDate: initialData.dueDate ? format(parseISO(initialData.dueDate), 'yyyy-MM-dd') : defaults.dueDate,
        user_id: initialData.user_id || user?.uid,
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreditCardFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        limit: initialData.limit.toString(),
        currentBalance: initialData.currentBalance.toString(),
        billCycleDay: initialData.billCycleDay.toString(),
        dueDate: initialData.dueDate ? format(parseISO(initialData.dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        user_id: initialData.user_id || user?.uid,
      });
    } else {
      setFormData({
        name: '', limit: '', issuer: '', billCycleDay: '15', autoDebit: true,
        currentBalance: '0', dueDate: format(new Date(), 'yyyy-MM-dd'),
        last4Digits: '', user_id: user?.uid,
      });
    }
    setFormErrors({});
  }, [initialData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(formErrors[name as keyof CreditCardFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
     setFormData(prev => ({ ...prev, autoDebit: !!checked }));
  };

  const handleDateChange = (date?: Date) => {
    setFormData(prev => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : undefined }));
    if(formErrors.dueDate) setFormErrors(prev => ({...prev, [dueDate]: undefined}));
  };

  const validateCurrentForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreditCardFormData, string>> = {};
    if (!formData.name?.trim()) newErrors.name = "Card Name is required.";
    if (!formData.issuer?.trim()) newErrors.issuer = "Issuer is required.";
    if (!formData.limit?.trim() || isNaN(parseFloat(formData.limit)) || parseFloat(formData.limit) <=0) newErrors.limit = "Valid Credit Limit is required.";
    if (!formData.billCycleDay?.trim() || isNaN(parseInt(formData.billCycleDay)) || parseInt(formData.billCycleDay) < 1 || parseInt(formData.billCycleDay) > 31) newErrors.billCycleDay = "Bill Cycle Day (1-31) is required.";
    if (!formData.dueDate || !isValidDate(parseISO(formData.dueDate))) newErrors.dueDate = "Valid Due Date is required.";
    if (formData.currentBalance && isNaN(parseFloat(formData.currentBalance))) newErrors.currentBalance = "Current Balance must be a valid number.";
     if (formData.last4Digits && (isNaN(parseInt(formData.last4Digits)) || formData.last4Digits.length !== 4)) newErrors.last4Digits = "Last 4 digits must be a 4-digit number.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validateCurrentForm()) {
      toast({ title: "Validation Error", description: "Please correct the errors in the form.", variant: "destructive"});
      return;
    }
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save a credit card.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const cardRecord: Omit<DexieCreditCardRecord, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name!,
      issuer: formData.issuer!,
      limit: parseFloat(formData.limit!),
      currentBalance: parseFloat(formData.currentBalance || '0'),
      billCycleDay: parseInt(formData.billCycleDay!, 10),
      dueDate: formData.dueDate!,
      autoDebit: formData.autoDebit || false,
      last4Digits: formData.last4Digits || '',
      user_id: user.uid,
    };

    try {
      if (formData.id) {
        await db.creditCards.update(formData.id, { ...cardRecord, updated_at: new Date() });
        toast({ title: "Success", description: `Card "${cardRecord.name}" updated.` });
      } else {
        const newId = self.crypto.randomUUID();
        await db.creditCards.add({ ...cardRecord, id: newId, created_at: new Date(), updated_at: new Date() });
        toast({ title: "Success", description: `Card "${cardRecord.name}" added.` });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save credit card:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save credit card details.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const FieldError: React.FC<{ field: keyof CreditCardFormData }> = ({ field }) =>
    formErrors[field] ? <p className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {formErrors[field]}</p> : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6" aria-describedby="add-credit-card-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{formData.id ? 'Edit' : 'Add New'} Credit Card</DialogTitle>
          <DialogDescription id="add-credit-card-description">
            {formData.id ? 'Update the details of your existing credit card.' : 'Add a new credit card to track your spending.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Nickname *</Label>
              <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required className={formErrors.name ? 'border-red-500' : ''}/>
              <FieldError field="name"/>
            </div>
            <div>
              <Label htmlFor="issuer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuer (Bank) *</Label>
              <Input id="issuer" name="issuer" value={formData.issuer || ''} onChange={handleChange} required className={formErrors.issuer ? 'border-red-500' : ''}/>
              <FieldError field="issuer"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Limit (₹) *</Label>
              <Input id="limit" name="limit" type="number" step="0.01" value={formData.limit || ''} onChange={handleChange} required className={formErrors.limit ? 'border-red-500' : ''}/>
              <FieldError field="limit"/>
            </div>
            <div>
              <Label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Outstanding Balance (₹)</Label>
              <Input id="currentBalance" name="currentBalance" type="number" step="0.01" value={formData.currentBalance || ''} onChange={handleChange} className={formErrors.currentBalance ? 'border-red-500' : ''}/>
              <FieldError field="currentBalance"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billCycleDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Cycle Day (1-31) *</Label>
              <Input id="billCycleDay" name="billCycleDay" type="number" min="1" max="31" value={formData.billCycleDay || ''} onChange={handleChange} required className={formErrors.billCycleDay ? 'border-red-500' : ''}/>
              <FieldError field="billCycleDay"/>
            </div>
            <div>
              <Label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Payment Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.dueDate ? 'border-red-500' : ''}`}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {(formData.dueDate && isValid(parseISO(formData.dueDate))) ? format(parseISO(formData.dueDate), 'PPP') : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.dueDate ? parseISO(formData.dueDate) : undefined} onSelect={handleDateChange} initialFocus /></PopoverContent>
              </Popover>
              <FieldError field="dueDate"/>
            </div>
          </div>
          <div>
            <Label htmlFor="last4Digits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last 4 Digits (Optional)</Label>
            <Input id="last4Digits" name="last4Digits" value={formData.last4Digits || ''} onChange={handleChange} maxLength={4} className={formErrors.last4Digits ? 'border-red-500' : ''}/>
            <FieldError field="last4Digits"/>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="autoDebit" checked={formData.autoDebit} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="autoDebit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300">Auto-debit enabled</Label>
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Card' : 'Save Card')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
