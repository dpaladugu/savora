import React from 'react';
import { MoreModule } from '@/components/layout/more-module';
import { MoreModuleRouter } from '@/components/layout/more-module-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Target } from 'lucide-react';

interface MoreModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
}

const modules: MoreModule[] = [
  {
    id: 'insurance',
    name: 'Insurance Tracker',
    description: 'Manage your insurance policies and track renewals',
    icon: ShieldCheck,
    category: 'Financial Tools'
  },
  {
    id: 'vehicles',
    name: 'Vehicle Manager',
    description: 'Track vehicle maintenance, insurance, and documentation',
    icon: Car,
    category: 'Asset Management'
  },
  {
    id: 'family-accounts',
    name: 'Family Bank Accounts',
    description: 'Manage and track family bank accounts and transactions',
    icon: Bank,
    category: 'Family Finance'
  },
  {
    id: 'enhanced-rentals',
    name: 'Enhanced Rentals',
    description: 'Advanced rental property management with analytics',
    icon: Building,
    category: 'Property Management'
  },
  {
    id: 'family-dashboard',
    name: 'Family Financial Dashboard',
    description: 'Comprehensive family financial overview and health tracking',
    icon: Users,
    category: 'Family Finance'
  },
  {
    id: 'smart-goals',
    name: 'Smart Goal Management',
    description: 'AI-powered goal recommendations and auto-funding strategies',
    icon: Target,
    category: 'Goals & Planning'
  }
];

export function MoreScreen() {
  const [activeModule, setActiveModule] = React.useState<string | null>(null);

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const handleBackClick = () => {
    setActiveModule(null);
  };

  return (
    <div className="h-full">
      {activeModule ? (
        <>
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            &larr; Back to More
          </Button>
          <MoreModuleRouter activeModule={activeModule} />
        </>
      ) : (
        <div className="container mx-auto p-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>More Features</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <MoreModule
                  key={module.id}
                  id={module.id}
                  name={module.name}
                  description={module.description}
                  icon={module.icon}
                  category={module.category}
                  onClick={handleModuleClick}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
