import { addDays, addMonths, subYears } from 'date-fns';
import { db } from './db';
import { CreditCard, Goal, Investment, RentalProperty, Subscription, Tenant, Vehicle } from './db';

const creditCards: Omit<CreditCard, 'id'>[] = [
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
    rewardPointsBalance: 1000,
    cycleStart: 1,
    stmtDay: 20,
    dueDay: 10,
  },
  {
    issuer: 'SBI',
    bankName: 'State Bank of India',
    last4: '5678',
    network: 'Mastercard',
    cardVariant: 'Gold',
    productVariant: 'Premium',
    annualFee: 0,
    annualFeeGst: 0,
    creditLimit: 50000,
    creditLimitShared: false,
    fuelSurchargeWaiver: false,
    rewardPointsBalance: 500,
    cycleStart: 15,
    stmtDay: 5,
    dueDay: 25,
  },
];

const goals: Omit<Goal, 'id'>[] = [
  {
    name: 'Trip to Goa',
    slug: 'trip-to-goa',
    type: 'Short',
    targetAmount: 50000,
    targetDate: addMonths(new Date(), 6),
    currentAmount: 10000,
  },
  {
    name: 'Down Payment for Car',
    slug: 'down-payment-for-car',
    type: 'Medium',
    targetAmount: 200000,
    targetDate: addYears(new Date(), 2),
    currentAmount: 50000,
  },
];

const investments: Omit<Investment, 'id'>[] = [
  {
    type: 'MF-Growth',
    name: 'Axis Bluechip Fund',
    currentNav: 750.50,
    units: 100,
    investedValue: 50000,
    currentValue: 75050,
    startDate: subYears(new Date(), 1),
    frequency: 'Monthly',
    taxBenefit: true,
    familyMember: 'Self',
  },
  {
    type: 'Stocks',
    name: 'Reliance Industries',
    currentNav: 2500.00,
    units: 20,
    investedValue: 40000,
    currentValue: 50000,
    startDate: subYears(new Date(), 2),
    frequency: 'OneTime',
    taxBenefit: false,
    familyMember: 'Self',
  },
];

const vehicles: Omit<Vehicle, 'id'>[] = [
  {
    owner: 'Me',
    regNo: 'KA01AB1234',
    registrationNumber: 'KA01AB1234',
    make: 'Maruti',
    model: 'Swift',
    type: 'Hatchback',
    purchaseDate: subYears(new Date(), 3),
    insuranceExpiry: addMonths(new Date(), 2),
    pucExpiry: addMonths(new Date(), 8),
    odometer: 45000,
    fuelEfficiency: 18.5,
    fuelLogs: [],
    serviceLogs: [],
    claims: [],
    treadDepthMM: 6,
  },
  {
    owner: 'Me',
    regNo: 'KA02CD5678',
    registrationNumber: 'KA02CD5678',
    make: 'Honda',
    model: 'City',
    type: 'Sedan',
    purchaseDate: subYears(new Date(), 1),
    insuranceExpiry: addMonths(new Date(), 8),
    pucExpiry: addMonths(new Date(), 14),
    odometer: 15000,
    fuelEfficiency: 16.2,
    fuelLogs: [],
    serviceLogs: [],
    claims: [],
    treadDepthMM: 8,
  }
];

const rentalProperties: Omit<RentalProperty, 'id'>[] = [
  {
    address: '123 MG Road, Bangalore',
    owner: 'Me',
    type: 'Apartment',
    squareYards: 1200,
    monthlyRent: 25000,
    dueDay: 5,
    escalationPercent: 5,
    depositRefundPending: false,
    propertyTaxAnnual: 12000,
    waterTaxAnnual: 3000,
    maintenanceReserve: 30000,
  },
  {
    address: '456 Brigade Road, Bangalore',
    owner: 'Mother',
    type: 'House',
    squareYards: 2400,
    monthlyRent: 40000,
    dueDay: 10,
    escalationPercent: 7,
    depositRefundPending: false,
    propertyTaxAnnual: 24000,
    waterTaxAnnual: 6000,
    maintenanceReserve: 60000,
  },
];

const subscriptions: Omit<Subscription, 'id'>[] = [
  {
    name: 'Netflix',
    category: 'Entertainment',
    amount: 199,
    dueDate: addDays(new Date(), 15),
    paymentMethod: 'Card',
    autoRenew: true,
    notes: 'Premium plan'
  }
];

const tenants: Omit<Tenant, 'id'>[] = [
  {
    propertyId: 'property-1',
    rentalPropertyId: 'property-1',
    tenantName: 'Raj Kumar',
    name: 'Raj Kumar',
    phone: '9876543210',
    moveInDate: subMonths(new Date(), 6),
    joinDate: subMonths(new Date(), 6),
    rentDueDate: 5,
    rentAmount: 25000,
    monthlyRent: 25000,
    securityDeposit: 50000,
    depositPaid: 50000,
    depositRefundPending: false,
    tenantContact: '9876543210'
  },
  {
    propertyId: 'property-2',
    rentalPropertyId: 'property-2',
    tenantName: 'Priya Sharma',
    name: 'Priya Sharma',
    phone: '9876543211',
    moveInDate: subMonths(new Date(), 3),
    joinDate: subMonths(new Date(), 3),
    rentDueDate: 10,
    rentAmount: 30000,
    monthlyRent: 30000,
    securityDeposit: 60000,
    depositPaid: 60000,
    depositRefundPending: false,
    tenantContact: '9876543211'
  }
];

export async function seedDatabase() {
  try {
    await db.creditCards.bulkAdd(creditCards);
    await db.goals.bulkAdd(goals);
    await db.investments.bulkAdd(investments);
    await db.vehicles.bulkAdd(vehicles);
    await db.rentalProperties.bulkAdd(rentalProperties);
    await db.subscriptions.bulkAdd(subscriptions);
    await db.tenants.bulkAdd(tenants);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
