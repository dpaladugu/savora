
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Calendar, CreditCard, Repeat, TrendingUp, TrendingDown, Tag } from "lucide-react";
import type { Expense as AppExpense } from "@/services/supabase-data-service";
import type { Income as AppIncome } from "@/components/income/income-tracker";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Badge } from "@/components/ui/badge";

type Transaction = AppExpense | AppIncome;

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (itemId: string, type: 'expense' | 'income') => void;
  onEdit?: (item: Transaction) => void;
}

const isExpense = (transaction: Transaction): transaction is AppExpense => {
  return 'payment_method' in transaction;
};

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No transactions found for the selected criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((item) => {
        const itemIsExpense = isExpense(item);
        const description = itemIsExpense ? item.description : item.source_name;
        const subLine = itemIsExpense ? item.payment_method : item.frequency;

        return (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${itemIsExpense ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'}`}>
                    {itemIsExpense ? <TrendingDown className="w-4 h-4"/> : <TrendingUp className="w-4 h-4"/>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{description}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date)}
                        {'source_recurring_transaction_id' in item && item.source_recurring_transaction_id && (
                          <Repeat className="w-3 h-3 ml-1 text-blue-500" title="Recurring" />
                        )}
                      </span>
                      {subLine && (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {subLine}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${itemIsExpense ? 'text-destructive' : 'text-success'}`}>
                      {itemIsExpense ? '-' : '+'}{formatCurrency(item.amount)}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-end mt-1">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      {item.tags_flat?.split(',').filter(Boolean).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col ml-2">
                    {onEdit && item.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && item.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => onDelete(item.id!, itemIsExpense ? 'expense' : 'income')}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
