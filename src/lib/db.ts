
import Dexie, { type EntityTable } from 'dexie';
import type { EmergencyFund, Investment, CreditCard, RentalProperty, Health, Txn, Goal, Tenant } from '@/types/financial';

export type { EmergencyFund, Investment, CreditCard, RentalProperty, Health, Txn, Goal, Tenant } from '@/types/financial';

export interface Contact { name: string; phone: string; relation: string; }
export interface Dependent { name: string; dob: Date; relation: string; }

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  make?: string;
  type?: string;
  fuelType?: string;
  registrationNumber?: string;
  regNo?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  insuranceExpiry?: Date;
  pucExpiry?: Date;
  serviceDueDate?: Date;
  odometer?: number;
  odometerReading?: number;
  fuelEfficiency?: number;
  fuelLogs?: any[];
  serviceLogs?: any[];
  claims?: any[];
  treadDepthMM?: number;
  depreciationRate?: number;
  ncbPercent?: number;
  owner?: string;
  vehicleValue?: number;
  createdAt: Date;
  updatedAt: Date;
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
  name?: string;
  principal: number;
  interestRate?: number;
  type?: 'Personal' | 'Personal-Brother' | 'Education-Brother';
  borrower?: 'Me' | 'Brother';
  roi?: number;
  tenureMonths?: number;
  emi?: number;
  outstanding?: number;
  startDate?: Date;
  isActive?: boolean;
  /** Generated amortisation schedule (stored inline) */
  amortisationSchedule?: AmortRow[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Insurance {
  id: string;
  name: string;
  type: string;
  premium: number;
  provider?: string;
  company?: string;
  policyNumber?: string;
  policyNo?: string;
  sumAssured?: number;
  sumInsured: number;
  premiumAmount?: number;
  premiumDueDate?: Date;
  startDate?: Date;
  endDate?: Date;
  nominee?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  familyMember?: string;
  notes?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpendingLimit {
  id: string;
  category: string;
  monthlyCap: number;
  alertAt: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Gold {
  id: string;
  type: string;
  weight: number;
  purity: number;
  form?: 'Jewelry' | 'Coin' | 'Bar' | 'Biscuit';
  description?: string;
  grossWeight?: number;
  netWeight?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: string;
  nextBilling: Date;
  amount?: number;
  cycle?: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate?: Date;
  nextDue?: Date;
  reminderDays?: number;
  isActive?: boolean;
  autoRenew?: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrotherRepayment {
  id: string;
  amount: number;
  date: Date;
  loanId?: string;
  mode?: string;
  note?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FamilyBankAccount {
  id: string;
  name?: string;
  balance?: number;
  owner: 'Mother' | 'Grandmother';
  bankName: string;
  accountNo?: string;
  type: string;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyTransfer {
  id: string;
  amount: number;
  from?: string;
  to?: string;
  date: Date;
  fromAccountId?: string;
  toPerson: 'Mother' | 'Grandmother' | 'Brother';
  purpose: string;
  mode: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WillRow {
  id: string;
  assetDescription: string;
  assetType: string;
  beneficiary: string;
  percentage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalAsset {
  id: string;
  type: string;
  name: string;
  loginUrl?: string;
  username?: string;
  storageLocation: string;
  nominee: string;
  accessInstructions: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  userId?: string;
  entity?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  deviceId?: string;
}

export interface GlobalSettings {
  id: string;
  userName: string;
  userMission?: string;
  failedPinAttempts: number;
  maxFailedAttempts: number;
  autoLockMinutes: number;
  taxRegime: 'Old' | 'New';
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
  darkMode: boolean;
  timeZone: string;
  isTest: boolean;
  theme: 'light' | 'dark' | 'system';
  deviceThemes: Record<string, string>;
  revealSecret: string;
  // Phase 2: data-safety
  lastBackupAt?: number;       // epoch ms
  lastAutoRunAt?: string;      // ISO date string YYYY-MM-DD
}

export interface Expense {
  id: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  paymentMethod?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Income {
  id: string;
  amount: number;
  date: Date;
  category: string;
  sourceName?: string;
  description?: string;
  frequency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  start_date: string;
  end_date?: string;
  day_of_week?: number;
  day_of_month?: number;
  next_date: string;
  is_active: boolean;
  type: 'income' | 'expense';
  payment_method?: string;
  account?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy AppSettingTable — kept for PinLock / AiChat compatibility
export interface AppSettingTable {
  key: string;
  value: any;
}

export interface PendingTxn {
  id: string;
  rawText: string;
  amount: number;
  category: string;
  note: string;
  paymentMode?: string;
  source: 'telegram' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface GunturShopRow {
  id: string;
  shopId: string;
  name: string;
  tenant: string;
  rent: number;
  status: 'Vacant' | 'Occupied';
  paid: boolean;
  advanceAmount?: number;
  advanceDate?: Date;
  // Tenant profile
  tenantContact?: string;
  leaseStart?: Date;
  tenantIdNote?: string;
  updatedAt: Date;
}

export interface WaterfallProgressRow {
  id: string;
  bucketId: string;
  accumulated: number;
  updatedAt: Date;
}

export interface GorantlaRoomRow {
  id: string;
  roomId: string;
  name: string;
  tenant: string;
  rent: number;
  paid: boolean;
  advanceAmount?: number;
  advanceDate?: Date;
  // Tenant profile
  tenantContact?: string;
  leaseStart?: Date;
  tenantIdNote?: string;
  updatedAt: Date;
}

export interface RentHikeLog {
  id: string;
  unitId: string;              // references gunturShops.id or gorantlaRooms.id
  unitType: 'shop' | 'room';
  oldRent: number;
  newRent: number;
  hikeDate: Date;
  note?: string;
  createdAt: Date;
}

// ─── Database Instance ────────────────────────────────────────────────────────
const db = new Dexie('SavoraDB') as typeof Dexie.prototype & {
  txns: EntityTable<Txn, 'id'>;
  rentalProperties: EntityTable<RentalProperty, 'id'>;
  goals: EntityTable<Goal, 'id'>;
  vehicles: EntityTable<Vehicle, 'id'>;
  creditCards: EntityTable<CreditCard, 'id'>;
  loans: EntityTable<Loan, 'id'>;
  insurance: EntityTable<Insurance, 'id'>;
  tenants: EntityTable<Tenant, 'id'>;
  investments: EntityTable<Investment, 'id'>;
  gold: EntityTable<Gold, 'id'>;
  subscriptions: EntityTable<Subscription, 'id'>;
  emergencyFunds: EntityTable<EmergencyFund, 'id'>;
  health: EntityTable<Health, 'id'>;
  brotherRepayments: EntityTable<BrotherRepayment, 'id'>;
  familyBankAccounts: EntityTable<FamilyBankAccount, 'id'>;
  familyTransfers: EntityTable<FamilyTransfer, 'id'>;
  auditLogs: EntityTable<AuditLog, 'id'>;
  globalSettings: EntityTable<GlobalSettings, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  incomes: EntityTable<Income, 'id'>;
  insurancePolicies: EntityTable<Insurance, 'id'>;
  spendingLimits: EntityTable<SpendingLimit, 'id'>;
  willRows: EntityTable<WillRow, 'id'>;
  digitalAssets: EntityTable<DigitalAsset, 'id'>;
  recurringTransactions: EntityTable<RecurringTransaction, 'id'>;
  gunturShops: EntityTable<GunturShopRow, 'id'>;
  waterfallProgress: EntityTable<WaterfallProgressRow, 'id'>;
  gorantlaRooms: EntityTable<GorantlaRoomRow, 'id'>;
  pendingTxns: EntityTable<PendingTxn, 'id'>;
  rentHikeLogs: EntityTable<RentHikeLog, 'id'>;
  // Legacy compatibility — used by PinLock and AiChatService
  appSettings: EntityTable<AppSettingTable, 'key'>;
};

// ─── v1 — core tables ─────────────────────────────────────────────────────────
db.version(1).stores({
  txns: '++id, amount, currency, category, date, note, goalId, cardId, vehicleId, tenantId, propertyId, createdAt, updatedAt',
  rentalProperties: '++id, address, owner, type, squareYards, monthlyRent, dueDay, escalationPercent, createdAt, updatedAt',
  goals: '++id, name, title, targetAmount, currentAmount, deadline, category, createdAt, updatedAt',
  vehicles: '++id, name, model, year, createdAt, updatedAt',
  creditCards: '++id, name, issuer, bankName, last4, network, creditLimit, currentBalance, dueDate, createdAt, updatedAt',
  loans: '++id, name, principal, interestRate, createdAt, updatedAt',
  insurance: '++id, name, type, premium, createdAt, updatedAt',
  tenants: '++id, name, email, phone, propertyId, leaseStart, leaseEnd, depositAmount, isActive, createdAt, updatedAt',
  investments: '++id, name, type, currentValue, purchasePrice, quantity, purchaseDate, currentNav, units, investedValue, startDate, maturityDate, expectedReturn, createdAt, updatedAt',
  gold: '++id, type, weight, purity, createdAt, updatedAt',
  subscriptions: '++id, name, cost, billingCycle, nextBilling, createdAt, updatedAt',
  emergencyFunds: '++id, name, targetAmount, currentAmount, targetMonths, lastReviewDate, status, medicalSubBucket, medicalSubBucketUsed, monthlyExpenses, createdAt, updatedAt',
  health: '++id, refillAlertDays, allergySeverity, emergencyContact, nextCheckupDate, familyHistory, vaccinations, vitals, prescriptions, weightKg, heightCm, createdAt, updatedAt',
  brotherRepayments: '++id, amount, date, createdAt, updatedAt',
  familyBankAccounts: '++id, name, balance, createdAt, updatedAt',
  familyTransfers: '++id, amount, from, to, date, createdAt, updatedAt',
  auditLogs: '++id, action, timestamp, userId',
  globalSettings: '++id, failedPinAttempts, maxFailedAttempts, autoLockMinutes, taxRegime, privacyMask, darkMode, timeZone, isTest, theme, revealSecret',
  expenses: '++id, amount, date, category, description, createdAt, updatedAt',
  incomes: '++id, amount, date, category, sourceName, createdAt, updatedAt',
});

// v2 — insurancePolicies + spendingLimits
db.version(2).stores({
  insurancePolicies: '++id, type, provider, familyMember, endDate, createdAt, updatedAt',
  spendingLimits: '++id, category, monthlyCap, alertAt, createdAt, updatedAt',
});

// v3 — Will & Estate
db.version(3).stores({
  willRows:      '++id, assetDescription, assetType, beneficiary, createdAt, updatedAt',
  digitalAssets: '++id, type, name, nominee, createdAt, updatedAt',
});

// v4 — Recurring Transactions
db.version(4).stores({
  recurringTransactions: '++id, description, category, frequency, type, is_active, next_date, createdAt, updatedAt',
});

// v5 — userName migration
db.version(5).stores({}).upgrade(tx =>
  tx.table('globalSettings').toCollection().modify((s: any) => {
    if (!s.userName) s.userName = 'Devavratha';
    if (!s.userMission) s.userMission = 'Antifragile Debt-Freedom by 2029';
  })
);

// v6 — Guntur waterfall persistence
db.version(6).stores({
  gunturShops:       '++id, shopId, name, tenant, rent, status',
  waterfallProgress: '++id, bucketId, accumulated',
  gorantlaRooms:     '++id, roomId, name, tenant, rent, paid',
});

// v7 — Add appSettings table (legacy PinLock / AiChat key-value store)
//      Also stamps lastAutoRunAt on globalSettings for idempotency guard
db.version(7).stores({
  appSettings: '&key',
});

// v8 — §23 Telegram PendingTxns capture queue
db.version(8).stores({
  pendingTxns: '++id, status, source, createdAt',
});

// v9 — Guntur property/water tax settings (stored via appSettings key-value)
db.version(9).stores({}).upgrade(tx =>
  tx.table('appSettings').put({ key: 'gunturTaxSettings', value: JSON.stringify({ propertyTax: 0, waterTax: 0 }) }).catch(() => {})
);

// v10 — Add paid flag to gunturShops
db.version(10).stores({}).upgrade(tx =>
  tx.table('gunturShops').toCollection().modify((shop: any) => {
    if (shop.paid === undefined) shop.paid = false;
  })
);

// v11 — Add advanceAmount + advanceDate to gunturShops and gorantlaRooms
db.version(11).stores({}).upgrade(tx =>
  Promise.all([
    tx.table('gunturShops').toCollection().modify((row: any) => {
      if (row.advanceAmount === undefined) row.advanceAmount = 0;
      if (row.advanceDate   === undefined) row.advanceDate   = null;
    }),
    tx.table('gorantlaRooms').toCollection().modify((row: any) => {
      if (row.advanceAmount === undefined) row.advanceAmount = 0;
      if (row.advanceDate   === undefined) row.advanceDate   = null;
    }),
  ])
);

// ─── Install Audit Middleware (§19) — auto-logs all mutations ─────────────────
import('./audit-middleware').then(({ installAuditMiddleware }) => {
  installAuditMiddleware(db);
}).catch(() => {});

// ─── Safe open: if a schema upgrade fails (stale IndexedDB from dev builds),
//     delete the database and reload once so the user never sees a broken app.
db.open().catch(err => {
  if (
    err?.name === 'UpgradeError' ||
    err?.name === 'DatabaseClosedError' ||
    (err?.message && err.message.includes('changing primary key'))
  ) {
    console.warn('[Savora] Schema conflict detected — clearing stale DB and reloading.');
    Dexie.delete('SavoraDB').then(() => {
      window.location.reload();
    });
  }
});

export { db };
