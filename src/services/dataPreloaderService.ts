import { db } from '@/lib/db';
import type {
  Txn, Goal, CreditCard, Vehicle, Investment, RentalProperty, Tenant,
  Gold, Insurance, Loan, BrotherRepayment, Subscription, Health,
  GlobalSettings, FamilyBankAccount, FamilyTransfer, EmergencyFund
} from '@/lib/db';
import { withTimestamps } from '@/lib/goal-factory';
import { createGoal } from '@/lib/goal-factory';

const now = new Date();

const sampleTransactions: Omit<Txn, 'id'>[] = [
  {
    date: new Date(),
    amount: -500,
    currency: 'INR',
    category: 'Food',
    note: 'Sample lunch expense',
    tags: ['food', 'lunch'],
    paymentMix: [{ mode: 'Cash', amount: 500 }],
    splitWith: [],
    isPartialRent: false,
    isSplit: false,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleGoals: Goal[] = [
  createGoal({
    name: 'Retirement Fund',
    slug: 'retirement',
    type: 'Long',
    targetAmount: 10000000,
    targetDate: new Date('2045-12-31'),
    currentAmount: 500000,
    notes: 'Planning for retirement'
  })
];

const sampleCreditCards: Omit<CreditCard, 'id'>[] = [
  {
    name: 'HDFC 1234',
    issuer: 'HDFC',
    bankName: 'HDFC Bank',
    last4: '1234',
    network: 'Visa',
    cardVariant: 'Platinum',
    productVariant: 'Regular',
    annualFee: 500,
    annualFeeGst: 90,
    creditLimit: 100000,
    limit: 100000,
    creditLimitShared: false,
    fuelSurchargeWaiver: true,
    rewardPointsBalance: 1200,
    cycleStart: 1,
    stmtDay: 20,
    dueDay: 10,
    fxTxnFee: 3.5,
    emiConversion: false,
    currentBalance: 0,
    dueDate: new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
  }
];

const sampleVehicles: Omit<Vehicle, 'id'>[] = [
  {
    name: 'Maruti Swift',
    make: 'Maruti',
    model: 'Swift',
    year: 2020,
    purchaseDate: new Date('2020-05-15'),
    purchasePrice: 650000,
    fuelType: 'Petrol',
    registrationNumber: 'KA01AB1234',
    regNo: 'KA01AB1234',
    insuranceExpiry: new Date('2025-05-15'),
    serviceDueDate: new Date('2024-09-15'),
    odometerReading: 45000,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleInvestments: Omit<Investment, 'id'>[] = [
  {
    type: 'MF-Growth',
    name: 'HDFC Equity Fund',
    currentNav: 45.67,
    units: 1000,
    investedValue: 40000,
    currentValue: 45670,
    startDate: new Date('2023-01-01'),
    taxBenefit: false,
    familyMember: 'Self',
    notes: 'Long-term wealth creation',
    purchasePrice: 40,
    quantity: 1000,
    purchaseDate: new Date('2023-01-01'),
    createdAt: now,
    updatedAt: now,
  }
];

const sampleRentalProperties: Omit<RentalProperty, 'id'>[] = [
  {
    address: '123 MG Road, Bangalore',
    owner: 'Me',
    type: 'Apartment',
    squareYards: 1200,
    monthlyRent: 25000,
    dueDay: 5,
    escalationPercent: 5,
    escalationDate: new Date(),
    lateFeeRate: 2,
    noticePeriodDays: 30,
    depositRefundPending: false,
    propertyTaxAnnual: 12000,
    propertyTaxDueDay: 1,
    waterTaxAnnual: 3000,
    waterTaxDueDay: 1,
    maintenanceReserve: 30000,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleTenants: Omit<Tenant, 'id'>[] = [
  {
    name: 'Sample Tenant',
    email: '',
    phone: '9999999999',
    propertyId: 'sample-property-id',
    leaseStart: new Date('2023-01-01'),
    leaseEnd: new Date('2024-01-01'),
    depositAmount: 50000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleGold: Omit<Gold, 'id'>[] = [
  {
    type: 'Jewelry',
    weight: 10,
    purity: 22,
    purchaseDate: new Date('2023-01-15'),
    purchasePrice: 50000,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleInsurance: Omit<Insurance, 'id'>[] = [
  {
    name: 'Star Health',
    type: 'Health',
    premium: 15000,
    company: 'Star Health',
    policyNumber: 'SH12345678',
    sumAssured: 500000,
    sumInsured: 500000,
    premiumAmount: 15000,
    premiumDueDate: new Date('2024-12-31'),
    nominee: 'Spouse',
    endDate: new Date('2024-12-31'),
    provider: 'Star Health',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleLoans: Omit<Loan, 'id'>[] = [
  {
    name: 'Home Loan',
    principal: 5000000,
    interestRate: 8.5,
    type: 'Personal',
    startDate: new Date('2022-01-01'),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleBrotherRepayments: Omit<BrotherRepayment, 'id'>[] = [
  {
    amount: 10000,
    date: new Date('2023-03-01'),
    createdAt: now,
    updatedAt: now,
  }
];

const sampleSubscriptions: Omit<Subscription, 'id'>[] = [
  {
    name: 'Netflix',
    cost: 500,
    billingCycle: 'Monthly',
    nextBilling: new Date('2024-03-15'),
    category: 'Entertainment',
    autoRenew: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleHealth: Omit<Health, 'id'>[] = [
  {
    refillAlertDays: 7,
    prescriptions: [],
    familyHistory: [],
    vaccinations: [],
    vitals: [],
    createdAt: now,
    updatedAt: now,
  }
];

const sampleFamilyBankAccounts: Omit<FamilyBankAccount, 'id'>[] = [
  {
    name: 'Mother Savings',
    balance: 50000,
    owner: 'Mother',
    bankName: 'SBI',
    type: 'Savings',
    currentBalance: 50000,
    createdAt: now,
    updatedAt: now,
  }
];

const sampleFamilyTransfers: Omit<FamilyTransfer, 'id'>[] = [
  {
    amount: 5000,
    from: 'My Account',
    to: 'Family Account',
    toPerson: 'Mother',
    purpose: 'Monthly allowance',
    mode: 'NEFT',
    date: new Date('2023-02-20'),
    createdAt: now,
    updatedAt: now,
  }
];

const sampleEmergencyFunds: Omit<EmergencyFund, 'id'>[] = [
  {
    name: 'Emergency Fund',
    targetMonths: 6,
    targetAmount: 300000,
    currentAmount: 100000,
    lastReviewDate: new Date(),
    status: 'Under-Target',
    medicalSubBucket: 100000,
    medicalSubBucketUsed: 0,
    createdAt: now,
    updatedAt: now,
  }
];

export const preloadSampleData = async (): Promise<void> => {
  try {
    await Promise.all([
      db.txns.bulkAdd(sampleTransactions.map(t => ({ ...t, id: crypto.randomUUID() }))),
      db.goals.bulkAdd(sampleGoals),
      db.creditCards.bulkAdd(sampleCreditCards.map(c => ({ ...c, id: crypto.randomUUID() }))),
      db.vehicles.bulkAdd(sampleVehicles.map(v => ({ ...v, id: crypto.randomUUID() }))),
      db.investments.bulkAdd(sampleInvestments.map(i => ({ ...i, id: crypto.randomUUID() }))),
      db.rentalProperties.bulkAdd(sampleRentalProperties.map(p => ({ ...p, id: crypto.randomUUID() }))),
      db.tenants.bulkAdd(sampleTenants.map(t => ({ ...t, id: crypto.randomUUID() }))),
      db.gold.bulkAdd(sampleGold.map(g => ({ ...g, id: crypto.randomUUID() }))),
      db.insurance.bulkAdd(sampleInsurance.map(i => ({ ...i, id: crypto.randomUUID() }))),
      db.loans.bulkAdd(sampleLoans.map(l => ({ ...l, id: crypto.randomUUID() }))),
      db.brotherRepayments.bulkAdd(sampleBrotherRepayments.map(r => ({ ...r, id: crypto.randomUUID() }))),
      db.subscriptions.bulkAdd(sampleSubscriptions.map(s => ({ ...s, id: crypto.randomUUID() }))),
      db.health.bulkAdd(sampleHealth.map(h => ({ ...h, id: crypto.randomUUID() }))),
      db.familyBankAccounts.bulkAdd(sampleFamilyBankAccounts.map(a => ({ ...a, id: crypto.randomUUID() }))),
      db.familyTransfers.bulkAdd(sampleFamilyTransfers.map(t => ({ ...t, id: crypto.randomUUID() }))),
      db.emergencyFunds.bulkAdd(sampleEmergencyFunds.map(f => ({ ...f, id: crypto.randomUUID() }))),
    ]);
    console.log('Sample data preloaded successfully');
  } catch (error) {
    console.error('Error preloading sample data:', error);
    throw error;
  }
};

export async function preloadFinancialData(data?: any): Promise<{ success: boolean; message: string; summary?: any }> {
  try {
    if (data) {
      console.log('Financial data preloading with provided data:', Object.keys(data));
    } else {
      await preloadSampleData();
    }
    return { success: true, message: 'Financial data preloaded successfully', summary: { preloadedRecords: 'sample data' } };
  } catch (error) {
    console.error('Error preloading financial data:', error);
    return { success: false, message: `Failed to preload: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
