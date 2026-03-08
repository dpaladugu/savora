// Local Dexie re-export wrapper — bypasses the `declare module Dexie {}` declaration
// that causes TS1540 in TypeScript 5.5+ (module keyword deprecated for namespaces)
// All consumers import from 'dexie' which tsconfig.paths redirects here.

// Re-export everything from the Dexie package internals
export type { Table, Collection, IndexableType, IndexableTypeArray, WhereClause, Transaction, TransactionMode } from 'dexie/dist/dexie';
export { liveQuery } from 'dexie/dist/dexie';

// Re-export default (Dexie class)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import DexieLib from 'dexie/dist/dexie';
export default DexieLib;
export { DexieLib as Dexie };
