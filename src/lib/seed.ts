
import { db } from './db';

export const seed = async () => {
  if (localStorage.getItem('seedLoaded')) return;

  // Initialize global settings with all required fields
  await db.globalSettings.add({
    id: 'main',
    taxRegime: 'New',
    autoLockMinutes: 5,
    birthdayBudget: 0,
    birthdayAlertDays: 7,
    emergencyContacts: [],
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
  });

  // Add sample transactions with correct PaymentSplit structure
  await db.txns.bulkAdd([
    { 
      id: 'tx1', 
      date: new Date('2024-07-01'), 
      amount: 50000, 
      currency: 'INR', 
      category: 'Salary', 
      note: 'July salary',
      tags: ['salary', 'income'],
      paymentMix: [{ mode: 'Bank', amount: 50000 }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false
    },
    { 
      id: 'tx2', 
      date: new Date('2024-07-05'), 
      amount: -1200, 
      currency: 'INR', 
      category: 'Rent', 
      note: 'Home rent',
      tags: ['rent', 'housing'],
      paymentMix: [{ mode: 'UPI', amount: 1200 }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false
    },
    { 
      id: 'tx3', 
      date: new Date('2024-07-10'), 
      amount: -500, 
      currency: 'INR', 
      category: 'Groceries', 
      note: 'Monthly groceries',
      tags: ['groceries', 'food'],
      paymentMix: [{ mode: 'Cash', amount: 500 }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false
    },
    { 
      id: 'tx4', 
      date: new Date('2024-07-15'), 
      amount: -17964, 
      currency: 'INR', 
      category: 'EMI', 
      note: 'Plot loan EMI',
      tags: ['emi', 'loan'],
      paymentMix: [{ mode: 'Bank', amount: 17964 }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false
    },
    { 
      id: 'tx5', 
      date: new Date('2024-07-20'), 
      amount: 8000, 
      currency: 'INR', 
      category: 'Rental-Income', 
      note: 'Tenant rent',
      tags: ['rental', 'income'],
      paymentMix: [{ mode: 'UPI', amount: 8000 }],
      splitWith: [],
      isPartialRent: false,
      isSplit: false
    },
  ]);

  await db.rentalProperties.add({
    id: 'rp1', 
    address: 'Hometown Plot 1', 
    owner: 'Mother', 
    type: 'House',
    squareYards: 600, 
    monthlyRent: 8000, 
    dueDay: 20, 
    escalationPercent: 10,
    escalationDate: new Date('2025-01-01'),
    lateFeeRate: 5,
    noticePeriodDays: 30,
    depositRefundPending: false,
    propertyTaxAnnual: 12000,
    propertyTaxDueDay: 31,
    waterTaxAnnual: 2400,
    waterTaxDueDay: 31,
    maintenanceReserve: 24000
  });

  await db.goals.add({
    id: 'g1', 
    name: 'Emergency Fund',
    slug: 'emergency-fund', 
    type: 'Short', 
    targetAmount: 120000, 
    targetDate: new Date('2025-12-31'), 
    currentAmount: 0,
    notes: 'Building emergency fund for financial security'
  });

  localStorage.setItem('seedLoaded', 'true');
  console.log('✅ Seed loaded');
};
