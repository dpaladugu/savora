
import { db } from './db';

export const exportData = async () => {
  try {
    const data = {
      txns: await db.txns.toArray(),
      rentalProperties: await db.rentalProperties.toArray(),
      tenants: await db.tenants.toArray(),
      creditCards: await db.creditCards.toArray(),
      loans: await db.loans.toArray(),
      goals: await db.goals.toArray(),
      policies: await db.policies.toArray(),
      vehicles: await db.vehicles.toArray(),
      healthProfiles: await db.healthProfiles.toArray(),
      medicines: await db.medicines.toArray(),
      wallets: await db.wallets.toArray(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const importData = async (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);
    
    // Clear existing data
    await db.txns.clear();
    await db.rentalProperties.clear();
    await db.tenants.clear();
    await db.creditCards.clear();
    await db.loans.clear();
    await db.goals.clear();
    await db.policies.clear();
    await db.vehicles.clear();
    await db.healthProfiles.clear();
    await db.medicines.clear();
    await db.wallets.clear();
    
    // Import new data
    if (data.txns) await db.txns.bulkAdd(data.txns);
    if (data.rentalProperties) await db.rentalProperties.bulkAdd(data.rentalProperties);
    if (data.tenants) await db.tenants.bulkAdd(data.tenants);
    if (data.creditCards) await db.creditCards.bulkAdd(data.creditCards);
    if (data.loans) await db.loans.bulkAdd(data.loans);
    if (data.goals) await db.goals.bulkAdd(data.goals);
    if (data.policies) await db.policies.bulkAdd(data.policies);
    if (data.vehicles) await db.vehicles.bulkAdd(data.vehicles);
    if (data.healthProfiles) await db.healthProfiles.bulkAdd(data.healthProfiles);
    if (data.medicines) await db.medicines.bulkAdd(data.medicines);
    if (data.wallets) await db.wallets.bulkAdd(data.wallets);
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'Failed to import data' };
  }
};
