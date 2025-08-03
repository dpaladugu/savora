
import Dexie, { type EntityTable } from 'dexie';

export interface Txn {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  category: string;
  note?: string;
  tags: string[];
  paymentMix: { mode: 'Cash' | 'Card' | 'UPI' | 'Bank'; amount: number }[];
  splitWith: string[];
  isPartialRent: boolean;
  isSplit: boolean;
  goalId?: string;
}

export interface Goal {
  id: string;
  name: string;
  slug: string;
  type: 'Short' | 'Medium' | 'Long';
  targetAmount: number;
  targetDate: Date;
  currentAmount: number;
  notes?: string;
}

export interface CreditCard {
  id: string;
  issuer: string;
  bankName: string;
  last4: string;
  network: 'Visa' | 'Mastercard' | 'Amex' | 'Rupay';
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
  fxTxnFee?: number;
  emiConversion?: boolean;
  // Add missing properties for compatibility
  name?: string;
  currentBalance?: number;
  dueDate?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  purchaseDate: Date;
  purchasePrice: number;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
  registrationNumber: string;
  insuranceExpiry: Date;
  serviceDueDate: Date;
  odometerReading: number;
  owner?: string;
}

export interface Investment {
  id: string;
  type: 'MF-Growth' | 'MF-Dividend' | 'Stocks' | 'Bonds' | 'FD' | 'RD' | 'Real Estate' | 'Gold' | 'PPF' | 'EPF' | 'NPS-T1' | 'SGB';
  name: string;
  currentNav: number;
  units: number;
  investedValue: number;
  currentValue: number;
  startDate: Date;
  frequency: 'OneTime' | 'Monthly' | 'Quarterly' | 'Annually';
  taxBenefit: boolean;
  familyMember: string;
  notes?: string;
  goalId?: string;
  maturityDate?: Date;
}

export interface RentalProperty {
  id: string;
  address: string;
  owner: 'Me' | 'Mother' | 'Grandmother';
  type: 'Apartment' | 'House' | 'Commercial' | 'Plot';
  squareYards: number;
  monthlyRent: number;
  dueDay: number;
  escalationPercent?: number;
  escalationDate?: Date;
  lateFeeRate?: number;
  noticePeriodDays?: number;
  depositRefundPending: boolean;
  propertyTaxAnnual?: number;
  propertyTaxDueDay?: number;
  waterTaxAnnual?: number;
  waterTaxDueDay?: number;
  maintenanceReserve?: number;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  moveInDate: Date;
  rentDueDate: number;
  rentAmount: number;
  securityDeposit: number;
  rentalPropertyId: string;
  // Add missing properties
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
  purchaseDate: Date;
  grams: number;
  ratePerGram: number;
  makingCharges?: number;
  gst?: number;
  notes?: string;
}

export interface Insurance {
  id: string;
  type: 'Health' | 'Life' | 'Vehicle' | 'Property' | 'Term';
  company: string;
  policyNumber: string;
  sumAssured: number;
  premiumAmount: number;
  premiumDueDate: Date;
  nominee: string;
  notes?: string;
  // Add missing properties
  sumInsured: number;
  endDate: Date;
  provider: string;
  isActive?: boolean;
}

export interface Loan {
  id: string;
  type: 'Home' | 'Vehicle' | 'Personal' | 'Education';
  bank: string;
  loanAmount: number;
  interestRate: number;
  startDate: Date;
  endDate: Date;
  emiAmount: number;
  notes?: string;
  // Add missing properties
  emi: number;
  roi: number;
  outstanding: number;
  tenureMonths: number;
  isActive: boolean;
}

export interface BrotherRepayment {
  id: string;
  date: Date;
  amount: number;
  notes?: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank';
  autoRenew: boolean;
  notes?: string;
}

export interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}

export interface Vaccination {
  name: string;
  date: Date;
  nextDue?: Date;
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
  allergySeverity?: string;
  emergencyContact?: string;
  nextCheckupDate?: Date;
  doctorNotes?: string;
  medicalHistory?: string;
  prescriptions: Prescription[];
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  familyHistory: string[];
  vaccinations: Vaccination[];
  vitals: Vital[];
  lifeExpectancy?: number;
}

export interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export interface Dependent {
  name: string;
  dob: Date;
  relation: string;
}

