// src/types/entities.ts

// --- Income Type ---
export interface Income {
  id: string;           // UUID string from Supabase (PK)
  user_id: string;      // UUID string (FK to auth.users.id)
  amount: number;
  source: string;
  category: 'salary' | 'rental' | 'side-business' | 'investment' | 'other';
  date: string;           // YYYY-MM-DD
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  note?: string;
  created_at?: string;     // ISO string, managed by Supabase
  updated_at?: string;     // ISO string, managed by Supabase
}

// --- Expense Type ---
export interface Expense {
  id: string;           // UUID string from Supabase (PK)
  user_id: string;      // UUID string (FK to auth.users.id)
  amount: number;
  date: string;           // YYYY-MM-DD
  category: string;
  description: string;    // Main description
  payment_method?: string; // From PaymentMethod type union (defined in CategoryPaymentSelectors or a shared type file)
  tags?: string[];         // Array of strings
  source?: string;         // e.g., manual entry, CSV import
  merchant?: string;       // Optional: specific merchant name
  account?: string;        // Optional: which user account/card was used
  note?: string;           // Optional: longer notes
  created_at?: string;     // ISO string, managed by Supabase
  updated_at?: string;     // ISO string, managed by Supabase
}

// For PaymentMethod, it's currently in 'category-payment-selectors.tsx'.
// It would be good to move it here or to another central type file if widely used.
// For example:
// export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet';
// Then, Expense.payment_method could be `payment_method?: PaymentMethod;`
// For now, leaving it as string and the specific type is enforced by CategoryPaymentSelectors.
