import Dexie, { Table } from 'dexie';

// Extended interfaces matching the requirements spec exactly

export interface RentalProperty {
  id: string;
  address: string;
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: 'Apartment' | 'House' | 'Commercial' | 'Plot';
  squareYards: number;
  latitude?: number;
  longitude?: number;
  monthlyRent: number;
  dueDay: number; // 1-31
  escalationPercent: number;
  escalationDate: Date;
  lateFeeRate: number;
  noticePeriodDays: number;
  depositRefundPending: boolean;
  propertyTaxAnnual: number;
  propertyTaxDueDay: number; // 1-31
  waterTaxAnnual: number;
  waterTaxDueDay: number; // 1-31
  maintenanceReserve: number; // per year
}

export interface Tenant {
  id: string;
  propertyId: string; // FK -> RentalProperty
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
  form: 'Jewelry' | 'Coin' | 'Bar' | 'Biscuit';
  description: string;
  grossWeight: number; // grams
  netWeight: number; // grams
  stoneWeight: number; // grams
  purity: '24K' | '22K' | '20K' | '18K';
  purchasePrice: number; // INR
  makingCharge: number; // INR
  gstPaid: number; // INR
  hallmarkCharge: number; // INR
  karatPrice: number;
  purchaseDate: Date;
  merchant: string;
  storageLocation: string;
  storageCost: number; // per year
  familyMember: string;
  insurancePolicyId?: string;
  receiptUri?: string;
  saleDate?: Date;
  salePrice?: number;
  profit?: number; // auto-calc
  goldLoanId?: string;
  loanInterestRate?: number;
  currentMcxPrice?: number;
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
  loanId: string; // FK -> Loan (Education-Brother only)
  amount: number;
  date: Date;
  mode: 'Cash' | 'Bank' | 'UPI';
  note: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'Monthly' | 'Quarterly' | 'Yearly';
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

export interface Health {
  id: string;
  refillAlertDays: number;
  allergySeverity?: 'Mild' | 'Moderate' | 'Severe';
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
  mode: 'Cash' | 'Bank' | 'UPI';
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

export interface Will {
  id: string;
  assetId: string; // FK -> any asset table
  beneficiary: string;
  percentage: number; // 0-100
  createdDate: Date;
  lastUpdated: Date;
}

export interface DigitalAsset {
  id: string;
  type: 'Crypto' | 'Demat PDF' | 'FD Receipt' | 'App Passphrase' | 'Telegram Token' | 'Others';
  location: string;
  nominee: string;
  accessInstructions: string;
  lastUpdated: Date;
}

export interface SpendingLimit {
  id: string;
  category: string;
  monthlyCap: number;
  currentSpend: number;
  alertAt: number; // default 80%
}

export interface LLMPrompt {
  id: string;
  promptType: 'AssetReview' | 'GoalReview' | 'TaxReview' | 'HealthReview' | 'VehicleReview' | 'RentalReview' | 'EmergencyReview';
  promptText: string;
  createdDate: Date;
  usedDate?: Date;
}

// Extended Database class
export class ExtendedSavoraDB extends Dexie {
  // Existing tables
  globalSettings!: Table<GlobalSettings>;
  txns!: Table<Txn>;
  goals!: Table<Goal>;
  creditCards!: Table<CreditCard>;
  vehicles!: Table<Vehicle>;
  investments!: Table<Investment>;
  insurance!: Table<Insurance>;
  emergencyFunds!: Table<EmergencyFund>;
  expenses!: Table<Expense>;
  incomes!: Table<Income>;

  // New tables from requirements spec
  rentalProperties!: Table<RentalProperty>;
  tenants!: Table<Tenant>;
  gold!: Table<Gold>;
  loans!: Table<Loan>;
  brotherRepayments!: Table<BrotherRepayment>;
  subscriptions!: Table<Subscription>;
  health!: Table<Health>;
  familyBankAccounts!: Table<FamilyBankAccount>;
  familyTransfers!: Table<FamilyTransfer>;
  auditLog!: Table<AuditLog>;
  will!: Table<Will>;
  digitalAssets!: Table<DigitalAsset>;
  spendingLimits!: Table<SpendingLimit>;
  llmPrompts!: Table<LLMPrompt>;

  constructor() {
    super('SavoraDB');
    
    this.version(2).stores({
      // Existing stores
      globalSettings: 'id',
      txns: '++id, amount, date, category, currency, goalId, cardId, vehicleId, tenantId, propertyId',
      goals: '++id, name, slug, type, targetDate',
      creditCards: '++id, issuer, last4, cycleStart, dueDay',
      vehicles: '++id, owner, regNo, type, insuranceExpiry, pucExpiry',
      investments: '++id, name, type, startDate, maturityDate, goalId',
      insurance: '++id, type, provider, endDate',
      emergencyFunds: '++id, targetAmount, currentAmount',
      expenses: '++id, amount, date, category, description',
      incomes: '++id, amount, date, category, source_name',
      
      // New stores from requirements spec
      rentalProperties: '++id, address, owner, type, dueDay',
      tenants: '++id, propertyId, tenantName, joinDate, endDate',
      gold: '++id, form, purity, purchaseDate, familyMember',
      loans: '++id, type, borrower, startDate, isActive',
      brotherRepayments: '++id, loanId, date, amount',
      subscriptions: '++id, name, cycle, nextDue, isActive',
      health: '++id, emergencyContact, nextCheckupDate',
      familyBankAccounts: '++id, owner, bankName, accountNo',
      familyTransfers: '++id, fromAccountId, toPerson, date',
      auditLog: '++id, entity, entityId, timestamp',
      will: '++id, assetId, beneficiary, createdDate',
      digitalAssets: '++id, type, location, nominee',
      spendingLimits: '++id, category, monthlyCap',
      llmPrompts: '++id, promptType, createdDate'
    });
  }
}

// Import existing types from db.ts
import type { 
  GlobalSettings, 
  Txn, 
  Goal, 
  CreditCard, 
  Vehicle, 
  Investment, 
  Insurance, 
  EmergencyFund,
  Expense,
  Income
} from './db';

export const extendedDb = new ExtendedSavoraDB();
