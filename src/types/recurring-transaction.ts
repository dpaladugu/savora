
export interface RecurringTransactionRecord {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string;
  frequency: string;
  next_date: string;
  is_active: boolean;
  account?: string; // Add missing account property
  created_at?: Date;
  updated_at?: Date;
}
