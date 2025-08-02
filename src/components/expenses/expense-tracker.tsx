
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Filter, Download, Upload, Trash2, Edit, Search } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from "@/db";
import type { Expense } from "@/db";
import { ExpenseService } from "@/services/ExpenseService";
import { EnhancedAddExpenseForm } from "./EnhancedAddExpenseForm";

export function ExpenseTracker() {
  const [selectedTab, setSelectedTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Get expenses from database
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []);

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      
      const matchesPaymentMethod = !selectedPaymentMethod || 
                                  (expense.payment_method && expense.payment_method === selectedPaymentMethod);

      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date;
        if (dateRange.from && dateRange.to) {
          matchesDateRange = isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to });
        } else if (dateRange.from) {
          matchesDateRange = expenseDate >= dateRange.from;
        } else if (dateRange.to) {
          matchesDateRange = expenseDate <= dateRange.to;
        }
      }

      return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateRange;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, dateRange]);

  // Get unique categories and payment methods
  const categories = useMemo(() => {
    if (!expenses) return [];
    return [...new Set(expenses.map(e => e.category))].sort();
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    if (!expenses) return [];
    return [...new Set(expenses.map(e => e.payment_method).filter(Boolean))].sort();
  }, [expenses]);

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

  const handleDeleteExpense = async (id: string) => {
    try {
      setIsLoading(true);
      await ExpenseService.deleteExpense(id);
      toast.success("Expense deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete expense: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExpense = (id: string) => {
    setEditingExpenseId(id);
    setSelectedTab("add");
  };

  const handleExpenseAdded = () => {
    setSelectedTab("list");
    setEditingExpenseId(undefined);
  };

  const handleExpenseUpdated = () => {
    setSelectedTab("list");
    setEditingExpenseId(undefined);
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy');
  };

  const formatTags = (tags: string[] | undefined) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expense Tracker</h2>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Expense List</TabsTrigger>
          <TabsTrigger value="add">
            {editingExpenseId ? "Edit Expense" : "Add Expense"}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "dd MMM") : "From"} - {dateRange.to ? format(dateRange.to, "dd MMM") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range || {})}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{filteredExpenses.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Average Amount</p>
                  <p className="text-2xl font-bold">₹{averageAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length > 0 ? (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{expense.description}</p>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDate(expense.date)}</span>
                          {expense.payment_method && <span>{expense.payment_method}</span>}
                        </div>
                        {formatTags(expense.tags).length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {formatTags(expense.tags).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₹{expense.amount.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExpense(expense.id)}
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No expenses found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <EnhancedAddExpenseForm 
            expenseId={editingExpenseId}
            onExpenseAdded={handleExpenseAdded}
            onExpenseUpdated={handleExpenseUpdated}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
