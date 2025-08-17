
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CreditCard, Target, TrendingUp } from 'lucide-react';
import { NavigationTab } from '@/types/common';

interface QuickActionsProps {
  onTabChange: (tab: NavigationTab) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function QuickActions({ onTabChange, onMoreNavigation }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => onTabChange('expenses')}
          >
            <Plus className="h-5 w-5" />
            Add Expense
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => onTabChange('credit-cards')}
          >
            <CreditCard className="h-5 w-5" />
            Credit Cards
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => onTabChange('goals')}
          >
            <Target className="h-5 w-5" />
            Manage Goals
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => onTabChange('investments')}
          >
            <TrendingUp className="h-5 w-5" />
            Investments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
