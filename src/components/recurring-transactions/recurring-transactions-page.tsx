import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit, Repeat, CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RecurringTransactionService } from "@/services/RecurringTransactionService";
import { useAuth } from "@/services/auth-service";

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  accountId: string;
  categoryId: string;
  startDate: Date;
  endDate?: Date;
  frequency: string;
}

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [frequency, setFrequency] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchRecurringTransactions = async () => {
      try {
        const transactions = await RecurringTransactionService.getRecurringTransactions(user.uid);
        setRecurringTransactions(transactions);
      } catch (error) {
        console.error("Failed to fetch recurring transactions:", error);
        toast.error("Failed to fetch recurring transactions.");
      }
    };

    fetchRecurringTransactions();
  }, [user]);

  const handleAddTransaction = async () => {
    if (!user) return;

    try {
      if (!description || !amount || !accountId || !categoryId || !startDate || !frequency) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const newTransaction = {
        description,
        amount: Number(amount),
        accountId,
        categoryId,
        startDate,
        endDate,
        frequency,
      };

      await RecurringTransactionService.addRecurringTransaction(user.uid, newTransaction);
      setRecurringTransactions([
        ...recurringTransactions,
        {
          id: "temp_" + Date.now(), // Temporary ID
          ...newTransaction,
        },
      ]);
      closeModal();
      toast.success("Recurring transaction added successfully!");
    } catch (error) {
      console.error("Failed to add recurring transaction:", error);
      toast.error("Failed to add recurring transaction.");
    }
  };

  const handleEditTransaction = async () => {
    if (!user || !selectedTransaction) return;

    try {
      if (!description || !amount || !accountId || !categoryId || !startDate || !frequency) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const updatedTransaction = {
        id: selectedTransaction.id,
        description,
        amount: Number(amount),
        accountId,
        categoryId,
        startDate,
        endDate,
        frequency,
      };

      await RecurringTransactionService.updateRecurringTransaction(user.uid, selectedTransaction.id, updatedTransaction);
      setRecurringTransactions(
        recurringTransactions.map((transaction) =>
          transaction.id === selectedTransaction.id ? updatedTransaction : transaction
        )
      );
      closeModal();
      toast.success("Recurring transaction updated successfully!");
    } catch (error) {
      console.error("Failed to edit recurring transaction:", error);
      toast.error("Failed to edit recurring transaction.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      await RecurringTransactionService.deleteRecurringTransaction(user.uid, id);
      setRecurringTransactions(recurringTransactions.filter((transaction) => transaction.id !== id));
      toast.success("Recurring transaction deleted successfully!");
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);
      toast.error("Failed to delete recurring transaction.");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setDescription("");
    setAmount("");
    setAccountId("");
    setCategoryId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFrequency("");
  };

  const openEditModal = (transaction: RecurringTransaction) => {
    setIsEditModalOpen(true);
    setSelectedTransaction(transaction);
    setDescription(transaction.description);
    setAmount(transaction.amount);
    setAccountId(transaction.accountId);
    setCategoryId(transaction.categoryId);
    setStartDate(transaction.startDate);
    setEndDate(transaction.endDate);
    setFrequency(transaction.frequency);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTransaction(null);
    setDescription("");
    setAmount("");
    setAccountId("");
    setCategoryId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFrequency("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring Transaction
        </Button>
        <div className="mt-4">
          {recurringTransactions.length > 0 ? (
            <div className="grid gap-4">
              {recurringTransactions.map((transaction) => (
                <Card key={transaction.id} className="bg-muted">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{transaction.description}</h3>
                      <p className="text-sm text-gray-500">Amount: ${transaction.amount}</p>
                      <Badge variant="secondary">{transaction.frequency}</Badge>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(transaction)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No recurring transactions added yet.</p>
          )}
        </div>
      </CardContent>

      {/* Add Recurring Transaction Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Recurring Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setAmount(value);
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">
                Account
              </Label>
              <Select onValueChange={setAccountId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account1">Account 1</SelectItem>
                  <SelectItem value="account2">Account 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Category
              </Label>
              <Select onValueChange={setCategoryId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category1">Category 1</SelectItem>
                  <SelectItem value="category2">Category 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="right">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="right">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select onValueChange={setFrequency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddTransaction}>
              Add Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Transaction Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Recurring Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setAmount(value);
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">
                Account
              </Label>
              <Select onValueChange={setAccountId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account1">Account 1</SelectItem>
                  <SelectItem value="account2">Account 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Category
              </Label>
              <Select onValueChange={setCategoryId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category1">Category 1</SelectItem>
                  <SelectItem value="category2">Category 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="right">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="right">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select onValueChange={setFrequency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditTransaction}>
              Update Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
