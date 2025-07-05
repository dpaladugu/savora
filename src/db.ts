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

// --- Dexie Database Class (Single, Consolidated Definition) ---
export class SavoraDB extends Dexie {
  // Table Property Declarations
  public appSettings!: Table<AppSettingTable, string>;
  public expenses!: Table<ExpenseData, number>;
  public incomeSources!: Table<IncomeSourceData, number>;
  public vehicles!: Table<VehicleData, number>;
  public loans!: Table<LoanData, number>;
  public investments!: Table<InvestmentData, number>; // Simplified for MVP
  public creditCards!: Table<CreditCardData, number>;
  public yearlySummaries!: Table<YearlySummary, number>;

  constructor() {
    super('SavoraFinanceDB');

    this.version(4).stores({
      appSettings: '&key',
      expenses: '++id, date, category, amount, type, merchant, source, cardLast4, *tags',
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
