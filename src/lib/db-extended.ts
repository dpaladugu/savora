// Re-export the extended database as the main database
export { extendedDb as db } from './db-schema-extended';

// Keep all existing exports for compatibility
export * from './db';
export * from './db-schema-extended';
