
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export interface FirestoreExpense {
  id?: string;
  userId: string;
  date: string;
  amount: number;
  category: string;
  paymentMode: string;
  description: string;
  tags: string;
  account: string;
  source: 'manual' | 'csv';
  createdAt: string;
}

export interface FirestoreInvestment {
  id?: string;
  userId: string;
  date: string;
  fundName: string;
  folio: string;
  units: number;
  nav: number;
  amount: number;
  type: string;
  source: 'manual' | 'csv';
  createdAt: string;
}

export class FirestoreService {
  static async addExpenses(expenses: Omit<FirestoreExpense, 'id'>[]): Promise<void> {
    const batch = expenses.map(expense => 
      addDoc(collection(db, 'expenses'), expense)
    );
    await Promise.all(batch);
  }

  static async addInvestments(investments: Omit<FirestoreInvestment, 'id'>[]): Promise<void> {
    const batch = investments.map(investment => 
      addDoc(collection(db, 'investments'), investment)
    );
    await Promise.all(batch);
  }
  
  static async getExpenses(userId: string): Promise<FirestoreExpense[]> {
    try {
      // Use simple query to avoid composite index requirement
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreExpense));
      
      // Sort in memory to avoid composite index requirement
      return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw new Error('Failed to fetch expenses');
    }
  }
  
  static async getInvestments(userId: string): Promise<FirestoreInvestment[]> {
    try {
      // Use simple query to avoid composite index requirement
      const q = query(
        collection(db, 'investments'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const investments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreInvestment));
      
      // Sort in memory to avoid composite index requirement
      return investments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw new Error('Failed to fetch investments');
    }
  }
  
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }
  
  static async getMonthlyExpenseSummary(userId: string): Promise<{ month: string; total: number }[]> {
    try {
      const expenses = await this.getExpenses(userId);
      const summary: { [key: string]: number } = {};
      
      expenses.forEach(expense => {
        const month = expense.date.substring(0, 7); // YYYY-MM
        summary[month] = (summary[month] || 0) + expense.amount;
      });
      
      return Object.entries(summary).map(([month, total]) => ({ month, total }));
    } catch (error) {
      console.error('Error getting monthly expense summary:', error);
      throw new Error('Failed to get monthly expense summary');
    }
  }

  // For future use when composite indexes are set up
  static async getExpensesWithCompositeIndex(userId: string): Promise<FirestoreExpense[]> {
    try {
      // This query requires a composite index: (userId, date)
      // Add this to Firestore console: Collection: expenses, Fields: userId (Ascending), date (Descending)
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreExpense));
    } catch (error) {
      console.error('Error fetching expenses with composite index:', error);
      // Fallback to simple query
      return this.getExpenses(userId);
    }
  }
}

// Composite indexes required for Firestore console:
// 1. Collection: expenses, Fields: userId (Ascending), date (Descending)
// 2. Collection: investments, Fields: userId (Ascending), date (Descending)
// 3. Collection: expenses, Fields: userId (Ascending), category (Ascending), date (Descending)
