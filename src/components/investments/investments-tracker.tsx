
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
import { InvestmentService } from '@/services/InvestmentService';
import { AddInvestmentForm } from '@/components/forms/add-investment-form';
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { formatCurrency } from "@/lib/format-utils";
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
export type InvestmentFormData = Partial<Omit<InvestmentData, 'invested_value' | 'current_value' | 'quantity' | 'created_at' | 'updated_at'>> & {
  invested_value?: string;
  current_value?: string;
  quantity?: string;
};

const INVESTMENT_TYPES = ['Mutual Fund', 'PPF', 'EPF', 'NPS', 'Gold', 'Stock', 'Other'] as const;
const INVESTMENT_CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'Retirement', 'Commodity', 'Real Estate', 'Other'] as const;

export function InvestmentsTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentData | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const liveInvestments = useLiveQuery(
    async () => {
      const userInvestments = await InvestmentService.getInvestments(user?.uid || '');

      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return userInvestments.filter(inv =>
          inv.fund_name.toLowerCase().includes(lowerSearchTerm) ||
          inv.investment_type.toLowerCase().includes(lowerSearchTerm) ||
          (inv.category && inv.category.toLowerCase().includes(lowerSearchTerm))
        );
      }
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
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalInvested)}</p>
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
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalCurrent)}</p>
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
                  {formatCurrency(totalGains)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="mt-6 mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search investments by name, type, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
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
                            <span className="font-medium">{formatCurrency(investment.invested_value)}</span>
                        </div>
                        {investment.current_value !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Current: </span>
                            <span className="font-medium">{formatCurrency(investment.current_value)}</span>
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
                                {formatCurrency(investment.current_value - investment.invested_value)}
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
        <div className="my-4">
          <AddInvestmentForm
            initialData={editingInvestment}
            onSuccess={() => { setShowAddForm(false); setEditingInvestment(null); }}
            onCancel={() => { setShowAddForm(false); setEditingInvestment(null); }}
          />
        </div>
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
