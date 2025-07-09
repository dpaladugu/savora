import Dexie, { Table } from 'dexie';
import type {
  AppSetting,
  ProfileData,
  ExpenseData,
  IncomeSourceData,
  InvestmentData,
  YearlySummary
} from '@/types/jsonPreload';

import type { Income as AppIncome } from '@/components/income/income-tracker';
import type { Expense as AppExpense } from '@/services/supabase-data-service';

export type AppSettingTable = AppSetting;

// --- Record Interface Definitions for Dexie Tables ---

export interface RecurringTransactionRecord {
  id: string; user_id?: string; description: string; amount: number; type: 'income' | 'expense';
  category: string; payment_method?: string; frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; start_date: string; end_date?: string; day_of_week?: number; day_of_month?: number;
  next_occurrence_date?: string; is_active?: boolean; created_at?: Date; updated_at?: Date;
}

export interface DexieCreditCardRecord {
  id: string; user_id?: string; name: string; issuer: string; limit: number; currentBalance: number;
  billCycleDay: number; dueDate: string; autoDebit: boolean; last4Digits?: string;
  created_at?: Date; updated_at?: Date;
}

export interface DexieGoldInvestmentRecord {
  id: string; user_id?: string; weight: number; purity: string; purchasePrice: number; currentPrice?: number;
  purchaseDate: string; paymentMethod: string; storageLocation: string; form: string;
  vendor?: string; note?: string; created_at?: Date; updated_at?: Date;
}

export interface DexieInsurancePolicyRecord {
  id: string; user_id?: string; policyName: string; policyNumber?: string; insurer: string; type: string;
  premium: number; frequency: string; startDate?: string; endDate?: string; coverageAmount?: number;
  nextDueDate?: string; status: string; note?: string; created_at?: Date; updated_at?: Date;
}

export interface DexieLoanEMIRecord {
  id: string; user_id?: string; loanType: string; lender: string; principalAmount: number; emiAmount: number;
  interestRate?: number; tenureMonths: number; startDate?: string; endDate?: string; nextDueDate?: string;
  remainingAmount?: number; status: string; account?: string; note?: string; created_at?: Date; updated_at?: Date;
}

export interface DexieVehicleRecord {
  id: string; user_id?: string; name: string; registrationNumber: string; make?: string; model?: string;
  year?: number; fuelType?: string; color?: string; mileage?: number; purchaseDate?: string; purchasePrice?: number;
  insurancePolicyNumber?: string; insuranceExpiryDate?: string; engineNumber?: string; chassisNumber?: string;
  notes?: string; created_at?: Date; updated_at?: Date;
}

export interface DexieTagRecord {
  id: string; user_id?: string; name: string; color?: string;
  created_at?: Date; updated_at?: Date;
}

export interface DexieAccountRecord { // New interface for Accounts
  id: string; // UUID
  user_id?: string;
  name: string;
  type: 'Bank' | 'Wallet' | string; // Allow string for other types
  balance: number;
  accountNumber?: string; // Optional, mainly for bank accounts
  provider: string; // Bank name or Wallet provider name
  isActive: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

// --- Dexie Database Class ---
export class SavoraDB extends Dexie {
  public appSettings!: Table<AppSettingTable, string>;
  public expenses!: Table<AppExpense, string>;
  public incomes!: Table<AppIncome, string>;
  public incomeSources!: Table<IncomeSourceData, string>;
  public vehicles!: Table<DexieVehicleRecord, string>;
  public loans!: Table<DexieLoanEMIRecord, string>;
  public investments!: Table<InvestmentData, string>;
  public creditCards!: Table<DexieCreditCardRecord, string>;
  public yearlySummaries!: Table<YearlySummary, number>;
  public recurringTransactions!: Table<RecurringTransactionRecord, string>;
  public goldInvestments!: Table<DexieGoldInvestmentRecord, string>;
  public insurancePolicies!: Table<DexieInsurancePolicyRecord, string>;
  public tags!: Table<DexieTagRecord, string>;
  public accounts!: Table<DexieAccountRecord, string>; // New table property

