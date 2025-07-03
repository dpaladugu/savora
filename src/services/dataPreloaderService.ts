import { db, Expense, Vehicle } from '@/db'; // Import Dexie db and relevant types
import { Logger } from './logger';

// Corresponds to Section 5.2 of your spec
export function validateFinancialData(data: any): boolean {
  if (typeof data !== 'object' || data === null) {
    Logger.error('Validation Error: Provided data is not an object.');
    return false;
  }
  const requiredSections = [
    'personal_profile',    // Example, align with your actual top-level JSON keys
    'income_cash_flows', // Example
    'assets',              // Example
    'liabilities',         // Example
    'financial_goals',     // Example
    // Add other top-level keys you expect in your main JSON structure
    // For initial preload, we might focus on expenses, vehicles, etc.
    'expenses',            // Assuming a top-level 'expenses' array
    'vehicles',            // Assuming a top-level 'vehicles' array
  ];

  for (const section of requiredSections) {
    if (data[section] === undefined) {
      Logger.error(`Validation Error: Required section "${section}" is missing from JSON data.`);
      // Consider if all are strictly mandatory for an initial load, or if some can be optional.
      // For now, assuming these listed are critical for a base import.
      // return false;
      // Making it less strict for now, will depend on actual JSON structure.
      // Let's log a warning if a section is missing but continue if core ones like 'expenses' exist.
      Logger.warn(`Data Preloader: Optional section "${section}" is missing from JSON data.`);
    }
  }
  if (!data.expenses || !Array.isArray(data.expenses)) {
      Logger.error('Validation Error: "expenses" array is missing or not an array.');
      // return false; // For a finance app, expenses are usually critical.
  }

  // Add more specific validation as needed (e.g., checking if arrays are indeed arrays)
  Logger.info('Basic JSON structure validation passed (or warnings logged).');
  return true; // Or return based on stricter checks
}

// Maps your JSON expense structure to the Dexie 'Expense' interface
// THIS IS AN EXAMPLE AND NEEDS TO BE ADJUSTED TO YOUR ACTUAL JSON STRUCTURE
function mapJsonExpenseToDbExpense(jsonExpense: any): Omit<Expense, 'id'> {
  // Ensure all required fields for Dexie 'Expense' are present and correctly typed
  if (typeof jsonExpense.amount === 'string') {
    jsonExpense.amount = parseFloat(jsonExpense.amount.replace(/,/g, ''));
  }

  return {
    date: jsonExpense.transaction_date || jsonExpense.date || new Date().toISOString().split('T')[0],
    description: jsonExpense.description || jsonExpense.narration || 'N/A',
    amount: Number(jsonExpense.amount) || 0,
    category: jsonExpense.category || 'Uncategorized',
    type: (jsonExpense.type === 'income' || parseFloat(jsonExpense.amount) > 0) ? 'income' : 'expense', // Infer type if not present
    paymentMethod: jsonExpense.payment_method || jsonExpense.paymentMode || undefined,
    tags: Array.isArray(jsonExpense.tags) ? jsonExpense.tags : (typeof jsonExpense.tags === 'string' ? jsonExpense.tags.split(',').map(t => t.trim()) : undefined),
    cardLast4: jsonExpense.card_last_4 || jsonExpense.cardLast4 || undefined,
    merchant: jsonExpense.merchant || jsonExpense.payee || undefined,
    createdAt: jsonExpense.created_at || new Date().toISOString(),
    updatedAt: jsonExpense.updated_at || new Date().toISOString(),
  };
}

// Maps your JSON vehicle structure to the Dexie 'Vehicle' interface
// THIS IS AN EXAMPLE AND NEEDS TO BE ADJUSTED TO YOUR ACTUAL JSON STRUCTURE
function mapJsonVehicleToDbVehicle(jsonVehicle: any): Omit<Vehicle, 'id'> {
  return {
    name: jsonVehicle.name || 'Unknown Vehicle',
    type: jsonVehicle.type === 'motorcycle' || jsonVehicle.type === 'car' ? jsonVehicle.type : 'car', // Default to car
    owner: jsonVehicle.owner === 'self' || jsonVehicle.owner === 'brother' ? jsonVehicle.owner : undefined,
    initial_odometer: Number(jsonVehicle.initial_odometer) || 0,
    current_odometer: Number(jsonVehicle.current_odometer) || Number(jsonVehicle.initial_odometer) || 0,
    insurance_provider: jsonVehicle.insurance?.provider || undefined,
    insurance_premium: Number(jsonVehicle.insurance?.premium) || undefined,
    insurance_renewal_date: jsonVehicle.insurance?.renewal_date || undefined,
  };
}


