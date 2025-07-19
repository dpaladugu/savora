
import Dexie, { Table } from 'dexie';
import { db } from '@/db'; // Import Dexie db instance
import { Logger } from './logger';

import { z } from 'zod';
import { jsonPreloadMVPDataSchema } from './jsonPreloadValidators';
import type {
  JsonPreloadMVPData,
  JsonExpenseTransaction,
  JsonIncomeCashFlow,
  JsonVehicleAsset,
  JsonLoan,
  JsonInvestmentMutualFund,
  JsonCreditCard,
  ExpenseData,
  IncomeSourceData,
  VehicleData,
  LoanData,
  InvestmentData,
  CreditCardData,
  ProfileData // Assuming personal_profile maps to ProfileData for appSettings
} from '@/types/jsonPreload';

// Import Dexie record types
import type { 
  DexieVehicleRecord, 
  DexieLoanEMIRecord, 
  DexieCreditCardRecord 
} from '@/db';

export interface ValidatedPreloadData {
  success: true;
  data: JsonPreloadMVPData; // Use the inferred type from Zod schema if preferred
}
export interface FailedValidationResult {
  success: false;
  errors: z.ZodIssue[];
  message: string;
}
export type ValidationResult = ValidatedPreloadData | FailedValidationResult;

// Validates the JSON data against the Zod schema for MVP sections
export function validateFinancialData(data: unknown): ValidationResult {
  Logger.info('Validating JSON data for preload (MVP sections)...');
  const result = jsonPreloadMVPDataSchema.safeParse(data);

  if (result.success) {
    Logger.info('JSON data validation successful (MVP sections).');
    return { success: true, data: result.data as JsonPreloadMVPData }; // Cast to ensure type
  } else {
    Logger.error('JSON data validation failed (MVP sections):', result.error.errors);
    return {
      success: false,
      errors: result.error.errors,
      message: "JSON data validation failed. Check console for details or ensure all required fields for MVP sections are present and correctly formatted."
    };
  }
}

// --- Data Mapping Functions ---

// Maps JsonExpenseTransaction to ExpenseData for Dexie
function mapJsonExpenseToDbExpense(jsonExpense: JsonExpenseTransaction): ExpenseData {
  return {
    id: self.crypto.randomUUID(),
    date: jsonExpense.date,
    amount: jsonExpense.amount,
    description: jsonExpense.description,
    category: jsonExpense.category,
    payment_method: jsonExpense.payment_method,
    source: jsonExpense.source,
    geotag: jsonExpense.geotag,
    merchant_code: jsonExpense.merchant_code,
    card_last4: jsonExpense.card_last4,
    vehicle_id_json: jsonExpense.vehicle_id, // Store JSON vehicle_id, map to FK later if needed
    part_details: jsonExpense.part_details,
    odometer: jsonExpense.odometer,
    liters: jsonExpense.liters,
    rate_per_liter: jsonExpense.rate_per_liter,
    json_id: jsonExpense.id, // Store original JSON id if present
    subcategory: jsonExpense.subcategory,
    verified: jsonExpense.verified,
    // 'type' can be inferred or explicitly mapped if available in source JSON for expenses
    // For now, assuming all in expense_transactions are 'expense' type.
    // If income is also in this list, logic needs to handle jsonExpense.type or amount sign.
    type: 'expense', // Defaulting, adjust if JSON provides type or based on amount
  };
}

// Maps JsonIncomeCashFlow to IncomeSourceData for Dexie
function mapJsonIncomeToDbIncomeSource(jsonIncome: JsonIncomeCashFlow): IncomeSourceData {
  return {
    id: self.crypto.randomUUID(), // Generate UUID
    source: jsonIncome.source,
    name: jsonIncome.source, // Map source to name
    defaultAmount: jsonIncome.amount,
    frequency: jsonIncome.frequency,
    account: jsonIncome.account,
  };
}

