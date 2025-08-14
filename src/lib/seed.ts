
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
      db.auditLogs.clear(),
      db.appSettings.clear()
    ]);

    // Seed Global Settings
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
        owner: 'Me',
        regNo: 'KA01AB1234',
        registrationNumber: 'KA01AB1234',
        make: 'Maruti',
        model: 'Swift',
        type: 'Hatchback',
        year: 2020,
        purchaseDate: addYears(new Date(), -2),
        purchasePrice: 600000,
        fuelType: 'Petrol',
        insuranceExpiry: addYears(new Date(), 1),
        pucExpiry: addYears(new Date(), 1),
        serviceDueDate: addYears(new Date(), 1),
        odometer: 25000,
        odometerReading: 25000,
        fuelEfficiency: 18.5,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 6,
        depreciationRate: 15,
        ncbPercent: 20
      }),
      db.vehicles.add({
        id: 'vehicle-2',
        owner: 'Me',
        regNo: 'KA02CD5678',
        registrationNumber: 'KA02CD5678',
        make: 'Honda',
        model: 'City',
        type: 'Sedan',
        year: 2019,
        purchaseDate: addYears(new Date(), -3),
        purchasePrice: 1200000,
        fuelType: 'Petrol',
        insuranceExpiry: addYears(new Date(), 1),
        pucExpiry: addYears(new Date(), 1),
        serviceDueDate: addYears(new Date(), 1),
        odometer: 45000,
        odometerReading: 45000,
        fuelEfficiency: 16.2,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 4,
        depreciationRate: 12,
        ncbPercent: 35
      })
    ]);

    // Seed Transactions
    const transactions = [
      {
        id: 'txn-1',
        date: subMonths(new Date(), 1),
        amount: -5000,
        currency: 'INR',
        category: 'Food',
        note: 'Grocery shopping',
        tags: ['essential'],
        paymentMix: [{ mode: 'UPI' as const, amount: 5000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      },
      {
        id: 'txn-2',
        date: subMonths(new Date(), 1),
        amount: 75000,
        currency: 'INR',
        category: 'Salary',
        note: 'Monthly salary',
        tags: ['income'],
        paymentMix: [{ mode: 'Bank' as const, amount: 75000 }],
        splitWith: [],
        isPartialRent: false,
        isSplit: false
      }
    ];

    for (const txn of transactions) {
      await db.txns.add(txn);
    }

    // Seed Subscriptions
    await db.subscriptions.add({
      id: 'sub-1',
      name: 'Netflix',
      category: 'Entertainment',
      amount: 649,
      dueDate: addYears(new Date(), 1),
      paymentMethod: 'Card',
      autoRenew: true,
      notes: 'Premium plan'
    });

    // Seed Rental Properties
    await db.rentalProperties.add({
      id: 'property-1',
      address: '123 Main Street, Bangalore',
      owner: 'Me',
      type: 'Apartment',
      squareYards: 150,
      monthlyRent: 25000,
      dueDay: 5,
      escalationPercent: 5,
      escalationDate: addYears(new Date(), 1),
      lateFeeRate: 100,
      noticePeriodDays: 30,
      depositRefundPending: false,
      propertyTaxAnnual: 12000,
      propertyTaxDueDay: 31,
      waterTaxAnnual: 3000,
      waterTaxDueDay: 15,
      maintenanceReserve: 50000
    });

    // Seed Tenants with correct property mapping
    await Promise.all([
      db.tenants.add({
        id: 'tenant-1',
        propertyId: 'property-1',
        rentalPropertyId: 'property-1',
        tenantName: 'John Doe',
        name: 'John Doe',
        phone: '+91-9876543210',
        email: 'john.doe@email.com',
        roomNo: '101',
        monthlyRent: 25000,
        rentAmount: 25000,
        depositPaid: 50000,
        securityDeposit: 50000,
        joinDate: subMonths(new Date(), 6),
        moveInDate: subMonths(new Date(), 6),
        endDate: addYears(new Date(), 1),
        rentDueDate: 5,
        depositRefundPending: false,
        tenantContact: '+91-9876543210'
      }),
      db.tenants.add({
        id: 'tenant-2',
        propertyId: 'property-1',
        rentalPropertyId: 'property-1',
        tenantName: 'Jane Smith',
        name: 'Jane Smith',
        phone: '+91-9876543211',
        email: 'jane.smith@email.com',
        roomNo: '102',
        monthlyRent: 25000,
        rentAmount: 25000,
        depositPaid: 50000,
        securityDeposit: 50000,
        joinDate: subMonths(new Date(), 3),
        moveInDate: subMonths(new Date(), 3),
        endDate: addYears(new Date(), 2),
        rentDueDate: 5,
        depositRefundPending: false,
        tenantContact: '+91-9876543211'
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
      startDate: subMonths(new Date(), 12),
      frequency: 'Monthly',
      taxBenefit: false,
      familyMember: 'Me',
      notes: 'Long-term wealth creation',
      maturityDate: addYears(new Date(), 10)
    });

    // Seed Emergency Fund
    await db.emergencyFunds.add({
      id: 'emergency-1',
      targetMonths: 12,
      targetAmount: 600000,
      currentAmount: 200000,
      lastReviewDate: new Date(),
      status: 'Under-Target',
      medicalSubBucket: 200000,
      medicalSubBucketUsed: 0
    });

    // Seed Insurance
    await db.insurance.add({
      id: 'insurance-1',
      type: 'Health',
      company: 'Star Health',
      provider: 'Star Health',
      policyNumber: 'SH123456789',
      sumAssured: 500000,
      sumInsured: 500000,
      premiumAmount: 12000,
      premiumDueDate: addYears(new Date(), 1),
      endDate: addYears(new Date(), 1),
      nominee: 'Spouse',
      notes: 'Family floater plan',
      isActive: true
    });

    // Seed Goals
    await db.goals.add({
      id: 'goal-1',
      name: 'Emergency Fund',
      slug: 'emergency-fund',
      type: 'Short',
      targetAmount: 600000,
      targetDate: addYears(new Date(), 2),
      currentAmount: 200000,
      notes: '12 months of expenses'
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
