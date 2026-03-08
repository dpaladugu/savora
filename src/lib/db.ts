
import Dexie, { type EntityTable } from 'dexie';
import type { EmergencyFund, Investment, CreditCard, RentalProperty, Health, Txn, Goal, Tenant } from '@/types/financial';

// Re-export types from financial.ts for backwards compatibility
export type { EmergencyFund, Investment, CreditCard, RentalProperty, Health, Txn, Goal, Tenant } from '@/types/financial';

// Contact interface for emergency contacts
export interface Contact {
  name: string;
  phone: string;
  relation: string;
}

// Dependent interface for family dependents
export interface Dependent {
  name: string;
  dob: Date;
  relation: string;
}

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  make?: string;
  type?: string;
  fuelType?: string;
  registrationNumber?: string;
  regNo?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  insuranceExpiry?: Date;
  pucExpiry?: Date;
  serviceDueDate?: Date;
  odometer?: number;
  odometerReading?: number;
  fuelEfficiency?: number;
  fuelLogs?: any[];
  serviceLogs?: any[];
  claims?: any[];
  treadDepthMM?: number;
  depreciationRate?: number;
  ncbPercent?: number;
  owner?: string;
  vehicleValue?: number;
  regNo?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  type?: 'Personal' | 'Personal-Brother' | 'Education-Brother';
  borrower?: 'Me' | 'Brother';
  roi?: number;
  tenureMonths?: number;
  emi?: number;
  outstanding?: number;
  startDate?: Date;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Insurance {
  id: string;
  name: string;
  type: string;
  premium: number;
  provider?: string;
  company?: string;
  policyNumber?: string;
  sumAssured?: number;
  sumInsured?: number;
  premiumAmount?: number;
  premiumDueDate?: Date;
  endDate?: Date;
  nominee?: string;
  notes?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Gold {
  id: string;
  type: string;
  weight: number;
  purity: number;
  form?: 'Jewelry' | 'Coin' | 'Bar' | 'Biscuit';
  description?: string;
  grossWeight?: number;
  netWeight?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: string;
  nextBilling: Date;
  amount?: number;
  cycle?: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate?: Date;
  nextDue?: Date;
  reminderDays?: number;
  isActive?: boolean;
  autoRenew?: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrotherRepayment {
  id: string;
  amount: number;
  date: Date;
  loanId?: string;
  mode?: 'Cash' | 'Bank' | 'UPI';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyBankAccount {
  id: string;
  name: string;
  balance: number;
  owner?: 'Mother' | 'Grandmother';
  bankName?: string;
  accountNo?: string;
  type?: 'Savings' | 'Current' | 'FD';
  currentBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyTransfer {
  id: string;
  amount: number;
  from: string;
  to: string;
  date: Date;
  fromAccountId?: string;
  toPerson?: 'Mother' | 'Grandmother' | 'Brother';
  purpose?: string;
  mode?: 'Cash' | 'Bank' | 'UPI';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  userId?: string;
  entity?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  deviceId?: string;
}

export interface GlobalSettings {
  id: string;
  failedPinAttempts: number;
  maxFailedAttempts: number;
  autoLockMinutes: number;
  taxRegime: 'Old' | 'New';
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: Contact[];
  dependents: Dependent[];
  salaryCreditDay: number;
  annualBonus: number;
  medicalInflationRate: number;
  educationInflation: number;
  vehicleInflation: number;
  maintenanceInflation: number;
  privacyMask: boolean;
  darkMode: boolean;
  timeZone: string;
  isTest: boolean;
  theme: 'light' | 'dark' | 'system';
  deviceThemes: Record<string, string>;
  revealSecret: string;
}

// Expense and Income interfaces for extended schema compatibility
export interface Expense {
  id: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  paymentMethod?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  id: string;
  amount: number;
  date: Date;
  category: string;
  sourceName?: string;
  description?: string;
  frequency?: string;
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie('SavoraDB') as typeof Dexie.prototype & {
  txns: EntityTable<Txn, 'id'>;
  rentalProperties: EntityTable<RentalProperty, 'id'>;
  goals: EntityTable<Goal, 'id'>;
  vehicles: EntityTable<Vehicle, 'id'>;
  creditCards: EntityTable<CreditCard, 'id'>;
  loans: EntityTable<Loan, 'id'>;
  insurance: EntityTable<Insurance, 'id'>;
  tenants: EntityTable<Tenant, 'id'>;
  investments: EntityTable<Investment, 'id'>;
  gold: EntityTable<Gold, 'id'>;
  subscriptions: EntityTable<Subscription, 'id'>;
  emergencyFunds: EntityTable<EmergencyFund, 'id'>;
  health: EntityTable<Health, 'id'>;
  brotherRepayments: EntityTable<BrotherRepayment, 'id'>;
  familyBankAccounts: EntityTable<FamilyBankAccount, 'id'>;
  familyTransfers: EntityTable<FamilyTransfer, 'id'>;
  auditLogs: EntityTable<AuditLog, 'id'>;
  globalSettings: EntityTable<GlobalSettings, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  incomes: EntityTable<Income, 'id'>;
};

// Schema definition using camelCase field names
db.version(1).stores({
  txns: '++id, amount, currency, category, date, note, goalId, cardId, vehicleId, tenantId, propertyId, createdAt, updatedAt',
  rentalProperties: '++id, address, owner, type, squareYards, monthlyRent, dueDay, escalationPercent, createdAt, updatedAt',
  goals: '++id, name, title, targetAmount, currentAmount, deadline, category, createdAt, updatedAt',
  vehicles: '++id, name, model, year, createdAt, updatedAt',
  creditCards: '++id, name, issuer, bankName, last4, network, creditLimit, currentBalance, dueDate, createdAt, updatedAt',
  loans: '++id, name, principal, interestRate, createdAt, updatedAt',
  insurance: '++id, name, type, premium, createdAt, updatedAt',
  tenants: '++id, name, email, phone, propertyId, leaseStart, leaseEnd, depositAmount, isActive, createdAt, updatedAt',
  investments: '++id, name, type, currentValue, purchasePrice, quantity, purchaseDate, currentNav, units, investedValue, startDate, maturityDate, expectedReturn, createdAt, updatedAt',
  gold: '++id, type, weight, purity, createdAt, updatedAt',
  subscriptions: '++id, name, cost, billingCycle, nextBilling, createdAt, updatedAt',
  emergencyFunds: '++id, name, targetAmount, currentAmount, targetMonths, lastReviewDate, status, medicalSubBucket, medicalSubBucketUsed, monthlyExpenses, createdAt, updatedAt',
  health: '++id, refillAlertDays, allergySeverity, emergencyContact, nextCheckupDate, familyHistory, vaccinations, vitals, prescriptions, weightKg, heightCm, createdAt, updatedAt',
  brotherRepayments: '++id, amount, date, createdAt, updatedAt',
  familyBankAccounts: '++id, name, balance, createdAt, updatedAt',
  familyTransfers: '++id, amount, from, to, date, createdAt, updatedAt',
  auditLogs: '++id, action, timestamp, userId',
  globalSettings: '++id, failedPinAttempts, maxFailedAttempts, autoLockMinutes, taxRegime, birthdayBudget, birthdayAlertDays, emergencyContacts, dependents, salaryCreditDay, annualBonus, medicalInflationRate, educationInflation, vehicleInflation, maintenanceInflation, privacyMask, darkMode, timeZone, isTest, theme, deviceThemes, revealSecret',
  expenses: '++id, amount, date, category, description, createdAt, updatedAt',
  incomes: '++id, amount, date, category, sourceName, createdAt, updatedAt'
});

export { db };
