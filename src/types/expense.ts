
// Shared expense type for components
export interface Expense {
  id?: string | number;
  amount: number;
  date: string;
  category: string;
  description: string;
  type: 'expense' | 'income';
  payment_method?: string;
  tags?: string[];
  source?: string;
}

// Extended expense type for internal use
export interface ExtendedExpense extends Expense {
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}
