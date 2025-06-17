
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseFilter } from './expense-manager';
import { Logger } from './logger';

export class SupabaseExpenseManager {
  static async addExpense(userId: string, expense: Omit<Expense, 'id' | 'userId'>): Promise<string> {
    try {
      Logger.info('Adding expense to Supabase', { userId, expense });
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          type: expense.type,
          payment_method: expense.paymentMethod || null,
          tags: expense.tags?.join(', ') || null,
          source: 'manual'
        })
        .select('id')
        .single();

      if (error) throw error;
      Logger.info('Expense added successfully', { id: data.id });
      return data.id;
    } catch (error) {
      Logger.error('Error adding expense', error);
      throw error;
    }
  }

  static async updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      Logger.info('Updating expense', { userId, expenseId, updates });
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.tags !== undefined) updateData.tags = updates.tags?.join(', ') || null;

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId)
        .eq('user_id', userId);

      if (error) throw error;
      Logger.info('Expense updated successfully');
    } catch (error) {
      Logger.error('Error updating expense', error);
      throw error;
    }
  }

  static async deleteExpense(userId: string, expenseId: string): Promise<void> {
    try {
      Logger.info('Deleting expense', { userId, expenseId });
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', userId);

      if (error) throw error;
      Logger.info('Expense deleted successfully');
    } catch (error) {
      Logger.error('Error deleting expense', error);
      throw error;
    }
  }

  static async getExpenses(userId: string, filter?: ExpenseFilter): Promise<Expense[]> {
    try {
      Logger.info('Getting expenses from Supabase', { userId, filter });
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (filter) {
        if (filter.category) query = query.eq('category', filter.category);
        if (filter.type) query = query.eq('type', filter.type);
        if (filter.dateFrom) query = query.gte('date', filter.dateFrom);
        if (filter.dateTo) query = query.lte('date', filter.dateTo);
        if (filter.minAmount) query = query.gte('amount', filter.minAmount);
        if (filter.maxAmount) query = query.lte('amount', filter.maxAmount);
        if (filter.paymentMethod) query = query.eq('payment_method', filter.paymentMethod);
      }

      const { data, error } = await query;

      if (error) throw error;

      const expenses: Expense[] = (data || []).map(row => ({
        id: row.id,
        amount: Number(row.amount),
        description: row.description,
        category: row.category,
        date: row.date,
        type: row.type as 'expense' | 'income',
        paymentMethod: row.payment_method,
        tags: row.tags ? row.tags.split(', ') : [],
        userId: row.user_id
      }));

      return expenses;
    } catch (error) {
      Logger.error('Error getting expenses', error);
      return [];
    }
  }

  static async getExpensesByCategory(userId: string): Promise<{ [category: string]: number }> {
    try {
      const expenses = await this.getExpenses(userId, { type: 'expense' });
      const categoryTotals: { [category: string]: number } = {};

      expenses.forEach(expense => {
        const category = expense.category || 'Others';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
      });

      return categoryTotals;
    } catch (error) {
      Logger.error('Error getting expenses by category', error);
      return {};
    }
  }

  static async getMonthlyExpenses(userId: string, year: number, month: number): Promise<Expense[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    return this.getExpenses(userId, {
      type: 'expense',
      dateFrom: startDate,
      dateTo: endDate
    });
  }
}
