
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
  type: 'MF-Growth' | 'MF-Dividend' | 'Stocks' | 'Bonds' | 'FD' | 'RD' | 'Real Estate' | 'Gold' | 'PPF' | 'EPF' | 'NPS-T1' | 'SGB' | 'Others' | 'SIP' | 'NPS-T2' | 'Gold-ETF' | 'Gift-Card-Float';
  currentValue: number;
  purchasePrice?: number;
  quantity?: number;
  purchaseDate?: Date;
  currentNav: number;
  units: number;
  investedValue: number;
  startDate?: Date;
  maturityDate?: Date;
  expectedReturn?: number;

  // ── Common ──────────────────────────────────────────────────────────────────
  familyMember?: string;           // Me | Mother | Grandmother | Brother
  taxBenefit?: boolean;
  notes?: string;
  folioNo?: string;
  goalId?: string;
  lockInYears?: number;
  interestRate?: number;
  interestCreditDate?: Date;
  frequency?: string;              // Monthly | Quarterly | Yearly | One-time

  // ── SIP / Mutual Fund ───────────────────────────────────────────────────────
  sipAmount?: number;              // Monthly SIP instalment (₹)
  sipDay?: number;                 // Debit day of month (1-31)
  isSIP?: boolean;                 // true → recurring SIP
  schemeCode?: string;             // AMFI scheme code
  amcName?: string;                // Asset Management Company
  sipStartDate?: Date;
  sipEndDate?: Date;               // null = perpetual

  // ── EPF ─────────────────────────────────────────────────────────────────────
  uan?: string;                    // Universal Account Number
  employeeContribution?: number;   // Monthly employee share (₹)
  employerContribution?: number;   // Monthly employer share (₹)
  establishmentCode?: string;

  // ── PPF ─────────────────────────────────────────────────────────────────────
  ppfAccountNo?: string;
  ppfBank?: string;                // SBI | PO | HDFC | ICICI etc.
  ppfAnnualContribution?: number;  // Target annual contribution (₹)
  ppfOpenDate?: Date;              // Account opening date (maturity = open + 15 yrs)
  ppf80CUsed?: number;             // ₹ claimed under 80C this FY

  // ── NPS ──────────────────────────────────────────────────────────────────────
  pran?: string;                   // Permanent Retirement Account Number
  npsEquityPct?: number;           // % in Equity (E) fund
  npsCorpDebtPct?: number;         // % in Corporate Debt (C) fund
  npsGovDebtPct?: number;          // % in Government Securities (G) fund
  nps80CCDUsed?: number;           // ₹ claimed under 80CCD(1B) this FY (max ₹50,000)
  npsTier?: 'T1' | 'T2';

  // ── SGB (Sovereign Gold Bond) ────────────────────────────────────────────────
  sgbSeries?: string;              // e.g. "SGB 2022-23 Series VI"
  sgbIssuePrice?: number;          // Issue price per gram (₹)
  sgbUnits?: number;               // Grams purchased
  sgbIssueDate?: Date;
  sgbMaturityDate?: Date;          // Issue date + 8 years
  sgbCouponRate?: number;          // Fixed at 2.5% p.a.
  sgbCouponAccount?: string;       // "SBI" — coupon credited here
  sgbPrematureExitDate?: Date;     // Optional: 5th year exit window

  // ── FD / RD ──────────────────────────────────────────────────────────────────
  bankName?: string;               // Bank where FD/RD is held
  accountNumber?: string;          // Deposit account/receipt no.
  fdPrincipal?: number;
  fdRate?: number;                 // Interest rate % p.a.
  fdTenureDays?: number;           // Tenure in days
  fdMaturityAmount?: number;       // Calculated or entered maturity value
  fdTdsApplicable?: boolean;
  fdAutoRenewal?: boolean;
  rdMonthlyInstalment?: number;    // Monthly instalment for RD

  createdAt?: Date;
  updatedAt?: Date;
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
  title?: string;          // optional alias for name
  targetAmount: number;
  currentAmount: number;
  deadline?: string;       // optional ISO string
  category?: string;       // optional
  // Extended fields
  slug?: string;
  type?: 'Short' | 'Medium' | 'Long';
  targetDate?: Date;
  notes?: string;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
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
  // ── Identity ────────────────────────────────────────────────────────────────
  name: string;
  issuer?: string;
  bankName: string;
  cardName?: string;         // e.g. "Regalia", "Swiggy"
  last4?: string;            // legacy alias
  lastFourDigits?: string;   // canonical 4-digit identifier (preferred over last4)
  network?: 'Visa' | 'Mastercard' | 'Rupay' | 'Amex' | 'Diners' | string;
  cardVariant?: string;
  productVariant?: string;
  // ── Limits & Balance ────────────────────────────────────────────────────────
  creditLimit: number;
  limit?: number;            // legacy alias
  currentBalance?: number;   // outstanding bill amount
  creditLimitShared?: boolean;
  // ── Fees ────────────────────────────────────────────────────────────────────
  annualFee: number;
  annualFeeGst?: number;
  feeWaiverRule?: string;    // e.g. "Spend ₹2L/yr"
  // ── Payment & Dates ──────────────────────────────────────────────────────────
  dueDate?: string;          // legacy ISO string
  dueDay?: number;           // day of month (1-31)
  cycleStart?: number;
  stmtDay?: number;          // statement generation day
  statementDate?: number;    // alias for stmtDay
  anniversaryDate?: string;  // card activation anniversary (ISO date)
  paymentMethod?: 'UPI' | 'NEFT' | 'NACH Auto-Pay' | 'In App' | 'Cheque' | string;
  // ── Misc ─────────────────────────────────────────────────────────────────────
  fxTxnFee?: number;
  emiConversion?: boolean;
  fuelSurchargeWaiver?: boolean;
  rewardPointsBalance?: number;
  isActive?: boolean;
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
  createdAt?: Date;
  updatedAt?: Date;
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
