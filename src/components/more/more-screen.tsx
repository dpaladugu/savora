
import { motion } from "framer-motion";
import { Shield, Coins, Home, DollarSign, FileText, Calculator, PieChart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoreScreenProps {
  onNavigate: (screen: string) => void;
}

export function MoreScreen({ onNavigate }: MoreScreenProps) {
  const modules = [
    {
      id: 'income',
      title: 'Income Tracker',
      description: 'Track salary, rental & other income',
      icon: DollarSign,
      color: 'bg-gradient-green'
    },
    {
      id: 'insurance',
      title: 'Insurance & EMI',
      description: 'Manage policies and loan EMIs',
      icon: Shield,
      color: 'bg-gradient-purple'
    },
    {
      id: 'gold',
      title: 'Gold Investments',
      description: 'Track physical gold holdings',
      icon: Coins,
      color: 'bg-gradient-orange'
    },
    {
      id: 'rentals',
      title: 'Rental Properties',
      description: 'Manage rental income & tenants',
      icon: Home,
      color: 'bg-gradient-blue'
    },
    {
      id: 'investments',
      title: 'Investments',
      description: 'Track stocks, mutual funds & more',
      icon: TrendingUp,
      color: 'bg-gradient-green'
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Financial reports & analytics',
      icon: PieChart,
      color: 'bg-gradient-purple'
    },
    {
      id: 'calculator',
      title: 'Calculators',
      description: 'EMI, SIP & tax calculators',
      icon: Calculator,
      color: 'bg-gradient-blue'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Store financial documents',
      icon: FileText,
      color: 'bg-gradient-orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          More Features
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Explore additional financial modules
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="metric-card border-border/50 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate(module.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-xl ${module.color} text-white`}>
                    <module.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {module.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-muted-foreground">
          More features coming soon! 🚀
        </p>
      </motion.div>
    </div>
  );
}
