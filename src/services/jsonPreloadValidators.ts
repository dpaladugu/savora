// src/services/jsonPreloadValidators.ts
import { z } from 'zod';
import type {
  JsonPersonalProfile,
  JsonExpenseTransaction,
  JsonIncomeCashFlow,
  JsonVehicleAsset,
  JsonLoan,
  JsonInvestmentMutualFund,
  JsonCreditCard,
  // JsonPreloadMVPData will be defined using these schemas
} from '@/types/jsonPreload';

// Zod schema for JsonPersonalProfile
export const personalProfileSchema: z.ZodType<JsonPersonalProfile> = z.object({
  age: z.string().optional(),
  location: z.string().optional(),
  dependents: z.array(z.object({
    relation: z.string().optional(),
    age: z.string().optional(),
    location: z.string().optional(),
  })).optional(),
  employment: z.string().optional(),
  annual_gross_income: z.number().optional(),
  tax_regime: z.string().optional(),
}).strict(); // Use .strict() if no extra fields are allowed

// Zod schema for JsonExpenseTransaction
export const expenseTransactionSchema: z.ZodType<JsonExpenseTransaction> = z.object({
  date: z.string().refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  payment_method: z.string(),
  source: z.union([z.literal("Telegram"), z.literal("Voice"), z.literal("CSV"), z.literal("Form"), z.string()]),
  geotag: z.string().optional(),
  merchant_code: z.string().optional(),
  card_last4: z.string().optional(),
  vehicle_id: z.string().optional(),
  part_details: z.string().optional(),
  odometer: z.number().optional(),
  liters: z.number().optional(),
  rate_per_liter: z.number().optional(),
  id: z.string().optional(), // From JSON, not DB id
  subcategory: z.string().optional(),
  verified: z.boolean().optional(),
}).strict();

// Zod schema for JsonIncomeCashFlow (simplified for MVP)
export const incomeCashFlowSchema: z.ZodType<JsonIncomeCashFlow> = z.object({
  source: z.string(),
  amount: z.number(),
  amount_min: z.number().optional(),
  amount_max: z.number().optional(),
  frequency: z.union([z.literal("monthly"), z.literal("yearly"), z.literal("weekly"), z.string()]),
  account: z.string().optional(),
}).strict();

// Zod schema for JsonVehicleAsset
export const vehicleAssetSchema: z.ZodType<JsonVehicleAsset> = z.object({
  vehicle: z.string(), // Name of the vehicle
  usage: z.string().optional(),
  insurance: z.object({
    premium: z.number().optional(),
    provider: z.string().optional(),
    frequency: z.string().optional(),
    next_renewal: z.string().refine(val => val === undefined || /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }).optional(),
  }).optional(),
  tracking: z.object({
    type: z.string().optional(),
    last_service_odometer: z.number().optional(),
    next_pollution_check: z.string().refine(val => val === undefined || /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }).optional(),
  }).optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  repair_estimate: z.number().optional(),
}).strict();

// Zod schema for JsonLoan
export const loanSchema: z.ZodType<JsonLoan> = z.object({
  loan: z.string(), // Name of the loan
  amount: z.number(),
  emi: z.number(),
  account: z.string().optional(),
  purpose: z.string().optional(),
  interest_rate: z.number().optional(),
  lender: z.string().optional(),
  notes: z.string().optional(),
}).strict();

// Zod schema for JsonInvestmentMutualFund (Simplified for MVP)
export const investmentMutualFundSchema: z.ZodType<JsonInvestmentMutualFund> = z.object({
  fund: z.string(),
  current_value: z.number().optional(),
  invested: z.number().optional(),
  category: z.string().optional(),
  risk_category: z.string().optional(),
}).strict();

// Zod schema for JsonCreditCard
export const creditCardSchema: z.ZodType<JsonCreditCard> = z.object({
  bank_name: z.string(),
  card_name: z.string(),
  last_digits: z.string(),
  due_date: z.union([z.number(), z.string()]), // number (day) or string
  fee_waiver: z.union([z.string(), z.number()]).optional(),
  credit_limit: z.number().optional(),
  anniversary_date: z.string().optional(),
  payment_method: z.string().optional(),
  status: z.string().optional(),
}).strict();

// Top-level Zod schema for the MVP parts of the JSON data
export const jsonPreloadMVPDataSchema = z.object({
  personal_profile: personalProfileSchema.optional(),
  expense_transactions: z.object({
    count: z.number().optional(),
    total_records: z.number().optional(),
    transactions: z.array(expenseTransactionSchema),
  }).optional(), // Making the whole section optional for initial flexibility
  income_cash_flows: z.array(incomeCashFlowSchema).optional(),
  assets: z.object({
    vehicles: z.array(vehicleAssetSchema).optional(),
    investments: z.object({
      mutual_funds_breakdown: z.array(investmentMutualFundSchema).optional(),
    }).optional(),
  }).optional(),
  liabilities: z.array(loanSchema).optional(),
  credit_card_management: z.object({
    cards: z.array(creditCardSchema),
  }).optional(),
}).strict(); // Strict on the top level to ensure no unexpected top-level keys for MVP

// Example usage (for testing or in the service):
/*
export function validateJsonForPreload(data: unknown) {
  try {
    const validatedData = jsonPreloadMVPDataSchema.parse(data);
    console.log("JSON data is valid (MVP sections):", validatedData);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("JSON validation errors (MVP sections):", error.errors);
      return { success: false, errors: error.errors };
    }
    console.error("Unexpected validation error:", error);
    return { success: false, errors: [{ message: "Unexpected validation error" }] };
  }
}
*/
