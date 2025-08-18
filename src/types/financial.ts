
export interface EmergencyFund {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetMonths: number;
  lastReviewDate: Date;
  status: 'Under-Target' | 'OnTrack' | 'Achieved';
  medicalSubBucket: number;
  medicalSubBucketUsed: number;
  monthlyExpenses?: number;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
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
  name: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  bankName: string;
  last4: string;
  network: 'Visa' | 'Mastercard' | 'Rupay' | 'Amex';
  cardVariant: string;
  productVariant: string;
  annualFee: number;
  annualFeeGst: number;
  creditLimit: number;
  creditLimitShared: boolean;
  fuelSurchargeWaiver: boolean;
  rewardPointsBalance: number;
  cycleStart: number;
  stmtDay: number;
  dueDay: number;
  fxTxnFee: number;
  emiConversion: boolean;
  currentBalance: number;
  limit: number;
  dueDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalProperty {
  id: string;
  address: string;
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: 'Apartment' | 'House' | 'Commercial' | 'Plot';
  squareYards: number;
  monthlyRent: number;
  dueDay: number;
  escalationPercent: number;
  escalationDate: Date;
  lateFeeRate: number;
  noticePeriodDays: number;
  depositRefundPending: boolean;
  propertyTaxAnnual: number;
  propertyTaxDueDay: number;
  waterTaxAnnual: number;
  waterTaxDueDay: number;
  maintenanceReserve: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Health {
  id: string;
  refillAlertDays: number;
  allergySeverity?: string;
  emergencyContact?: string;
  nextCheckupDate?: Date;
  familyHistory: string[];
  vaccinations: Vaccination[];
  vitals: Vital[];
  prescriptions: Prescription[];
  weightKg?: number;
  heightCm?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}

export interface Vaccination {
  name: string;
  dueDate: Date;
  administeredDate?: Date;
}

export interface Vital {
  date: Date;
  type: string;
  value: number;
}

export interface Txn {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  category: string;
  note: string;
  tags: string[];
  goalId?: string;
  receiptUri?: string;
  cardId?: string;
  vehicleId?: string;
  tenantId?: string;
  propertyId?: string;
  rentMonth?: string;
  isPartialRent: boolean;
  paymentMix: PaymentSplit[];
  cashbackAmount?: number;
  isSplit: boolean;
  splitWith: SplitItem[];
  gstPaid?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSplit {
  mode: 'Cash' | 'Card' | 'UPI' | 'Bank';
  amount: number;
  refId?: string;
}

export interface SplitItem {
  person: string;
  amount: number;
  settled: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  leaseStart: Date;
  leaseEnd: Date;
  depositAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