export interface GlobalSettings {
  id: string;
  taxRegime: 'Old' | 'New';
  autoLockMinutes: number;
  birthdayBudget: number;
  birthdayAlertDays: number;
  emergencyContacts: Contact[];
  dependents: Dependent[];
  salaryCreditDay: number;
  annualBonus: number;
  medicalInflationRate: number;
  educationInflation: number;
  vehicleInflation: number;
  maintenanceInflation: number;
  privacyMask: boolean;
  failedPinAttempts: number;
  maxFailedAttempts: number;
  darkMode: boolean;
  timeZone: string;
  isTest: boolean;
  theme: 'light' | 'dark' | 'system';
  deviceThemes: { [deviceId: string]: 'light' | 'dark' | 'system' };
  revealSecret: string;
}

export interface FamilyBankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'Savings' | 'Current';
  jointHolders?: string[];
  nomineeName?: string;
  nomineeRelation?: string;
}

export interface FamilyTransfer {
  id: string;
  date: Date;
  fromAccount: string;
  toAccount: string;
  amount: number;
  description?: string;
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
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string;
}

// Add missing exports for compatibility
export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  tags?: string[];
  payment_method?: string;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  source?: string;
}

export interface Claim {
  id: string;
  amount: number;
  date: Date;
  description: string;
}

export class SavoraDatabase extends Dexie {
  txns: EntityTable<Txn, 'id'>;
  goals: EntityTable<Goal, 'id'>;
  creditCards: EntityTable<CreditCard, 'id'>;
  vehicles: EntityTable<Vehicle, 'id'>;
  investments: EntityTable<Investment, 'id'>;
  rentalProperties: EntityTable<RentalProperty, 'id'>;
  tenants: EntityTable<Tenant, 'id'>;
  gold: EntityTable<Gold, 'id'>;
  insurance: EntityTable<Insurance, 'id'>;
  loans: EntityTable<Loan, 'id'>;
  brotherRepayments: EntityTable<BrotherRepayment, 'id'>;
  subscriptions: EntityTable<Subscription, 'id'>;
  health: EntityTable<Health, 'id'>;
  globalSettings: EntityTable<GlobalSettings, 'id'>;
  familyBankAccounts: EntityTable<FamilyBankAccount, 'id'>;
  familyTransfers: EntityTable<FamilyTransfer, 'id'>;
  emergencyFunds: EntityTable<EmergencyFund, 'id'>;
  auditLogs: EntityTable<AuditLog, 'id'>;
  appSettings: EntityTable<AppSettings, 'id'>;

  // Legacy tables for migration
  expenses: EntityTable<Txn, 'id'>;
  incomes: EntityTable<Txn, 'id'>;

  constructor() {
    super('SavoraDatabase');

    this.version(1).stores({
      txns: 'id, date, amount, category, *tags',
      goals: 'id, name, type, targetAmount, targetDate',
      creditCards: 'id, issuer, bankName, network, annualFee, creditLimit',
      vehicles: 'id, make, model, year, purchaseDate, fuelType',
      investments: 'id, type, name, currentNav, units, investedValue',
      rentalProperties: 'id, address, owner, type, squareYards, monthlyRent',
      tenants: 'id, name, phone, moveInDate, rentDueDate, rentAmount',
      gold: 'id, purchaseDate, grams, ratePerGram',
      insurance: 'id, type, company, policyNumber, sumAssured, premiumAmount',
      loans: 'id, type, bank, loanAmount, interestRate, startDate, endDate, emiAmount',
      brotherRepayments: 'id, date, amount',
      subscriptions: 'id, name, category, amount, dueDate',
      health: 'id, refillAlertDays, prescriptions',
      globalSettings: 'id',
      familyBankAccounts: 'id, accountHolderName, bankName, accountNumber',
      familyTransfers: 'id, date, fromAccount, toAccount, amount',
      emergencyFunds: 'id, targetMonths, targetAmount, currentAmount',
      auditLogs: 'id, timestamp, userId, action, details',
      appSettings: 'id, key, value',

      // Legacy tables for migration
      expenses: 'id, date, amount, category, *tags',
      incomes: 'id, date, amount, category, *tags',
    });
  }

  // Add missing methods
  async getPersonalProfile(): Promise<any> {
    const setting = await this.appSettings.get('userPersonalProfile_v1');
    return setting ? setting.value : null;
  }

  async savePersonalProfile(profile: any): Promise<void> {
    await this.appSettings.put({ id: 'userPersonalProfile_v1', key: 'userPersonalProfile_v1', value: profile });
  }
}

export const db = new SavoraDatabase();
