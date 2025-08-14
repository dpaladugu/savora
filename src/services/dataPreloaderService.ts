import { db } from '@/lib/db';
import type { 
  Txn, 
  Goal, 
  CreditCard, 
  Vehicle, 
  Investment, 
  RentalProperty, 
  Tenant, 
  Gold, 
  Insurance, 
  Loan, 
  BrotherRepayment, 
  Subscription, 
  Health, 
  GlobalSettings, 
  FamilyBankAccount, 
  FamilyTransfer, 
  EmergencyFund 
} from '@/lib/db';

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
    isSplit: false
  }
];

const sampleGoals: Omit<Goal, 'id'>[] = [
  {
    name: 'Retirement Fund',
    slug: 'retirement',
    type: 'Long',
    targetAmount: 10000000,
    targetDate: new Date('2045-12-31'),
    currentAmount: 500000,
    notes: 'Planning for retirement'
  }
];

const sampleCreditCards: Omit<CreditCard, 'id'>[] = [
  {
    issuer: 'HDFC',
    bankName: 'HDFC Bank',
    last4: '1234',
    network: 'Visa',
    cardVariant: 'Platinum',
    productVariant: 'Regular',
    annualFee: 500,
    annualFeeGst: 90,
    creditLimit: 100000,
    creditLimitShared: false,
    fuelSurchargeWaiver: true,
    rewardPointsBalance: 1200,
    cycleStart: 1,
    stmtDay: 20,
    dueDay: 10
  }
];

const sampleVehicles: Omit<Vehicle, 'id'>[] = [
  {
    make: 'Maruti',
    model: 'Swift',
    year: 2020,
    purchaseDate: new Date('2020-05-15'),
    purchasePrice: 650000,
    fuelType: 'Petrol' as const,
    registrationNumber: 'KA01AB1234',
    regNo: 'KA01AB1234',
    insuranceExpiry: new Date('2025-05-15'),
    serviceDueDate: new Date('2024-09-15'),
    odometerReading: 45000,
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
    frequency: 'Monthly',
    taxBenefit: false,
    familyMember: 'Self',
    notes: 'Long-term wealth creation'
  }
];

const sampleRentalProperties: Omit<RentalProperty, 'id'>[] = [
  {
    address: '123 MG Road, Bangalore',
    owner: 'Me' as const,
    type: 'Apartment' as const,
    squareYards: 1200,
    monthlyRent: 25000,
    dueDay: 5,
    escalationPercent: 5,
    depositRefundPending: false,
    propertyTaxAnnual: 12000,
    waterTaxAnnual: 3000,
    maintenanceReserve: 30000, // Annual maintenance reserve
  }
];

const sampleTenants: Omit<Tenant, 'id'>[] = [
  {
    name: 'Sample Tenant',
    phone: '9999999999',
    moveInDate: new Date('2023-01-01'),
    rentDueDate: 5,
    rentAmount: 25000,
    securityDeposit: 50000,
    rentalPropertyId: 'sample-property-id',
    propertyId: 'sample-property-id',
    tenantName: 'Sample Tenant',
    monthlyRent: 25000,
    depositPaid: 50000,
    joinDate: new Date('2023-01-01'),
    depositRefundPending: false,
    tenantContact: '9999999999'
  }
];

const sampleGold: Omit<Gold, 'id'>[] = [
  {
    purchaseDate: new Date('2023-01-15'),
    grams: 10,
    ratePerGram: 5000,
    makingCharges: 500,
    gst: 150
  }
];

const sampleInsurance: Omit<Insurance, 'id'>[] = [
  {
    type: 'Health' as const,
    company: 'Star Health',
    policyNumber: 'SH12345678',
    sumAssured: 500000,
    premiumAmount: 15000,
    premiumDueDate: new Date('2024-12-31'),
    nominee: 'Spouse',
    sumInsured: 500000,
    endDate: new Date('2024-12-31'),
    provider: 'Star Health',
    isActive: true,
  }
];

const sampleLoans: Omit<Loan, 'id'>[] = [
  {
    type: 'Home',
    bank: 'Sample Bank',
    loanAmount: 5000000,
    interestRate: 8.5,
    startDate: new Date('2022-01-01'),
    endDate: new Date('2042-01-01'),
    emiAmount: 45000,
    emi: 45000,
    roi: 8.5,
    outstanding: 5000000,
    tenureMonths: 240,
    isActive: true
  }
];

const sampleBrotherRepayments: Omit<BrotherRepayment, 'id'>[] = [
  {
    date: new Date('2023-03-01'),
    amount: 10000
  }
];

