/**
 * Vehicle fleet seed — runs once on app start if table is empty.
 * Seeds Yamaha FZS (oil overdue), Honda Shine, CBR250R.
 * Safe to import from main.tsx or App.tsx.
 */
import { db } from '@/lib/db';

const FLEET_SEED = [
  {
    name: 'Yamaha FZS',
    make: 'Yamaha', model: 'FZS', type: 'Motorcycle',
    fuelType: 'Petrol', regNo: 'AP05AB1234',
    year: 2020, odometer: 18600,
    purchasePrice: 115000, vehicleValue: 85000,
    fuelEfficiency: 45,
    serviceLogs: [
      { date: '2024-08-01', odometer: 17000, type: 'Oil Change', note: 'Motul 10W-40' }
    ], // 1600km ago → triggers OVERDUE alert
    fuelLogs: [], claims: [], treadDepthMM: 4,
    purchaseDate: new Date('2020-06-15'),
    insuranceExpiry: new Date('2025-06-14'),
    pucExpiry: new Date('2025-04-01'),
    owner: 'Me' as const,
  },
  {
    name: 'Honda Shine',
    make: 'Honda', model: 'Shine', type: 'Motorcycle',
    fuelType: 'Petrol', regNo: 'AP05CD5678',
    year: 2019, odometer: 32100,
    purchasePrice: 72000, vehicleValue: 40000,
    fuelEfficiency: 55,
    serviceLogs: [
      { date: '2024-11-10', odometer: 31500, type: 'Oil Change', note: 'Honda Genuine Oil' }
    ], // 600km → safe
    fuelLogs: [], claims: [], treadDepthMM: 5,
    purchaseDate: new Date('2019-03-20'),
    insuranceExpiry: new Date('2025-03-19'),
    pucExpiry: new Date('2025-06-18'),
    owner: 'Me' as const,
  },
  {
    name: 'Honda CBR250R',
    make: 'Honda', model: 'CBR250R', type: 'Motorcycle',
    fuelType: 'Petrol', regNo: 'AP05EF9012',
    year: 2022, odometer: 8400,
    purchasePrice: 210000, vehicleValue: 175000,
    fuelEfficiency: 35,
    serviceLogs: [
      { date: '2025-01-05', odometer: 7800, type: 'Oil Change', note: 'Shell Advance AX5' }
    ], // 600km → safe
    fuelLogs: [], claims: [], treadDepthMM: 6,
    purchaseDate: new Date('2022-11-01'),
    insuranceExpiry: new Date('2025-10-31'),
    pucExpiry: new Date('2025-11-30'),
    owner: 'Me' as const,
  },
];

export async function seedVehiclesIfEmpty(): Promise<void> {
  try {
    const count = await db.vehicles.count();
    if (count > 0) return; // already seeded

    const now = new Date();
    const records = FLEET_SEED.map(v => ({
      ...v,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    await db.vehicles.bulkAdd(records);
    console.info('[Savora] Fleet seeded with FZS, Shine, CBR250R');
  } catch (err) {
    console.warn('[Savora] Vehicle seed skipped:', err);
  }
}
