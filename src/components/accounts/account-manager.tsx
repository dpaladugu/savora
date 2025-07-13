
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, CreditCard, Wallet, Search, Trash2, Edit, Loader2, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { db, DexieAccountRecord } from "@/db";
import { AccountService } from "@/services/AccountService"; // Import the new service
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/contexts/auth-context";
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

// Form data type
type AccountFormData = Partial<Omit<DexieAccountRecord, 'balance' | 'created_at' | 'updated_at'>> & {
  balance?: string; // For form input
};

const ACCOUNT_TYPES = ['Bank', 'Wallet', 'Cash', 'Other'] as const;
type AccountType = typeof ACCOUNT_TYPES[number];


export function AccountManager() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DexieAccountRecord | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<DexieAccountRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // const userIdToQuery = user?.uid || 'default_user'; // Old approach

  const liveAccounts = useLiveQuery(
    async () => {
      if (!user?.uid) return []; // Don't query if no user_id
      let query = db.accounts.where('user_id').equals(user.uid); // Correct way to use where clause

      // The filter logic below needs to be applied carefully after initial data fetching
      // or by ensuring Dexie can handle it. Dexie's .filter() is client-side.
      // For server-side or more complex filtering, you might need multiple queries or more advanced indexing.
      // For now, let's assume searchTerm filtering happens client-side on the results.
      const allUserAccounts = await query.orderBy('name').toArray();

      if (searchTerm) {
        return allUserAccounts.filter(acc =>
          acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (acc.accountNumber && acc.accountNumber.includes(searchTerm))
        );
      }
      return allUserAccounts;
    },
    [searchTerm, user?.uid], // Depend on user.uid
    []
  );
  const accounts = liveAccounts || [];

  const handleAddNew = () => {
    setEditingAccount(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (account: DexieAccountRecord) => {
    setEditingAccount(account);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (account: DexieAccountRecord) => {
    setAccountToDelete(account);
  };

  const handleDeleteExecute = async () => {
    if (!accountToDelete || !accountToDelete.id) return;
    try {
      await AccountService.deleteAccount(accountToDelete.id);
      toast({ title: "Success", description: `Account "${accountToDelete.name}" deleted.` });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not delete account.", variant: "destructive" });
    } finally {
      setAccountToDelete(null);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  // const bankAccounts = accounts.filter(acc => acc.type === 'Bank');
  // const walletAccounts = accounts.filter(acc => acc.type === 'Wallet');

  if (liveAccounts === undefined) {
     return (
      <div className="flex justify-center items-center h-64 p-4">
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-lg text-muted-foreground">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts, wallets, and cash.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-lg font-bold text-foreground">₹{totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-lg font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Form - onSubmit needs to be defined or passed if this is the intended structure */}
      {/* Assuming handleAddAccount is a method that will call db.accounts.add/update after getting data from AddAccountForm */}
      {showAddForm && (
        <AddAccountForm // Remove onSubmit for now, as AddAccountForm will handle its own submission
          initialData={editingAccount} // Pass editingAccount here
          onClose={() => { setShowAddForm(false); setEditingAccount(null); }}
          // userId prop will be removed from AddAccountForm
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {filteredAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg text-white ${
                        account.type === 'Bank' ? 'bg-gradient-blue' : 'bg-gradient-purple'
                      }`}>
                        {account.type === 'Bank' ? 
                          <CreditCard className="w-4 h-4" /> : 
                          <Wallet className="w-4 h-4" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">
                          {account.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{account.provider}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.type === 'Bank' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {account.type}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className="font-medium text-foreground text-lg">₹{account.balance.toLocaleString()}</span>
                      </div>
                      {account.accountNumber && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium text-foreground">{account.accountNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          account.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenEditForm(account)} className="h-8 w-8 p-0" aria-label={`Edit account ${account.name}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:text-destructive"
                      onClick={() => openDeleteConfirm(account)}
                      aria-label={`Delete account ${account.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Accounts</h3>
          <p className="text-muted-foreground mb-4">Add your first account</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Account
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// --- AddAccountForm Sub-Component ---
interface AddAccountFormProps {
  initialData?: DexieAccountRecord | null;
  onClose: () => void;
  // userId prop removed
}

function AddAccountForm({ initialData, onClose }: AddAccountFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user directly in form
  const [formData, setFormData] = useState<AccountFormData>(() => {
    const defaults: AccountFormData = {
      name: '', type: 'Bank', balance: '0', accountNumber: '', provider: '', isActive: true, notes: '', user_id: user?.uid
    };
    if (initialData) {
      return {
        ...initialData,
        balance: initialData.balance?.toString() || '0',
        type: initialData.type as AccountType,
        user_id: initialData.user_id || user?.uid, // Ensure user_id is set
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        balance: initialData.balance?.toString() || '0',
        type: initialData.type as AccountType,
        user_id: initialData.user_id || user?.uid, // Prioritize initialData's user_id if present
      });
    } else {
      // For new form, set user_id from current auth context
      setFormData({
        name: '', type: 'Bank', balance: '0', accountNumber: '', provider: '', isActive: true, notes: '', user_id: user?.uid
      });
    }
    setFormErrors({});
  }, [initialData, user]); // Rerun if initialData or user changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof AccountFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };
  const handleSelectChange = (name: keyof AccountFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
     if (formErrors[name as keyof AccountFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };
   const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setFormData(prev => ({ ...prev, isActive: !!checked }));
  };

  const validateCurrentForm = (): boolean => {
    const newErrors: Partial<Record<keyof AccountFormData, string>> = {};
    if (!formData.name?.trim()) newErrors.name = "Account Name is required.";
    if (!formData.provider?.trim()) newErrors.provider = "Provider/Bank Name is required.";
    if (!formData.type) newErrors.type = "Account Type is required.";
    if (formData.balance) {
        const balNum = parseFloat(formData.balance);
        if (isNaN(balNum)) newErrors.balance = "Balance must be a valid number.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validateCurrentForm()){
      toast({ title: "Validation Error", description: "Please correct the errors in the form.", variant: "destructive"});
      return;
    }
    setIsSaving(true);

    if(!validateCurrentForm()){
      toast({ title: "Validation Error", description: "Please correct the errors in the form.", variant: "destructive"});
      return;
    }
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save an account.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const balanceNum = parseFloat(formData.balance || '0');

    const recordData: Omit<DexieAccountRecord, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name!,
      type: formData.type!,
      balance: balanceNum,
      accountNumber: formData.accountNumber || '',
      provider: formData.provider!,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      notes: formData.notes || '',
      user_id: user.uid, // Use authenticated user's ID
    };

    try {
      if (formData.id) { // Update
        // Optional: check if existing record's user_id matches current user.uid before update
        // const existingRecord = await db.accounts.get(formData.id);
        // if (existingRecord?.user_id !== user.uid) { throw new Error("Permission denied."); }
        await db.accounts.update(formData.id, { ...recordData, updated_at: new Date() });
        toast({ title: "Success", description: "Account updated." });
      } else { // Add
        await AccountService.addAccount(recordData as Omit<DexieAccountRecord, 'id'>);
        toast({ title: "Success", description: "Account added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save account:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save account.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const FieldError: React.FC<{ field: keyof AccountFormData }> = ({ field }) =>
    formErrors[field] ? <p className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon className="w-3 h-3 mr-1"/> {formErrors[field]}</p> : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add New'} Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required
                   className={formErrors.name ? 'border-red-500' : ''}/>
            <FieldError field="name"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</Label>
              <Select name="type" value={formData.type || 'Bank'} onValueChange={v => handleSelectChange('type', v as string)}>
                <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError field="type"/>
            </div>
            <div>
              <Label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider/Bank *</Label>
              <Input id="provider" name="provider" value={formData.provider || ''} onChange={handleChange} required
                     className={formErrors.provider ? 'border-red-500' : ''}/>
              <FieldError field="provider"/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance (₹)</Label>
              <Input id="balance" name="balance" type="number" step="0.01" value={formData.balance || ''} onChange={handleChange}
                     className={formErrors.balance ? 'border-red-500' : ''}/>
              <FieldError field="balance"/>
            </div>
            {formData.type === 'Bank' && (
              <div>
                <Label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} />
              </div>
            )}
          </div>
           <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Optional notes..."/>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300">
              Account is active
            </Label>
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Account' : 'Save Account')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
