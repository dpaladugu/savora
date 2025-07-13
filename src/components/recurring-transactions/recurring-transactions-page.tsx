import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Repeat, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { RecurringTransactionForm } from './recurring-transaction-form';
import { db, RecurringTransactionRecord } from '@/db';
import { RecurringTransactionService } from '@/services/RecurringTransactionService'; // Import the service
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { format, parseISO, isValid } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Using RecurringTransactionRecord directly for display or can create a specific Display type
// For simplicity, we'll use fields from RecurringTransactionRecord directly in JSX

export function RecurringTransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransactionRecord | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<RecurringTransactionRecord | null>(null);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user

  const recurringTransactions = useLiveQuery(
    () => {
      if (!user?.uid) return [];
      return RecurringTransactionService.getRecurringTransactions(user.uid);
    },
    [user?.uid]
  );

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: RecurringTransactionRecord) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const openDeleteConfirm = (transaction: RecurringTransactionRecord) => {
    setTransactionToDelete(transaction);
  };

  const handleDelete = async () => {
    if (!transactionToDelete || !transactionToDelete.id) return;
    try {
      await RecurringTransactionService.deleteRecurringTransaction(transactionToDelete.id);
      toast({
        title: "Success",
        description: `Recurring transaction "${transactionToDelete.description}" deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete transaction.",
        variant: "destructive",
      });
    } finally {
      setTransactionToDelete(null); // Close confirmation dialog
    }
  };

  const getFrequencyText = (rt: RecurringTransactionRecord): string => {
    let text = `Every ${rt.interval > 1 ? rt.interval + ' ' : ''}${rt.frequency.replace(/ly$/, '')}${rt.interval > 1 ? 's' : ''}`;
    if (rt.frequency === 'weekly' && rt.day_of_week !== undefined) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        text += ` on ${days[rt.day_of_week]}`;
    } else if (rt.frequency === 'monthly' && rt.day_of_month) {
        text += ` on day ${rt.day_of_month}`;
    } else if (rt.frequency === 'yearly' && rt.start_date) {
        text += ` on ${format(parseISO(rt.start_date), 'MMMM do')}`;
    }
    return text;
  };


  if (recurringTransactions === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Repeat aria-hidden="true" className="w-12 h-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-lg text-muted-foreground">Loading recurring transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Recurring Transactions</h1>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Add New Recurring
        </Button>
      </div>

      {recurringTransactions.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg shadow-sm">
          <Repeat aria-hidden="true" className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-3">No Recurring Transactions Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Automate your income and expenses. Add a recurring transaction to get started.
          </p>
          <Button onClick={handleAddNew} size="lg" className="flex items-center gap-2 mx-auto">
            <PlusCircle className="w-5 h-5" />
            Create First Recurring Transaction
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recurringTransactions.map(rt => (
            <div key={rt.id} className={`p-5 bg-card border rounded-lg shadow-md flex flex-col justify-between transition-all hover:shadow-lg ${!rt.is_active ? 'opacity-60 bg-muted/50' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-foreground break-all">{rt.description}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        rt.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {rt.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p className={`text-2xl font-bold mb-1 ${rt.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {rt.type === 'income' ? '+' : '-'}${rt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground capitalize">Category: {rt.category}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {getFrequencyText(rt)}
                </p>
                {rt.next_occurrence_date && isValid(parseISO(rt.next_occurrence_date)) && (
                     <p className="text-sm text-muted-foreground">Next: {format(parseISO(rt.next_occurrence_date), 'PPP')}</p>
                )}
                {rt.end_date && isValid(parseISO(rt.end_date)) && (
                     <p className="text-sm text-muted-foreground">Ends: {format(parseISO(rt.end_date), 'PPP')}</p>
                )}
                 {rt.payment_method && <p className="text-xs text-muted-foreground pt-1">Via: {rt.payment_method}</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex justify-end space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(rt)} className="text-blue-600 hover:text-blue-700" aria-label={`Edit recurring transaction: ${rt.description}`}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(rt)} className="text-red-600 hover:text-red-700" aria-label={`Delete recurring transaction: ${rt.description}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <RecurringTransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingTransaction}
      />
      {transactionToDelete && (
        <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center"><AlertTriangle aria-hidden="true" className="w-5 h-5 mr-2 text-destructive"/>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the recurring transaction for
                "{transactionToDelete.description}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
