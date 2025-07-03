import { z } from 'zod';
import { db, Expense, Vehicle } from '@/db'; // Import Dexie db and relevant types
import { Logger } from './logger';

// --- Zod Schemas for Validation ---

// Matches the structure provided by the user for individual expense transactions
const ExpenseTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  amount: z.number().positive("Amount must be a positive number"),
  description: z.string().min(1, "Description cannot be empty"),
  category: z.string().min(1, "Category cannot be empty"),
  payment_method: z.string().min(1, "Payment method cannot be empty"),
  source: z.enum(["Telegram", "Voice", "CSV", "Form"]),
  geotag: z.string().optional(),
  merchant_code: z.string().optional(),
  card_last4: z.string().optional(),
  vehicle_id: z.string().optional(), // Will be used to link to a vehicle if applicable
  part_details: z.string().optional(),
});
export type JsonExpenseTransaction = z.infer<typeof ExpenseTransactionSchema>;

const VehicleInsuranceSchema = z.object({
  premium: z.number().optional(),
  provider: z.string().optional(),
  frequency: z.string().optional(), // e.g., "yearly"
  next_renewal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
});

const VehicleTrackingSchema = z.object({
  type: z.string().optional(),
  last_service_odometer: z.number().optional(),
  next_pollution_check: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  depreciation_rate: z.number().optional(),
  cost_per_km: z.number().optional(),
  resale_value: z.number().optional(),
  idle_score: z.number().optional(),
});

// Matches the structure from `assets.vehicles`
const VehicleSchema = z.object({
  vehicle: z.string().min(1, "Vehicle name cannot be empty"), // This will map to 'name' in DB
  usage: z.string().optional(),
  owner: z.enum(["self", "brother"]).optional(),
  status: z.string().optional(), // e.g., "Under repair"
  location: z.string().optional(), // e.g., "Hyderabad Workshop"
  repair_estimate: z.number().optional(),
  insurance: VehicleInsuranceSchema.optional(),
  tracking: VehicleTrackingSchema.optional(),
  // Note: 'type' (car/motorcycle) is missing, will be inferred or defaulted in mapping.
  // 'idle_score' is also present at top level for some vehicles in example. Consolidating under tracking.
  idle_score: z.number().optional(), // For cases like Honda Shine where it's top-level
});
export type JsonVehicle = z.infer<typeof VehicleSchema>;

const MainJsonSchema = z.object({
  expense_transactions: z.object({
    data_format: z.string().optional(),
    transactions: z.array(ExpenseTransactionSchema),
  }).optional(), // Making the whole section optional for now if user wants to import only vehicles
  assets: z.object({
    vehicles: z.array(VehicleSchema).optional(),
    // Other asset types like real_estate, investments, gold can be added here later
    real_estate: z.array(z.any()).optional(), // Placeholder
    investments: z.object({
        mutual_funds_total: z.any().optional(),
        mutual_funds_breakdown: z.array(z.any()).optional(),
        sips: z.array(z.any()).optional(),
        ppf: z.any().optional(),
        nps: z.any().optional(),
        epf: z.any().optional(),
    }).optional(),
    gold: z.array(z.any()).optional(), // Placeholder
  }).optional(),
  // Add other top-level sections from the user's JSON as needed for validation
  personal_profile: z.any().optional(),
  income_cash_flows: z.array(z.any()).optional(),
  liabilities: z.array(z.any()).optional(),
  // expenses_tracking: z.any().optional(), // This seems to be metadata, not transactions
  insurance_policies: z.any().optional(),
  credit_card_management: z.any().optional(),
  financial_goals: z.array(z.any()).optional(),
  // ... other top-level keys
});
export type FinancialDataJson = z.infer<typeof MainJsonSchema>;


// Updated validation function using Zod
export function validateFinancialData(data: any): { isValid: boolean; errors?: z.ZodIssue[]; data?: FinancialDataJson } {
  const result = MainJsonSchema.safeParse(data);
  if (result.success) {
    Logger.info('JSON data validation successful with Zod.');
    return { isValid: true, data: result.data };
  } else {
    Logger.error('JSON data validation failed with Zod:', result.error.issues);
    return { isValid: false, errors: result.error.issues };
  }
}

// --- Mapping Functions (to be refined based on Zod schemas and Dexie interfaces) ---

