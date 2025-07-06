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

export interface FirestoreIncome {
  id?: string;
  amount: number;
  source: string;
  category: 'salary' | 'rental' | 'side-business' | 'investment' | 'other';
  date: string; // YYYY-MM-DD
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  userId: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class FirestoreService {
  static async getExpenses(userId: string): Promise<FirestoreExpense[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

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
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  static async getIncomes(userId: string): Promise<FirestoreIncome[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    // Mock data for development, ensuring varied dates for testing
    const today = new Date();
    const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
    const twoMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 2)).toISOString().split('T')[0];
    const sixMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 6)).toISOString().split('T')[0];

    return [
      {
        id: 'inc1',
        amount: 75000,
        source: 'Monthly Salary',
        category: 'salary',
        date: twoMonthsAgo, // Approx 2 months ago
        frequency: 'monthly',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inc2',
        amount: 12000,
        source: 'Freelance Project A',
        category: 'side-business',
        date: oneMonthAgo, // Approx 1 month ago
        frequency: 'one-time',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inc3',
        amount: 75000,
        source: 'Monthly Salary',
        category: 'salary',
        date: oneMonthAgo, // Approx 1 month ago
        frequency: 'monthly',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inc4',
        amount: 5000,
        source: 'Stock Dividends',
        category: 'investment',
        date: sixMonthsAgo, // Approx 6 months ago
        frequency: 'quarterly', // This would imply it repeats, but for cashflow we care about the specific date it hit
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
       {
        id: 'inc5',
        amount: 75000,
        source: 'Monthly Salary',
        category: 'salary',
        date: today.toISOString().split('T')[0], // Current month
        frequency: 'monthly',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  static async getInvestments(userId: string): Promise<FirestoreInvestment[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

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
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
