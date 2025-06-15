
// Mock Firestore service for development
export interface FirestoreExpense {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  userId: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  tags?: string;
  account?: string;
  source?: 'manual' | 'csv';
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreInvestment {
  id?: string;
  amount: number;
  type: string;
  name: string;
  date: string;
  purchaseDate: string;
  userId: string;
  units?: number;
  nav?: number;
  price?: number;
  currentValue?: number;
  expectedReturn?: number;
  actualReturn?: number;
  riskLevel: 'low' | 'medium' | 'high';
  maturityDate?: string;
  source?: 'manual' | 'csv';
  createdAt?: string;
  updatedAt?: string;
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
        type: 'expense',
        paymentMethod: 'UPI',
        tags: 'groceries, food',
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
        type: 'expense',
        paymentMethod: 'Credit Card',
        tags: 'fuel, transport',
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
        type: 'mutual_funds',
        name: 'Large Cap Fund',
        date: '2024-01-01',
        purchaseDate: '2024-01-01',
        userId,
        units: 1000,
        nav: 50,
        price: 50,
        currentValue: 52000,
        riskLevel: 'medium',
        source: 'manual'
      },
      {
        id: '2',
        amount: 25000,
        type: 'stocks',
        name: 'Tech Stock',
        date: '2024-01-10',
        purchaseDate: '2024-01-10',
        userId,
        units: 500,
        price: 50,
        currentValue: 26000,
        riskLevel: 'high',
        source: 'manual'
      }
    ];
  }

  static async addExpense(userId: string, expense: Omit<FirestoreExpense, 'id'>): Promise<string> {
    // Mock implementation
    console.log('Adding expense:', expense);
    await new Promise(resolve => setTimeout(resolve, 500));
    return Date.now().toString();
  }

  static async addExpenses(expenses: FirestoreExpense[]): Promise<void> {
    // Mock implementation
    console.log('Adding expenses:', expenses);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static async addInvestment(userId: string, investment: Omit<FirestoreInvestment, 'id'>): Promise<string> {
    // Mock implementation
    console.log('Adding investment:', investment);
    await new Promise(resolve => setTimeout(resolve, 500));
    return Date.now().toString();
  }

  static async addInvestments(investments: FirestoreInvestment[]): Promise<void> {
    // Mock implementation
    console.log('Adding investments:', investments);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static async updateExpense(userId: string, expenseId: string, updates: Partial<FirestoreExpense>): Promise<void> {
    // Mock implementation
    console.log('Updating expense:', { userId, expenseId, updates });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  static async updateInvestment(userId: string, investmentId: string, updates: Partial<FirestoreInvestment>): Promise<void> {
    // Mock implementation
    console.log('Updating investment:', { userId, investmentId, updates });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  static async deleteExpense(userId: string, expenseId: string): Promise<void> {
    // Mock implementation
    console.log('Deleting expense:', { userId, expenseId });
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  static async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    // Mock implementation
    console.log('Deleting investment:', { userId, investmentId });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
