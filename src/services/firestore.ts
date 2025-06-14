
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/auth-context';

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
  }
  
  static async addInvestments(investments: Omit<FirestoreInvestment, 'id'>[]): Promise<void> {
    const batch = investments.map(investment => 
      addDoc(collection(db, 'investments'), investment)
    );
    await Promise.all(batch);
  }
  
  static async getInvestments(userId: string): Promise<FirestoreInvestment[]> {
    const q = query(
      collection(db, 'investments'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreInvestment));
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
