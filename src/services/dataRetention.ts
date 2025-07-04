import { db, Expense, MaintenanceRecord, FuelRecord, YearlySummary } from '@/db'; // Assuming @ is src

export const applyDataRetention = async (): Promise<void> => {
  const retentionYears = 2;
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD for comparison if dates are stored as strings

  console.log(`Applying data retention policy: Archiving records older than ${cutoffDateString}`);

  // --- Archive Old Expenses ---
  try {
    const oldExpenses = await db.expenses
      .where('date')
      .below(cutoffDateString) // Assumes date is stored as YYYY-MM-DD or ISO string compatible with string comparison
      .toArray();

    if (oldExpenses.length > 0) {
      console.log(`Found ${oldExpenses.length} old expenses to archive.`);
      const yearlySummariesMap: { [key: string]: YearlySummary } = {};

      oldExpenses.forEach((expense: Expense) => {
        const year = new Date(expense.date).getFullYear();
        const expenseType = expense.type || 'expense'; // Default to 'expense' if type is not set
        const key = `${year}-${expense.category}-${expenseType}`;

        if (!yearlySummariesMap[key]) {
          yearlySummariesMap[key] = {
            year: year,
            category: expense.category,
            type: expenseType,
            totalAmount: 0,
            transactionCount: 0,
          };
        }
        yearlySummariesMap[key].totalAmount += expense.amount;
        yearlySummariesMap[key].transactionCount++;
      });

      const summariesToPut = Object.values(yearlySummariesMap);
      if (summariesToPut.length > 0) {
        await db.yearlySummaries.bulkPut(summariesToPut);
        console.log(`Put ${summariesToPut.length} yearly expense summaries into DB.`);
      }

      // Delete the old expenses
      const expenseIdsToDelete = oldExpenses.map(e => e.id).filter(id => id !== undefined) as number[];
      if (expenseIdsToDelete.length > 0) {
        await db.expenses.bulkDelete(expenseIdsToDelete);
        console.log(`Deleted ${expenseIdsToDelete.length} old expenses.`);
      }
    } else {
      console.log("No old expenses found to archive.");
    }
  } catch (error) {
    console.error("Error during expense data retention:", error);
  }

  // --- Apply to Maintenance Records ---
  // Spec: await db.maintenance.where('date').below(cutoffDate).delete();
  try {
    const oldMaintenanceRecords = await db.maintenanceRecords
      .where('date')
      .below(cutoffDateString)
      .toArray();

    if (oldMaintenanceRecords.length > 0) {
      const idsToDelete = oldMaintenanceRecords.map(mr => mr.id).filter(id => id !== undefined) as number[];
      await db.maintenanceRecords.bulkDelete(idsToDelete);
      console.log(`Deleted ${idsToDelete.length} old maintenance records.`);
    } else {
      console.log("No old maintenance records found to delete.");
    }
  } catch (error) {
    console.error("Error during maintenance data retention:", error);
  }

  // --- Apply to Fuel Records ---
  // Spec: await db.fuel.where('date').below(cutoffDate).delete();
  try {
    const oldFuelRecords = await db.fuelRecords
      .where('date')
      .below(cutoffDateString)
      .toArray();

    if (oldFuelRecords.length > 0) {
      const idsToDelete = oldFuelRecords.map(fr => fr.id).filter(id => id !== undefined) as number[];
      await db.fuelRecords.bulkDelete(idsToDelete);
      console.log(`Deleted ${idsToDelete.length} old fuel records.`);
    } else {
      console.log("No old fuel records found to delete.");
    }
  } catch (error) {
    console.error("Error during fuel data retention:", error);
  }

  console.log("Data retention policy application finished.");
};

// Example of how to call it (e.g., on app startup or a settings page)
/*
async function testDataRetention() {
  // Pre-populate some data for testing
  const today = new Date();
  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(today.getFullYear() - 3);
  const threeYearsAgoStr = threeYearsAgo.toISOString().split('T')[0];

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  await db.expenses.bulkPut([
    { date: threeYearsAgoStr, category: 'Food', amount: 100, type: 'expense', description: 'Old food' },
    { date: threeYearsAgoStr, category: 'Travel', amount: 200, type: 'expense', description: 'Old travel' },
    { date: oneYearAgoStr, category: 'Food', amount: 150, type: 'expense', description: 'Recent food' },
  ]);

  await db.maintenanceRecords.bulkPut([
     { vehicleId: 1, date: threeYearsAgoStr, type: 'Old Checkup', description: 'checkup', cost:100 },
     { vehicleId: 1, date: oneYearAgoStr, type: 'New Checkup', description: 'checkup', cost:100 },
  ]);

  await db.fuelRecords.bulkPut([
      { vehicleId: 1, date: threeYearsAgoStr, odometer: 1000, quantityLiters: 10, costPerLiter:10, totalCost:100 },
      { vehicleId: 1, date: oneYearAgoStr, odometer: 2000, quantityLiters: 10, costPerLiter:10, totalCost:100 },
  ]);

  console.log("Initial expenses count:", await db.expenses.count());
  console.log("Initial maintenance count:", await db.maintenanceRecords.count());
  console.log("Initial fuel records count:", await db.fuelRecords.count());
  console.log("Initial yearly summaries count:", await db.yearlySummaries.count());

  await applyDataRetention();

  console.log("Final expenses count:", await db.expenses.count()); // Should be 1
  console.log("Final maintenance count:", await db.maintenanceRecords.count()); // Should be 1
  console.log("Final fuel records count:", await db.fuelRecords.count()); // Should be 1
  console.log("Final yearly summaries count:", await db.yearlySummaries.count()); // Should be 2 (Food, Travel for 3 years ago)

  const summaries = await db.yearlySummaries.toArray();
  console.log("Summaries:", JSON.stringify(summaries, null, 2));

  // Clean up test data
  // await db.expenses.clear();
  // await db.maintenanceRecords.clear();
  // await db.fuelRecords.clear();
  // await db.yearlySummaries.clear();
}

// testDataRetention();
*/
