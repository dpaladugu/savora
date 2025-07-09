import { supabase } from '@/integrations/supabase/client';
import type { Income } from '@/components/income/income-tracker'; // Assuming Income interface is here

// This interface defines the structure for expenses when interacting with the Supabase backend.
// It should align with the 'expenses' table schema in Supabase.
// Local app components might use a slightly different structure (e.g., for forms or Dexie),
// and this service will handle mapping between those structures and this Supabase-specific one if needed during sync.
export interface Expense { // Renaming to SupabaseExpense for clarity if a global AppExpense type is defined elsewhere
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


// Helper to map Supabase user_id to your app's convention if different, though likely the same.
// For now, assume direct mapping.

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
    // Assuming Supabase returns `id` as string (UUID) and dates as ISO strings.
    // The Income interface might need id to be string.
    return data as Income[];
  }

  static async addIncome(incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at'> & { user_id: string }): Promise<Income> {
    const { data, error } = await supabase
      .from('incomes')
      .insert([incomeData])
      .select()
      .single(); // Assuming you want the inserted row back

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
