import Dexie, { Table } from 'dexie';
import type {
  AppSetting, // Now directly importing AppSetting
  ProfileData,
  ExpenseData,
  IncomeSourceData,
  VehicleData,
  LoanData,
  InvestmentData,
  CreditCardData,
  YearlySummary // Assuming YearlySummary is also in jsonPreload.ts
} from '@/types/jsonPreload';

// Use AppSetting directly for the table type
export type AppSettingTable = AppSetting;

// Assuming the refined Expense interface will be available, e.g., from a shared types file
// Use AppSetting directly for the table type
export type AppSettingTable = AppSetting;

// Import centralized Income and Expense types
import type { Income, Expense } from '@/types/entities';

// --- Dexie Database Class (Single, Consolidated Definition) ---
export class SavoraDB extends Dexie {
  // Table Property Declarations
  public appSettings!: Table<AppSettingTable, string>;
  public expenses!: Table<Expense, string>; // Use central Expense type
  public incomes!: Table<Income, string>;  // Use central Income type
  public incomeSources!: Table<IncomeSourceData, number>;
  public vehicles!: Table<VehicleData, number>;
  public loans!: Table<LoanData, number>;
  public investments!: Table<InvestmentData, number>; // Simplified for MVP
  public creditCards!: Table<CreditCardData, number>;
  public yearlySummaries!: Table<YearlySummary, number>;

  constructor() {
    super('SavoraFinanceDB');

    // Bump version number due to expenses schema change
    this.version(5).stores({
      appSettings: '&key',
      // Updated expenses schema: id is UUID string, added user_id, tags is string for simplicity with Dexie basic indexing
      // For array tags, more complex indexing or client-side filtering is needed if searching within tags.
      // For Supabase, tags can be TEXT[]
      expenses: '&id, user_id, date, category, amount, description, payment_method, *tags_flat, source, merchant, account',
      incomes: '&id, user_id, date, category, source',
      incomeSources: '++id, source, frequency, account',
      vehicles: '++id, vehicle_name, owner, type',
      loans: '++id, loan_name, lender, interest_rate',
      investments: '++id, fund_name, investment_type, category',
      creditCards: '++id, &lastDigits, bank_name, card_name',
      yearlySummaries: '++id, year, category, type',
    }).upgrade(async tx => {
      // Migration for expenses table:
      // If you have existing data in 'expenses' with numeric IDs, it needs to be handled.
      // For this refactor, we assume we might be starting fresh or data loss for old expenses is acceptable.
      // A proper migration would read old expenses, assign UUIDs, add user_id (if possible), and put into new structure.
      // Placeholder for a more complex migration if needed:
      console.log("Upgrading expenses table schema for version 5. Old data might not be directly compatible without migration logic.");
      // If old expenses table data needs to be cleared because of incompatible ID types:
      // await tx.table('expenses').clear(); // Uncomment if clearing is desired during upgrade
      // This example does not migrate data, it just sets up the new schema.
      // For tags, if they were an array, they need to be flattened to a string for '*tags_flat' or handled differently.
      // The new AppExpense interface uses string[], so for Dexie we might store it as a comma-separated string if using '*tags_flat'.
      // Or, don't multiEntry index tags in Dexie and filter in JS / rely on Supabase for tag filtering.
      // For simplicity, let's assume 'tags_flat' is a string representation for now for Dexie,
      // while AppExpense and Supabase use string[]. The service layer would handle conversion.
      // The schema 'description' is added. 'type', 'merchant', 'source', 'cardLast4' from old schema are reviewed.
      // 'type' is implicit. 'merchant', 'source' are in new model. 'cardLast4' can be part of 'account'.
      return tx.table('expenses').toCollection().modify(exp => {
        // Example modification if 'tags' was an array and needs to be flattened for 'tags_flat'
        if (Array.isArray(exp.tags)) {
            exp.tags_flat = exp.tags.join(',');
        }
        // If old ID was numeric and new is string, this won't auto-migrate.
        // This is a placeholder for actual data transformation if needed.
      });
    });

    this.version(4).stores({
      appSettings: '&key',
      // Old expenses schema for reference during potential manual migration or if v4 was the active one
      expenses: '++id, date, category, amount, type, merchant, source, cardLast4, *tags',
      incomes: '&id, user_id, date, category, source',
      incomeSources: '++id, source, frequency, account',
      vehicles: '++id, vehicle_name, owner, type',
      loans: '++id, loan_name, lender, interest_rate',
      investments: '++id, fund_name, investment_type, category',
      creditCards: '++id, &lastDigits, bank_name, card_name',
      yearlySummaries: '++id, year, category, type',
    });

    this.version(3).stores({
        appSettings: '&key',
        expenses: '++id, date, category, amount, cardLast4, type, merchant, *tags',
        vehicles: '++id, name, type',
        maintenanceRecords: '++id, vehicleId, date, [vehicleId+date], type',
        parts: '++id, maintenanceId, name',
        fuelRecords: '++id, vehicleId, date, [vehicleId+date]',
        investments: '++id, type, date, name, platform',
        creditCards: '++id, &lastDigits, name, bankName',
        yearlySummaries: '++id, year, category, type',
        loans: '++id, name, lenderName, type',
        realEstateProperties: '++id, name, address',
        insurancePolicies: '++id, type, policyNumber, renewalDate',
        financialGoals: '++id, name, priority, targetDate',
    }).upgrade(async tx => {
        console.log("Attempting to upgrade Dexie DB from version 3 to version 4.");
        await tx.table('vehicles').toCollection().modify(vehicle => {
          if (vehicle.name && !vehicle.vehicle_name) {
            vehicle.vehicle_name = vehicle.name;
            delete vehicle.name;
          }
        });
        await tx.table('investments').toCollection().modify(inv => {
            if (inv.name && !inv.fund_name) {
                inv.fund_name = inv.name;
                delete inv.name;
            }
            if (!inv.investment_type && inv.type) { // Assuming 'type' was the old field for 'investment_type'
                inv.investment_type = inv.type;
            }
        });
        await tx.table('loans').toCollection().modify(loan => {
            if (loan.name && !loan.loan_name) {
                loan.loan_name = loan.name;
                delete loan.name;
            }
        });
    });

    this.appSettings = this.table('appSettings');
    this.expenses = this.table('expenses');
    this.incomes = this.table('incomes'); // Initialize new table
    this.incomeSources = this.table('incomeSources');
    this.vehicles = this.table('vehicles');
    this.loans = this.table('loans');
    this.investments = this.table('investments');
    this.creditCards = this.table('creditCards');
    this.yearlySummaries = this.table('yearlySummaries');
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

// Export type aliases for backward compatibility
export type Expense = ExpenseData;
export type Vehicle = VehicleData;
export type Investment = InvestmentData;
export type Loan = LoanData;
export type CreditCard = CreditCardData;
export { YearlySummary };
