// Re-export the extended database as the main database
export { extendedDb as db } from './db-schema-extended';

// Export specific types from the extended schema to avoid conflicts
export type {
  RentalProperty,
  Tenant,
  Gold,
  Loan,
  BrotherRepayment,
  Health,
  Prescription,
  Vaccination,
  Vital,
  FamilyBankAccount,
  FamilyTransfer,
  AuditLog,
  Subscription,
  AmortRow,
  Will,
  DigitalAsset,
  SpendingLimit,
  LLMPrompt
} from './db-schema-extended';

// Keep all existing exports for compatibility
export * from './db';
