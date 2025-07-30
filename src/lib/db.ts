
import Dexie, { Table } from 'dexie';

// --- Core Interfaces from Requirements Spec ---

export interface GlobalSettings {
  id: string;
  taxRegime: 'Old' | 'New';
  autoLockMinutes: number;
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: Contact[];
}

export interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export interface PaymentSplit {
  method: string;
  amount: number;
}

export interface SplitItem {
  person: string;
  amount: number;
  settled: boolean;
}

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
}

export interface Goal {
  id: string;
  name: string;
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
}

export interface RentalProperty {
  id: string;
  address: string;
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: 'Apartment' | 'House' | 'Commercial' | 'Land';
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
  form: 'Coin' | 'Jewellery' | 'Bar' | 'Ornament';
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
  type: 'MF-Growth' | 'MF-Dividend' | 'SIP' | 'PPF' | 'EPF' | 'NPS-T1' | 'NPS-T2' | 'Gold-Coin' | 'Gold-ETF' | 'SGB' | 'FD' | 'RD' | 'Stocks' | 'Others';
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
}

export interface Insurance {
  id: string;
  type: 'Term' | 'Health' | 'Motor' | 'Home' | 'Travel' | 'Personal-Accident';
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
  notes: string;
}

export interface AmortRow {
  month: number;
  emi: number;
  principalPart: number;
  interestPart: number;
  balance: number;
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

export interface BrotherRepayment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  mode: 'Cash' | 'UPI' | 'Bank-Transfer' | 'Cheque';
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

export interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}

export interface Health {
  id: string;
  refillAlertDays: number;
  allergySeverity?: 'Mild' | 'Moderate' | 'Severe';
  emergencyContact?: string;
  nextCheckupDate?: Date;
  doctorNotes?: string;
  medicalHistory?: string;
  prescriptions: Prescription[];
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
  toPerson: 'Me' | 'Mother' | 'Grandmother';
  amount: number;
  date: Date;
  purpose: string;
  mode: 'UPI' | 'NEFT' | 'Cash' | 'Cheque';
}

export interface EmergencyFund {
  id: string;
  targetMonths: number;
  targetAmount: number;
  currentAmount: number;
  lastReviewDate: Date;
  status: 'Under-Target' | 'On-Target' | 'Over-Target';
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

// --- Dexie Database Class ---
export class SavoraDB extends Dexie {
  public globalSettings!: Table<GlobalSettings, string>;
  public txns!: Table<Txn, string>;
  public goals!: Table<Goal, string>;
  public creditCards!: Table<CreditCard, string>;
  public vehicles!: Table<Vehicle, string>;
  public rentalProperties!: Table<RentalProperty, string>;
  public tenants!: Table<Tenant, string>;
  public gold!: Table<Gold, string>;
  public investments!: Table<Investment, string>;
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
  public appSettings!: Table<any, string>;

  constructor() {
    super('SavoraFinanceDB');

    // Version 1: Requirements spec compliant schema
    this.version(1).stores({
      globalSettings: '&id',
      txns: '&id, date, category, amount, goalId, cardId, vehicleId, propertyId, tenantId',
      goals: '&id, type, targetDate, name',
      creditCards: '&id, issuer, bankName, last4',
      vehicles: '&id, regNo, owner, type, insuranceExpiry, pucExpiry',
      rentalProperties: '&id, owner, type, address',
      tenants: '&id, propertyId, tenantName, joinDate, endDate',
      gold: '&id, form, purity, purchaseDate, merchant',
      investments: '&id, type, name, startDate, maturityDate, goalId',
      insurance: '&id, type, provider, policyNo, endDate',
      loans: '&id, type, borrower, isActive',
      brotherRepayments: '&id, loanId, date',
      subscriptions: '&id, name, nextDue, isActive',
      health: '&id',
      familyBankAccounts: '&id, owner, bankName',
      familyTransfers: '&id, fromAccountId, toPerson, date',
      emergencyFunds: '&id, status',
      auditLogs: '&id, entity, entityId, timestamp',
      // Legacy compatibility
      appSettings: '&key'
    });

    // Initialize table properties
    this.globalSettings = this.table('globalSettings');
    this.txns = this.table('txns');
    this.goals = this.table('goals');
    this.creditCards = this.table('creditCards');
    this.vehicles = this.table('vehicles');
    this.rentalProperties = this.table('rentalProperties');
    this.tenants = this.table('tenants');
    this.gold = this.table('gold');
    this.investments = this.table('investments');
    this.insurance = this.table('insurance');
    this.loans = this.table('loans');
    this.brotherRepayments = this.table('brotherRepayments');
    this.subscriptions = this.table('subscriptions');
    this.health = this.table('health');
    this.familyBankAccounts = this.table('familyBankAccounts');
    this.familyTransfers = this.table('familyTransfers');
    this.emergencyFunds = this.table('emergencyFunds');
    this.auditLogs = this.table('auditLogs');
    this.appSettings = this.table('appSettings');
  }

  // Legacy compatibility methods
  async savePersonalProfile(profile: any): Promise<void> {
    await this.appSettings.put({ key: 'userPersonalProfile_v1', value: profile });
  }

  async getPersonalProfile(): Promise<any | null> {
    const setting = await this.appSettings.get('userPersonalProfile_v1');
    return setting ? setting.value : null;
  }
}

export const db = new SavoraDB();

// Error handling for database initialization
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
