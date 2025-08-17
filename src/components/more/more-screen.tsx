
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  FileText,
  Repeat,
  Car,
  Shield,
  Heart,
  Coins,
  Users2,
  Target,
  TrendingUp,
  Brain,
  Settings,
  Sparkles,
  Home,
  Banknote,
  AlertCircle
} from 'lucide-react';

interface MoreModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'available' | 'coming-soon' | 'beta';
  category: 'financial' | 'tracking' | 'analysis' | 'settings';
  priority: 'high' | 'medium' | 'low';
}

const modules: MoreModule[] = [
  // Financial Management
  {
    id: 'credit-cards',
    title: 'Credit Cards',
    description: 'Manage credit cards, track balances, and monitor due dates',
    icon: CreditCard,
    status: 'available',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'loans',
    title: 'Loans & EMIs',
    description: 'Track loan balances, EMI schedules, and prepayment scenarios',
    icon: Banknote,
    status: 'coming-soon',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Monitor recurring subscriptions and manage cancellations',
    icon: Repeat,
    status: 'beta',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Build and track your emergency fund progress',
    icon: AlertCircle,
    status: 'available',
    category: 'financial',
    priority: 'high'
  },

  // Asset Tracking
  {
    id: 'vehicles',
    title: 'Vehicles',
    description: 'Track vehicle expenses, maintenance, and fuel costs',
    icon: Car,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'insurance',
    title: 'Insurance',
    description: 'Manage insurance policies, premiums, and claims',
    icon: Shield,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'enhanced-rentals',
    title: 'Rental Properties',
    description: 'Manage rental income, expenses, and tenant information',
    icon: Home,
    status: 'beta',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'gold',
    title: 'Gold Investments',
    description: 'Track gold investments and price movements',
    icon: Coins,
    status: 'beta',
    category: 'tracking',
    priority: 'low'
  },

  // Analysis & Intelligence
  {
    id: 'cfa-recommendations',
    title: 'CFA Recommendations',
    description: 'Professional-grade financial analysis and recommendations',
    icon: Brain,
    status: 'available',
    category: 'analysis',
    priority: 'high'
  },
  {
    id: 'recommendations',
    title: 'Smart Recommendations',
    description: 'AI-powered financial insights and suggestions',
    icon: Sparkles,
    status: 'beta',
    category: 'analysis',
    priority: 'medium'
  },
  {
    id: 'smart-goals',
    title: 'Smart Goals',
    description: 'Auto-generated financial goals based on your profile',
    icon: Target,
    status: 'beta',
    category: 'analysis',
    priority: 'medium'
  },

  // Personal & Family
  {
    id: 'health-tracker',
    title: 'Health Tracker',
    description: 'Track medical expenses and health-related costs',
    icon: Heart,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'low'
  },
  {
    id: 'family-banking',
    title: 'Family Banking',
    description: 'Manage shared accounts and family financial planning',
    icon: Users2,
    status: 'coming-soon',
    category: 'financial',
    priority: 'low'
  },

  // Settings & Configuration
  {
    id: 'settings',
    title: 'Settings',
    description: 'App preferences, security, and account settings',
    icon: Settings,
    status: 'available',
    category: 'settings',
    priority: 'high'
  }
];

export function MoreScreen() {
  const handleModuleClick = (moduleId: string, status: string) => {
    if (status === 'coming-soon') {
      return; // Do nothing for coming soon modules
    }
    
    // Navigate to module
    window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: moduleId }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-500">Available</Badge>;
      case 'beta':
        return <Badge variant="secondary">Beta</Badge>;
      case 'coming-soon':
        return <Badge variant="outline">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'coming-soon' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md';
  };

  const categorizedModules = {
    financial: modules.filter(m => m.category === 'financial'),
    tracking: modules.filter(m => m.category === 'tracking'),
    analysis: modules.filter(m => m.category === 'analysis'),
    settings: modules.filter(m => m.category === 'settings')
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">More Features</h1>
        <p className="text-muted-foreground">
          Discover powerful tools to manage your complete financial life
        </p>
      </div>

      {/* Financial Management */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Financial Management
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorizedModules.financial.map((module) => (
            <Card 
              key={module.id}
              className={`transition-all duration-200 ${getStatusStyle(module.status)}`}
              onClick={() => handleModuleClick(module.id, module.status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <module.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  {getStatusBadge(module.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Asset Tracking */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Asset & Expense Tracking
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorizedModules.tracking.map((module) => (
            <Card 
              key={module.id}
              className={`transition-all duration-200 ${getStatusStyle(module.status)}`}
              onClick={() => handleModuleClick(module.id, module.status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <module.icon className="h-5 w-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  {getStatusBadge(module.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analysis & Intelligence */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Analysis & Intelligence
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorizedModules.analysis.map((module) => (
            <Card 
              key={module.id}
              className={`transition-all duration-200 ${getStatusStyle(module.status)}`}
              onClick={() => handleModuleClick(module.id, module.status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <module.icon className="h-5 w-5 text-purple-500" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  {getStatusBadge(module.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorizedModules.settings.map((module) => (
            <Card 
              key={module.id}
              className={`transition-all duration-200 ${getStatusStyle(module.status)}`}
              onClick={() => handleModuleClick(module.id, module.status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                      <module.icon className="h-5 w-5 text-gray-500" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  {getStatusBadge(module.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
