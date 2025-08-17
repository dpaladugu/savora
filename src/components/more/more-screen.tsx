
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Heart, Car, Home, Coins, CreditCard, 
  TrendingUp, Users, PiggyBank, Calendar, Settings,
  Brain, Target, BarChart3, FileText
} from 'lucide-react';

const modules = [
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Track and manage your emergency savings fund',
    icon: Shield,
    color: 'bg-green-500',
    category: 'Financial Planning'
  },
  {
    id: 'cfa-recommendations',
    title: 'CFA Recommendations',
    description: 'Professional-grade portfolio analysis and recommendations',
    icon: Brain,
    color: 'bg-purple-500',
    category: 'Financial Intelligence',
    badge: 'AI'
  },
  {
    id: 'recommendations',
    title: 'Smart Recommendations',
    description: 'AI-powered financial advice and recommendations',
    icon: Target,
    color: 'bg-blue-500',
    category: 'Financial Intelligence',
    badge: 'AI'
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Track recurring subscriptions and payments',
    icon: Calendar,
    color: 'bg-orange-500',
    category: 'Expense Management'
  },
  {
    id: 'health-tracker',
    title: 'Health Tracker',
    description: 'Monitor health expenses and medical records',
    icon: Heart,
    color: 'bg-red-500',
    category: 'Health & Wellness'
  },
  {
    id: 'vehicles',
    title: 'Vehicle Manager',
    description: 'Track vehicle expenses, maintenance, and insurance',
    icon: Car,
    color: 'bg-indigo-500',
    category: 'Asset Management'
  },
  {
    id: 'insurance',
    title: 'Insurance Tracker',
    description: 'Manage all your insurance policies and claims',
    icon: Shield,
    color: 'bg-cyan-500',
    category: 'Risk Management'
  },
  {
    id: 'enhanced-rentals',
    title: 'Rental Properties',
    description: 'Complete rental property and tenant management',
    icon: Home,
    color: 'bg-emerald-500',
    category: 'Real Estate'
  },
  {
    id: 'gold',
    title: 'Gold Investments',
    description: 'Track gold purchases, sales, and current valuations',
    icon: Coins,
    color: 'bg-yellow-500',
    category: 'Investments'
  },
  {
    id: 'loans',
    title: 'Loan Manager',
    description: 'Track personal loans, EMIs, and repayment schedules',
    icon: CreditCard,
    color: 'bg-rose-500',
    category: 'Debt Management'
  },
  {
    id: 'family-dashboard',
    title: 'Family Finance',
    description: 'Comprehensive family financial overview and planning',
    icon: Users,
    color: 'bg-violet-500',
    category: 'Family Planning'
  },
  {
    id: 'family-banking',
    title: 'Family Banking',
    description: 'Manage family bank accounts and transfers',
    icon: PiggyBank,
    color: 'bg-teal-500',
    category: 'Family Planning'
  },
  {
    id: 'smart-goals',
    title: 'Smart Goals',
    description: 'AI-enhanced goal tracking with automatic recommendations',
    icon: Target,
    color: 'bg-pink-500',
    category: 'Goal Planning',
    badge: 'AI'
  },
  {
    id: 'settings',
    title: 'Advanced Settings',
    description: 'Comprehensive app settings and preferences',
    icon: Settings,
    color: 'bg-gray-500',
    category: 'Configuration'
  }
];

const categories = [
  'Financial Planning',
  'Financial Intelligence', 
  'Expense Management',
  'Asset Management',
  'Risk Management',
  'Investments',
  'Debt Management',
  'Real Estate',
  'Family Planning',
  'Health & Wellness',
  'Goal Planning',
  'Configuration'
];

export function MoreScreen() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredModules = selectedCategory 
    ? modules.filter(module => module.category === selectedCategory)
    : modules;

  const handleModuleClick = (moduleId: string) => {
    // This will be handled by the parent component
    const event = new CustomEvent('navigate-more', { detail: moduleId });
    window.dispatchEvent(event);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">More Features</h1>
        <p className="text-muted-foreground">
          Explore advanced financial management tools and specialized trackers
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                    {module.badge && (
                      <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                        {module.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleModuleClick(module.id)}
                >
                  Open Module
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No modules found in this category.</p>
        </div>
      )}
    </div>
  );
}
