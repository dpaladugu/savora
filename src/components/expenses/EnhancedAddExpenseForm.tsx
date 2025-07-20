import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, X, Receipt, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/services/auth-service";

import { ExpenseService } from "@/services/ExpenseService";
import { TagService } from "@/services/TagService";
import { AccountService } from "@/services/AccountService";
import { VehicleService } from "@/services/VehicleService";

interface ExpenseFormProps {
  expenseId?: string;
  onExpenseAdded?: () => void;
  onExpenseUpdated?: () => void;
}

export function EnhancedAddExpenseForm({ expenseId, onExpenseAdded, onExpenseUpdated }: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [location, setLocation] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [tags, setTags] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewExpense, setIsNewExpense] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchTags = async () => {
      if (!user?.uid) return;
      try {
        const fetchedTags = await TagService.getTags(user.uid);
        setTags(fetchedTags);
      } catch (error: any) {
        toast.error(`Failed to fetch tags: ${error.message}`);
      }
    };

    const fetchAccounts = async () => {
      if (!user?.uid) return;
      try {
        const fetchedAccounts = await AccountService.getAccounts(user.uid);
        setAccounts(fetchedAccounts);
      } catch (error: any) {
        toast.error(`Failed to fetch accounts: ${error.message}`);
      }
    };

    const fetchVehicles = async () => {
      if (!user?.uid) return;
      try {
        const fetchedVehicles = await VehicleService.getVehicles(user.uid);
        setVehicles(fetchedVehicles);
      } catch (error: any) {
        toast.error(`Failed to fetch vehicles: ${error.message}`);
      }
    };

    fetchTags();
    fetchAccounts();
    fetchVehicles();
  }, [user?.uid]);

  useEffect(() => {
    const fetchExpense = async () => {
      if (!expenseId || !user?.uid) return;
      try {
        const expense = await ExpenseService.getExpenseById(user.uid, expenseId);
        if (expense) {
          setIsNewExpense(false);
          setDescription(expense.description || "");
          setAmount(expense.amount ? expense.amount.toString() : "");
          setDate(expense.date ? new Date(expense.date) : undefined);
          setSelectedTag(expense.tagId || "");
          setSelectedAccount(expense.accountId || "");
          setSelectedVehicle(expense.vehicleId || "");
          setLocation(expense.location || "");
        }
      } catch (error: any) {
        toast.error(`Failed to fetch expense: ${error.message}`);
      }
    };

    if (expenseId) {
      fetchExpense();
    } else {
      setIsNewExpense(true);
      setDescription("");
      setAmount("");
      setDate(new Date());
      setSelectedTag("");
      setSelectedAccount("");
      setSelectedVehicle("");
      setLocation("");
    }
  }, [expenseId, user?.uid]);

  const handleAddTag = async () => {
    if (!user?.uid) {
      toast.error("User not authenticated.");
      return;
    }

    if (!newTagName.trim()) {
      toast.error("Tag name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const newTag = await TagService.addTag(user.uid, {
        name: newTagName,
        description: newTagDescription,
      });
      setTags([...tags, newTag]);
      setNewTagName("");
      setNewTagDescription("");
      setIsAddingTag(false);
      toast.success("Tag added successfully!");
    } catch (error: any) {
      toast.error(`Failed to add tag: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!user?.uid) {
      toast.error("User not authenticated.");
      return;
    }

    if (!amount.trim() || isNaN(Number(amount))) {
      toast.error("Amount must be a valid number.");
      return;
    }

    setIsSaving(true);
    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        date: date ? date.toISOString() : new Date().toISOString(),
        tagId: selectedTag || null,
        accountId: selectedAccount || null,
        vehicleId: selectedVehicle || null,
        location,
      };

      if (isNewExpense && !expenseId) {
        await ExpenseService.addExpense(user.uid, expenseData);
        toast.success("Expense added successfully!");
        if (onExpenseAdded) {
          onExpenseAdded();
        }
      } else {
        if (expenseId) {
          await ExpenseService.updateExpense(user.uid, expenseId, expenseData);
          toast.success("Expense updated successfully!");
          if (onExpenseUpdated) {
            onExpenseUpdated();
          }
        } else {
          toast.error("Expense ID is missing for update operation.");
        }
      }
    } catch (error: any) {
      toast.error(`Failed to save expense: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!user?.uid || !expenseId) {
      toast.error("User not authenticated or Expense ID missing.");
      return;
    }

    setIsSaving(true);
    try {
      await ExpenseService.deleteExpense(user.uid, expenseId);
      toast.success("Expense deleted successfully!");
      if (onExpenseUpdated) {
        onExpenseUpdated();
      }
    } catch (error: any) {
      toast.error(`Failed to delete expense: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNewExpense ? "Add Expense" : "Edit Expense"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Brief description of the expense"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tag">Tag</Label>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {sortedTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setIsAddingTag(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account">Account</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Where was this expense incurred?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <Button onClick={handleSaveExpense} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Expense"}
        </Button>
        {!isNewExpense && expenseId ? (
          <Button variant="destructive" onClick={handleDeleteExpense} disabled={isSaving}>
            {isSaving ? "Deleting..." : "Delete Expense"}
          </Button>
        ) : null}
      </CardContent>
      {isAddingTag && (
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  placeholder="Tag Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tagDescription">Tag Description</Label>
                <Textarea
                  id="tagDescription"
                  placeholder="Tag Description"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsAddingTag(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTag} disabled={isSaving}>
                {isSaving ? "Adding..." : "Add Tag"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
