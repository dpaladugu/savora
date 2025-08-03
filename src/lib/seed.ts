import { db } from './db';
import type { GlobalSettings } from './db';

export const seedDatabase = async () => {
  // Seed GlobalSettings
  const existingSettings = await db.globalSettings.toArray();
  if (existingSettings.length === 0) {
    const defaultSettings: GlobalSettings = {
      id: 'default',
      taxRegime: 'New',
      autoLockMinutes: 5,
      birthdayBudget: 10000,
      birthdayAlertDays: 7,
      emergencyContacts: [],
      dependents: [],
      salaryCreditDay: 1,
      annualBonus: 0,
      medicalInflationRate: 8,
      educationInflation: 10,
      vehicleInflation: 6,
      maintenanceInflation: 7,
      privacyMask: false,
      failedPinAttempts: 0,
      maxFailedAttempts: 10,
      darkMode: false,
      timeZone: 'Asia/Kolkata',
      isTest: true,
      theme: 'system', // Fixed: was "auto"
      deviceThemes: {},
      revealSecret: ''
    };
    await db.globalSettings.add(defaultSettings);
  }

  // Seed Goals
  const existingGoals = await db.goals.toArray();
  if (existingGoals.length === 0) {
    await db.goals.bulkAdd([
      {
        id: 'goal-1',
        name: 'Retirement Fund',
        slug: 'retirement-fund',
        type: 'Long',
        targetAmount: 10000000,
        targetDate: new Date('2050-12-31'),
        currentAmount: 100000,
        notes: 'Aggressive investments for long-term growth'
      },
      {
        id: 'goal-2',
        name: 'Home Down Payment',
        slug: 'home-down-payment',
        type: 'Medium',
        targetAmount: 5000000,
        targetDate: new Date('2028-12-31'),
        currentAmount: 50000,
        notes: 'Save for 20% down payment on a house'
      },
      {
        id: 'goal-3',
        name: 'Emergency Fund',
        slug: 'emergency-fund',
        type: 'Short',
        targetAmount: 600000,
        targetDate: new Date('2024-12-31'),
        currentAmount: 300000,
        notes: '6 months of living expenses'
      }
    ]);
  }

  // Seed CreditCards
  const existingCards = await db.creditCards.toArray();
  if (existingCards.length === 0) {
    await db.creditCards.bulkAdd([
      {
        id: 'card-1',
        issuer: 'HDFC Bank',
        bankName: 'HDFC',
        last4: '1234',
        network: 'Visa',
        cardVariant: 'Platinum',
        productVariant: 'Regular',
        annualFee: 500,
        annualFeeGst: 90,
        creditLimit: 500000,
        creditLimitShared: false,
        fuelSurchargeWaiver: true,
        rewardPointsBalance: 1000,
        cycleStart: 1,
        stmtDay: 20,
        dueDay: 10
      },
      {
        id: 'card-2',
        issuer: 'SBI Card',
        bankName: 'SBI',
        last4: '5678',
        network: 'Mastercard',
        cardVariant: 'Gold',
        productVariant: 'Premium',
        annualFee: 0,
        annualFeeGst: 0,
        creditLimit: 300000,
        creditLimitShared: true,
        fuelSurchargeWaiver: false,
        rewardPointsBalance: 500,
        cycleStart: 15,
        stmtDay: 5,
        dueDay: 25
      }
    ]);
  }

  // Seed Vehicles
  const existingVehicles = await db.vehicles.toArray();
  if (existingVehicles.length === 0) {
    await db.vehicles.bulkAdd([
      {
        id: 'vehicle-1',
        owner: 'Me',
        regNo: 'TS09GA1234',
        make: 'Hyundai',
        model: 'i20',
        type: 'Car',
        purchaseDate: new Date('2020-01-15'),
        insuranceExpiry: new Date('2024-01-15'),
        pucExpiry: new Date('2023-12-31'),
        odometer: 50000,
        fuelEfficiency: 20,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 5
      },
      {
        id: 'vehicle-2',
        owner: 'Me',
        regNo: 'TS10FA5678',
        make: 'Honda',
        model: 'Activa',
        type: 'Scooter',
        purchaseDate: new Date('2021-03-10'),
        insuranceExpiry: new Date('2024-03-10'),
        pucExpiry: new Date('2024-02-28'),
        odometer: 15000,
        fuelEfficiency: 45,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 3
      }
    ]);
  }

  // Seed Investments
  const existingInvestments = await db.investments.toArray();
  if (existingInvestments.length === 0) {
    await db.investments.bulkAdd([
      {
        id: 'investment-1',
        type: 'MF-Growth',
        name: 'Axis Bluechip Fund',
        currentNav: 55.67,
        units: 500,
        investedValue: 25000,
        currentValue: 27835,
        startDate: new Date('2022-03-01'),
        frequency: 'Monthly',
        taxBenefit: true,
        familyMember: 'Self',
        notes: 'SIP for long-term capital appreciation'
      },
      {
        id: 'investment-2',
        type: 'FD',
        name: 'SBI Fixed Deposit',
        currentNav: 1,
        units: 1,
        investedValue: 100000,
        currentValue: 108000,
        startDate: new Date('2023-01-01'),
        frequency: 'One-time',
        taxBenefit: false,
        familyMember: 'Self',
        notes: 'Safe investment with guaranteed returns'
      }
    ]);
  }

  // Seed RentalProperties
  const existingProperties = await db.rentalProperties.toArray();
  if (existingProperties.length === 0) {
    await db.rentalProperties.add({
      id: 'property-1',
      address: '123 Sample Street, Hyderabad',
      owner: 'Me',
      type: 'Apartment',
      squareYards: 1200,
      monthlyRent: 25000,
      dueDay: 5,
      escalationPercent: 5,
      depositRefundPending: false,
      propertyTaxAnnual: 12000,
      waterTaxAnnual: 3000
      // Removed maintenanceReserve as it's causing error
    });
  }

  // Seed Tenants
  const existingTenants = await db.tenants.toArray();
  if (existingTenants.length === 0) {
    await db.tenants.bulkAdd([
      {
        id: 'tenant-1',
        propertyId: 'property-1',
        tenantName: 'John Doe',
        phone: '+91-9876543210',
        moveInDate: new Date('2023-01-01'),
        rentDueDate: 5,
        rentAmount: 25000,
        securityDeposit: 50000,
        depositRefundPending: false
      },
      {
        id: 'tenant-2',
        propertyId: 'property-1',
        tenantName: 'Jane Smith',
        phone: '+91-8765432109',
        moveInDate: new Date('2023-05-01'),
        rentDueDate: 5,
        rentAmount: 25000,
        securityDeposit: 50000,
        depositRefundPending: false
      }
    ]);
  }
};
