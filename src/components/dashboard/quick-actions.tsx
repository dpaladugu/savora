
import { motion } from "framer-motion";
import { Plus, Upload, Target, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionsProps {
  onAddExpense: () => void;
  onImportCSV: () => void;
  onCreateGoal: () => void;
  onViewCards: () => void;
}

export function QuickActions({ 
  onAddExpense, 
  onImportCSV, 
  onCreateGoal, 
  onViewCards 
}: QuickActionsProps) {
  const actions = [
    {
      id: "add-expense",
      label: "Add Expense",
      icon: Plus,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      onClick: onAddExpense
    },
    {
      id: "import-csv",
      label: "Import CSV",
      icon: Upload,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      onClick: onImportCSV
    },
    {
      id: "create-goal",
      label: "Create Goal",
      icon: Target,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      onClick: onCreateGoal
    },
    {
      id: "view-cards",
      label: "Credit Cards",
      icon: CreditCard,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      onClick: onViewCards
    }
  ];

  return (
    <Card className="metric-card border-border/50 mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                onClick={action.onClick}
                className={`w-full h-16 flex flex-col items-center justify-center gap-2 text-white ${action.color} hover:opacity-90 transition-opacity`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