// Maps your JSON expense structure to the Dexie 'Expense' interface
function mapJsonExpenseToDbExpense(jsonExpense: JsonExpenseTransaction): Omit<Expense, 'id'> {
  const tags: string[] = [];
  if (jsonExpense.geotag) tags.push(`geo:${jsonExpense.geotag}`);
  if (jsonExpense.merchant_code) tags.push(`mcc:${jsonExpense.merchant_code}`);
  if (jsonExpense.vehicle_id) tags.push(`vehicle:${jsonExpense.vehicle_id}`);
  if (jsonExpense.part_details) tags.push(`part:${jsonExpense.part_details}`);
  if (jsonExpense.source) tags.push(`source:${jsonExpense.source}`);

  return {
    date: jsonExpense.date,
    description: jsonExpense.description,
    amount: jsonExpense.amount, // Assuming amounts in JSON are expenses (positive numbers)
    category: jsonExpense.category,
    type: 'expense', // All transactions from "expense_transactions" are considered expenses
    paymentMethod: jsonExpense.payment_method,
    tags: tags.length > 0 ? tags : undefined,
    cardLast4: jsonExpense.card_last4,
    merchant: undefined, // Consider if merchant can be extracted or is available
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Maps your JSON vehicle structure to the Dexie 'Vehicle' interface
function mapJsonVehicleToDbVehicle(jsonVehicle: JsonVehicle): Omit<Vehicle, 'id'> {
  let vehicleType: "motorcycle" | "car" = "car"; // Default
  if (jsonVehicle.vehicle.toLowerCase().includes("fzs") || jsonVehicle.vehicle.toLowerCase().includes("cbr") || jsonVehicle.vehicle.toLowerCase().includes("shine")) {
    vehicleType = "motorcycle";
  } else if (jsonVehicle.vehicle.toLowerCase().includes("xylo")) {
    vehicleType = "car";
  }

  return {
    name: jsonVehicle.vehicle,
    type: vehicleType,
    owner: jsonVehicle.owner,
    initial_odometer: jsonVehicle.tracking?.last_service_odometer || 0, // Or a dedicated initial_odometer field if available
    current_odometer: jsonVehicle.tracking?.last_service_odometer || 0,
    insurance_provider: jsonVehicle.insurance?.provider,
    insurance_premium: jsonVehicle.insurance?.premium,
    insurance_renewal_date: jsonVehicle.insurance?.next_renewal,
    // Add other relevant fields from jsonVehicle if they match Vehicle interface
  };
}


export async function preloadFinancialData(jsonData: FinancialDataJson): Promise<{success: boolean; message: string; summary?: any}> {
  Logger.info('Starting data preload process with validated data...');

  const importSummary = {
    expenses: { added: 0, failed: 0, present: jsonData.expense_transactions?.transactions?.length || 0 },
    vehicles: { added: 0, failed: 0, present: jsonData.assets?.vehicles?.length || 0 },
  };

  try {
    await db.transaction('rw', db.expenses, db.vehicles, async () => {
      Logger.info('Clearing existing data from relevant tables...');
      if (jsonData.expense_transactions?.transactions) {
        await db.expenses.clear();
      }
      if (jsonData.assets?.vehicles) {
        await db.vehicles.clear();
      }

      // Preload Expenses
      if (jsonData.expense_transactions?.transactions && Array.isArray(jsonData.expense_transactions.transactions)) {
        const expensesToInsert: Expense[] = [];
        for (const rawExpense of jsonData.expense_transactions.transactions) {
          try {
            // Validation of individual items already done by Zod schema for the array
            const mapped = mapJsonExpenseToDbExpense(rawExpense) as Expense;
            expensesToInsert.push(mapped);
          } catch (mapError) {
            Logger.error('Error mapping expense item:', rawExpense, mapError);
            importSummary.expenses.failed++;
          }
        }
        if (expensesToInsert.length > 0) {
          await db.expenses.bulkAdd(expensesToInsert);
          importSummary.expenses.added = expensesToInsert.length;
          Logger.info(`Successfully added ${expensesToInsert.length} expenses to IndexedDB.`);
        }
      } else {
        Logger.warn('No "expense_transactions.transactions" array found in JSON data or it is not an array.');
      }

      // Preload Vehicles
      if (jsonData.assets?.vehicles && Array.isArray(jsonData.assets.vehicles)) {
        const vehiclesToInsert: Vehicle[] = [];
        for (const rawVehicle of jsonData.assets.vehicles) {
          try {
            // Validation of individual items already done by Zod schema for the array
            const mapped = mapJsonVehicleToDbVehicle(rawVehicle) as Vehicle;
            vehiclesToInsert.push(mapped);
          } catch (mapError) {
            Logger.error('Error mapping vehicle item:', rawVehicle, mapError);
            importSummary.vehicles.failed++;
          }
        }
        if (vehiclesToInsert.length > 0) {
          await db.vehicles.bulkAdd(vehiclesToInsert);
          importSummary.vehicles.added = vehiclesToInsert.length;
          Logger.info(`Successfully added ${vehiclesToInsert.length} vehicles to IndexedDB.`);
        }
      } else {
        Logger.warn('No "assets.vehicles" array found in JSON data or it is not an array.');
      }
    });

    const successMessage = `Data preload completed. Expenses: ${importSummary.expenses.added}/${importSummary.expenses.present} added (${importSummary.expenses.failed} failed). Vehicles: ${importSummary.vehicles.added}/${importSummary.vehicles.present} added (${importSummary.vehicles.failed} failed).`;
    Logger.info(successMessage);
    return { success: true, message: successMessage, summary: importSummary };

  } catch (error: any) {
    Logger.error('Critical error during data preload transaction:', error);
    return { success: false, message: `Data preload failed: ${error.message || 'Unknown error'}`, summary: importSummary };
  }
}
