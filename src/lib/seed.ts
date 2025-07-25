import { db } from './db';

export const seed = async () => {
  if (localStorage.getItem('seedLoaded')) return;

  
  
  await db.txns.bulkAdd([
  { id: 'tx1', date: new Date('2024-07-01'), amount: 50000, currency: 'INR', category: 'Salary', note: 'July salary' },
  { id: 'tx2', date: new Date('2024-07-05'), amount: -1200, currency: 'INR', category: 'Rent', note: 'Home rent' },
  { id: 'tx3', date: new Date('2024-07-10'), amount: -500, currency: 'INR', category: 'Groceries', note: 'Monthly groceries' },
  { id: 'tx4', date: new Date('2024-07-15'), amount: -17964, currency: 'INR', category: 'EMI', note: 'Plot loan EMI' },
  { id: 'tx5', date: new Date('2024-07-20'), amount: 8000, currency: 'INR', category: 'Rental-Income', note: 'Tenant rent' },
]);

await db.rentalProperties.add({
  id: 'rp1', address: 'Hometown Plot 1', owner: 'Mother', type: 'House',
  squareYards: 600, maxTenants: 4, monthlyRent: 8000, dueDay: 20, escalationPercent: 10
});

await db.goals.add({
  id: 'g1', name: 'Emergency Fund', horizon: 'short', targetAmount: 120000, targetDate: new Date('2025-12-31'), linkedTxns: []
});

await db.healthProfiles.add({
  id: 'hp1', name: 'Self', dob: new Date('1990-01-01'), bloodGroup: '', allergies: [], chronicConditions: []
});





  localStorage.setItem('seedLoaded', 'true');
  console.log('✅ Seed loaded');
};