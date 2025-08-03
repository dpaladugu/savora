
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Target, DollarSign } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PrivacyMask } from '@/components/auth/PrivacyMask';

interface DashboardMetric {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const mockMetrics: DashboardMetric[] = [
  {
    title: 'Total Balance',
    value: '₹1,25,000',
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    title: 'Monthly Expenses',
    value: '₹45,000',
    icon: CreditCard,
    color: 'text-red-600'
  },
  {
    title: 'Goals Progress',
    value: '65%',
    icon: Target,
    color: 'text-blue-600'
  }
];

export function ProtectedDashboard() {
  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <IconComponent className={`w-4 h-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <PrivacyMask value={metric.value} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Grocery Shopping</p>
                  <p className="text-sm text-muted-foreground">Food & Dining</p>
                </div>
                <div className="text-red-600 font-medium">
                  <PrivacyMask value="-₹2,500" />
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Salary Credit</p>
                  <p className="text-sm text-muted-foreground">Income</p>
                </div>
                <div className="text-green-600 font-medium">
                  <PrivacyMask value="+₹75,000" />
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Electricity Bill</p>
                  <p className="text-sm text-muted-foreground">Utilities</p>
                </div>
                <div className="text-red-600 font-medium">
                  <PrivacyMask value="-₹3,200" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
