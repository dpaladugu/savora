
import Dexie, { type EntityTable } from 'dexie';

// ---------- helper interfaces ----------
interface LineItem {
  name: string; qty: number; rate: number; gstRate?: number;
}
interface PaymentSplit {
  mode: 'CreditCard' | 'Wallet' | 'RewardPoints' | 'Cash' | 'UPI';
  amount: number;
  creditCardId?: string;
  walletId?: string;
}
interface AmortizationRow {
  date: Date; emi: number; principal: number; interest: number; outstanding: number;
}
interface HealthParameter {
  name: string; value: number; unit: string; flag?: 'Normal' | 'Borderline' | 'High';
}
interface SplitItem {
  person: string; amount: number; settled: boolean;
}
interface ServiceLog {
  date: Date; odo: number; centre: string; items: LineItem[]; total: number;
}
interface Contact {
  name: string; phone: string; relation: string;
}

// ---------- Global Settings ----------
export interface GlobalSettings {
  id: string;
  taxRegime: 'Old' | 'New';
  autoLockMinutes: number;
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: Contact[];
}

// ---------- Universal Transaction ----------
export interface Txn {
  id: string; 
  date: Date; 
  amount: number; 
  currency: string; 
  category: string;
  note?: string; 
  tags?: string[]; 
  goalId?: string; 
  receiptUri?: string;
  creditCardId?: string; 
  tenantId?: string; 
  propertyId?: string;
  rentMonth?: string;
  isPartialRent?: boolean;
  paymentMix?: PaymentSplit[]; 
  cashbackAmount?: number;
  isSplit?: boolean;
  splitWith?: SplitItem[];
  items?: LineItem[];
}

// ---------- core tables ----------
export interface CreditCard {
  id: string; 
  issuer: string; 
  bankName: string;
  last4: string; 
  network: string;
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
  amortisationSchedule?: AmortizationRow[];
  isActive: boolean;
  prepaymentPenalty?: number;
  moratoriumMonths?: number;
  loanInsurance?: string;
  guarantorName?: string;
}

export interface Goal {
  id: string; 
  name: string; 
  type: 'Micro' | 'Small' | 'Short' | 'Medium' | 'Long';
  targetAmount: number; 
  targetDate: Date; 
  currentAmount: number;
  notes?: string;
}

export interface Insurance {
  id: string; 
  type: 'Term' | 'Health' | 'Motor' | 'Critical-Illness' | 'Personal-Accident' | 'Other';
  provider: string; 
  policyNo: string;
  sumInsured: number; 
  premium: number;
  dueDay: number;
  startDate: Date; 
  endDate: Date;
  nomineeName?: string; 
  nomineeDOB?: Date;
  nomineeRelation?: string;
  familyMember: string;
  personalTermCover?: number;
  personalHealthCover?: number;
  employerTermCover?: number;
  employerHealthCover?: number;
  notes?: string;
}

export interface Vehicle {
  id: string; 
  owner: string; 
  regNo: string; 
  make: string; 
  model: string;
  type: 'Bike' | 'Car' | 'Scooter'; 
  purchaseDate: Date; 
  insuranceExpiry: Date;
  pucExpiry?: Date; 
  odometer?: number; 
  fuelEfficiency?: number;
  serviceLogs: ServiceLog[];
}

export interface RentalProperty {
  id: string; 
  address: string; 
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: string;
  squareYards: number; 
  latitude?: number;
  longitude?: number;
  monthlyRent: number;
  dueDay: number; 
  escalationPercent?: number; 
  escalationDate?: Date;
  lateFeeRate?: number;
  noticePeriodDays?: number;
  depositRefundPending?: boolean;
  propertyTaxAnnual?: number;
  propertyTaxDueDay?: number;
  waterTaxAnnual?: number;
  waterTaxDueDay?: number;
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
  depositRefundPending?: boolean;
  tenantContact?: string;
}

