
// Mock Firestore service for development
export interface FirestoreExpense {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  userId: string;
  tags?: string;
  paymentMode?: string;
  account?: string;
  source?: 'manual' | 'csv';
  createdAt?: string;
}

export interface FirestoreInvestment {
  id?: string;
  amount: number;
  type: string;
  name: string;
  date: string;
  userId: string;
  units?: number;
  nav?: number;
  source?: 'manual' | 'csv';
  createdAt?: string;
}

export class FirestoreService {
  static async getExpenses(userId: string): Promise<FirestoreExpense[]> {
    // Mock data for development
    return [
      {
        id: '1',
        amount: 2500,
        description: 'Grocery Shopping',
        category: 'Food',
        date: '2024-01-15',
        userId,
        tags: 'groceries, food',
        paymentMode: 'UPI',
        account: 'Main Account',
        source: 'manual'
      },
      {
        id: '2',
        amount: 800,
        description: 'Gas Station',
        category: 'Transport',
        date: '2024-01-14',
        userId,
        tags: 'fuel, transport',
        paymentMode: 'Credit Card',
        account: 'Main Account',
        source: 'manual'
      }
    ];
  }

  static async getInvestments(userId: string): Promise<FirestoreInvestment[]> {
    // Mock data for development
    return [
      {
        id: '1',
        amount: 50000,
        type: 'SIP',
        name: 'Large Cap Fund',
        date: '2024-01-01',
        userId,
        units: 1000,
        nav: 50,
        source: 'manual'
      },
      {
        id: '2',
        amount: 25000,
        type: 'Lumpsum',
        name: 'Mid Cap Fund',
        date: '2024-01-10',
        userId,
        units: 500,
        nav: 50,
        source: 'manual'
      }
    ];
  }

  static async addExpenses(expenses: FirestoreExpense[]): Promise<void> {
    // Mock implementation
    console.log('Adding expenses:', expenses);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static async addInvestments(investments: FirestoreInvestment[]): Promise<void> {
    // Mock implementation
    console.log('Adding investments:', investments);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    // Mock implementation
    console.log('Deleting expense:', expenseId);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  static async deleteInvestment(investmentId: string): Promise<void> {
    // Mock implementation
    console.log('Deleting investment:', investmentId);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
