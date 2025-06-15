
import { motion } from "framer-motion";
import { Plus, Upload, Target, CreditCard } from "lucide-react";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { Card, CardContent } from "@/components/ui/card";
import { memo } from "react";

interface QuickActionsProps {
  onAddExpense: () => void;
  onImportCSV: () => void;
  onCreateGoal: () => void;
  onViewCards: () => void;
}

export const QuickActions = memo(function QuickActions({ 
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
      onClick: onAddExpense,
      ariaLabel: "Add new expense entry"
    },
    {
      id: "import-csv",
      label: "Import CSV",
      icon: Upload,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      onClick: onImportCSV,
      ariaLabel: "Import data from CSV file"
    },
    {
      id: "create-goal",
      label: "Create Goal",
      icon: Target,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      onClick: onCreateGoal,
      ariaLabel: "Create new financial goal"
    },
    {
      id: "view-cards",
      label: "Credit Cards",
      icon: CreditCard,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      onClick: onViewCards,
      ariaLabel: "View credit card information"
    }
  ];

  return (
    <Card className="metric-card border-border/50 mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Quick action buttons">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AccessibleButton
                onClick={action.onClick}
                ariaLabel={action.ariaLabel}
                className={`w-full h-16 flex flex-col items-center justify-center gap-2 text-white ${action.color} hover:opacity-90 transition-opacity border-0`}
              >
                <action.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">{action.label}</span>
              </AccessibleButton>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
