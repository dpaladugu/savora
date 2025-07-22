

export interface RecurringTransactionRecord {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  start_date: string;
  end_date?: string;
  day_of_week?: number;
  day_of_month?: number;
  next_occurrence_date?: string;
  next_date: string;
  is_active: boolean;
  type: 'income' | 'expense';
  payment_method?: string;
  account?: string;
  created_at?: Date;
  updated_at?: Date;
}
