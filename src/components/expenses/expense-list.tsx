
import { motion } from "framer-motion";
import { Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "./expense-tracker";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Bills': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Fuel': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'EMI': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Shopping': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Entertainment': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="metric-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground text-lg">
                      ₹{expense.amount.toLocaleString()}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{expense.tag}</span>
                      <span>•</span>
                      <span>{expense.paymentMode}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                    
                    {expense.note && (
                      <p className="text-sm text-muted-foreground">{expense.note}</p>
                    )}
                    
                    {expense.linkedGoal && (
                      <p className="text-xs text-primary">→ {expense.linkedGoal}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete(expense.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
