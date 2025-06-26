import React, { useState } from 'react'; // Import useState
import { Button } from '@/components/ui/button';
import { PlusCircle, Repeat } from 'lucide-react';
import { RecurringTransactionForm } from './recurring-transaction-form'; // Import the form

// Define a more specific type for recurring transactions based on the form data, for display
interface DisplayRecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: string; // Simplified for display
  next_occurrence_date: string; // ISO Date
  // Add other relevant fields for display
}


export function RecurringTransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null); // Replace 'any' with RecurringTransactionData from form

  // Placeholder data and functions - this would come from a service/hook
  const [recurringTransactions, setRecurringTransactions] = useState<DisplayRecurringTransaction[]>([
     // Example:
     { id: '1', description: 'Netflix', amount: 15.99, type: 'expense', category: 'Entertainment', frequency: 'Monthly', next_occurrence_date: '2024-08-01' },
     { id: '2', description: 'Salary', amount: 5000, type: 'income', category: 'Income', frequency: 'Monthly', next_occurrence_date: '2024-07-25' },
  ]);

  const handleAddNew = () => {
    setEditingTransaction(null); // Ensure it's a new form
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: DisplayRecurringTransaction) => {
    // TODO: Transform DisplayRecurringTransaction to RecurringTransactionData for the form
    // This might involve fetching the full data or having it available
    console.log("Editing transaction:", transaction);
    // setEditingTransaction(transactionToEditData);
    // setIsFormOpen(true);
  };

  const handleDelete = (transactionId: string) => {
    console.log("Deleting transaction:", transactionId);
    // TODO: Implement delete logic
    // setRecurringTransactions(prev => prev.filter(rt => rt.id !== transactionId));
  }

  const handleFormSubmit = (data: any) => { // Replace 'any' with RecurringTransactionData from form
    console.log('Form submitted:', data);
    if (editingTransaction) {
      // TODO: Implement update logic
      // setRecurringTransactions(prev => prev.map(rt => rt.id === data.id ? { ...rt, ...data, frequency: data.frequency, next_occurrence_date: data.next_occurrence_date } : rt));
    } else {
      // TODO: Implement add logic
      // const newTransaction: DisplayRecurringTransaction = { ...data, id: Date.now().toString(), next_occurrence_date: data.start_date };
      // setRecurringTransactions(prev => [...prev, newTransaction]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Recurring Transactions</h2>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Add New
        </Button>
      </div>

      {recurringTransactions.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-lg shadow-sm">
          <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" /> {/* Use Repeat from lucide-react */}
          <h3 className="text-xl font-semibold text-foreground mb-2">No Recurring Transactions Yet</h3>
          <p className="text-muted-foreground mb-4">
            Automate your income and expenses. Add a recurring transaction to get started.
          </p>
          <Button onClick={handleAddNew} size="lg" className="flex items-center gap-2 mx-auto">
            <PlusCircle className="w-5 h-5" />
            Create First Recurring Transaction
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TODO: Implement better list item component with edit/delete buttons */}
          {recurringTransactions.map(rt => (
            <div key={rt.id} className="p-4 bg-card border border-border rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{rt.description}</h3>
                <p className={`text-sm ${rt.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {rt.type === 'income' ? '+' : '-'}${rt.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Category: {rt.category}</p>
                <p className="text-xs text-muted-foreground">Frequency: {rt.frequency} - Next: {new Date(rt.next_occurrence_date).toLocaleDateString()}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(rt)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(rt.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <RecurringTransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTransaction}
      />
    </div>
  );
}
