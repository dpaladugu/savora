
// src/types/jsonPreload.ts

export interface AppSetting { // Ensure this is exported
  key: string;
  value: any;
}

export interface JsonPersonalProfile {
  age?: string;
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

export interface JsonExpenseTransaction {
  date: string; // Required field
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  source: "Telegram" | "Voice" | "CSV" | "Form" | string;
  geotag?: string;
  merchant_code?: string;
  card_last4?: string;
  vehicle_id?: string;
  part_details?: string;
  odometer?: number;
  liters?: number;
  rate_per_liter?: number;
  id?: string;
  subcategory?: string;
  verified?: boolean;
}

export interface JsonIncomeCashFlow {
  source: string;
  amount: number;
  amount_min?: number;
  amount_max?: number;
  frequency: "monthly" | "yearly" | "weekly" | string;
  account?: string;
}

export interface JsonVehicleAsset {
  vehicle: string;
  usage?: string;
  insurance?: {
    premium?: number;
    provider?: string;
    frequency?: string;
    next_renewal?: string;
  };
  tracking?: {
    type?: string;
    last_service_odometer?: number;
    next_pollution_check?: string;
  };
  owner?: string;
  status?: string;
  location?: string;
  repair_estimate?: number;
}

export interface JsonLoan {
  loan: string;
  amount: number;
  emi: number;
  account?: string;
  purpose?: string;
  interest_rate?: number;
  lender?: string;
  notes?: string;
}

export interface JsonInvestmentMutualFund {
  fund: string;
  current_value?: number;
  invested?: number;
  category?: string;
  risk_category?: string;
}

export interface JsonCreditCard {
  bank_name: string;
  card_name: string;
  last_digits: string;
  due_date: number | string;
  fee_waiver?: string | number;
  credit_limit?: number;
  anniversary_date?: string;
  payment_method?: string;
  status?: string;
}

export interface JsonPreloadMVPData {
  personal_profile?: JsonPersonalProfile;
  expense_transactions?: {
    count?: number;
    total_records?: number;
    transactions: JsonExpenseTransaction[];
  };
  income_cash_flows?: JsonIncomeCashFlow[];
  assets?: {
    vehicles?: JsonVehicleAsset[];
    investments?: {
      mutual_funds_breakdown?: JsonInvestmentMutualFund[];
    };
  };
  liabilities?: JsonLoan[];
  credit_card_management?: {
    cards: JsonCreditCard[];
  };
}

export interface ProfileData extends JsonPersonalProfile {
  id?: string;
}

export interface ExpenseData extends Omit<JsonExpenseTransaction, 'id'> {
  id?: string; // Changed from number to string for consistency
  type?: 'expense' | 'income';
  vehicle_id_json?: string;
  json_id?: string;
}

export interface IncomeSourceData {
  id: string; // Changed to string for UUID
  user_id?: string; // Added for consistency
  name: string; // This will be the 'source' name, making it more explicit
  defaultAmount?: number; // Expected amount from this source
  source: string; // Keep the original source field
  frequency: "monthly" | "yearly" | "weekly" | string;
  account?: string;
  created_at?: Date; // Added
  updated_at?: Date; // Added
}

export interface VehicleData {
  // Core Identification
  id?: string; // Changed to string for consistency
  vehicle_name: string; // Form field, maps to 'name' in DexieVehicleRecord
  name?: string; // Add this to match DexieVehicleRecord
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  type?: string; // General type like "Car", "Motorcycle"
  owner?: string;
  status?: string; // e.g., "Active", "Sold"

  // Purchase and Financials
  purchaseDate?: string; // ISO Date string
  purchasePrice?: number;

  // Technical Details
  fuelType?: string;
  engineNumber?: string;
  chassisNumber?: string;
  currentOdometer?: number;
  fuelEfficiency?: string; // e.g., "15 km/l"

  // Insurance Details
  insurance_provider?: string;
  insurancePolicyNumber?: string;
  insurance_next_renewal?: string; // Form field, maps to 'insuranceExpiryDate' in Dexie
  insurance_premium?: number;
  insurance_frequency?: string;

  // Tracking & Maintenance
  tracking_type?: string;
  tracking_last_service_odometer?: number;
  next_pollution_check?: string; // ISO Date string
  location?: string;
  repair_estimate?: number;

  // Misc
  notes?: string;
}

export interface LoanData {
  id?: string; // Changed to string for consistency
  loan_name: string;
  lender?: string;
  interest_rate?: number;
  amount: number;
  emi: number;
  account?: string;
  purpose?: string;
  notes?: string;
  // Add fields to match DexieLoanEMIRecord
  loanType?: string;
  principalAmount?: number;
  emiAmount?: number;
  tenureMonths?: number;
  status?: string;
}

export interface InvestmentData {
  id: string; // Changed to string for UUID
  user_id?: string; // Added for consistency
  fund_name: string;
  investment_type: 'Mutual Fund' | 'PPF' | 'EPF' | 'NPS' | 'Gold' | 'Stock' | 'Other' | string; // Expanded options
  category?: string; // e.g., Equity, Debt, Hybrid, Real Estate, Commodity
  invested_value?: number; // Amount invested
  current_value?: number; // Current market value
  purchaseDate?: string; // ISO YYYY-MM-DD - Added
  quantity?: number; // e.g., number of units/shares
  notes?: string; // Added
  created_at?: Date; // Added
  updated_at?: Date; // Added
  risk_category?: string; // Added back for compatibility
}

export interface CreditCardData extends Omit<JsonCreditCard, 'due_date' | 'fee_waiver'> {
  id?: string; // Changed to string for consistency
  due_date: string;
  fee_waiver_details?: string;
  // Add fields to match DexieCreditCardRecord
  name?: string;
  issuer?: string;
  limit?: number;
  currentBalance?: number;
  dueDate?: string;
  last4Digits?: string;
}

export interface YearlySummary {
    id?: string; // Changed to string for consistency
    year: number;
    category?: string;
    type: 'expense' | 'income' | 'investment' | string;
    totalAmount: number;
    transactionCount: number;
}
