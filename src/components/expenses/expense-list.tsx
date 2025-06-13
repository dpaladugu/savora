
import { motion } from "framer-motion";
import { Trash2, Edit, Car, Tag, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "./expense-tracker";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

// Mock vehicle data for display
const mockVehicles: Record<string, { name: string; number: string }> = {
  '1': { name: 'My Swift', number: 'TS09AB1234' },
  '2': { name: 'Activa', number: 'TS10XY5678' }
};

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
      'Servicing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Maintenance': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
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
                    {expense.autoTagged && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Tag className="w-3 h-3" />
                        Auto-tagged
                      </div>
                    )}
                    {expense.recurring && (
                      <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Recurring
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{expense.tag}</span>
                      <span>•</span>
                      <span>{expense.paymentMode}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>

                    {expense.linkedAccount && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Account:</span>
                        <span className="font-medium">{expense.linkedAccount}</span>
                      </div>
                    )}

                    {expense.linkedVehicle && mockVehicles[expense.linkedVehicle] && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Car className="w-3 h-3" />
                        <span>{mockVehicles[expense.linkedVehicle].name} ({mockVehicles[expense.linkedVehicle].number})</span>
                      </div>
                    )}
                    
                    {expense.note && (
                      <p className="text-sm text-muted-foreground">{expense.note}</p>
                    )}

                    {expense.lineItems && expense.lineItems.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Itemized:</span>
                        <span className="ml-1">
                          {expense.lineItems.map(item => item.title).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {expense.linkedGoal && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <LinkIcon className="w-3 h-3" />
                        <span>{expense.linkedGoal}</span>
                      </div>
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
