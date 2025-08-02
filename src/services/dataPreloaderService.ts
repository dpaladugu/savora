
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
  ProfileData
} from '@/types/jsonPreload';

// Import Dexie record types from db
import type { 
  Vehicle, 
  Loan, 
  CreditCard,
  Investment,
  Expense,
  Income
} from '@/db';

export interface ValidatedPreloadData {
  success: true;
  data: JsonPreloadMVPData;
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
    return { success: true, data: result.data as JsonPreloadMVPData };
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

// Maps JsonExpenseTransaction to Expense for Dexie
function mapJsonExpenseToDbExpense(jsonExpense: JsonExpenseTransaction): Expense {
  return {
    id: self.crypto.randomUUID(),
    user_id: '', // Will be set during transaction
    date: jsonExpense.date,
    amount: jsonExpense.amount,
    description: jsonExpense.description,
    category: jsonExpense.category,
    type: 'expense',
    payment_method: jsonExpense.payment_method,
    source: jsonExpense.source,
    tags: jsonExpense.subcategory || '',
    account: jsonExpense.merchant_code || '',
  };
}

// Maps JsonIncomeCashFlow to Income for Dexie
function mapJsonIncomeToDbIncome(jsonIncome: JsonIncomeCashFlow): Income {
  return {
    id: self.crypto.randomUUID(),
    user_id: '', // Will be set during transaction
    date: new Date().toISOString().split('T')[0], // Default to current date
    amount: jsonIncome.amount,
    category: 'salary', // Default category
    description: jsonIncome.source,
    source_name: jsonIncome.source,
    frequency: jsonIncome.frequency,
    account_id: jsonIncome.account,
  };
}

// Maps JsonVehicleAsset to Vehicle for Dexie
function mapJsonVehicleToDbVehicle(jsonVehicle: JsonVehicleAsset): Vehicle {
  return {
    id: self.crypto.randomUUID(),
    owner: jsonVehicle.owner || '',
    regNo: '', // Default empty
    make: '',
    model: '',
    type: 'Car', // Default type
    purchaseDate: new Date(),
    insuranceExpiry: new Date(),
    pucExpiry: new Date(),
    odometer: 0,
    fuelEfficiency: 0,
    fuelLogs: [],
    serviceLogs: [],
  };
}

// Maps JsonLoan to Loan for Dexie
function mapJsonLoanToDbLoan(jsonLoan: JsonLoan): Loan {
  return {
    id: self.crypto.randomUUID(),
    type: 'Personal',
    borrower: 'Me',
    principal: jsonLoan.amount,
    roi: jsonLoan.interest_rate || 10,
    tenureMonths: 12,
    emi: jsonLoan.emi,
    outstanding: jsonLoan.amount,
    startDate: new Date(),
    amortisationSchedule: [],
    isActive: true,
  };
}

// Maps JsonInvestmentMutualFund to Investment for Dexie
function mapJsonInvestmentMFToDbInvestment(jsonMf: JsonInvestmentMutualFund): Investment {
  return {
    id: self.crypto.randomUUID(),
    type: 'MF-Growth',
    name: jsonMf.fund,
    folioNo: '',
    currentNav: 1,
    units: jsonMf.current_value || 0,
    investedValue: jsonMf.invested || 0,
    currentValue: jsonMf.current_value || 0,
    startDate: new Date(),
    frequency: 'One-time',
    taxBenefit: false,
    familyMember: 'Me',
    notes: jsonMf.category || '',
  };
}

// Maps JsonCreditCard to CreditCard for Dexie
function mapJsonCreditCardToDbCreditCard(jsonCard: JsonCreditCard): CreditCard {
  return {
    id: self.crypto.randomUUID(),
    issuer: jsonCard.bank_name,
    bankName: jsonCard.bank_name,
    last4: jsonCard.last_digits,
    network: 'Visa', // Default network
    cardVariant: jsonCard.card_name,
    productVariant: '',
    annualFee: 0,
    annualFeeGst: 0,
    creditLimit: jsonCard.credit_limit || 0,
    creditLimitShared: false,
    fuelSurchargeWaiver: false,
    rewardPointsBalance: 0,
    cycleStart: 1,
    stmtDay: typeof jsonCard.due_date === 'number' ? jsonCard.due_date : parseInt(jsonCard.due_date) || 1,
    dueDay: typeof jsonCard.due_date === 'number' ? jsonCard.due_date : parseInt(jsonCard.due_date) || 1,
    fxTxnFee: 0,
    emiConversion: false,
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

  const validatedData = validationResult.data;

  const importSummary = {
    personal_profile: { processed: 0, status: "not_processed" },
    expenses: { added: 0, failed: 0, found: 0 },
    incomes: { added: 0, failed: 0, found: 0 },
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
      db.incomes,
      db.vehicles,
      db.loans,
      db.investments,
      db.creditCards
    ];

    await db.transaction('rw', tablesToClearAndWrite, async () => {
      Logger.info('Clearing existing MVP data from relevant tables...');
      await db.appSettings.where('key').equals('userPersonalProfile_v1').delete();
      await db.expenses.clear();
      await db.incomes.clear();
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
        const mappedItems: Expense[] = [];
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
        importSummary.incomes.found = rawItems.length;
        const mappedItems: Income[] = [];
        for (const item of rawItems) {
          try {
            mappedItems.push(mapJsonIncomeToDbIncome(item));
          } catch (e) { 
            Logger.error('Error mapping income source:', item); 
            importSummary.incomes.failed++; 
          }
        }
        if (mappedItems.length > 0) { 
          await db.incomes.bulkAdd(mappedItems); 
          importSummary.incomes.added = mappedItems.length; 
        }
        Logger.info(`Incomes: Added ${importSummary.incomes.added}/${importSummary.incomes.found}. Failed: ${importSummary.incomes.failed}`);
      }

      // Preload Vehicles
      if (validatedData.assets?.vehicles) {
        const rawItems = validatedData.assets.vehicles;
        importSummary.vehicles.found = rawItems.length;
        const mappedItems: Vehicle[] = [];
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
        const mappedItems: Loan[] = [];
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
        const mappedItems: Investment[] = [];
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
        const mappedItems: CreditCard[] = [];
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

    const finalMessage = successMessages.length > 0 ? successMessages.join(' ') : "Data preload completed (no specific MVP data found or processed).";
    Logger.info(finalMessage);
    return { success: true, message: finalMessage, summary: importSummary };

  } catch (error: any) {
    Logger.error('Critical error during data preload transaction:', error);
    const failMessage = `Data preload failed: ${error.message || 'Unknown error'}`;
    Logger.error(failMessage);
    return { success: false, message: failMessage, summary: importSummary };
  }
}
