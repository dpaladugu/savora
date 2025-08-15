import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MoreScreenProps {
  onModuleSelect: (moduleId: string) => void;
}

export function MoreScreen({ onModuleSelect }: MoreScreenProps) {
  const modules = [
    {
      id: 'emergency-fund',
      title: 'Emergency Fund',
      description: 'Calculate and track your emergency fund savings',
      icon: '⛑️',
      category: 'Financial Planning'
    },
    {
      id: 'rentals',
      title: 'Rental Manager',
      description: 'Manage your rental properties and track income',
      icon: '🏠',
      category: 'Real Estate'
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      description: 'Get personalized financial recommendations',
      icon: '💡',
      category: 'Insights'
    },
    {
      id: 'cashflow',
      title: 'Cash Flow',
      description: 'Visualize your income and expenses',
      icon: '📊',
      category: 'Analytics'
    },
    {
      id: 'telegram',
      title: 'Telegram Bot',
      description: 'Connect to Telegram for instant updates',
      icon: '🤖',
      category: 'Integrations'
    },
    {
      id: 'credit-cards',
      title: 'Credit Cards',
      description: 'Manage your credit cards and track spending',
      icon: '💳',
      category: 'Credit Management'
    },
    {
      id: 'credit-card-statements',
      title: 'Credit Card Statements',
      description: 'Upload and analyze your credit card statements',
      icon: '🧾',
      category: 'Credit Management'
    },
    {
      id: 'recurring-transactions',
      title: 'Recurring Transactions',
      description: 'Manage and track your recurring transactions',
      icon: '🔄',
      category: 'Transaction Management'
    },
    {
      id: 'gold',
      title: 'Gold Tracker',
      description: 'Track your gold investments and current market value',
      icon: '🥇',
      category: 'Investments'
    },
    {
      id: 'loans',
      title: 'Loan Manager',
      description: 'Manage loans, EMIs and track repayment progress',
      icon: '💰',
      category: 'Debt Management'
    },
    {
      id: 'insurance',
      title: 'Insurance Tracker',
      description: 'Track insurance policies and renewal dates',
      icon: '🛡️',
      category: 'Protection'
    },
    {
      id: 'vehicles',
      title: 'Vehicle Manager',
      description: 'Manage vehicles and track document renewals',
      icon: '🚗',
      category: 'Assets'
    },
  ];

  const groupedModules = modules.reduce((acc: { [key: string]: any[] }, module) => {
    (acc[module.category] = acc[module.category] || []).push(module);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">More</h1>
        <Link to="/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {Object.entries(groupedModules).map(([category, modules]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">{module.icon}</span>
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <Button variant="link" className="mt-4" onClick={() => onModuleSelect(module.id)}>
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
