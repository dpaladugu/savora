
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Play, Pause } from "lucide-react";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { RecurringTransactionService } from "@/services/RecurringTransactionService";
import { useAuth } from "@/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import type { RecurringTransactionRecord } from "@/types/recurring-transaction";

interface RecurringTransactionsPageProps {
  onTabChange?: (tab: string) => void;
}

export function RecurringTransactionsPage({ onTabChange }: RecurringTransactionsPageProps) {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransactionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadRecurringTransactions();
    }
  }, [user]);

  const loadRecurringTransactions = async () => {
    setIsLoading(true);
    try {
      const transactions = await RecurringTransactionService.getAll(user!.uid);
      setRecurringTransactions(transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recurring transactions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: RecurringTransactionRecord) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleUpdate = async (transactionId: string, updates: Partial<RecurringTransactionRecord>) => {
    setIsLoading(true);
    try {
      await RecurringTransactionService.update(transactionId, updates);
      toast({
        title: "Success",
        description: "Recurring transaction updated successfully.",
      });
      loadRecurringTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recurring transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowForm(false);
      setEditingTransaction(null);
    }
  };

  const handleDelete = async (transactionId: string) => {
    setIsLoading(true);
    try {
      await RecurringTransactionService.delete(transactionId);
      toast({
        title: "Success",
        description: "Recurring transaction deleted successfully.",
      });
      loadRecurringTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recurring transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (transaction: RecurringTransactionRecord) => {
    setIsLoading(true);
    try {
      await RecurringTransactionService.update(transaction.id, {
        is_active: !transaction.is_active,
      });
      toast({
        title: "Success",
        description: `Recurring transaction ${transaction.is_active ? "paused" : "resumed"} successfully.`,
      });
      loadRecurringTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle recurring transaction status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<RecurringTransactionRecord, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      if (editingTransaction) {
        // Update existing transaction
        await RecurringTransactionService.update(editingTransaction.id, data);
        toast({
          title: "Success",
          description: "Recurring transaction updated successfully.",
        });
      } else {
        // Create new transaction
        await RecurringTransactionService.create({ ...data, user_id: user!.uid });
        toast({
          title: "Success",
          description: "Recurring transaction created successfully.",
        });
      }
      loadRecurringTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recurring transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowForm(false);
      setEditingTransaction(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Transaction
            </Button>
          </div>

          {showForm ? (
            <RecurringTransactionForm
              isOpen={showForm}
              onClose={handleCancel}
              onSubmit={handleSubmit}
              initialData={editingTransaction}
            />
          ) : (
            <div>
              {isLoading ? (
                <p>Loading recurring transactions...</p>
              ) : (
                <div className="grid gap-4">
                  {recurringTransactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{transaction.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            Amount: ${transaction.amount}, Category: {transaction.category}, Frequency: {transaction.frequency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Next Due: {transaction.next_date}
                          </p>
                          {transaction.account && (
                            <p className="text-sm text-muted-foreground">
                              Account: {transaction.account}
                            </p>
                          )}
                          <Badge variant={transaction.is_active ? "default" : "secondary"}>
                            {transaction.is_active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleActive(transaction)}
                            disabled={isLoading}
                          >
                            {transaction.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {recurringTransactions.length === 0 && (
                    <p>No recurring transactions found.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
