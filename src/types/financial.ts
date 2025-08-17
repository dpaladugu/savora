
export interface EmergencyFund {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetMonths: number;
  lastReviewDate: Date;
  status: 'Under-Target' | 'On-Track' | 'Achieved';
  medicalSubBucket: number;
  medicalSubBucketUsed: number;
  monthlyExpenses?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Investment {
  id: string;
  name: string;
  type: 'MF-Growth' | 'MF-Dividend' | 'Stocks' | 'Bonds' | 'FD' | 'RD' | 'Real Estate' | 'Gold' | 'PPF' | 'EPF' | 'NPS-T1' | 'SGB';
  currentValue: number;
  purchasePrice: number;
  quantity: number;
  purchaseDate: Date;
  currentNav: number;
  units: number;
  investedValue: number;
  startDate: Date;
  maturityDate?: Date;
  expectedReturn?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  totalInvestments: number;
  expenseCount: number;
  investmentCount: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
  monthlyIncome: number;
  savingsRate: number;
  investmentValue: number;
  creditCardDebt: number;
  emergencyFund: number;
  goals: Goal[];
  recentTransactions: Transaction[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface PortfolioAnalysis {
  totalValue: number;
  allocation: {
    equity: number;
    debt: number;
    other: number;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
  diversificationScore: number;
  assetAllocation: Record<string, number>;
  riskScore: number;
  expectedReturn: number;
  sharpeRatio: number;
  rebalanceNeeded: boolean;
}

// Helper functions for DB field mapping
export const snakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  
  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = snakeToCamel(value);
  }
  return camelObj;
};

export const camelToSnake = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  
  const snakeObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = camelToSnake(value);
  }
  return snakeObj;
};