export interface Gold {
  id: string;
  form: 'Coin' | 'Bar' | 'Jewelry' | 'Biscuit';
  description: string;
  grossWeight: number; // grams
  netWeight: number; // grams
  stoneWeight?: number; // grams
  purity: '24K' | '22K' | '18K' | '14K';
  purchasePrice: number;
  makingCharge: number;
  gstPaid: number;
  hallmarkCharge?: number;
  karatPrice: number;
  purchaseDate: Date;
  merchant: string;
  storageLocation: string;
  storageCost?: number; // per year
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
  currentNav?: number;
  units?: number;
  investedValue: number;
  currentValue?: number;
  startDate: Date;
  maturityDate?: Date;
  sipAmount?: number;
  sipDay?: number;
  frequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  goalId?: string;
  lockInYears?: number;
  taxBenefit?: boolean;
  familyMember: string;
  notes?: string;
  interestRate?: number;
  interestCreditDate?: Date;
}

export interface BrotherRepayment {
  id: string;
  loanId: string; // FK to Loan
  amount: number;
  date: Date;
  mode: 'Cash' | 'UPI' | 'Bank-Transfer' | 'Cheque';
  note?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'Monthly' | 'Yearly' | 'Quarterly';
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
  prescriptions?: {
    date: Date;
    doctor: string;
    medicines: string[];
    amount: number;
  }[];
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
  mode: 'NEFT' | 'IMPS' | 'UPI' | 'Cash';
}

export interface EmergencyFund {
  id: string;
  targetMonths: number;
  targetAmount: number;
  currentAmount: number;
  lastReviewDate: Date;
  status: 'Below-Target' | 'On-Target' | 'Above-Target';
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

export interface Wallet {
  id: string; 
  name: string; 
  balance: number; 
  expiry?: Date; 
  sourceCard?: string;
}

// ---------- Dexie instance ----------
export class SavoraDB extends Dexie {
  globalSettings!: EntityTable<GlobalSettings, 'id'>;
  txns!: EntityTable<Txn, 'id'>;
  creditCards!: EntityTable<CreditCard, 'id'>;
  loans!: EntityTable<Loan, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  insurance!: EntityTable<Insurance, 'id'>;
  vehicles!: EntityTable<Vehicle, 'id'>;
  rentalProperties!: EntityTable<RentalProperty, 'id'>;
  tenants!: EntityTable<Tenant, 'id'>;
  gold!: EntityTable<Gold, 'id'>;
  investments!: EntityTable<Investment, 'id'>;
  brotherRepayments!: EntityTable<BrotherRepayment, 'id'>;
  subscriptions!: EntityTable<Subscription, 'id'>;
  health!: EntityTable<Health, 'id'>;
  familyBankAccounts!: EntityTable<FamilyBankAccount, 'id'>;
  familyTransfers!: EntityTable<FamilyTransfer, 'id'>;
  emergencyFunds!: EntityTable<EmergencyFund, 'id'>;
  auditLogs!: EntityTable<AuditLog, 'id'>;
  wallets!: EntityTable<Wallet, 'id'>;

  constructor() {
    super('savora');
    this.version(1).stores({
      globalSettings: 'id',
      txns: 'id, date, category, tenantId, propertyId',
      creditCards: 'id, issuer, last4',
      loans: 'id, type, borrower',
      goals: 'id, type, targetDate',
      insurance: 'id, type, provider',
      vehicles: 'id, regNo, type',
      rentalProperties: 'id, address, owner',
      tenants: 'id, propertyId, tenantName',
      gold: 'id, form, purchaseDate',
      investments: 'id, type, startDate',
      brotherRepayments: 'id, loanId, date',
      subscriptions: 'id, nextDue, isActive',
      health: 'id, refillAlertDays',
      familyBankAccounts: 'id, owner',
      familyTransfers: 'id, date',
      emergencyFunds: 'id, status',
      auditLogs: 'id, entity, timestamp',
      wallets: 'id, name'
    });
  }
}

export const db = new SavoraDB();
