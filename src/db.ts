import Dexie, { Table } from 'dexie';

// 1. Define an interface for each data type/table
// These should align with or be derived from your main spec interfaces

export interface Expense {
  id?: number; // Primary key, auto-incremented
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  tags?: string[]; // Stored as string array, Dexie handles this
  cardLast4?: string; // Optional, if paid by card
  // Add other fields from your spec as needed, e.g., merchant
  merchant?: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface Vehicle {
  id?: number; // Primary key, auto-incremented
  name: string;
  type: "motorcycle" | "car";
  owner?: "self" | "brother"; // Made optional for simplicity if not always known
  initial_odometer?: number;
  current_odometer?: number;
  // fuel_efficiency will be calculated, not stored directly here unless it's a target/manual override
  insurance_provider?: string;
  insurance_premium?: number;
  insurance_renewal_date?: string; // YYYY-MM-DD
  // Other fields from your spec can be added
}

export interface AppSetting {
  key: string; // Primary key (e.g., 'encryptedApiKey', 'userPinHash', 'lastSync')
  value: any;  // Can store various types of settings
}

// 2. Define the Database class
class SavoraDB extends Dexie {
  // Declare tables, using '!' for definite assignment assertion
  public expenses!: Table<Expense, number>;
  public vehicles!: Table<Vehicle, number>;
  public appSettings!: Table<AppSetting, string>; // Key is string

  // Other tables from your spec will be added here in later versions
  // Example:
  // public maintenance!: Table<MaintenanceRecord, number>;
  // public fuelRecords!: Table<FuelRecord, number>;
  // public investments!: Table<Investment, number>;
  // public creditCards!: Table<CreditCard, number>;
  // public loans!: Table<Loan, number>;
  // public realEstate!: Table<RealEstateProperty, number>;
  // public insurancePolicies!: Table<InsurancePolicy, number>;
  // public financialGoals!: Table<FinancialGoal, number>;
  // public yearlySummaries!: Table<YearlySummary, number>; // For data retention

  constructor() {
    super('SavoraFinanceDB'); // Database name

    // Define current schema version (version 1)
    this.version(1).stores({
      expenses: '++id, date, category, type, paymentMethod, cardLast4, merchant, tags', // Indexed fields
      vehicles: '++id, name, type',
      appSettings: '&key', // Primary key 'key' is unique, not auto-incrementing

      // Future tables can be added here or in subsequent versions
      // maintenance: '++id, vehicleId, date, [vehicleId+date]',
      // fuelRecords: '++id, vehicleId, date, [vehicleId+date]',
      // investments: '++id, type, date, name',
      // creditCards: '++id, lastFourDigits, dueDate',
      // ... and so on for other entities from your spec
    });

    // You can chain more versions here for schema migrations if needed in the future
    // this.version(2).stores({ ... }).upgrade(tx => { ... });
  }
}

// 3. Export a single instance of the database
export const db = new SavoraDB();

// Basic example of how to use it (for testing/dev purposes, not part of the service itself)
/*
async function testDB() {
  try {
    // Add an expense
    const expenseId = await db.expenses.add({
      date: new Date().toISOString().split('T')[0],
      description: 'Test Coffee',
      amount: 150,
      category: 'Food',
      type: 'expense',
      paymentMethod: 'UPI'
    });
    console.log(`Added expense with id ${expenseId}`);

    // Get all expenses
    const allExpenses = await db.expenses.toArray();
    console.log('All expenses:', allExpenses);

    // Add a setting
    await db.appSettings.put({ key: 'testSetting', value: 'testValue' });
    const setting = await db.appSettings.get('testSetting');
    console.log('Test setting:', setting);

  } catch (error) {
    console.error('Dexie DB test error:', error);
  }
}

// testDB(); // Uncomment to test basic DB operations in console when this file is imported
*/
