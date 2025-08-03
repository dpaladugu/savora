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

// NEW ENTITIES FROM REQUIREMENTS SPEC

export interface RentalProperty {
  id: string;
  address: string;
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: 'House' | 'Apartment' | 'Plot' | 'Commercial';
  squareYards: number;
  latitude?: number;
  longitude?: number;
  monthlyRent: number;
  dueDay: number;
  escalationPercent: number;
  escalationDate: Date;
  lateFeeRate: number;
  noticePeriodDays: number;
  depositRefundPending: boolean;
  propertyTaxAnnual: number;
  propertyTaxDueDay: number;
  waterTaxAnnual: number;
  waterTaxDueDay: number;
  maintenanceReserve: number;
}

export interface Tenant {
  id: string;
  propertyId: string;
  tenantName: string;
  roomNo?: string;
  monthlyRent: number;
  depositPaid: number;
  joinDate: Date;
  endDate?: Date;
  depositRefundPending: boolean;
  tenantContact: string;
}

export interface Gold {
  id: string;
  form: 'Coin' | 'Bar' | 'Jewellery' | 'Ornament';
  description: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight: number;
  purity: '22K' | '24K' | '18K' | '14K';
  purchasePrice: number;
  makingCharge: number;
  gstPaid: number;
  hallmarkCharge: number;
  karatPrice: number;
  purchaseDate: Date;
  merchant: string;
  storageLocation: string;
  storageCost: number;
  familyMember: string;
  insurancePolicyId?: string;
  receiptUri?: string;
  saleDate?: Date;
  salePrice?: number;
  profit?: number;
  goldLoanId?: string;
  loanInterestRate?: number;
  currentMcxPrice?: number;
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

export interface Insurance {
  id: string;
  type: 'Health' | 'Term' | 'Vehicle' | 'Home' | 'Travel' | 'Personal-Accident' | 'Critical-Illness';
  provider: string;
  policyNo: string;
  sumInsured: number;
  premium: number;
  dueDay: number;
  startDate: Date;
  endDate: Date;
  nomineeName: string;
  nomineeDOB: string;
  nomineeRelation: string;
  familyMember: string;
  personalTermCover?: number;
  personalHealthCover?: number;
  employerTermCover?: number;
  employerHealthCover?: number;
  personalLiabilityCover?: number;
  notes: string;
}

export interface Loan {
  id: string;
  type: 'Personal' | 'Personal-Brother' | 'Education-Brother';
  borrower: 'Me' | 'Brother';
  principal: number;
  roi: number;
  tenureMonths: number;
  emi: number;
  outstanding: number;
  startDate: Date;
  amortisationSchedule: AmortRow[];
  isActive: boolean;
  prepaymentPenalty?: number;
  moratoriumMonths?: number;
  loanInsurance?: string;
  guarantorName?: string;
}

export interface AmortRow {
  month: number;
  emi: number;
  principalPart: number;
  interestPart: number;
  balance: number;
}

export interface BrotherRepayment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  mode: 'Cash' | 'UPI' | 'Bank';
  note: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'Monthly' | 'Quarterly' | 'Annually';
  startDate: Date;
  nextDue: Date;
  reminderDays: number;
  isActive: boolean;
}

export interface Health {
  id: string;
  refillAlertDays: number;
  allergySeverity?: 'Low' | 'Medium' | 'High';
  emergencyContact?: string;
  nextCheckupDate?: Date;
  doctorNotes?: string;
  medicalHistory?: string;
  prescriptions: Prescription[];
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  familyHistory: string[];
  lifeExpectancy?: number;
  vaccinations: Vaccination[];
  vitals: Vital[];
}

export interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}

export interface Vaccination {
  name: string;
  dueDate: Date;
  administeredDate?: Date;
  reminderDays: number;
  notes: string;
}

export interface Vital {
  date: Date;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  hba1c?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  vitaminD?: number;
  vitaminB12?: number;
  creatinine?: number;
}

export interface FamilyBankAccount {
  id: string;
  owner: 'Mother' | 'Grandmother';
  bankName: string;
  accountNo: string;
  type: 'Savings' | 'Current' | 'FD';
  currentBalance: number;
}

export interface FamilyTransfer {
  id: string;
  fromAccountId: string;
  toPerson: 'Mother' | 'Grandmother' | 'Brother';
  amount: number;
  date: Date;
  purpose: string;
  mode: 'Cash' | 'UPI' | 'Bank';
}

export interface EmergencyFund {
  id: string;
  targetMonths: number;
  targetAmount: number;
  currentAmount: number;
  lastReviewDate: Date;
  status: 'OnTrack' | 'Under-Target' | 'Achieved';
  medicalSubBucket: number;
  medicalSubBucketUsed: number;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  timestamp: Date;
  deviceId: string;
}

// Legacy compatibility interfaces
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

export interface Income {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  source?: string;
  account_id: string;
}

export interface AppSettingTable {
  key: string;
  value: any;
}

// Enhanced Dexie Database Class
export class SavoraDB extends Dexie {
  // Core tables
  public globalSettings!: Table<GlobalSettings, string>;
  public txns!: Table<Txn, string>;
  public goals!: Table<Goal, string>;
  public creditCards!: Table<CreditCard, string>;
  public vehicles!: Table<Vehicle, string>;
  public investments!: Table<Investment, string>;
  
  // New required tables from spec
  public rentalProperties!: Table<RentalProperty, string>;
  public tenants!: Table<Tenant, string>;
  public gold!: Table<Gold, string>;
  public insurance!: Table<Insurance, string>;
  public loans!: Table<Loan, string>;
  public brotherRepayments!: Table<BrotherRepayment, string>;
  public subscriptions!: Table<Subscription, string>;
  public health!: Table<Health, string>;
  public familyBankAccounts!: Table<FamilyBankAccount, string>;
  public familyTransfers!: Table<FamilyTransfer, string>;
  public emergencyFunds!: Table<EmergencyFund, string>;
  public auditLogs!: Table<AuditLog, string>;
  
  // Legacy compatibility tables
  public expenses!: Table<Expense, string>;
  public incomes!: Table<Income, string>;
  public appSettings!: Table<AppSettingTable, string>;

  constructor() {
    super('SavoraFinanceDB');

    this.version(1).stores({
      // Core tables
      globalSettings: '&id',
      txns: '&id, date, category, amount, goalId, cardId, vehicleId',
      goals: '&id, type, targetDate, name, slug',
      creditCards: '&id, issuer, bankName, last4',
      vehicles: '&id, regNo, owner, type',
      investments: '&id, type, name, startDate, goalId',
      
      // New required tables
      rentalProperties: '&id, owner, type, address',
      tenants: '&id, propertyId, tenantName, joinDate',
      gold: '&id, form, purchaseDate, familyMember',
      insurance: '&id, type, provider, policyNo, endDate',
      loans: '&id, type, borrower, isActive',
      brotherRepayments: '&id, loanId, date',
      subscriptions: '&id, name, cycle, nextDue, isActive',
      health: '&id, nextCheckupDate',
      familyBankAccounts: '&id, owner, bankName',
      familyTransfers: '&id, fromAccountId, toPerson, date',
      emergencyFunds: '&id, status',
      auditLogs: '&id, entity, timestamp',
      
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
