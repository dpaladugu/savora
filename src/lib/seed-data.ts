
import { db } from '@/lib/db';
import type { 
  GlobalSettings, 
  Txn, 
  Goal, 
  CreditCard, 
  Investment, 
  Insurance,
  EmergencyFund 
} from '@/lib/db';

export async function seedInitialData() {
  try {
    // Check if data already exists
    const existingTxns = await db.txns.count();
    if (existingTxns > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    console.log('Seeding initial data...');

    // Add global settings with all required fields
    const globalSettings: GlobalSettings = {
      id: '1',
      taxRegime: 'New',
      autoLockMinutes: 5,
      birthdayBudget: 5000,
      birthdayAlertDays: 7,
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '+91-9999999999', relation: 'Family' }
      ],
      dependents: [],
      salaryCreditDay: 15,
      annualBonus: 100000,
      medicalInflationRate: 10.0,
      educationInflation: 7.0,
      vehicleInflation: 5.0,
      maintenanceInflation: 6.0,
      privacyMask: true,
      failedPinAttempts: 0,
      maxFailedAttempts: 10,
      darkMode: false,
      timeZone: "Asia/Kolkata",
      isTest: false,
      theme: 'auto'
    };
    await db.globalSettings.add(globalSettings);

    // Add some sample transactions with correct PaymentSplit structure
    const sampleTransactions: Txn[] = [
      {
        id: crypto.randomUUID(),
        date: new Date('2024-01-15'),
        amount: -2500,
        currency: 'INR',
        category: 'Food',
        note: 'Grocery shopping',
        tags: ['grocery', 'monthly'],
        paymentMix: [{ mode: 'UPI', amount: 2500 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      },
      {
        id: crypto.randomUUID(),
        date: new Date('2024-01-20'),
        amount: 50000,
        currency: 'INR',
        category: 'Salary',
        note: 'Monthly salary',
        tags: ['salary', 'income'],
        paymentMix: [{ mode: 'Bank', amount: 50000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      },
      {
        id: crypto.randomUUID(),
        date: new Date('2024-01-25'),
        amount: -15000,
        currency: 'INR',
        category: 'Rent',
        note: 'Monthly rent payment',
        tags: ['rent', 'housing'],
        paymentMix: [{ mode: 'UPI', amount: 15000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      }
    ];

    await db.txns.bulkAdd(sampleTransactions);

    // Add sample goals with required slug field
    const sampleGoals: Goal[] = [
      {
        id: crypto.randomUUID(),
        name: 'Emergency Fund',
        slug: 'emergency-fund',
        type: 'Short',
        targetAmount: 300000,
        targetDate: new Date('2024-12-31'),
        currentAmount: 50000,
        notes: 'Build 6 months of expenses as emergency fund'
      },
      {
        id: crypto.randomUUID(),
        name: 'House Down Payment',
        slug: 'house-down-payment',
        type: 'Long',
        targetAmount: 2000000,
        targetDate: new Date('2027-01-01'),
        currentAmount: 150000,
        notes: 'Save for house down payment'
      }
    ];

    await db.goals.bulkAdd(sampleGoals);

    // Add emergency fund
    const emergencyFund: EmergencyFund = {
      id: crypto.randomUUID(),
      targetMonths: 6,
      targetAmount: 300000,
      currentAmount: 50000,
      lastReviewDate: new Date(),
      status: 'Under-Target',
      medicalSubBucket: 200000,
      medicalSubBucketUsed: 0
    };

    await db.emergencyFunds.add(emergencyFund);

    // Add sample investment
    const sampleInvestment: Investment = {
      id: crypto.randomUUID(),
      type: 'MF-Growth',
      name: 'HDFC Top 100 Fund',
      currentNav: 750,
      units: 200,
      investedValue: 120000,
      currentValue: 150000,
      startDate: new Date('2023-01-01'),
      frequency: 'Monthly',
      taxBenefit: false,
      familyMember: 'Self',
      notes: 'Large cap mutual fund investment'
    };

    await db.investments.add(sampleInvestment);

    // Add sample insurance
    const sampleInsurance: Insurance = {
      id: crypto.randomUUID(),
      type: 'Health',
      provider: 'HDFC ERGO',
      policyNo: 'POL123456',
      sumInsured: 500000,
      premium: 12000,
      dueDay: 15,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      nomineeName: 'Family Member',
      nomineeDOB: '1990-01-01',
      nomineeRelation: 'Spouse',
      familyMember: 'Self',
      notes: 'Family health insurance policy'
    };

    await db.insurance.add(sampleInsurance);

    console.log('Initial data seeded successfully');

  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
