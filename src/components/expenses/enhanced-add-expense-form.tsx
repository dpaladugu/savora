
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

interface ExpenseCategory {
  value: string;
  label: string;
}

interface ExpenseLocation {
  value: string;
  label: string;
}

interface ExpenseTag {
  value: string;
  label: string;
}

interface ExtendedExpense {
  id?: string;
  amount: number;
  description: string;
  category: string;
  location?: string;
  tags?: string[];
  date: string;
}

interface EnhancedAddExpenseFormProps {
  categories?: ExpenseCategory[];
  locations?: ExpenseLocation[];
  tags?: ExpenseTag[];
  expense?: ExtendedExpense;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  onExpenseAdded?: () => void;
  onExpenseUpdated?: () => void;
}

export function EnhancedAddExpenseForm({ 
  categories = [], 
  locations = [], 
  tags = [], 
  expense,
  onSubmit, 
  onCancel,
  onExpenseAdded,
  onExpenseUpdated
}: EnhancedAddExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Initialize form with expense data if editing
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setCategory(expense.category);
      setLocation(expense.location || "");
      setSelectedTags(expense.tags || []);
      setDate(expense.date ? new Date(expense.date) : new Date());
    }
  }, [expense]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
  };

  const handleTagToggle = (tagValue: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tagValue)
        ? prevTags.filter((tag) => tag !== tagValue)
        : [...prevTags, tagValue]
    );
  };

  const handleSubmit = () => {
    if (!amount || !description || !category || !date) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const expenseData = {
      amount: parseFloat(amount),
      description,
      category,
      location,
      tags: selectedTags,
      date: date.toISOString(),
    };

    if (onSubmit) {
      onSubmit(expenseData);
    }

    if (expense && onExpenseUpdated) {
      onExpenseUpdated();
    } else if (onExpenseAdded) {
      onExpenseAdded();
    }

    toast.success(expense ? "Expense updated successfully!" : "Expense added successfully!");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{expense ? "Edit Expense" : "Add New Expense"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            type="number"
            id="amount"
            placeholder="Enter amount"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter description"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select onValueChange={handleCategoryChange} value={category}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Select onValueChange={handleLocationChange} value={location}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag.value}
                variant={selectedTags.includes(tag.value) ? "secondary" : "outline"}
                onClick={() => handleTagToggle(tag.value)}
                className="cursor-pointer"
              >
                {tag.label}
              </Badge>
            ))}
          </div>
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
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {expense ? "Update Expense" : "Add Expense"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
