
import Dexie, { type EntityTable } from 'dexie';
import type { EmergencyFund, Investment } from '@/types/financial';

// Import other types that should exist
interface Txn {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'income' | 'expense';
  paymentMethod?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface RentalProperty {
  id: string;
  name: string;
  address: string;
  monthlyRent: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreditCard {
  id: string;
  name: string;
  last4: string;
  limit: number;
  currentBalance: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Loan {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Insurance {
  id: string;
  name: string;
  type: string;
  premium: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Gold {
  id: string;
  type: string;
  weight: number;
  purity: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: string;
  nextBilling: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Health {
  id: string;
  type: string;
  value: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BrotherRepayment {
  id: string;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface FamilyBankAccount {
  id: string;
  name: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FamilyTransfer {
  id: string;
  amount: number;
  from: string;
  to: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  userId?: string;
}

interface GlobalSettings {
  id: string;
  failedPinAttempts: number;
  maxFailedAttempts: number;
  autoLockMinutes: number;
  taxRegime: 'Old' | 'New';
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: string[];
  dependents: string[];
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

const db = new Dexie('SavoraDB') as Dexie & {
  txns: EntityTable<Txn, 'id'>;
  rentalProperties: EntityTable<RentalProperty, 'id'>();
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
};

// Schema definition using camelCase field names
db.version(1).stores({
  txns: '++id, amount, description, category, date, type, paymentMethod, createdAt, updatedAt',
  rentalProperties: '++id, name, address, monthlyRent, createdAt, updatedAt',
  goals: '++id, title, targetAmount, currentAmount, deadline, category, createdAt, updatedAt',
  vehicles: '++id, name, model, year, createdAt, updatedAt',
  creditCards: '++id, name, last4, limit, currentBalance, dueDate, createdAt, updatedAt',
  loans: '++id, name, principal, interestRate, createdAt, updatedAt',
  insurance: '++id, name, type, premium, createdAt, updatedAt',
  tenants: '++id, name, email, phone, createdAt, updatedAt',
  investments: '++id, name, type, currentValue, purchasePrice, quantity, purchaseDate, currentNav, units, investedValue, startDate, maturityDate, expectedReturn, createdAt, updatedAt',
  gold: '++id, type, weight, purity, createdAt, updatedAt',
  subscriptions: '++id, name, cost, billingCycle, nextBilling, createdAt, updatedAt',
  emergencyFunds: '++id, name, targetAmount, currentAmount, targetMonths, lastReviewDate, status, medicalSubBucket, medicalSubBucketUsed, monthlyExpenses, createdAt, updatedAt',
  health: '++id, type, value, date, createdAt, updatedAt',
  brotherRepayments: '++id, amount, date, createdAt, updatedAt',
  familyBankAccounts: '++id, name, balance, createdAt, updatedAt',
  familyTransfers: '++id, amount, from, to, date, createdAt, updatedAt',
  auditLogs: '++id, action, timestamp, userId',
  globalSettings: '++id, failedPinAttempts, maxFailedAttempts, autoLockMinutes, taxRegime, birthdayBudget, birthdayAlertDays, emergencyContacts, dependents, salaryCreditDay, annualBonus, medicalInflationRate, educationInflation, vehicleInflation, maintenanceInflation, privacyMask, darkMode, timeZone, isTest, theme, deviceThemes, revealSecret'
});

export { db };
export type { Txn, RentalProperty, Goal, Vehicle, CreditCard, Loan, Insurance, Tenant, Gold, Subscription, Health, BrotherRepayment, FamilyBankAccount, FamilyTransfer, AuditLog, GlobalSettings };
