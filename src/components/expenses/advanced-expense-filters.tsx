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
import { format, isValid, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Define a more precise type for filters state and callback
export interface ExpenseFilterCriteria {
  searchTerm: string;
  category: string;
  paymentMethod: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  minAmount: string;
  maxAmount: string;
  type: string; // 'All', 'expense', 'income'
}

interface AdvancedExpenseFiltersProps {
  onFiltersChange: (filters: ExpenseFilterCriteria) => void;
  totalResults: number;
  availableCategories: string[]; // To be passed from parent
  availablePaymentMethods: string[]; // To be passed from parent
}

export function AdvancedExpenseFilters({
  onFiltersChange,
  totalResults,
  availableCategories,
  availablePaymentMethods
}: AdvancedExpenseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilterCriteria>({
    searchTerm: "",
    category: "All",
    paymentMethod: "All",
    dateFrom: null,
    dateTo: null,
    minAmount: "",
    maxAmount: "",
    type: "All", // Default to show all types; can be 'expense' if page is expense-specific
  });

  // Ensure "All" is an option
  const categories = ["All", ...availableCategories.filter(c => c !== "All")];
  const paymentMethods = ["All", ...availablePaymentMethods.filter(pm => pm !== "All")];


  const updateFilters = (newFilters: Partial<ExpenseFilterCriteria>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const resetFilters = () => {
    const resetState: ExpenseFilterCriteria = {
      searchTerm: "",
      category: "All",
      paymentMethod: "All",
      dateFrom: null,
      dateTo: null,
      minAmount: "",
      maxAmount: "",
      type: "All",
    };
    setFilters(resetState);
    onFiltersChange(resetState);
    setIsExpanded(false); // Optionally collapse on reset
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
              <Filter aria-hidden="true" className="w-5 h-5" />
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
              {totalResults} result(s)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? "Less" : "More"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search-expenses">Search</Label>
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search-expenses"
                placeholder="Search descriptions, categories..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category-filter">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilters({ category: value })}
            >
              <SelectTrigger id="category-filter">
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

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-4 border-t"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => updateFilters({ type: value })}
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Types</SelectItem>
                      <SelectItem value="expense">Expenses Only</SelectItem>
                      <SelectItem value="income">Income Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentMethod-filter">Payment Method</Label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(value) => updateFilters({ paymentMethod: value })}
                  >
                    <SelectTrigger id="paymentMethod-filter">
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minAmount-filter">Min Amount</Label>
                    <Input
                      id="minAmount-filter"
                      type="number"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) => updateFilters({ minAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount-filter">Max Amount</Label>
                    <Input
                      id="maxAmount-filter"
                      type="number"
                      placeholder="e.g. 1000"
                      value={filters.maxAmount}
                      onChange={(e) => updateFilters({ maxAmount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom-filter">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="dateFrom-filter" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filters.dateFrom} onSelect={(date) => updateFilters({ dateFrom: date || null })} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="dateTo-filter">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="dateTo-filter" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filters.dateTo} onSelect={(date) => updateFilters({ dateTo: date || null })} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  disabled={activeFiltersCount === 0}
                  className="flex items-center gap-2 text-sm"
                >
                  <RotateCcw aria-hidden="true" className="w-4 h-4" />
                  Reset All Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
