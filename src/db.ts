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
  id: string; // Primary Key
  user_id?: string; // Foreign key to user

  // Core identification
  name: string; // Vehicle's display name (e.g., "My Red Swift", "Office Bike")
  registrationNumber: string; // Vehicle Registration Number (License Plate)
  make?: string; // e.g., "Maruti Suzuki", "Honda", "Toyota"
  model?: string; // e.g., "Swift", "Activa", "Corolla"
  year?: number; // Manufacturing year
  color?: string;
  type?: string; // General type like "Car", "Motorcycle", "Scooter"
  owner?: string; // e.g., "Self", "Spouse", "Company"
  status?: string; // e.g., "Active", "Sold", "In Repair", "Out of service"

  // Purchase and Financials
  purchaseDate?: string; // ISO Date string (YYYY-MM-DD)
  purchasePrice?: number;

  // Technical Details
  fuelType?: string; // e.g., "Petrol", "Diesel", "Electric", "Hybrid", "CNG"
  engineNumber?: string;
  chassisNumber?: string;
  currentOdometer?: number; // Current odometer reading
  fuelEfficiency?: string; // e.g., "15 km/l", "50 km/charge" (can be string to accommodate units)

  // Insurance Details (Basic)
  insuranceProvider?: string;
  insurancePolicyNumber?: string; // Kept from original, though not in v10 schema. Good to have.
  insuranceExpiryDate?: string; // ISO Date string (YYYY-MM-DD) - This was in v10 schema
  insurance_premium?: number; // Renaming from previous VehicleData to align naming
  insurance_frequency?: string; // e.g., "Annual", "Bi-Annual", "3-Year"

  // Tracking & Maintenance (Basic)
  tracking_type?: string; // e.g., "GPS", "FASTag", "None"
  tracking_last_service_odometer?: number;
  next_pollution_check?: string; // ISO Date string (YYYY-MM-DD)
  location?: string; // Current general location or parking spot
  repair_estimate?: number; // For any ongoing or upcoming repair

  // Misc
  notes?: string; // General notes

  // Audit
  created_at?: Date;
  updated_at?: Date;
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

    // Base schema definition, version 1 (or your initial version)
    this.version(1).stores({
      appSettings: '&key',
      // ... other initial tables if any
    });

    // Version 3: Added many new tables
    this.version(3).stores({
        appSettings: '&key', // No change to appSettings PK
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
        accounts: '++id, name, type, provider',
    });

    // Version 4: Schema changes and data migration
    this.version(4).stores({
      incomes: '&id, user_id, date, category, source', // New table
      vehicles: '++id, vehicle_name, owner, type', // Modified
      loans: '++id, user_id, loan_name, lender, interest_rate', // Modified
      investments: '++id, fund_name, investment_type, category', // Modified
      creditCards: '++id, &lastDigits, bank_name, card_name', // Modified
      incomeSources: '++id, source, frequency, account', // No change, but good to list
    }).upgrade(async tx => {
        console.log("Upgrading Dexie DB to v4.");
        await tx.table('vehicles').toCollection().modify(v => { if(v.name && !v.vehicle_name) {v.vehicle_name = v.name; delete v.name;} });
        await tx.table('investments').toCollection().modify(i => { if(i.name && !i.fund_name) {i.fund_name = i.name; delete i.name;} if(!i.investment_type && i.type) {i.investment_type = i.type;} });
        await tx.table('loans').toCollection().modify(l => { if(l.name && !l.loan_name) {l.loan_name = l.name; delete l.name;} });
    });

    // Version 5: Expenses table primary key changed to UUID
    this.version(5).stores({
      expenses: '&id, user_id, date, category, amount, description, payment_method, *tags_flat, source, merchant, account',
    });

    // Version 6: Added recurringTransactions table
    this.version(6).stores({
      recurringTransactions: '&id, user_id, description, type, category, frequency, start_date, next_occurrence_date, end_date, is_active',
    });

    // Version 8: Added goldInvestments table
    this.version(8).stores({
      goldInvestments: '&id, user_id, purchaseDate, form, purity, storageLocation, vendor',
    });

    // Version 9: Added insurancePolicies table
    this.version(9).stores({
      insurancePolicies: '&id, user_id, policyName, insurer, type, nextDueDate, status',
    });

    // Version 11: Updated investments table
    this.version(11).stores({
      investments: '&id, user_id, fund_name, investment_type, category, purchaseDate',
    });

    // Version 12: Updated incomeSources table
    this.version(12).stores({
      incomeSources: '&id, user_id, name, frequency, account, defaultAmount',
    });

    // Version 13: Added tags table
    this.version(13).stores({
      tags: '&id, user_id, &[user_id+name], color',
    });

    // Version 14: Added/Updated accounts table
    this.version(14).stores({
      accounts: '&id, user_id, name, type, provider, isActive',
    });

    // Version 15: Enhanced Vehicle Schema
    this.version(15).stores({
      vehicles: '&id, user_id, name, registrationNumber, type, status, purchaseDate, insuranceExpiryDate, next_pollution_check, make, model, fuelType, owner',
    });

    // Version 17: Added user_id index to loans
    this.version(17).stores({
      loans: '&id, user_id, loanType, lender, status, nextDueDate',
    });

    // Final, current version of the database.
    // This should be the highest version number.
    this.version(18).stores({}); // No schema changes, just ensuring it's the latest version.


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
export type Vehicle = DexieVehicleRecord; // Exporting DexieVehicleRecord as Vehicle

// Note on other *Data types from jsonPreload:
// IncomeSourceData and InvestmentData are now the primary types for their respective tables.
// VehicleData, LoanData, CreditCardData from jsonPreload are effectively superseded by
// DexieVehicleRecord, DexieLoanEMIRecord, DexieCreditCardRecord for new Dexie interactions.
// An AccountData type might be useful if defined in jsonPreload and used by DexieAccountRecord.
