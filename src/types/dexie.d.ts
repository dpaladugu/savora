// This file overrides the dexie module declaration to fix TS1540 error
// (TypeScript 5.5+ rejects `declare module Foo {}` inside ES modules in .d.ts files)
// By declaring the module here, TypeScript uses this declaration instead.

declare module 'dexie' {
  import Dexie from 'dexie/dist/dexie';
  export default Dexie;
  export type { Table, Collection, IndexableType, WhereClause, Transaction } from 'dexie/dist/dexie';
  export { liveQuery } from 'dexie/dist/dexie';
}
