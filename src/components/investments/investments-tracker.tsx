
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { InvestmentData } from '@/types/jsonPreload';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function InvestmentsTracker() {
  // Use the correct table name from the database
  const investments = useLiveQuery(() => db.txns.where('type').equals('investment').toArray()) || [];
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'returns'>('name');
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate total portfolio value
  const totalValue = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0); // Simplified for now
  const totalReturns = 0; // Simplified calculation
  const returnsPercentage = 0; // Simplified calculation

  // Sort investments
  const sortedInvestments = [...investments].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.amount || 0) - (a.amount || 0);
      case 'returns':
        return 0; // Simplified for now
      default:
        return (a.description || '').localeCompare(b.description || '');
    }
  });

  const handleAddInvestment = () => {
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalReturns)}
              </div>
              {totalReturns >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-sm ${totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnsPercentage.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Sort by Name
          </Button>
          <Button
            variant={sortBy === 'value' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('value')}
          >
            Sort by Value
          </Button>
          <Button
            variant={sortBy === 'returns' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('returns')}
          >
            Sort by Returns
          </Button>
        </div>
        
        <Button onClick={handleAddInvestment} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Investment</span>
        </Button>
      </div>

      {/* Investment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedInvestments.map((investment) => {
          const returns = 0; // Simplified calculation
          const returnsPercentage = 0; // Simplified calculation
          
          return (
            <Card key={investment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{investment.description}</CardTitle>
                  <Badge variant="secondary">
                    {investment.category || 'Investment'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(investment.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="font-medium">{investment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Returns</span>
                  <div className="flex items-center space-x-1">
                    <span className={`font-medium ${returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(returns)}
                    </span>
                    <span className={`text-xs ${returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({returnsPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {investments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No investments found. Add your first investment to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
