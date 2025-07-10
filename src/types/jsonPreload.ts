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
  date: string;
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
  id?: number;
  type?: 'expense' | 'income';
  vehicle_id_json?: string;
  json_id?: string;
}

export interface IncomeSourceData extends Omit<JsonIncomeCashFlow, 'amount'> { // amount in JsonIncomeCashFlow is the actual transaction amount, here it's a default/expected
  id: string; // Changed to string for UUID
  user_id?: string; // Added for consistency
  name: string; // This will be the 'source' name, making it more explicit
  defaultAmount?: number; // Expected amount from this source
  // frequency and account are inherited from JsonIncomeCashFlow
  created_at?: Date; // Added
  updated_at?: Date; // Added
  // Note: JsonIncomeCashFlow has 'source: string'. We'll use 'name' as the primary identifier for the source.
  // The 'source' field from JsonIncomeCashFlow can be mapped to 'name' when creating IncomeSourceData.
}


export interface VehicleData {
  id?: number;
  vehicle_name: string;
  registrationNumber?: string; // Added for DexieVehicleRecord compatibility
  make?: string; // Added for DexieVehicleRecord compatibility
  model?: string; // Added for DexieVehicleRecord compatibility
  year?: number; // Added as it's common for vehicles, though not in Dexie v10
  fuelType?: string; // Added for DexieVehicleRecord compatibility
  owner?: string;
  type?: "motorcycle" | "car" | string; // This is distinct from make/model, more general type
  usage?: string;
  insurance_premium?: number;
  insurance_provider?: string;
  insurance_frequency?: string;
  insurance_next_renewal?: string; // Maps to insuranceExpiryDate in DexieVehicleRecord
  tracking_type?: string;
  tracking_last_service_odometer?: number;
  tracking_next_pollution_check?: string;
  status?: string;
  location?: string;
  repair_estimate?: number;
  // Consider adding other fields from DexieVehicleRecord if they should be form-editable:
  // color?: string;
  // mileage?: number; // This was in VehicleList but not DexieVehicleRecord v10
  // purchaseDate?: string;
  // purchasePrice?: number;
  // engineNumber?: string;
  // chassisNumber?: string;
  // notes?: string;
}

export interface LoanData {
  id?: number;
  loan_name: string;
  lender?: string;
  interest_rate?: number;
  amount: number;
  emi: number;
  account?: string;
  purpose?: string;
  notes?: string;
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
  // risk_category?: string; // Can be kept if used
}

export interface CreditCardData extends Omit<JsonCreditCard, 'due_date' | 'fee_waiver'> {
  id?: number;
  due_date: string;
  fee_waiver_details?: string;
}

export interface YearlySummary {
    id?: number;
    year: number;
    category?: string;
    type: 'expense' | 'income' | 'investment' | string;
    totalAmount: number;
    transactionCount: number;
}
