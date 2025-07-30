
import { db } from './db';

/**
 * Export all data from the database as JSON
 */
export async function exportData(): Promise<string> {
  try {
    const data = {
      globalSettings: await db.globalSettings.toArray(),
      txns: await db.txns.toArray(),
      goals: await db.goals.toArray(),
      creditCards: await db.creditCards.toArray(),
      vehicles: await db.vehicles.toArray(),
      rentalProperties: await db.rentalProperties.toArray(),
      tenants: await db.tenants.toArray(),
      gold: await db.gold.toArray(),
      investments: await db.investments.toArray(),
      insurance: await db.insurance.toArray(),
      loans: await db.loans.toArray(),
      brotherRepayments: await db.brotherRepayments.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      health: await db.health.toArray(),
      familyBankAccounts: await db.familyBankAccounts.toArray(),
      familyTransfers: await db.familyTransfers.toArray(),
      emergencyFunds: await db.emergencyFunds.toArray(),
      auditLogs: await db.auditLogs.toArray(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from JSON and restore to database
 */
export async function importData(jsonData: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonData);

    // Clear existing data
    await db.transaction('rw', [
      db.globalSettings,
      db.txns,
      db.goals,
      db.creditCards,
      db.vehicles,
      db.rentalProperties,
      db.tenants,
      db.gold,
      db.investments,
      db.insurance,
      db.loans,
      db.brotherRepayments,
      db.subscriptions,
      db.health,
      db.familyBankAccounts,
      db.familyTransfers,
      db.emergencyFunds,
      db.auditLogs
    ], async () => {
      // Clear all tables
      await db.globalSettings.clear();
      await db.txns.clear();
      await db.goals.clear();
      await db.creditCards.clear();
      await db.vehicles.clear();
      await db.rentalProperties.clear();
      await db.tenants.clear();
      await db.gold.clear();
      await db.investments.clear();
      await db.insurance.clear();
      await db.loans.clear();
      await db.brotherRepayments.clear();
      await db.subscriptions.clear();
      await db.health.clear();
      await db.familyBankAccounts.clear();
      await db.familyTransfers.clear();
      await db.emergencyFunds.clear();
      await db.auditLogs.clear();

      // Import data
      if (data.globalSettings?.length) await db.globalSettings.bulkAdd(data.globalSettings);
      if (data.txns?.length) await db.txns.bulkAdd(data.txns);
      if (data.goals?.length) await db.goals.bulkAdd(data.goals);
      if (data.creditCards?.length) await db.creditCards.bulkAdd(data.creditCards);
      if (data.vehicles?.length) await db.vehicles.bulkAdd(data.vehicles);
      if (data.rentalProperties?.length) await db.rentalProperties.bulkAdd(data.rentalProperties);
      if (data.tenants?.length) await db.tenants.bulkAdd(data.tenants);
      if (data.gold?.length) await db.gold.bulkAdd(data.gold);
      if (data.investments?.length) await db.investments.bulkAdd(data.investments);
      if (data.insurance?.length) await db.insurance.bulkAdd(data.insurance);
      if (data.loans?.length) await db.loans.bulkAdd(data.loans);
      if (data.brotherRepayments?.length) await db.brotherRepayments.bulkAdd(data.brotherRepayments);
      if (data.subscriptions?.length) await db.subscriptions.bulkAdd(data.subscriptions);
      if (data.health?.length) await db.health.bulkAdd(data.health);
      if (data.familyBankAccounts?.length) await db.familyBankAccounts.bulkAdd(data.familyBankAccounts);
      if (data.familyTransfers?.length) await db.familyTransfers.bulkAdd(data.familyTransfers);
      if (data.emergencyFunds?.length) await db.emergencyFunds.bulkAdd(data.emergencyFunds);
      if (data.auditLogs?.length) await db.auditLogs.bulkAdd(data.auditLogs);
    });

    return {
      success: true,
      message: 'Data imported successfully'
    };
  } catch (error) {
    console.error('Error importing data:', error);
    return {
      success: false,
      message: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
