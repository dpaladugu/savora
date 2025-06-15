
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
  
  static async getExpenses(userId: string): Promise<FirestoreExpense[]> {
    try {
      // Simple query without composite index requirement
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
      return [];
    }
  }
  
  static async getInvestments(userId: string): Promise<FirestoreInvestment[]> {
    try {
      // Simple query without composite index requirement
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
      return [];
    }
  }
  
  static async deleteExpense(expenseId: string): Promise<void> {
    await deleteDoc(doc(db, 'expenses', expenseId));
  }
  
  static async getMonthlyExpenseSummary(userId: string): Promise<{ month: string; total: number }[]> {
    const expenses = await this.getExpenses(userId);
    const summary: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      summary[month] = (summary[month] || 0) + expense.amount;
    });
    
    return Object.entries(summary).map(([month, total]) => ({ month, total }));
  }
}
