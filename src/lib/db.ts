
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

// ---------- core tables ----------
export interface Txn {
  id: string; date: Date; amount: number; currency: string; category: string;
  note?: string; tags?: string[]; goalId?: string; receipt?: string;
  creditCardId?: string; tenantId?: string; propertyId?: string;
  paymentMix?: PaymentSplit[]; items?: LineItem[];
}
export interface CreditCard {
  id: string; issuer: string; last4: string; network: string;
  type: 'LTF' | 'Spend-Waiver' | 'Milestone';
  annualFee: number; spendThreshold?: number; rewardMilestone?: number;
  cycleStart: number; stmtDay: number; dueDay: number;
}
export interface Loan {
  id: string; lender: string; principal: number; disbursalDate: Date;
  tenureMonths: number; roi: number; emi: number; firstEmiDate: Date;
  outstanding?: number; type: 'Personal' | 'Home' | 'Plot';
  closureDate?: Date; closedByLoanIds?: string[]; amortization?: AmortizationRow[];
}
export interface Goal {
  id: string; name: string; horizon: 'micro' | 'short' | 'medium' | 'long';
  targetAmount: number; targetDate: Date; linkedTxns: string[]; autoSip?: boolean;
}
export interface Policy {
  id: string; type: 'Term' | 'Health' | 'Motor' | 'Other';
  provider: string; sumInsured: number; premium: number; dueDay: number;
  startDate: Date; nomineeName?: string; nomineeRelation?: string; docs?: string[];
}
export interface Vehicle {
  id: string; owner: string; regNo: string; make: string; model: string;
  type: 'Bike' | 'Car' | 'Scooter'; purchaseDate: Date; insuranceExpiry: Date;
  premium: number; location: string; odo?: number; fastagBalance?: number;
  pucExpiry?: Date; serviceLogs: ServiceLog[];
}
export interface ServiceLog {
  date: Date; odo: number; centre: string; items: LineItem[]; total: number;
}
export interface RentalProperty {
  id: string; address: string; owner: string; type: string;
  squareYards: number; maxTenants: number; monthlyRent: number;
  dueDay: number; escalationPercent?: number; escalationMonths?: number;
}
export interface Tenant {
  id: string; propertyId: string; tenantName: string; roomNo?: string;
  monthlyRent: number; depositPaid: number; depositRefund?: number;
  startDate: Date; endDate?: Date; depositTxns: string[];
}
export interface ACDEntry {
  id: string; propertyId: string; tenantId: string; billOwner: string;
  date: Date; amount: number; rentDeduction: number; billMonth: string;
}
export interface CapitalGain {
  id: string; assetId: string; purchaseDate: Date; purchasePrice: number;
  purchaseIndex: number; saleDate?: Date; salePrice?: number;
  saleIndex?: number; xirr?: number;
}
export interface Subscription {
  id: string; vendor: string; plan: string; cost: number;
  cycle: 'monthly' | 'yearly'; nextDebit: Date; cancelUrl?: string; receiptFile?: string;
}
export interface RepairLog {
  id: string; propertyId: string; date: Date; description: string;
  cost: number; type: 'Repair' | 'Improvement'; contractor?: string; receipt?: string;
}
export interface HealthProfile {
  id: string; name: string; dob: Date; bloodGroup?: string;
  allergies?: string[]; chronicConditions?: string[];
}
export interface HealthCheckup {
  id: string; profileId: string; date: Date; type: 'Annual' | 'Ad-hoc';
  doctor?: string; lab: string; reportFile?: string;
  parameters: HealthParameter[];
}
export interface Medicine {
  id: string; profileId: string; name: string; dosage: string;
  startDate: Date; endDate?: Date; refillQty: number; refillAlertDays: number;
  prescribedBy?: string;
}
export interface HandLoan {
  id: string; lender: string; borrower: string; principal: number;
  clearedDate?: Date; note?: string;
}
export interface Wallet {
  id: string; name: string; balance: number; expiry?: Date; sourceCard?: string;
}

// ---------- Dexie instance ----------
export class SavoraDB extends Dexie {
  txns!: EntityTable<Txn, 'id'>;
  creditCards!: EntityTable<CreditCard, 'id'>;
  loans!: EntityTable<Loan, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  policies!: EntityTable<Policy, 'id'>;
  vehicles!: EntityTable<Vehicle, 'id'>;
  rentalProperties!: EntityTable<RentalProperty, 'id'>;
  tenants!: EntityTable<Tenant, 'id'>;
  acdEntries!: EntityTable<ACDEntry, 'id'>;
  capitalGains!: EntityTable<CapitalGain, 'id'>;
  subscriptions!: EntityTable<Subscription, 'id'>;
  repairLogs!: EntityTable<RepairLog, 'id'>;
  healthProfiles!: EntityTable<HealthProfile, 'id'>;
  healthCheckups!: EntityTable<HealthCheckup, 'id'>;
  medicines!: EntityTable<Medicine, 'id'>;
  wallets!: EntityTable<Wallet, 'id'>;
  handLoans!: EntityTable<HandLoan, 'id'>;
  constructor() {
    super('savora');
    this.version(1).stores({
      txns: 'id, date, category, tenantId, propertyId',
      creditCards: 'id, issuer, last4',
      loans: 'id, lender, type',
      goals: 'id, horizon, targetDate',
      policies: 'id, type, provider',
      vehicles: 'id, regNo, type',
      rentalProperties: 'id, address, owner',
      tenants: 'id, propertyId, tenantName',
      acdEntries: 'id, propertyId, tenantId',
      capitalGains: 'id, assetId, purchaseDate',
      subscriptions: 'id, vendor, nextDebit',
      repairLogs: 'id, propertyId, date',
      healthProfiles: 'id, name',
      healthCheckups: 'id, profileId, date',
      medicines: 'id, profileId, refillAlertDays',
      wallets: 'id, name'
    });
  }
}
export const db = new SavoraDB();
