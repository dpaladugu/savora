import { db } from './db';
import type { GlobalSettings, Insurance, Contact, Dependent } from './db';

export const seedGlobalSettings = async () => {
  const existingSettings = await db.globalSettings.toArray();
  if (existingSettings.length > 0) return;

  const settings: GlobalSettings = {
    id: 'singleton',
    taxRegime: 'New',
    autoLockMinutes: 5,
    birthdayBudget: 5000,
    birthdayAlertDays: 7,
    emergencyContacts: [
      { name: 'Emergency Contact', phone: '+91-9999999999', relation: 'Friend' }
    ],
    dependents: [
      { name: 'Dependent 1', dob: new Date('2010-01-01'), relation: 'Child' }
    ],
    salaryCreditDay: 1,
    annualBonus: 50000,
    medicalInflationRate: 8,
    educationInflation: 10,
    vehicleInflation: 6,
    maintenanceInflation: 7,
    privacyMask: false,
    failedPinAttempts: 0,
    maxFailedAttempts: 10,
    darkMode: false,
    timeZone: 'Asia/Kolkata',
    isTest: false,
    theme: 'system',
    deviceThemes: {},
    revealSecret: ''
  };

  await db.globalSettings.add(settings);
};

const seedInsurance = async () => {
  const existingInsurance = await db.insurance.toArray();
  if (existingInsurance.length > 0) return;

  const now = new Date();

  const insurancePolicies: Omit<Insurance, 'id'>[] = [
    {
      name: 'Health Insurance',
      type: 'Health',
      premium: 15000,
      provider: 'Star Health Insurance',
      company: 'Star Health Insurance',
      policyNumber: 'SH123456789',
      sumAssured: 500000,
      sumInsured: 500000,
      premiumAmount: 15000,
      premiumDueDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-15'),
      nominee: 'Spouse',
      notes: 'Family floater policy',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const policy of insurancePolicies) {
    await db.insurance.add({ id: crypto.randomUUID(), ...policy });
  }
};

export const seedInitialData = async () => {
  await seedGlobalSettings();
  await seedInsurance();
};
