import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit2, Trash2, DollarSign, Repeat, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/db";
import { IncomeSourceData } from "@/types/jsonPreload"; // Using the updated type
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
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

// Form Data Type
type IncomeSourceFormData = Partial<Omit<IncomeSourceData, 'defaultAmount' | 'created_at' | 'updated_at'>> & {
  defaultAmount?: string;
};

const FREQUENCY_OPTIONS = ['monthly', 'yearly', 'weekly', 'one-time', 'variable'] as const;


export function IncomeSourceManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSourceData | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<IncomeSourceData | null>(null);
  const { toast } = useToast();

  const incomeSources = useLiveQuery(
    () => db.incomeSources.orderBy('name').toArray(),
    [], // dependencies
    []  // initial value
  );

  const handleAddNew = () => {
    setEditingSource(null);
    setShowForm(true);
  };

  const handleEdit = (source: IncomeSourceData) => {
    setEditingSource(source);
    setShowForm(true);
  };

  const openDeleteConfirm = (source: IncomeSourceData) => {
    setSourceToDelete(source);
  };

  const handleDeleteExecute = async () => {
    if (!sourceToDelete || !sourceToDelete.id) return;
    try {
      await db.incomeSources.delete(sourceToDelete.id);
      toast({ title: "Success", description: `Income source "${sourceToDelete.name}" deleted.` });
    } catch (error) {
      console.error("Error deleting income source:", error);
      toast({ title: "Error", description: "Could not delete income source.", variant: "destructive" });
    } finally {
      setSourceToDelete(null);
    }
  };

  if (incomeSources === undefined) {
    return <div className="p-4">Loading income sources...</div>; // Basic loading
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Income Sources</h1>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Income Source
        </Button>
      </div>

      {showForm && (
        <AddEditIncomeSourceForm
          initialData={editingSource}
          onClose={() => { setShowForm(false); setEditingSource(null); }}
        />
      )}

      {incomeSources.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <DollarSign aria-hidden="true" className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Income Sources Defined</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add your common income sources like Salary, Freelance Projects, Rental Income, etc.
            </p>
            <Button onClick={handleAddNew}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add First Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {incomeSources.map(source => (
            <Card key={source.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  {source.name}
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full capitalize">{source.frequency}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {source.defaultAmount && <p className="text-xl font-semibold text-green-600">₹{source.defaultAmount.toLocaleString()}</p>}
                {source.account && <p className="text-sm text-muted-foreground">Account: {source.account}</p>}
                 <div className="flex justify-end space-x-2 pt-2 border-t mt-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(source)} className="h-8 w-8" aria-label={`Edit ${source.name}`}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(source)} className="h-8 w-8 hover:text-destructive" aria-label={`Delete ${source.name}`}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {sourceToDelete && (
        <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-5 h-5 mr-2 text-destructive"/>Are you sure?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the income source: "{sourceToDelete.name}".
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

// --- AddEditIncomeSourceForm Sub-Component ---
interface AddEditIncomeSourceFormProps {
  initialData?: IncomeSourceData | null;
  onClose: () => void;
}

function AddEditIncomeSourceForm({ initialData, onClose }: AddEditIncomeSourceFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<IncomeSourceFormData>(() => {
    const defaults: IncomeSourceFormData = { name: '', defaultAmount: '', frequency: 'monthly', account: '', user_id: 'default_user' };
    if (initialData) {
      return {
        ...initialData,
        defaultAmount: initialData.defaultAmount?.toString() || '',
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof IncomeSourceFormData, string>>>({});


  useEffect(() => {
    const defaults: IncomeSourceFormData = { name: '', defaultAmount: '', frequency: 'monthly', account: '', user_id: 'default_user' };
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        defaultAmount: initialData.defaultAmount?.toString() || '',
      });
    } else {
      setFormData(defaults);
    }
    setFormErrors({}); // Clear errors when form opens or initialData changes
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof IncomeSourceFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof IncomeSourceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof IncomeSourceFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateCurrentForm = (): boolean => {
    const newErrors: Partial<Record<keyof IncomeSourceFormData, string>> = {};
    if (!formData.name?.trim()) newErrors.name = "Source Name is required.";
    if (formData.defaultAmount) {
        const amountNum = parseFloat(formData.defaultAmount);
        if (isNaN(amountNum) || amountNum < 0) newErrors.defaultAmount = "Default Amount must be a valid non-negative number.";
    }
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

    const defaultAmountNum = formData.defaultAmount ? parseFloat(formData.defaultAmount) : undefined;

    const recordData: Omit<IncomeSourceData, 'id' | 'created_at' | 'updated_at' | 'source'> & {source?: string} = { // Omit 'source' as we use 'name'
      name: formData.name!,
      defaultAmount: defaultAmountNum,
      frequency: formData.frequency! as IncomeSourceData['frequency'],
      account: formData.account || '',
      user_id: formData.user_id || 'default_user',
    };
    // The original JsonIncomeCashFlow had a 'source' field. If IncomeSourceData is to maintain that
    // for some reason while 'name' is the display name, we might need to set it:
    // recordData.source = formData.name;

    try {
      if (formData.id) {
        await db.incomeSources.update(formData.id, { ...recordData, updated_at: new Date() });
        toast({ title: "Success", description: "Income source updated." });
      } else {
        const newId = self.crypto.randomUUID();
        await db.incomeSources.add({ ...recordData, id: newId, created_at: new Date(), updated_at: new Date() } as IncomeSourceData);
        toast({ title: "Success", description: "Income source added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save income source:", error);
      toast({ title: "Database Error", description: "Could not save income source.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit' : 'Add'} Income Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required
                   className={formErrors.name ? 'border-red-500' : ''}
                   aria-required="true"
                   aria-invalid={!!formErrors.name}
                   aria-describedby={formErrors.name ? "sourceName-error" : undefined}
            />
            {formErrors.name && <p id="sourceName-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Amount (₹)</Label>
              <Input id="defaultAmount" name="defaultAmount" type="number" step="0.01" value={formData.defaultAmount || ''} onChange={handleChange}
                     className={formErrors.defaultAmount ? 'border-red-500' : ''}
                     aria-invalid={!!formErrors.defaultAmount}
                     aria-describedby={formErrors.defaultAmount ? "defaultAmount-error" : undefined}
              />
              {formErrors.defaultAmount && <p id="defaultAmount-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.defaultAmount}</p>}
            </div>
            <div>
              <Label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency *</Label>
              <Select name="frequency" value={formData.frequency || 'monthly'} onValueChange={v => handleSelectChange('frequency', v as string)}>
                <SelectTrigger className={formErrors.frequency ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!formErrors.frequency}
                               aria-describedby={formErrors.frequency ? "frequency-error" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.frequency && <p id="frequency-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{formErrors.frequency}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Associated Account (Optional)</Label>
            <Input id="account" name="account" value={formData.account || ''} onChange={handleChange} placeholder="e.g., Salary Account" />
          </div>
          <DialogFooter className="pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Source' : 'Save Source')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
