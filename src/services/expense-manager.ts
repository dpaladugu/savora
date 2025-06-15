
import { FirestoreService } from "./firestore";
import { Logger } from "./logger";

export interface Expense {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  tags?: string[];
  recurring?: boolean;
  userId?: string;
}

export interface ExpenseFilter {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  type?: 'expense' | 'income';
}

export class ExpenseManager {
  static async addExpense(userId: string, expense: Omit<Expense, 'id' | 'userId'>): Promise<string> {
    try {
      Logger.info('Adding expense', { userId, expense });
      
      const expenseData = {
        ...expense,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await FirestoreService.addExpense(userId, expenseData);
      Logger.info('Expense added successfully', { id });
      return id;
    } catch (error) {
      Logger.error('Error adding expense', error);
      throw error;
    }
  }

  static async updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      Logger.info('Updating expense', { userId, expenseId, updates });
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await FirestoreService.updateExpense(userId, expenseId, updateData);
      Logger.info('Expense updated successfully');
    } catch (error) {
      Logger.error('Error updating expense', error);
      throw error;
    }
  }

  static async deleteExpense(userId: string, expenseId: string): Promise<void> {
    try {
      Logger.info('Deleting expense', { userId, expenseId });
      await FirestoreService.deleteExpense(userId, expenseId);
      Logger.info('Expense deleted successfully');
    } catch (error) {
      Logger.error('Error deleting expense', error);
      throw error;
    }
  }

  static async getExpenses(userId: string, filter?: ExpenseFilter): Promise<Expense[]> {
    try {
      Logger.info('Getting expenses', { userId, filter });
      let expenses = await FirestoreService.getExpenses(userId);

      if (filter) {
        expenses = this.applyFilter(expenses, filter);
      }

      return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      Logger.error('Error getting expenses', error);
      return [];
    }
  }

  private static applyFilter(expenses: Expense[], filter: ExpenseFilter): Expense[] {
    return expenses.filter(expense => {
      if (filter.category && expense.category !== filter.category) return false;
      if (filter.type && expense.type !== filter.type) return false;
      if (filter.paymentMethod && expense.paymentMethod !== filter.paymentMethod) return false;
      if (filter.dateFrom && expense.date < filter.dateFrom) return false;
      if (filter.dateTo && expense.date > filter.dateTo) return false;
      if (filter.minAmount && expense.amount < filter.minAmount) return false;
      if (filter.maxAmount && expense.amount > filter.maxAmount) return false;
      return true;
    });
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
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    return this.getExpenses(userId, {
      type: 'expense',
      dateFrom: startDate,
      dateTo: endDate
    });
  }

  static getPopularCategories(): string[] {
    return [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Groceries',
      'Gas',
      'Others'
    ];
  }

  static getPaymentMethods(): string[] {
    return [
      'Credit Card',
      'Debit Card',
      'Cash',
      'Bank Transfer',
      'UPI',
      'Net Banking',
      'Others'
    ];
  }
}
