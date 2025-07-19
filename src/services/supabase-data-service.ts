
import { supabase } from '@/integrations/supabase/client';

// This interface defines the structure for expenses when interacting with the Supabase backend.
// It should align with the 'expenses' table schema in Supabase.
export interface Expense {
  id?: string; // UUID from Supabase will be string
  user_id?: string; // Foreign key to your users table in Supabase
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  payment_method?: string;
  tags?: string;
  account?: string;
  created_at?: string;
  updated_at?: string;
}

// Define Income interface that matches the database schema
export interface Income {
  id?: string;
  user_id?: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  frequency?: string;
  source_name?: string;
  tags_flat?: string;
  account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseDataService {
  // === INCOME METHODS ===

  static async getIncomes(userId: string): Promise<Income[]> {
    if (!userId) throw new Error("User ID is required to fetch incomes.");
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching incomes from Supabase:", error);
      throw error;
    }
    return data as Income[];
  }

  static async addIncome(incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at'> & { user_id: string }): Promise<Income> {
    const { data, error } = await supabase
      .from('incomes')
      .insert([incomeData])
      .select()
      .single();

    if (error) {
      console.error("Error adding income to Supabase:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned after insert");
    return data as Income;
  }

  static async updateIncome(incomeId: string, updates: Partial<Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Income> {
    const { data, error } = await supabase
      .from('incomes')
      .update(updates)
      .eq('id', incomeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating income in Supabase:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned after update");
    return data as Income;
  }

  static async deleteIncome(incomeId: string): Promise<void> {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', incomeId);

    if (error) {
      console.error("Error deleting income from Supabase:", error);
      throw error;
    }
  }

  // === EXPENSE METHODS ===

  static async getExpenses(userId: string): Promise<Expense[]> {
    if (!userId) throw new Error("User ID is required to fetch expenses.");
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching expenses from Supabase:", error);
      throw error;
    }
    return data as Expense[];
  }

  static async addExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & { user_id: string }): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) {
      console.error("Error adding expense to Supabase:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned after insert");
    return data as Expense;
  }

  static async updateExpense(expenseId: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense in Supabase:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned after update");
    return data as Expense;
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error("Error deleting expense from Supabase:", error);
      throw error;
    }
  }
}
