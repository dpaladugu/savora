
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Coins, Search, Trash2, Edit, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, DexieGoldInvestmentRecord } from "@/db";
import { GoldInvestmentService } from "@/services/GoldInvestmentService";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
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

const GOLD_PURITY_OPTIONS = ['999', '995', '916', '750', 'other'] as const;
type GoldPurity = typeof GOLD_PURITY_OPTIONS[number];

const GOLD_FORM_OPTIONS = ['coins', 'bars', 'jewelry', 'etf', 'other'] as const;
type GoldForm = typeof GOLD_FORM_OPTIONS[number];

export type GoldInvestmentFormData = Partial<Omit<DexieGoldInvestmentRecord, 'weight' | 'purchasePrice' | 'currentPrice' | 'created_at' | 'updated_at'>> & {
  weight: string;
  purchasePrice: string;
  currentPrice?: string;
  purity: GoldPurity;
  form: GoldForm;
};

export function GoldTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<DexieGoldInvestmentRecord | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<DexieGoldInvestmentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const liveInvestments = useLiveQuery(
    async () => {
      if (!user?.uid) return [];
      const userInvestments = await GoldInvestmentService.getGoldInvestments(user.uid);

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userInvestments.filter(inv =>
          inv.form.toLowerCase().includes(lowerSearchTerm) ||
          inv.storageLocation.toLowerCase().includes(lowerSearchTerm) ||
          (inv.vendor && inv.vendor.toLowerCase().includes(lowerSearchTerm)) ||
          (inv.note && inv.note.toLowerCase().includes(lowerSearchTerm))
        );
      }
      return userInvestments.sort((a, b) => parseISO(b.purchaseDate).getTime() - parseISO(a.purchaseDate).getTime());
    },
    [searchTerm, user?.uid],
    []
  );

  const investments = liveInvestments || [];

  const handleAddNew = () => {
    setEditingInvestment(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (investment: DexieGoldInvestmentRecord) => {
    setEditingInvestment(investment);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (investment: DexieGoldInvestmentRecord) => {
    setInvestmentToDelete(investment);
  };

  const handleDeleteInvestmentExecute = async () => {
    if (!investmentToDelete || !investmentToDelete.id) return;
    try {
      await GoldInvestmentService.deleteGoldInvestment(investmentToDelete.id);
      toast({
        title: "Investment Deleted",
        description: `Gold investment "${investmentToDelete.weight}g ${investmentToDelete.form}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting gold investment:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Could not delete gold investment.",
        variant: "destructive",
      });
    } finally {
        setInvestmentToDelete(null);
    }
  };

  const totalWeight = investments.reduce((sum, inv) => sum + Number(inv.weight || 0), 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + Number(inv.purchasePrice || 0), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (Number(inv.currentPrice) || Number(inv.purchasePrice) || 0), 0);
  const totalGainLoss = totalCurrentValue - totalInvestmentValue;

  const getFormColor = (formType: string) => {
    const colors: Record<string, string> = {
      'coins': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bars': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'jewelry': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'etf': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[formType] || colors['other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gold Investments</h2>
          <p className="text-muted-foreground">Track your physical gold holdings</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Gold
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-orange text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-lg font-bold text-foreground">{totalWeight}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalCurrentValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalInvestmentValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${totalGainLoss >= 0 ? 'bg-gradient-green' : 'bg-gradient-red'}`}>
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gain/Loss</p>
                <p className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <AddGoldForm 
          initialData={editingInvestment}
          onClose={() => {
            setShowAddForm(false);
            setEditingInvestment(null);
          }}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search gold investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Investment List */}
      <div className="space-y-3">
        {investments.map((investment, index) => (
          <motion.div
            key={investment.id}
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
                        {investment.weight}g Gold
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormColor(investment.form)}`}>
                        {investment.form}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {investment.purity} purity
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Purchase:</span>
                        <span className="font-medium text-foreground">{formatCurrency(investment.purchasePrice)}</span>
                        {investment.currentPrice && (
                          <>
                            <span className="text-muted-foreground">Current:</span>
                            <span className="font-medium text-foreground">{formatCurrency(investment.currentPrice)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Storage:</span>
                        <span className="font-medium text-foreground">{investment.storageLocation}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {investment.purchaseDate && isValidDate(parseISO(investment.purchaseDate)) ? format(parseISO(investment.purchaseDate), 'PPP') : 'N/A'}
                        </span>
                      </div>
                      {investment.vendor && (
                        <p className="text-xs text-muted-foreground">Vendor: {investment.vendor}</p>
                      )}
                      {investment.note && (
                        <p className="text-sm text-muted-foreground">{investment.note}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenEditForm(investment)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openDeleteConfirm(investment)}
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
      {investments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Gold Investments Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your gold portfolio</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Investment
          </Button>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      {investmentToDelete && (
        <AlertDialog open={!!investmentToDelete} onOpenChange={() => setInvestmentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-destructive"/>
                Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the gold investment: "{investmentToDelete.weight}g {investmentToDelete.form}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteInvestmentExecute} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function AddGoldForm({ initialData, onClose }: {
  initialData?: DexieGoldInvestmentRecord | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<GoldInvestmentFormData>(() => {
    const defaults: GoldInvestmentFormData = {
      weight: '', purity: '999', purchasePrice: '', currentPrice: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'Bank Transfer',
      storageLocation: '', form: 'coins', vendor: '', note: '',
    };
    if (initialData) {
      return {
        ...initialData,
        weight: initialData.weight.toString(),
        purchasePrice: initialData.purchasePrice.toString(),
        currentPrice: initialData.currentPrice?.toString() || '',
        purity: initialData.purity as GoldPurity,
        form: initialData.form as GoldForm,
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        weight: initialData.weight.toString(),
        purchasePrice: initialData.purchasePrice.toString(),
        currentPrice: initialData.currentPrice?.toString() || '',
        purity: initialData.purity as GoldPurity,
        form: initialData.form as GoldForm,
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      setFormData({
        weight: '', purity: '999', purchasePrice: '', currentPrice: '',
        purchaseDate: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'Bank Transfer',
        storageLocation: '', form: 'coins', vendor: '', note: '',
      });
    }
  }, [initialData]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, purchaseDate: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight || !formData.purchasePrice || !formData.storageLocation || !formData.paymentMethod || !formData.purchaseDate) {
      toast({ title: "Validation Error", description: "Please fill all required fields (*).", variant: "destructive" });
      return;
    }

    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to save a gold investment.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const weightNum = parseFloat(formData.weight);
    const purchasePriceNum = parseFloat(formData.purchasePrice);
    const currentPriceNum = formData.currentPrice ? parseFloat(formData.currentPrice) : undefined;

    if (isNaN(weightNum) || weightNum <= 0 || isNaN(purchasePriceNum) || purchasePriceNum <=0) {
        toast({ title: "Validation Error", description: "Weight and Purchase Price must be valid positive numbers.", variant: "destructive" });
        setIsSaving(false);
        return;
    }
    if (formData.currentPrice && (isNaN(currentPriceNum!) || currentPriceNum! < 0)) {
        toast({ title: "Validation Error", description: "Current Price must be a valid number if provided.", variant: "destructive" });
        setIsSaving(false);
        return;
    }

    const recordData: Omit<DexieGoldInvestmentRecord, 'id' | 'created_at' | 'updated_at'> = {
      weight: weightNum,
      purity: formData.purity!,
      purchasePrice: purchasePriceNum,
      currentPrice: currentPriceNum,
      purchaseDate: formData.purchaseDate!,
      paymentMethod: formData.paymentMethod!,
      storageLocation: formData.storageLocation!,
      form: formData.form!,
      vendor: formData.vendor || '',
      note: formData.note || '',
      user_id: user.uid,
    };

    try {
      if (formData.id) {
        await GoldInvestmentService.updateGoldInvestment(formData.id, recordData);
        toast({ title: "Success", description: "Gold investment updated." });
      } else {
        await GoldInvestmentService.addGoldInvestment(recordData as Omit<DexieGoldInvestmentRecord, 'id'>);
        toast({ title: "Success", description: "Gold investment added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save gold investment:", error);
      toast({ title: "Database Error", description: (error as Error).message || "Could not save gold investment.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>{initialData ? 'Edit' : 'Add'} Gold Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Weight (grams) *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purity *
                </label>
                <Select value={formData.purity} onValueChange={(v) => setFormData({ ...formData, purity: v as GoldPurity })} required>
                  <SelectTrigger className="w-full h-10 px-3 rounded-md border">
                    <SelectValue placeholder="Select purity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOLD_PURITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p === 'other' ? 'Other' : p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purchase Price (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="65000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Price (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                  placeholder="68000"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Form *
                </label>
                <Select value={formData.form} onValueChange={(v) => setFormData({ ...formData, form: v as GoldForm })} required>
                   <SelectTrigger className="w-full h-10 px-3 rounded-md border">
                    <SelectValue placeholder="Select form..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOLD_FORM_OPTIONS.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Storage Location *
                </label>
                <Input
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="Bank Locker"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Payment Method *
                </label>
                <Input
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="Bank Transfer"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purchase Date *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-10 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {(formData.purchaseDate && isValidDate(parseISO(formData.purchaseDate))) ? format(parseISO(formData.purchaseDate), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.purchaseDate ? parseISO(formData.purchaseDate) : undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Vendor
                </label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="MMTC-PAMP"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Note
              </label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving...' : (initialData ? 'Update Investment' : 'Add Investment')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
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