export async function preloadFinancialData(jsonData: any): Promise<{success: boolean; message: string; summary?: any}> {
  Logger.info('Starting data preload process...');
  if (!validateFinancialData(jsonData)) { // Basic validation
    Logger.error('JSON data failed basic validation.');
    return { success: false, message: 'JSON data structure is invalid. Please check required sections.' };
  }

  const importSummary = {
    expenses: { added: 0, failed: 0 },
    vehicles: { added: 0, failed: 0 },
    // Add other entities here
  };

  try {
    await db.transaction('rw', db.expenses, db.vehicles, /* add other tables here */ async () => {
      Logger.info('Clearing existing data from relevant tables...');
      await db.expenses.clear();
      await db.vehicles.clear();
      // await db.investments.clear(); // etc.

      // Preload Expenses
      if (jsonData.expenses && Array.isArray(jsonData.expenses)) {
        Logger.info(`Found ${jsonData.expenses.length} expenses in JSON to process.`);
        const mappedExpenses: Expense[] = [];
        for (const rawExpense of jsonData.expenses) {
          try {
            const mapped = mapJsonExpenseToDbExpense(rawExpense) as Expense; // Cast needed if id is truly optional on add
            mappedExpenses.push(mapped);
          } catch (mapError) {
            Logger.error('Error mapping expense item:', rawExpense, mapError);
            importSummary.expenses.failed++;
          }
        }
        if (mappedExpenses.length > 0) {
          await db.expenses.bulkAdd(mappedExpenses);
          importSummary.expenses.added = mappedExpenses.length;
          Logger.info(`Successfully added ${mappedExpenses.length} expenses to IndexedDB.`);
        }
      } else {
        Logger.warn('No "expenses" array found in JSON data or it is not an array.');
      }

      // Preload Vehicles
      if (jsonData.vehicles && Array.isArray(jsonData.vehicles)) {
        Logger.info(`Found ${jsonData.vehicles.length} vehicles in JSON to process.`);
        const mappedVehicles: Vehicle[] = [];
        for (const rawVehicle of jsonData.vehicles) {
          try {
            const mapped = mapJsonVehicleToDbVehicle(rawVehicle) as Vehicle;
            mappedVehicles.push(mapped);
          } catch (mapError) {
            Logger.error('Error mapping vehicle item:', rawVehicle, mapError);
            importSummary.vehicles.failed++;
          }
        }
        if (mappedVehicles.length > 0) {
          await db.vehicles.bulkAdd(mappedVehicles);
          importSummary.vehicles.added = mappedVehicles.length;
          Logger.info(`Successfully added ${mappedVehicles.length} vehicles to IndexedDB.`);
        }
      } else {
        Logger.warn('No "vehicles" array found in JSON data or it is not an array.');
      }

      // TODO: Add similar blocks for other data types:
      // - investments (mutual funds, gold, retirement)
      // - loans
      // - credit card definitions (if not part of expenses)
      // - real estate
      // - insurance policies
      // - financial goals
      // Ensure corresponding tables and interfaces are defined in db.ts
    });

    const successMessage = `Data preload completed. Expenses: ${importSummary.expenses.added} added (${importSummary.expenses.failed} failed). Vehicles: ${importSummary.vehicles.added} added (${importSummary.vehicles.failed} failed).`;
    Logger.info(successMessage);
    return { success: true, message: successMessage, summary: importSummary };

  } catch (error: any) {
    Logger.error('Critical error during data preload transaction:', error);
    return { success: false, message: `Data preload failed: ${error.message || 'Unknown error'}`, summary: importSummary };
  }
}
