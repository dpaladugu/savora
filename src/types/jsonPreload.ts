// src/types/jsonPreload.ts

// Based on "personal_profile"
export interface JsonPersonalProfile {
  age?: string; // e.g., "34M"
  location?: string;
  dependents?: Array<{
    relation?: string;
    age?: string;
    location?: string;
  }>;
  employment?: string;
  annual_gross_income?: number;
  tax_regime?: string;
}

// Based on "expense_transactions.transactions" array elements
export interface JsonExpenseTransaction {
  // Required fields from spec example
  date: string;       // ISO 8601 format "YYYY-MM-DD"
  amount: number;     // Positive integer (₹)
  description: string;
  category: string;
  payment_method: string;
  source: "Telegram" | "Voice" | "CSV" | "Form" | string; // Allow other strings for flexibility

  // Optional Contextual Fields from spec example
  geotag?: string;
  merchant_code?: string;
  card_last4?: string;
  vehicle_id?: string; // e.g., "FZS", "Xylo" - will need mapping to a vehicle PK later
  part_details?: string;
  odometer?: number; // Added from example
  liters?: number; // Added from example
  rate_per_liter?: number; // Added from example

  // Additional fields observed in some JSON snippets
  id?: string; // e.g., "txn_20250615_102" - could be used if present and unique
  subcategory?: string;
  verified?: boolean;
  // Note: The main JSON structure has "expense_transactions": { "count": N, "transactions": [...] }
  // This interface is for one item in the "transactions" array.
}

// Based on "income_cash_flows" array elements (simplified for MVP)
export interface JsonIncomeCashFlow {
  source: string;
  amount: number; // Assuming this is the primary amount, min/max can be handled later
  amount_min?: number;
  amount_max?: number;
  frequency: "monthly" | "yearly" | "weekly" | string; // Allow other strings
  account?: string; // e.g., "SCB", "Cash"
  // Detailed breakdown and allocation will be deferred for MVP
  // breakdown?: object;
  // allocation?: any;
}

// Based on "assets.vehicles" array elements
export interface JsonVehicleAsset {
  vehicle: string; // This seems to be the name, e.g., "Yamaha FZS"
  usage?: string;
  insurance?: {
    premium?: number;
    provider?: string;
    frequency?: string;
    next_renewal?: string; // YYYY-MM-DD
  };
  tracking?: { // MVP might only take a few fields from here
    type?: string;
    last_service_odometer?: number;
    next_pollution_check?: string; // YYYY-MM-DD
    // cost_per_km, resale_value, idle_score could be complex to map initially or calculated fields
  };
  owner?: string; // e.g., "Brother"
  status?: string; // e.g., "Under repair"
  location?: string;
  repair_estimate?: number;
  // Note: The main JSON structure is "assets": { "vehicles": [...] }
  // This interface is for one item in the "vehicles" array.
}

// Based on "liabilities" array elements (Loans)
export interface JsonLoan {
  loan: string; // This is the name, e.g., "HDFC Personal"
  amount: number; // Original loan amount
  emi: number;
  account?: string; // Account used for EMI payment
  purpose?: string;
  interest_rate?: number;
  // Complex nested objects like closure_details, repayment_log deferred for MVP
  // closure_details?: object;
  // prepayment_penalty?: string;
  // snowball_priority?: number;
  // refinance_opportunity?: object;
  // repayment_log?: any[];
  lender?: string; // From "Brother's Education Loan" example
  notes?: string;
}

// Based on "assets.investments.mutual_funds_breakdown" array elements (Simplified for MVP)
export interface JsonInvestmentMutualFund {
  fund: string; // Fund name
  current_value?: number;
  invested?: number; // "invested" in JSON, maps to invested_value or similar
  category?: string;
  risk_category?: string;
  // p_and_l, xirr, last_rebalancing, tax_harvesting_status etc. are derived or advanced, defer for MVP
  // one_day_gain could be stored if simple value
}

// Based on "credit_card_management.cards" array elements
export interface JsonCreditCard {
  bank_name: string;
  card_name: string;
  last_digits: string; // Key identifier
  due_date: number | string; // Day of month, or string like "20" or "1st"
  fee_waiver?: string | number; // e.g., "None (LTF)" or amount like 150000
  credit_limit?: number;
  anniversary_date?: string; // e.g., "26-Feb" or "4-Nov to 3-Nov"
  payment_method?: string;
  status?: string; // e.g., "Active"
  // reward_balance and fee_waiver_tracking deferred for MVP
  // reward_balance?: number;
  // fee_waiver_tracking?: object;
}

// Interface for the top-level structure of the JSON that contains these arrays
// This helps in validating the overall JSON structure before processing arrays.
// We'll only define the MVP parts here.
export interface JsonPreloadMVPData {
  personal_profile?: JsonPersonalProfile;
  expense_transactions?: {
    count?: number;
    total_records?: number; // Seen in one snippet
    transactions: JsonExpenseTransaction[];
  };
  income_cash_flows?: JsonIncomeCashFlow[];
  assets?: {
    vehicles?: JsonVehicleAsset[];
    investments?: {
      mutual_funds_breakdown?: JsonInvestmentMutualFund[];
      // Other investment types like ppf, nps, gold will be added iteratively
    };
    // real_estate, gold - deferred
  };
  liabilities?: JsonLoan[]; // This is an array of loans
  credit_card_management?: {
    cards: JsonCreditCard[];
  };
  // Other top-level sections from the full JSON are deferred for subsequent phases
}

// It's also useful to define the Dexie table-specific interfaces
// These will be used in db.ts and might slightly differ from JSON interfaces
// (e.g., having an auto-generated 'id?: number' primary key)

export interface ProfileData extends JsonPersonalProfile {
  // Dexie doesn't usually store a single profile object in a table directly.
  // This might be broken down into appSettings or a specific profile table if needed.
  // For now, this represents the data structure.
  id?: string; // e.g. 'userProfile' if stored as a single doc in appSettings
}

export interface ExpenseData extends Omit<JsonExpenseTransaction, 'id'> { // Omit JSON id if it's not the PK
  id?: number; // Auto-incremented primary key for Dexie
  // vehicleId_fk?: number; // Example of a foreign key if we link expenses to vehicles
}

export interface IncomeSourceData extends JsonIncomeCashFlow {
  id?: number; // Auto-incremented primary key
}

export interface VehicleData extends JsonVehicleAsset {
  id?: number; // Auto-incremented primary key
  // We'll use 'vehicle' field from JSON as 'name' or similar in Dexie table
}

export interface LoanData extends JsonLoan {
  id?: number; // Auto-incremented primary key
  // We'll use 'loan' field from JSON as 'name' or similar
}

export interface InvestmentData extends JsonInvestmentMutualFund {
  id?: number; // Auto-incremented primary key
  // Add a 'type' field to distinguish (e.g., 'Mutual Fund')
  investment_type: 'Mutual Fund' | string; // To categorize different investments in one table for MVP
}

export interface CreditCardData extends JsonCreditCard {
  id?: number; // Auto-incremented primary key
}
