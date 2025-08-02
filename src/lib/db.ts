
import Dexie, { Table } from 'dexie';

// --- Enhanced Interfaces from Requirements Spec ---

export interface GlobalSettings {
  id: string;
  taxRegime: 'Old' | 'New';
  autoLockMinutes: number;
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: Contact[];
  incomeTaxReturnJson?: string;
  telegramBotToken?: string;
  dependents: Dependent[];
  salaryCreditDay: number;
  annualBonus?: number;
  medicalInflationRate: number;
  educationInflation: number;
  vehicleInflation: number;
  maintenanceInflation: number;
  privacyMask: boolean;
  revealSecret?: string;
  failedPinAttempts: number;
  maxFailedAttempts: number;
  darkMode: boolean;
  timeZone: string;
  isTest: boolean;
  theme: 'light' | 'dark' | 'auto';
  deviceThemes?: Record<string, 'light' | 'dark' | 'auto'>;
}

export interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export interface Dependent {
  id: string;
  relation: 'Spouse' | 'Child' | 'Mother' | 'Grandmother' | 'Brother';
  name: string;
  dob: Date;
  gender: 'M' | 'F';
  chronic: boolean;
  schoolFeesAnnual?: number;
  isNominee: boolean;
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

// Universal Transaction - Core of the system
export interface Txn {
  id: string;
  date: Date;
  amount: number;
  currency: string; // hard-coded "INR"
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
}

export interface Goal {
  id: string;
  name: string;
  slug: string;
  type: 'Micro' | 'Small' | 'Short' | 'Medium' | 'Long';
  targetAmount: number;
  targetDate: Date;
  currentAmount: number;
  notes: string;
}

export interface CreditCard {
  id: string;
  issuer: string;
  bankName: string;
  last4: string;
  network: 'Visa' | 'Mastercard' | 'Rupay' | 'Amex';
  cardVariant: string;
  productVariant: string;
  annualFee: number;
  annualFeeGst: number;
  creditLimit: number;
  creditLimitShared: boolean;
  fuelSurchargeWaiver: boolean;
  rewardPointsBalance: number;
  cycleStart: number;
  stmtDay: number;
  dueDay: number;
  fxTxnFee: number;
  emiConversion: boolean;
  // Additional compatibility fields for UI components
  name?: string;
  currentBalance?: number;
  limit?: number;
  last4Digits?: string;
  dueDate?: string;
}

export interface Vehicle {
  id: string;
  owner: string;
  regNo: string;
  make: string;
  model: string;
  type: 'Car' | 'Motorcycle' | 'Scooter' | 'Truck' | 'Other';
  purchaseDate: Date;
  insuranceExpiry: Date;
  pucExpiry: Date;
  odometer: number;
  fuelEfficiency: number;
  fuelLogs: FuelFill[];
  serviceLogs: ServiceEntry[];
  claims: Claim[];
  treadDepthMM: number;
  depreciationRate?: number;
  ncbPercent?: number;
}

export interface FuelFill {
  date: Date;
  litres: number;
  odometer: number;
  isFullTank: boolean;
  cost: number;
}

export interface ServiceEntry {
  date: Date;
  odometer: number;
  description: string;
  cost: number;
  nextServiceDate?: Date;
  items: ServiceItem[];
}

export interface ServiceItem {
  category: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Claim {
  date: Date;
  amount: number;
  description: string;
}

export interface Investment {
  id: string;
  type: 'MF-Growth' | 'MF-Dividend' | 'SIP' | 'PPF' | 'EPF' | 'NPS-T1' | 'NPS-T2' | 'Gold-Coin' | 'Gold-ETF' | 'SGB' | 'FD' | 'RD' | 'Stocks' | 'Others' | 'Gift-Card-Float';
  name: string;
  folioNo?: string;
  currentNav: number;
  units: number;
  investedValue: number;
  currentValue: number;
  startDate: Date;
  maturityDate?: Date;
  sipAmount?: number;
  sipDay?: number;
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One-time';
  goalId?: string;
  lockInYears?: number;
  taxBenefit: boolean;
  familyMember: string;
  notes: string;
  interestRate?: number;
  interestCreditDate?: Date;
  dividendReceived?: number;
  indexCostInflation?: number;
  // Compatibility fields
  current_value?: number;
  invested_value?: number;
}

// Expense compatibility interface
export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  tags?: string[];
  payment_method?: string;
  source: string;
  account: string;
}

// Income compatibility interface  
export interface Income {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  source?: string;
  account_id: string;
}

// App Settings for compatibility
export interface AppSettingTable {
  key: string;
  value: any;
}

// Enhanced Dexie Database Class
export class SavoraDB extends Dexie {
  public globalSettings!: Table<GlobalSettings, string>;
  public txns!: Table<Txn, string>;
  public goals!: Table<Goal, string>;
  public creditCards!: Table<CreditCard, string>;
  public vehicles!: Table<Vehicle, string>;
  public investments!: Table<Investment, string>;
  
  // Legacy compatibility tables
  public expenses!: Table<Expense, string>;
  public incomes!: Table<Income, string>;
  public appSettings!: Table<AppSettingTable, string>;

  constructor() {
    super('SavoraFinanceDB');

    this.version(1).stores({
      globalSettings: '&id',
      txns: '&id, date, category, amount, goalId, cardId, vehicleId',
      goals: '&id, type, targetDate, name, slug',
      creditCards: '&id, issuer, bankName, last4',
      vehicles: '&id, regNo, owner, type',
      investments: '&id, type, name, startDate, goalId',
      // Legacy compatibility tables
      expenses: '&id, date, category, amount',
      incomes: '&id, date, category, amount',
      appSettings: '&key'
    });
  }

  // Enhanced methods for data access
  async savePersonalProfile(profile: any): Promise<void> {
    await this.appSettings.put({ key: 'userPersonalProfile_v1', value: profile });
  }

  async getPersonalProfile(): Promise<any | null> {
    const setting = await this.appSettings.get('userPersonalProfile_v1');
    return setting ? setting.value : null;
  }

  async getEmergencyFundSettings(): Promise<any> {
    const setting = await this.appSettings.get('emergencyFundSettings_v1');
    return setting ? setting.value : { efMonths: 6 };
  }

  async saveEmergencyFundSettings(settings: any): Promise<void> {
    await this.appSettings.put({ key: 'emergencyFundSettings_v1', value: settings });
  }
}

export const db = new SavoraDB();

// Enhanced error handling for database initialization
db.open().catch(async (err) => {
  if (err.name === "UpgradeError") {
    if (import.meta.env.DEV) {
      console.warn("Dev only DB wipe due to schema mismatch");
      await db.delete();
      await db.open();
    } else {
      console.error("Database upgrade error:", err);
    }
  } else {
    console.error("Failed to open Dexie database:", err);
  }
});
