
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db, Investment } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function InvestmentsTracker() {
  // Use the correct table name from the database
  const investments = useLiveQuery(() => db.investments.toArray()) || [];
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'returns'>('name');
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate total portfolio value
  const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.investedValue || 0), 0);
  const totalReturns = totalValue - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  // Sort investments
  const sortedInvestments = [...investments].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.currentValue || 0) - (a.currentValue || 0);
      case 'returns':
        const aReturns = (a.currentValue || 0) - (a.investedValue || 0);
        const bReturns = (b.currentValue || 0) - (b.investedValue || 0);
        return bReturns - aReturns;
      default:
        return (a.name || '').localeCompare(b.name || '');
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
          const returns = (investment.currentValue || 0) - (investment.investedValue || 0);
          const returnsPercentage = (investment.investedValue || 0) > 0 ? (returns / (investment.investedValue || 0)) * 100 : 0;
          
          return (
            <Card key={investment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{investment.name}</CardTitle>
                  <Badge variant="secondary">
                    {investment.type || 'Investment'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-medium">{formatCurrency(investment.currentValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invested</span>
                  <span className="font-medium">{formatCurrency(investment.investedValue || 0)}</span>
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