// Maps JsonVehicleAsset to DexieVehicleRecord for Dexie
function mapJsonVehicleToDbVehicle(jsonVehicle: JsonVehicleAsset): DexieVehicleRecord {
  return {
    id: self.crypto.randomUUID(), // Generate UUID
    name: jsonVehicle.vehicle, // JSON 'vehicle' field is the name
    registrationNumber: '', // Default empty
    make: '',
    model: '',
    year: undefined,
    color: '',
    type: '',
    owner: jsonVehicle.owner || '',
    status: jsonVehicle.status || 'Active',
    purchaseDate: undefined,
    purchasePrice: undefined,
    fuelType: '',
    engineNumber: '',
    chassisNumber: '',
    currentOdometer: undefined,
    fuelEfficiency: '',
    insuranceProvider: jsonVehicle.insurance?.provider,
    insurancePolicyNumber: '',
    insuranceExpiryDate: jsonVehicle.insurance?.next_renewal,
    insurance_premium: jsonVehicle.insurance?.premium,
    insurance_frequency: jsonVehicle.insurance?.frequency,
    tracking_type: jsonVehicle.tracking?.type,
    tracking_last_service_odometer: jsonVehicle.tracking?.last_service_odometer,
    next_pollution_check: jsonVehicle.tracking?.next_pollution_check,
    location: jsonVehicle.location,
    repair_estimate: jsonVehicle.repair_estimate,
    notes: '',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Maps JsonLoan to DexieLoanEMIRecord for Dexie
function mapJsonLoanToDbLoan(jsonLoan: JsonLoan): DexieLoanEMIRecord {
  return {
    id: self.crypto.randomUUID(), // Generate UUID
    loanType: jsonLoan.purpose || 'Personal',
    lender: jsonLoan.lender || '',
    principalAmount: jsonLoan.amount,
    emiAmount: jsonLoan.emi,
    interestRate: jsonLoan.interest_rate,
    tenureMonths: 12, // Default tenure
    startDate: '',
    endDate: '',
    nextDueDate: '',
    remainingAmount: jsonLoan.amount,
    status: 'active',
    account: jsonLoan.account,
    note: jsonLoan.notes,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Maps JsonInvestmentMutualFund to InvestmentData for Dexie (Simplified MVP)
function mapJsonInvestmentMFToDbInvestment(jsonMf: JsonInvestmentMutualFund): InvestmentData {
  return {
    id: self.crypto.randomUUID(), // Generate UUID
    investment_type: 'Mutual Fund', // Explicitly set type for MVP
    fund_name: jsonMf.fund, // JSON 'fund' is the name
    current_value: jsonMf.current_value,
    invested_value: jsonMf.invested, // JSON 'invested' maps here
    category: jsonMf.category,
  };
}

// Maps JsonCreditCard to DexieCreditCardRecord for Dexie
function mapJsonCreditCardToDbCreditCard(jsonCard: JsonCreditCard): DexieCreditCardRecord {
  return {
    id: self.crypto.randomUUID(), // Generate UUID
    name: jsonCard.card_name,
    issuer: jsonCard.bank_name,
    limit: jsonCard.credit_limit,
    currentBalance: 0, // Default value
    billCycleDay: typeof jsonCard.due_date === 'number' ? jsonCard.due_date : parseInt(jsonCard.due_date) || 1,
    dueDate: typeof jsonCard.due_date === 'number' ? jsonCard.due_date.toString() : jsonCard.due_date,
    autoDebit: false, // Default value
    last4Digits: jsonCard.last_digits,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function preloadFinancialData(jsonData: unknown): Promise<{success: boolean; message: string; summary?: any}> {
  Logger.info('Starting data preload process...');

  const validationResult = validateFinancialData(jsonData);
  if (!validationResult.success) {
    Logger.error('JSON data failed validation for MVP sections.');
    const errorMessage = (validationResult as FailedValidationResult).errors?.map(err => `${err.path.join('.')} - ${err.message}`).join('\n') || 'JSON data structure is invalid for MVP sections.';
    return { success: false, message: errorMessage };
  }

  const validatedData = validationResult.data; // Now this is typed JsonPreloadMVPData

  const importSummary = {
    personal_profile: { processed: 0, status: "not_processed" },
    expenses: { added: 0, failed: 0, found: 0 },
    incomeSources: { added: 0, failed: 0, found: 0 },
    vehicles: { added: 0, failed: 0, found: 0 },
    loans: { added: 0, failed: 0, found: 0 },
    investments: { added: 0, failed: 0, found: 0 },
    creditCards: { added: 0, failed: 0, found: 0 },
  };

  try {
    // Define all tables that will be written to in this transaction
    const tablesToClearAndWrite: Dexie.Table[] = [
      db.appSettings, // For personal_profile
      db.expenses,
      db.incomeSources,
      db.vehicles,
      db.loans,
      db.investments,
      db.creditCards
    ];

    await db.transaction('rw', tablesToClearAndWrite, async () => {
      Logger.info('Clearing existing MVP data from relevant tables...');
      await db.appSettings.where('key').equals('userPersonalProfile_v1').delete();
      await db.expenses.clear();
      await db.incomeSources.clear();
      await db.vehicles.clear();
      await db.loans.clear();
      await db.investments.clear();
      await db.creditCards.clear();

      // Preload Personal Profile
      if (validatedData.personal_profile) {
        await db.appSettings.put({ key: 'userPersonalProfile_v1', value: validatedData.personal_profile as ProfileData });
        importSummary.personal_profile = { processed: 1, status: "processed" };
        Logger.info('Successfully processed personal_profile.');
      }

      // Preload Expenses
      if (validatedData.expense_transactions?.transactions) {
        const rawItems = validatedData.expense_transactions.transactions;
        importSummary.expenses.found = rawItems.length;
        const mappedItems: ExpenseData[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonExpenseToDbExpense(item));
          } catch (e) { 
            Logger.error('Error mapping expense:', item); 
            importSummary.expenses.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.expenses.bulkAdd(mappedItems); 
          importSummary.expenses.added = mappedItems.length; 
        }
        Logger.info(`Expenses: Added ${importSummary.expenses.added}/${importSummary.expenses.found}. Failed: ${importSummary.expenses.failed}`);
      }

      // Preload Income Sources
      if (validatedData.income_cash_flows) {
        const rawItems = validatedData.income_cash_flows;
        importSummary.incomeSources.found = rawItems.length;
        const mappedItems: IncomeSourceData[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonIncomeToDbIncomeSource(item));
          } catch (e) { 
            Logger.error('Error mapping income source:', item); 
            importSummary.incomeSources.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.incomeSources.bulkAdd(mappedItems); 
          importSummary.incomeSources.added = mappedItems.length; 
        }
        Logger.info(`IncomeSources: Added ${importSummary.incomeSources.added}/${importSummary.incomeSources.found}. Failed: ${importSummary.incomeSources.failed}`);
      }

      // Preload Vehicles
      if (validatedData.assets?.vehicles) {
        const rawItems = validatedData.assets.vehicles;
        importSummary.vehicles.found = rawItems.length;
        const mappedItems: DexieVehicleRecord[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonVehicleToDbVehicle(item));
          } catch (e) { 
            Logger.error('Error mapping vehicle:', item); 
            importSummary.vehicles.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.vehicles.bulkAdd(mappedItems); 
          importSummary.vehicles.added = mappedItems.length; 
        }
        Logger.info(`Vehicles: Added ${importSummary.vehicles.added}/${importSummary.vehicles.found}. Failed: ${importSummary.vehicles.failed}`);
      }

      // Preload Loans
      if (validatedData.liabilities) {
        const rawItems = validatedData.liabilities;
        importSummary.loans.found = rawItems.length;
        const mappedItems: DexieLoanEMIRecord[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonLoanToDbLoan(item));
          } catch (e) { 
            Logger.error('Error mapping loan:', item); 
            importSummary.loans.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.loans.bulkAdd(mappedItems); 
          importSummary.loans.added = mappedItems.length; 
        }
        Logger.info(`Loans: Added ${importSummary.loans.added}/${importSummary.loans.found}. Failed: ${importSummary.loans.failed}`);
      }

      // Preload Investments (Simplified Mutual Funds)
      if (validatedData.assets?.investments?.mutual_funds_breakdown) {
        const rawItems = validatedData.assets.investments.mutual_funds_breakdown;
        importSummary.investments.found = rawItems.length;
        const mappedItems: InvestmentData[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonInvestmentMFToDbInvestment(item));
          } catch (e) { 
            Logger.error('Error mapping investment (MF):', item); 
            importSummary.investments.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.investments.bulkAdd(mappedItems); 
          importSummary.investments.added = mappedItems.length; 
        }
        Logger.info(`Investments (MF): Added ${importSummary.investments.added}/${importSummary.investments.found}. Failed: ${importSummary.investments.failed}`);
      }

      // Preload Credit Cards
      if (validatedData.credit_card_management?.cards) {
        const rawItems = validatedData.credit_card_management.cards;
        importSummary.creditCards.found = rawItems.length;
        const mappedItems: DexieCreditCardRecord[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonCreditCardToDbCreditCard(item));
          } catch (e) { 
            Logger.error('Error mapping credit card:', item); 
            importSummary.creditCards.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.creditCards.bulkAdd(mappedItems); 
          importSummary.creditCards.added = mappedItems.length; 
        }
        Logger.info(`CreditCards: Added ${importSummary.creditCards.added}/${importSummary.creditCards.found}. Failed: ${importSummary.creditCards.failed}`);
      }
    });

    let successMessages: string[] = [];
    if (importSummary.personal_profile.status === "processed") successMessages.push("Profile: processed.");
    if (importSummary.expenses.found > 0) successMessages.push(`Expenses: ${importSummary.expenses.added}/${importSummary.expenses.found} added (${importSummary.expenses.failed} failed).`);
    if (importSummary.vehicles.found > 0) successMessages.push(`Vehicles: ${importSummary.vehicles.added}/${importSummary.vehicles.found} added (${importSummary.vehicles.failed} failed).`);
    // Add for other entities

    const finalMessage = successMessages.length > 0 ? successMessages.join(' ') : "Data preload completed (no specific MVP data found or processed).";
    Logger.info(finalMessage);
    return { success: true, message: finalMessage, summary: importSummary };

  } catch (error: any) {
    Logger.error('Critical error during data preload transaction:', error);
    const failMessage = `Data preload failed: ${error.message || 'Unknown error'}`;
    Logger.error(failMessage); // Log the specific error message
    return { success: false, message: failMessage, summary: importSummary };
  }
}
