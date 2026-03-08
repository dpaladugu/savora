/**
 * COMPATIBILITY SHIM — do NOT import from here in new code.
 * All files should import from '@/lib/db' directly.
 *
 * This file re-exports everything from the canonical database module
 * so that legacy imports (@/db) continue to work without change.
 */

export { db } from '@/lib/db';

// Re-export all interface types so destructured imports like
//   import { db, Income, Investment } from '@/db'
// continue to compile.
export type {
  GlobalSettings,
  Contact,
  Dependent,
  Vehicle,
  Loan,
  Insurance,
  SpendingLimit,
  Gold,
  Subscription,
  BrotherRepayment,
  FamilyBankAccount,
  FamilyTransfer,
  WillRow,
  DigitalAsset,
  AuditLog,
  Expense,
  Income,
  RecurringTransaction,
  AppSettingTable,
  GunturShopRow,
  WaterfallProgressRow,
  GorantlaRoomRow,
} from '@/lib/db';

export type {
  EmergencyFund,
  Investment,
  CreditCard,
  RentalProperty,
  Health,
  Txn,
  Goal,
  Tenant,
} from '@/types/financial';

// SavoraDB class shim — some legacy code does `new SavoraDB()`
// We export a no-op class to avoid import errors
export class SavoraDB {}
