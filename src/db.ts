import Dexie, { Table } from 'dexie';
import type {
  AppSetting, // Keep existing AppSetting if still needed
  ProfileData,
  ExpenseData,
  IncomeSourceData,
  VehicleData,
  LoanData,
  InvestmentData,
  CreditCardData
  // Import other *Data types if they are part of AppSetting or ProfileData directly
} from '@/types/jsonPreload'; // Assuming @ is src

// Re-define AppSetting here if it's not in jsonPreload.ts or needs adjustment
export interface AppSettingTable extends AppSetting { // Ensure AppSetting has 'key'
  // key: string; // Already in AppSetting from jsonPreload if defined as { key: string; value: any; }
  // value: any;
}

// --- Dexie Database Class ---

class SavoraDB extends Dexie {
  // Core MVP Tables
  public appSettings!: Table<AppSettingTable, string>; // For general settings, API keys, user profile parts
  public expenses!: Table<ExpenseData, number>;
  public incomeSources!: Table<IncomeSourceData, number>;
  public vehicles!: Table<VehicleData, number>;
  public loans!: Table<LoanData, number>;
  public investments!: Table<InvestmentData, number>; // Simplified for MVP (mainly MFs)
  public creditCards!: Table<CreditCardData, number>;

  // Tables from the previous Savora Spec-based version (to be reviewed/removed if not in MVP JSON)
  // public maintenanceRecords!: Table<MaintenanceRecord, number>; // Example, if MaintenanceRecord type exists
  // public parts!: Table<Part, number>;
  // public fuelRecords!: Table<FuelRecord, number>;
  // public yearlySummaries!: Table<YearlySummary, number>; // This is used by dataRetention.ts, so keep.
  // public realEstateProperties!: Table<RealEstateProperty, number>;
  // public insurancePolicies!: Table<InsurancePolicy, number>;
  // public financialGoals!: Table<FinancialGoal, number>;

  // Adding YearlySummary for dataRetention.ts
  public yearlySummaries!: Table<YearlySummary, number>;
   // Define YearlySummary interface if not already imported or defined
   // For now, assuming it's defined elsewhere or implicitly by dataRetention.ts's needs
   // Ideally, it should also be in jsonPreload.ts or a common types file.
   // Let's add a placeholder for YearlySummary if it's not imported.
}
export interface YearlySummary { // Placeholder if not defined/imported, align with dataRetention.ts
    id?: number;
    year: number;
    category?: string;
    type: 'expense' | 'income' | 'investment' | string;
    totalAmount: number;
    transactionCount: number;
}


// Constructor
export class SavoraDB extends Dexie {
  constructor() {
    super('SavoraFinanceDB'); // Database name

    // Schema version 4 - focused on MVP JSON Preload
    // This version will replace/update tables based on the new JSON structure.
    // Previous version(3) was based on the Savora Spec doc.
    this.version(4).stores({
      // MVP Tables based on comprehensive JSON
      appSettings: '&key', // Stores user profile parts, API keys, etc.
      expenses: '++id, date, category, amount, type, merchant, source, cardLast4, *tags', // Key fields for querying
      incomeSources: '++id, source, frequency, account',
      vehicles: '++id, vehicle, owner, type', // 'vehicle' is the name field from JSON
      loans: '++id, loan, lender, interest_rate', // 'loan' is the name field from JSON
      investments: '++id, fund, investment_type, category', // 'fund' is name, 'investment_type' to distinguish
      creditCards: '++id, &lastDigits, bank_name, card_name', // Assuming lastDigits is a good unique candidate

      // Retaining yearlySummaries from previous version for dataRetention.ts
      yearlySummaries: '++id, year, category, type',

      // Comment out or remove tables from version(3) that are not part of this MVP
      // or are significantly restructured.
      // For example, the old 'maintenanceRecords', 'parts', 'fuelRecords' might need
      // different structures if we decide to populate them from vehicle-related expenses later.
      // For now, focusing on getting the direct JSON sections into their tables.
      // maintenanceRecords: null, // Example of how to remove a table in a new version
    });

    // Placeholder for migration from version 3 (Savora Spec based) to version 4 (JSON MVP based)
    // This would be crucial if there was user data in version 3 that needs transforming.
    // For now, we assume that `feat/phase1-core-infra` was not used by end-users yet,
    // so a direct definition of version 4 is okay. If there was a v3 in use,
    // we'd need an upgrade function here.
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
    }).upgrade(tx => {
        // This upgrade function is for migrating data from the schema defined
        // in `feat/phase1-core-infra` (which I called v3 based on Savora spec)
        // to the new v4 schema (based on JSON MVP).
        // This would involve mapping data from old tables/fields to new ones.
        // Example: if 'vehicles.name' in v3 maps to 'vehicles.vehicle' in v4.
        // For now, this is a placeholder. If no v3 data exists, it does nothing.
        console.log("Attempting to upgrade from version 3 (Savora Spec based) to version 4 (JSON MVP). Migration logic placeholder.");
        // tx.table('oldTable').clear(); // Example if removing a table
        // return tx.table('someTable').toCollection().modify(item => { item.newField = item.oldField; delete item.oldField; });
    });


    // Initialize table properties
    this.appSettings = this.table('appSettings');
    this.expenses = this.table('expenses');
    this.incomeSources = this.table('incomeSources');
    this.vehicles = this.table('vehicles');
    this.loans = this.table('loans');
    this.investments = this.table('investments');
    this.creditCards = this.table('creditCards');
    this.yearlySummaries = this.table('yearlySummaries');

    // We will handle personal_profile data likely via appSettings or a dedicated single-row table if it's complex.
    // For MVP, individual fields of personal_profile can be stored in appSettings.
  }

  // Storing complex single objects like 'personal_profile' can be done in appSettings
  // or a dedicated table if preferred.
  async savePersonalProfile(profile: ProfileData): Promise<void> {
    await this.appSettings.put({ key: 'userPersonalProfile_v1', value: profile });
  }

  async getPersonalProfile(): Promise<ProfileData | null> {
    const setting = await this.appSettings.get('userPersonalProfile_v1');
    return setting ? (setting.value as ProfileData) : null;
  }

  // --- Complex Query Example from previous version (getVehicleMaintenanceHistoryWithParts) ---
  // This query depended on 'maintenanceRecords' and 'parts' tables.
  // If these tables are not part of the MVP JSON preload schema, or are significantly
  // changed, this query will need to be re-evaluated or temporarily removed/commented out.
  // For now, commenting out as 'maintenanceRecords' and 'parts' are not primary MVP tables.
  /*
  async getVehicleMaintenanceHistoryWithParts(vehicleId: number): Promise<MaintenanceRecord[]> {
    // ... (implementation depends on MaintenanceRecord and Part interfaces and tables)
  }
  */
}

export const db = new SavoraDB();

// --- Example Usage (for testing during development) ---
/*
async function testDBOperations() {
  try {
    // Example: Add personal profile
    await db.savePersonalProfile({ age: '30M', location: 'Test City' });
    const profile = await db.getPersonalProfile();
    console.log('Fetched profile:', profile);

    // Example: Add an expense using the new ExpenseData structure
    await db.expenses.add({
      date: '2024-07-31',
      amount: 120,
      description: 'Coffee MVP',
      category: 'Food',
      payment_method: 'UPI',
      source: 'Form'
    });
    const expenses = await db.expenses.toArray();
    console.log('Current expenses:', expenses);

  } catch (error) {
    console.error('DB Test Operations Error:', error);
  }
}

// testDBOperations(); // Uncomment to run test operations
*/
