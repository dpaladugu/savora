
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import type { Txn } from "@/lib/db";
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { GlobalSettingsService } from "@/services/GlobalSettingsService";

interface TransactionFilters {
  search: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

export function TransactionList() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyMask, setPrivacyMask] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    category: "all",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    loadTransactions();
    loadPrivacySettings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      const txns = await db.txns.orderBy('date').reverse().toArray();
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error loading transactions",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const settings = await GlobalSettingsService.getSettings();
      setPrivacyMask(settings.privacyMask);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(txn =>
        txn.note?.toLowerCase().includes(filters.search.toLowerCase()) ||
        txn.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        txn.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(txn => txn.category === filters.category);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(txn => txn.date >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(txn => txn.date <= new Date(filters.dateTo));
    }

    setFilteredTransactions(filtered);
  };

  const formatAmount = (amount: number): string => {
    if (privacyMask) {
      return "₹****";
    }
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(transactions.map(txn => txn.category))];
    return categories.sort();
  };

  const togglePrivacyMask = () => {
    setPrivacyMask(!privacyMask);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transactions
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePrivacyMask}
              className="flex items-center gap-2"
            >
              {privacyMask ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {privacyMask ? 'Show' : 'Hide'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-8"
              />
            </div>
            
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({...filters, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            />

            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your filters
              </div>
            ) : (
              filteredTransactions.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="font-medium">{formatAmount(txn.amount)}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {txn.category}
                      </Badge>
                    </div>
                    
                    {txn.note && (
                      <p className="text-sm text-muted-foreground">{txn.note}</p>
                    )}
                    
                    {txn.tags.length > 0 && (
                      <div className="flex gap-1">
                        {txn.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(txn.date, 'dd MMM yyyy')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
