
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
      insurance: await db.insurance.toArray(),
      vehicles: await db.vehicles.toArray(),
      health: await db.health.toArray(),
      wallets: await db.wallets.toArray(),
      investments: await db.investments.toArray(),
      gold: await db.gold.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      emergencyFunds: await db.emergencyFunds.toArray(),
      brotherRepayments: await db.brotherRepayments.toArray(),
      familyBankAccounts: await db.familyBankAccounts.toArray(),
      familyTransfers: await db.familyTransfers.toArray(),
      auditLogs: await db.auditLogs.toArray(),
      globalSettings: await db.globalSettings.toArray(),
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
    await db.insurance.clear();
    await db.vehicles.clear();
    await db.health.clear();
    await db.wallets.clear();
    await db.investments.clear();
    await db.gold.clear();
    await db.subscriptions.clear();
    await db.emergencyFunds.clear();
    await db.brotherRepayments.clear();
    await db.familyBankAccounts.clear();
    await db.familyTransfers.clear();
    await db.auditLogs.clear();
    await db.globalSettings.clear();
    
    // Import new data
    if (data.txns) await db.txns.bulkAdd(data.txns);
    if (data.rentalProperties) await db.rentalProperties.bulkAdd(data.rentalProperties);
    if (data.tenants) await db.tenants.bulkAdd(data.tenants);
    if (data.creditCards) await db.creditCards.bulkAdd(data.creditCards);
    if (data.loans) await db.loans.bulkAdd(data.loans);
    if (data.goals) await db.goals.bulkAdd(data.goals);
    if (data.insurance) await db.insurance.bulkAdd(data.insurance);
    if (data.vehicles) await db.vehicles.bulkAdd(data.vehicles);
    if (data.health) await db.health.bulkAdd(data.health);
    if (data.wallets) await db.wallets.bulkAdd(data.wallets);
    if (data.investments) await db.investments.bulkAdd(data.investments);
    if (data.gold) await db.gold.bulkAdd(data.gold);
    if (data.subscriptions) await db.subscriptions.bulkAdd(data.subscriptions);
    if (data.emergencyFunds) await db.emergencyFunds.bulkAdd(data.emergencyFunds);
    if (data.brotherRepayments) await db.brotherRepayments.bulkAdd(data.brotherRepayments);
    if (data.familyBankAccounts) await db.familyBankAccounts.bulkAdd(data.familyBankAccounts);
    if (data.familyTransfers) await db.familyTransfers.bulkAdd(data.familyTransfers);
    if (data.auditLogs) await db.auditLogs.bulkAdd(data.auditLogs);
    if (data.globalSettings) await db.globalSettings.bulkAdd(data.globalSettings);
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'Failed to import data' };
  }
};