const sampleSubscriptions: Omit<Subscription, 'id'>[] = [
  {
    name: 'Netflix',
    category: 'Entertainment',
    amount: 500,
    dueDate: new Date('2023-03-15'),
    paymentMethod: 'Card',
    autoRenew: true
  }
];

const sampleHealth: Omit<Health, 'id'>[] = [
  {
    refillAlertDays: 7,
    prescriptions: [],
    familyHistory: [],
    vaccinations: [],
    vitals: []
  }
];

const sampleFamilyBankAccounts: Omit<FamilyBankAccount, 'id'>[] = [
  {
    accountHolderName: 'Sample Name',
    bankName: 'Sample Bank',
    accountNumber: 'SB123456789',
    ifscCode: 'SBIN0000000',
    accountType: 'Savings'
  }
];

const sampleFamilyTransfers: Omit<FamilyTransfer, 'id'>[] = [
  {
    date: new Date('2023-02-20'),
    fromAccount: 'My Account',
    toAccount: 'Family Account',
    amount: 5000
  }
];

const sampleEmergencyFunds: Omit<EmergencyFund, 'id'>[] = [
  {
    targetMonths: 6,
    targetAmount: 300000,
    currentAmount: 100000,
    lastReviewDate: new Date(),
    status: 'Under-Target',
    medicalSubBucket: 100000,
    medicalSubBucketUsed: 0
  }
];

export const preloadSampleData = async (): Promise<void> => {
  try {
    await Promise.all([
      db.txns.bulkAdd(
        sampleTransactions.map((txn) => ({ ...txn, id: crypto.randomUUID() }))
      ),
      db.goals.bulkAdd(
        sampleGoals.map((goal) => ({ ...goal, id: crypto.randomUUID() }))
      ),
      db.creditCards.bulkAdd(
        sampleCreditCards.map((card) => ({ ...card, id: crypto.randomUUID() }))
      ),
      db.vehicles.bulkAdd(
        sampleVehicles.map((vehicle) => ({ ...vehicle, id: crypto.randomUUID() }))
      ),
      db.investments.bulkAdd(
        sampleInvestments.map((investment) => ({
          ...investment,
          id: crypto.randomUUID()
        }))
      ),
      db.rentalProperties.bulkAdd(
        sampleRentalProperties.map((property) => ({
          ...property,
          id: crypto.randomUUID()
        }))
      ),
      db.tenants.bulkAdd(
        sampleTenants.map((tenant) => ({ ...tenant, id: crypto.randomUUID() }))
      ),
      db.gold.bulkAdd(
        sampleGold.map((gold) => ({ ...gold, id: crypto.randomUUID() }))
      ),
      db.insurance.bulkAdd(
        sampleInsurance.map((insurance) => ({
          ...insurance,
          id: crypto.randomUUID()
        }))
      ),
      db.loans.bulkAdd(
        sampleLoans.map((loan) => ({ ...loan, id: crypto.randomUUID() }))
      ),
      db.brotherRepayments.bulkAdd(
        sampleBrotherRepayments.map((repayment) => ({
          ...repayment,
          id: crypto.randomUUID()
        }))
      ),
      db.subscriptions.bulkAdd(
        sampleSubscriptions.map((subscription) => ({
          ...subscription,
          id: crypto.randomUUID()
        }))
      ),
      db.health.bulkAdd(
        sampleHealth.map((health) => ({ ...health, id: crypto.randomUUID() }))
      ),
      db.familyBankAccounts.bulkAdd(
        sampleFamilyBankAccounts.map((account) => ({
          ...account,
          id: crypto.randomUUID()
        }))
      ),
      db.familyTransfers.bulkAdd(
        sampleFamilyTransfers.map((transfer) => ({
          ...transfer,
          id: crypto.randomUUID()
        }))
      ),
      db.emergencyFunds.bulkAdd(
        sampleEmergencyFunds.map((fund) => ({ ...fund, id: crypto.randomUUID() }))
      )
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
      // TODO: Implement actual data preloading logic
      console.log('Financial data preloading with provided data:', Object.keys(data));
    } else {
      // Use sample data if no data provided
      await preloadSampleData();
    }
    
    return {
      success: true,
      message: 'Financial data preloaded successfully',
      summary: { preloadedRecords: 'sample data' }
    };
  } catch (error) {
    console.error('Error preloading financial data:', error);
    return {
      success: false,
      message: `Failed to preload financial data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
