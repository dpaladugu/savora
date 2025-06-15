
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, CreditCard } from "lucide-react";
import { Expense } from "@/services/expense-manager";
import { DataValidator } from "@/services/data-validator";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (expenseId: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No expenses found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first expense to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{expense.description}</h3>
                  <span className="text-lg font-bold text-destructive">
                    -{DataValidator.formatCurrency(expense.amount)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString()}
                  </span>
                  
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    {expense.category}
                  </span>
                  
                  {expense.paymentMethod && (
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {expense.paymentMethod}
                    </span>
                  )}
                </div>
              </div>
              
              {onDelete && expense.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(expense.id!)}
                  className="text-destructive hover:text-destructive/80 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