  constructor() {
    super('SavoraFinanceDB');

    this.version(3).stores({
        appSettings: '&key',
        expenses: '++id, date, category, amount, cardLast4, type, merchant, *tags',
        vehicles: '++id, name, type',
        investments: '++id, type, date, name, platform',
        creditCards: '++id, &lastDigits, name, bankName',
        loans: '++id, name, lenderName, type',
        insurancePolicies: '++id, type, policyNumber, renewalDate',
        maintenanceRecords: '++id, vehicleId, date, [vehicleId+date], type',
        parts: '++id, maintenanceId, name',
        fuelRecords: '++id, vehicleId, date, [vehicleId+date]',
        yearlySummaries: '++id, year, category, type',
        realEstateProperties: '++id, name, address',
        financialGoals: '++id, name, priority, targetDate',
        incomeSources: '++id, source, frequency, account',
        accounts: '++id, name, type, provider', // Simple old schema for accounts if it existed
    });

    this.version(4).stores({
      incomes: '&id, user_id, date, category, source',
      vehicles: '++id, vehicle_name, owner, type',
      loans: '++id, loan_name, lender, interest_rate',
      investments: '++id, fund_name, investment_type, category',
      creditCards: '++id, &lastDigits, bank_name, card_name',
      incomeSources: '++id, source, frequency, account',
    }).upgrade(async tx => {
        console.log("Upgrading Dexie DB to v4.");
        await tx.table('vehicles').toCollection().modify(v => { if(v.name && !v.vehicle_name) {v.vehicle_name = v.name; delete v.name;} });
        await tx.table('investments').toCollection().modify(i => { if(i.name && !i.fund_name) {i.fund_name = i.name; delete i.name;} if(!i.investment_type && i.type) {i.investment_type = i.type;} });
        await tx.table('loans').toCollection().modify(l => { if(l.name && !l.loan_name) {l.loan_name = l.name; delete l.name;} });
    });

    this.version(5).stores({
      expenses: '&id, user_id, date, category, amount, description, payment_method, *tags_flat, source, merchant, account',
    }).upgrade(async tx => {
      console.log("Upgrading Dexie DB to v5: Expenses PK to UUID, schema update.");
    });

    this.version(6).stores({
      recurringTransactions: '&id, user_id, description, type, category, frequency, start_date, next_occurrence_date, end_date, is_active',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v6: Added recurringTransactions."));

    this.version(7).stores({
      creditCards: '&id, user_id, name, issuer, dueDate',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v7: CreditCards PK to UUID and schema update."));

    this.version(8).stores({
      goldInvestments: '&id, user_id, purchaseDate, form, purity, storageLocation, vendor',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v8: Added goldInvestments."));

    this.version(9).stores({
      insurancePolicies: '&id, user_id, policyName, insurer, type, nextDueDate, status',
      loans: '&id, user_id, loanType, lender, nextDueDate, status, principalAmount, emiAmount, tenureMonths',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v9: Added insurancePolicies, Loans PK to UUID and schema update."));

    this.version(10).stores({
      vehicles: '&id, user_id, name, registrationNumber, make, model, fuelType, insuranceExpiryDate',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v10: Vehicles PK to UUID and schema update."));

    this.version(11).stores({
      investments: '&id, user_id, fund_name, investment_type, category, purchaseDate',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v11: Investments PK to UUID and schema update."));

    this.version(12).stores({
      incomeSources: '&id, user_id, name, frequency, account, defaultAmount',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v12: IncomeSources PK to UUID and schema update."));

    this.version(13).stores({
      tags: '&id, user_id, &[user_id+name], color',
    }).upgrade(async () => console.log("Upgrading Dexie DB to v13: Adding 'tags' table."));

    // Version 14 - Added/Updated accounts table
    this.version(14).stores({
      accounts: '&id, user_id, name, type, provider, isActive', // UUID PK, indexed fields
    }).upgrade(async tx => {
      console.log("Upgrading Dexie DB to v14: Adding/Updating 'accounts' table with UUID PK and detailed schema.");
      // Placeholder for migrating 'accounts' table if it existed with an old schema.
      // If migrating from '++id, name, type, provider' (example old schema in v3)
      // await tx.table('accounts').clear(); // Simplest if data can be re-entered or lost
    });

    // Initialize table properties
    this.appSettings = this.table('appSettings');
    this.expenses = this.table('expenses');
    this.incomes = this.table('incomes');
    this.incomeSources = this.table('incomeSources');
    this.vehicles = this.table('vehicles');
    this.loans = this.table('loans');
    this.investments = this.table('investments');
    this.creditCards = this.table('creditCards');
    this.yearlySummaries = this.table('yearlySummaries');
    this.recurringTransactions = this.table('recurringTransactions');
    this.goldInvestments = this.table('goldInvestments');
    this.insurancePolicies = this.table('insurancePolicies');
    this.tags = this.table('tags');
    this.accounts = this.table('accounts'); // Initialize new accounts table
  }

  async savePersonalProfile(profile: ProfileData): Promise<void> {
    await this.appSettings.put({ key: 'userPersonalProfile_v1', value: profile });
  }

  async getPersonalProfile(): Promise<ProfileData | null> {
    const setting = await this.appSettings.get('userPersonalProfile_v1');
    return setting ? (setting.value as ProfileData) : null;
  }
}

export const db = new SavoraDB();

export type Expense = ExpenseData;
export { YearlySummary };
// Note on other *Data types from jsonPreload:
// IncomeSourceData and InvestmentData are now the primary types for their respective tables.
// VehicleData, LoanData, CreditCardData from jsonPreload are effectively superseded by
// DexieVehicleRecord, DexieLoanEMIRecord, DexieCreditCardRecord for new Dexie interactions.
// An AccountData type might be useful if defined in jsonPreload and used by DexieAccountRecord.
