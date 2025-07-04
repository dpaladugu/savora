// Shared expense type for components
export interface Expense {
  id?: string | number;
  amount: number;
  date: string;
  category: string;
  description: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  tags?: string[];
  source?: string;
}