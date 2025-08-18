
import Dexie, { type EntityTable } from 'dexie';
import type { EmergencyFund, Investment, CreditCard, RentalProperty, Health, Txn, Goal, Tenant } from '@/types/financial';

interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
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
  globalSettings: '++id, failedPinAttempts, maxFailedAttempts, autoLockMinutes, taxRegime, birthdayBudget, birthdayAlertDays, emergencyContacts, dependents, salaryCreditDay, annualBonus, medicalInflationRate, educationInflation, vehicleInflation, maintenanceInflation, privacyMask, darkMode, timeZone, isTest, theme, deviceThemes, revealSecret'
});

export { db };
export type { Vehicle, Loan, Insurance, Gold, Subscription, BrotherRepayment, FamilyBankAccount, FamilyTransfer, AuditLog, GlobalSettings };
