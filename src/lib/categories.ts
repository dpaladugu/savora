/**
 * Single source of truth for India-specific expense categories.
 * Used across ExpenseTracker, SpendingLimits, CategoryBreakdown, etc.
 */

export const EXPENSE_CATEGORIES = [
  // ── Daily Living ──────────────────────────────────────────────────
  'Food & Dining',
  'Groceries',
  'Household Supplies',

  // ── Transport ─────────────────────────────────────────────────────
  'Transport',
  'Fuel',
  'Vehicle Maintenance',
  'Parking & Tolls',

  // ── Housing ───────────────────────────────────────────────────────
  'Rent',
  'Home Maintenance',
  'Electricity',
  'Utilities',

  // ── Financial Obligations ─────────────────────────────────────────
  'EMI',
  'Credit Card Bill',
  'Insurance / LIC',
  'Loan Repayment',

  // ── Health & Wellness ─────────────────────────────────────────────
  'Medical',
  'Pharmacy',
  'Doctor / Hospital',
  'Health Insurance',

  // ── Family & Social ───────────────────────────────────────────────
  'Family Transfer',
  'Festivals & Gifts',
  'Wedding / Functions',

  // ── Education ─────────────────────────────────────────────────────
  'School Fees',
  'Education',
  'Books & Stationery',

  // ── Lifestyle ─────────────────────────────────────────────────────
  'Shopping',
  'Clothing',
  'Entertainment',
  'Dining Out',
  'Travel',
  'Personal Care',

  // ── Savings & Investment ──────────────────────────────────────────
  'SIP / Mutual Fund',
  'PPF / NPS',
  'Gold Purchase',
  'FD / RD',

  // ── Tax & Statutory ───────────────────────────────────────────────
  'Income Tax',
  'Property Tax',
  'Professional Tax',

  // ── Business / Professional ───────────────────────────────────────
  'Professional Services',
  'Subscriptions',
  'Office Expenses',

  // ── Miscellaneous ─────────────────────────────────────────────────
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/** Shorter list for spending limits / chart labels */
export const SPENDING_LIMIT_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Fuel',
  'Shopping',
  'Clothing',
  'Entertainment',
  'Medical',
  'Utilities',
  'Electricity',
  'Rent',
  'EMI',
  'Insurance / LIC',
  'School Fees',
  'Education',
  'Vehicle Maintenance',
  'Festivals & Gifts',
  'Travel',
  'Personal Care',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Net Banking / NEFT',
  'Wallet (PhonePe / GPay)',
  'Cheque',
  'Auto-debit',
] as const;
