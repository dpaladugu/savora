
import { db } from './db';
import { addYears, subMonths } from 'date-fns';

async function seedDatabase(): Promise<void> {
  console.log('Starting database seed...');
  
  try {
    // Clear existing data
    await Promise.all([
      db.txns.clear(),
      db.goals.clear(),
      db.creditCards.clear(),
      db.vehicles.clear(),
      db.investments.clear(),
      db.rentalProperties.clear(),
      db.tenants.clear(),
      db.gold.clear(),
      db.insurance.clear(),
      db.loans.clear(),
      db.brotherRepayments.clear(),
      db.subscriptions.clear(),
      db.health.clear(),
      db.globalSettings.clear(),
      db.familyBankAccounts.clear(),
      db.familyTransfers.clear(),
      db.emergencyFunds.clear(),
      db.auditLogs.clear()
    ]);

    const now = new Date();

    // Seed Global Settings with proper Contact[] and Dependent[] types
    await db.globalSettings.add({
      id: 'global-settings-1',
      taxRegime: 'New',
      autoLockMinutes: 5,
      birthdayBudget: 10000,
      birthdayAlertDays: 7,
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '+91-9876543210', relation: 'Friend' }
      ],
      dependents: [
        { name: 'Child 1', dob: new Date('2015-06-15'), relation: 'Child' }
      ],
      salaryCreditDay: 1,
      annualBonus: 200000,
      medicalInflationRate: 10.0,
      educationInflation: 7.0,
      vehicleInflation: 5.0,
      maintenanceInflation: 6.0,
      privacyMask: false,
      failedPinAttempts: 0,
      maxFailedAttempts: 10,
      darkMode: false,
      timeZone: 'Asia/Kolkata',
      isTest: true,
      theme: 'light',
      deviceThemes: {},
      revealSecret: ''
    });

    // Seed Vehicles
    await Promise.all([
      db.vehicles.add({
        id: 'vehicle-1',
        name: 'Swift',
        model: 'Swift',
        year: 2020,
        make: 'Maruti',
        type: 'Hatchback',
        fuelType: 'Petrol',
        registrationNumber: 'KA01AB1234',
        regNo: 'KA01AB1234',
        purchaseDate: addYears(now, -2),
        purchasePrice: 600000,
        insuranceExpiry: addYears(now, 1),
        pucExpiry: addYears(now, 1),
        serviceDueDate: addYears(now, 1),
        odometer: 25000,
        odometerReading: 25000,
        fuelEfficiency: 18.5,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 6,
        depreciationRate: 15,
        ncbPercent: 20,
        createdAt: now,
        updatedAt: now
      }),
      db.vehicles.add({
        id: 'vehicle-2',
        name: 'City',
        model: 'City',
        year: 2019,
        make: 'Honda',
        type: 'Sedan',
        fuelType: 'Petrol',
        registrationNumber: 'KA02CD5678',
        regNo: 'KA02CD5678',
        purchaseDate: addYears(now, -3),
        purchasePrice: 1200000,
        insuranceExpiry: addYears(now, 1),
        pucExpiry: addYears(now, 1),
        serviceDueDate: addYears(now, 1),
        odometer: 45000,
        odometerReading: 45000,
        fuelEfficiency: 16.2,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 4,
        depreciationRate: 12,
        ncbPercent: 35,
        createdAt: now,
        updatedAt: now
      })
    ]);

    // Seed Transactions with all required fields
    const transactions = [
      {
        id: 'txn-1',
        date: subMonths(now, 1),
        amount: -5000,
        currency: 'INR',
        category: 'Food',
        note: 'Grocery shopping',
        tags: ['essential'],
        paymentMix: [{ mode: 'UPI' as const, amount: 5000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'txn-2',
        date: subMonths(now, 1),
        amount: 75000,
        currency: 'INR',
        category: 'Salary',
        note: 'Monthly salary',
        tags: ['income'],
        paymentMix: [{ mode: 'Bank' as const, amount: 75000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const txn of transactions) {
      await db.txns.add(txn);
    }

    // Seed Subscriptions with correct schema
    await db.subscriptions.add({
      id: 'sub-1',
      name: 'Netflix',
      cost: 649,
      billingCycle: 'Monthly',
      nextBilling: addYears(now, 1),
      amount: 649,
      cycle: 'Monthly',
      startDate: now,
      nextDue: addYears(now, 1),
      reminderDays: 7,
      isActive: true,
      autoRenew: true,
      category: 'Entertainment',
      createdAt: now,
      updatedAt: now
    });

    // Seed Rental Properties with all required fields
    await db.rentalProperties.add({
      id: 'property-1',
      address: '123 Main Street, Bangalore',
      owner: 'Me',
      type: 'Apartment',
      squareYards: 150,
      monthlyRent: 25000,
      dueDay: 5,
      escalationPercent: 5,
      escalationDate: addYears(now, 1),
      lateFeeRate: 100,
      noticePeriodDays: 30,
      depositRefundPending: false,
      propertyTaxAnnual: 12000,
      propertyTaxDueDay: 31,
      waterTaxAnnual: 3000,
      waterTaxDueDay: 15,
      maintenanceReserve: 50000,
      createdAt: now,
      updatedAt: now
    });

    // Seed Tenants with correct property mapping
    await Promise.all([
      db.tenants.add({
        id: 'tenant-1',
        propertyId: 'property-1',
        name: 'John Doe',
        phone: '+91-9876543210',
        email: 'john.doe@email.com',
        leaseStart: subMonths(now, 6),
        leaseEnd: addYears(now, 1),
        depositAmount: 50000,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }),
      db.tenants.add({
        id: 'tenant-2',
        propertyId: 'property-1',
        name: 'Jane Smith',
        phone: '+91-9876543211',
        email: 'jane.smith@email.com',
        leaseStart: subMonths(now, 3),
        leaseEnd: addYears(now, 2),
        depositAmount: 50000,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
    ]);

    // Seed Investments
    await db.investments.add({
      id: 'investment-1',
      type: 'MF-Growth',
      name: 'HDFC Top 100 Fund',
      currentNav: 650.25,
      units: 1538.46,
      investedValue: 100000,
      currentValue: 105000,
      purchasePrice: 65,
      quantity: 1538.46,
      purchaseDate: subMonths(now, 12),
      startDate: subMonths(now, 12),
      maturityDate: addYears(now, 10),
      createdAt: now,
      updatedAt: now
    });

    // Seed Emergency Fund
    await db.emergencyFunds.add({
      id: 'emergency-1',
      name: 'Emergency Fund',
      targetMonths: 12,
      targetAmount: 600000,
      currentAmount: 200000,
      lastReviewDate: now,
      status: 'Under-Target',
      medicalSubBucket: 200000,
      medicalSubBucketUsed: 0,
      createdAt: now,
      updatedAt: now
    });

    // Seed Insurance
    await db.insurance.add({
      id: 'insurance-1',
      name: 'Health Insurance',
      type: 'Health',
      premium: 12000,
      provider: 'Star Health',
      company: 'Star Health',
      policyNumber: 'SH123456789',
      sumAssured: 500000,
      sumInsured: 500000,
      premiumAmount: 12000,
      premiumDueDate: addYears(now, 1),
      endDate: addYears(now, 1),
      nominee: 'Spouse',
      notes: 'Family floater plan',
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    // Seed Goals
    await db.goals.add({
      id: 'goal-1',
      name: 'Emergency Fund',
      title: 'Emergency Fund Goal',
      targetAmount: 600000,
      currentAmount: 200000,
      deadline: addYears(now, 2).toISOString(),
      category: 'savings',
      createdAt: now,
      updatedAt: now
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Export the seed function
export async function seed(): Promise<void> {
  await seedDatabase();
}

export { seedDatabase };
