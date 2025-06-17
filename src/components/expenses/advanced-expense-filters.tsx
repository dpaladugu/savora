
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, CalendarIcon, X, Search, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ExpenseManager } from "@/services/expense-manager";

interface ExpenseFilter {
  searchTerm: string;
  category: string;
  paymentMethod: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  minAmount: string;
  maxAmount: string;
  type: string;
}

interface AdvancedExpenseFiltersProps {
  onFiltersChange: (filters: ExpenseFilter) => void;
  totalResults: number;
}

export function AdvancedExpenseFilters({ onFiltersChange, totalResults }: AdvancedExpenseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilter>({
    searchTerm: "",
    category: "All",
    paymentMethod: "All",
    dateFrom: null,
    dateTo: null,
    minAmount: "",
    maxAmount: "",
    type: "All",
  });

  const categories = ["All", ...ExpenseManager.getPopularCategories()];
  const paymentMethods = ["All", ...ExpenseManager.getPaymentMethods()];

  const updateFilters = (newFilters: Partial<ExpenseFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const resetFilters = () => {
    const resetFilters: ExpenseFilter = {
      searchTerm: "",
      category: "All",
      paymentMethod: "All",
      dateFrom: null,
      dateTo: null,
      minAmount: "",
      maxAmount: "",
      type: "All",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category !== "All") count++;
    if (filters.paymentMethod !== "All") count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.type !== "All") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalResults} results
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Less" : "More"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Always visible: Search and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Search descriptions..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilters({ category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Anim initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Advanced filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => updateFilters({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(value) => updateFilters({ paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Min Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) => updateFilters({ minAmount: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Max Amount</Label>
                    <Input
                      type="number"
                      placeholder="1000.00"
                      value={filters.maxAmount}
                      onChange={(e) => updateFilters({ maxAmount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom || undefined}
                        onSelect={(date) => updateFilters({ dateFrom: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo || undefined}
                        onSelect={(date) => updateFilters({ dateTo: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reset button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={activeFiltersCount === 0}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
