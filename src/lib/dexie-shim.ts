/**
 * Dexie shim — re-exports the runtime from dexie/dist/dexie.js while
 * providing hand-written TypeScript declarations that avoid the
 * `declare module Dexie {}` block that triggers TS1540 in TypeScript ≥ 5.5.
 *
 * tsconfig.app.json maps `"dexie"` → `"./src/lib/dexie-shim"` via `paths`,
 * so all `import … from 'dexie'` statements resolve here at typecheck time.
 * At runtime Vite still bundles the real dexie package normally.
 */

// ─── Runtime re-export (Vite resolves this to node_modules/dexie at build time) ─
// We use a dynamic import string so the TypeScript checker never follows it
// back to the problematic declaration file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _dexieModule: any = await import(/* @vite-ignore */ 'dexie' + '');

// ─── Types (hand-written, no `declare module Dexie {}` block) ────────────────

export type IndexableType = string | number | Date | ArrayBuffer | ArrayBufferView | DataView | Array<Array<void>>;
export type IndexableTypeArray = Array<IndexableType>;
export type IndexableTypeArrayReadonly = ReadonlyArray<IndexableType>;

export interface TransactionMode {
  readonly readwrite: string;
  readonly readonly: string;
}

export interface WhereClause<T = any, TKey = any> {
  above(key: any): Collection<T, TKey>;
  aboveOrEqual(key: any): Collection<T, TKey>;
  anyOf(...keys: Array<any>): Collection<T, TKey>;
  anyOfIgnoreCase(...keys: string[]): Collection<T, TKey>;
  below(key: any): Collection<T, TKey>;
  belowOrEqual(key: any): Collection<T, TKey>;
  between(lower: any, upper: any, includeLower?: boolean, includeUpper?: boolean): Collection<T, TKey>;
  equals(key: any): Collection<T, TKey>;
  equalsIgnoreCase(key: string): Collection<T, TKey>;
  inAnyRange(ranges: Array<[any, any]>): Collection<T, TKey>;
  noneOf(...keys: Array<any>): Collection<T, TKey>;
  notEqual(key: any): Collection<T, TKey>;
  startsWith(key: string): Collection<T, TKey>;
  startsWithAnyOf(...prefixes: string[]): Collection<T, TKey>;
  startsWithAnyOfIgnoreCase(...prefixes: string[]): Collection<T, TKey>;
  startsWithIgnoreCase(key: string): Collection<T, TKey>;
}

export interface Collection<T = any, TKey = any> {
  and(filter: (x: T) => boolean): Collection<T, TKey>;
  clone(): Collection<T, TKey>;
  count(): Promise<number>;
  delete(): Promise<number>;
  desc(): Collection<T, TKey>;
  distinct(): Collection<T, TKey>;
  each(callback: (obj: T, cursor: { key: TKey; primaryKey: TKey }) => any): Promise<void>;
  eachKey(callback: (key: TKey) => any): Promise<void>;
  eachPrimaryKey(callback: (key: TKey) => any): Promise<void>;
  eachUniqueKey(callback: (key: TKey) => any): Promise<void>;
  filter(filter: (x: T) => boolean): Collection<T, TKey>;
  first(): Promise<T | undefined>;
  keys(): Promise<TKey[]>;
  last(): Promise<T | undefined>;
  limit(n: number): Collection<T, TKey>;
  modify(changes: Partial<T> | ((obj: T, ctx: { value: T }) => void | boolean)): Promise<number>;
  offset(n: number): Collection<T, TKey>;
  or(indexOrPrimayKey: string): WhereClause<T, TKey>;
  primaryKeys(): Promise<TKey[]>;
  raw(): Collection<T, TKey>;
  reverse(): Collection<T, TKey>;
  sortBy(keyPath: string): Promise<T[]>;
  toArray(): Promise<T[]>;
  uniqueKeys(): Promise<TKey[]>;
  until(filter: (value: T) => boolean, includeStopEntry?: boolean): Collection<T, TKey>;
}

export interface Table<T = any, TKey = any, TInsertType = T> {
  name: string;
  schema: any;
  hook: any;
  db: DexieClass;
  add(item: TInsertType, key?: TKey): Promise<TKey>;
  bulkAdd(items: readonly TInsertType[], keys?: readonly TKey[]): Promise<TKey>;
  bulkDelete(keys: readonly TKey[]): Promise<void>;
  bulkGet(keys: TKey[]): Promise<Array<T | undefined>>;
  bulkPut(items: readonly TInsertType[], keys?: readonly TKey[]): Promise<TKey>;
  clear(): Promise<void>;
  count(): Promise<number>;
  delete(key: TKey): Promise<void>;
  each(callback: (obj: T) => any): Promise<void>;
  filter(fn: (obj: T) => boolean): Collection<T, TKey>;
  get(key: TKey): Promise<T | undefined>;
  get(equalityCriterias: Partial<T>): Promise<T | undefined>;
  limit(n: number): Collection<T, TKey>;
  offset(n: number): Collection<T, TKey>;
  orderBy(index: string): Collection<T, TKey>;
  put(item: T, key?: TKey): Promise<TKey>;
  reverse(): Collection<T, TKey>;
  toArray(): Promise<T[]>;
  toCollection(): Collection<T, TKey>;
  update(key: TKey, changes: Partial<T>): Promise<number>;
  where(indexOrCriteria: string | Partial<T>): WhereClause<T, TKey> & Collection<T, TKey>;
  mapToClass(constructor: Function): Function;
}

export type EntityTable<T, TPrimaryKey extends keyof T> = Table<T, T[TPrimaryKey], Omit<T, TPrimaryKey> & Partial<Pick<T, TPrimaryKey>>>;

export interface Transaction {
  abort(): void;
  table(tableName: string): Table;
}

export interface Observable<T> {
  subscribe(observer: { next?: (value: T) => void; error?: (error: any) => void; complete?: () => void }): { unsubscribe(): void };
}

export interface DexieConstructor {
  new (databaseName: string, options?: { autoOpen?: boolean; indexedDB?: any; IDBKeyRange?: any; cache?: 'immutable' | 'cloned' | 'disabled' }): DexieClass;
  prototype: DexieClass;
  semVer: string;
  version: string;
  maxKey: IDBValidKey;
  minKey: number;
  exists(databaseName: string): Promise<boolean>;
  getDatabaseNames(): Promise<string[]>;
  liveQuery: typeof liveQuery;
  delete(databaseName: string): Promise<void>;
}

export interface DexieClass {
  name: string;
  tables: Table[];
  verno: number;
  _allTables: { [name: string]: Table };
  open(): Promise<DexieClass>;
  close(): void;
  delete(): Promise<void>;
  isOpen(): boolean;
  on: any;
  transaction<T>(mode: 'r' | 'r!' | 'rw' | 'rw!', tables: Table[], scope: () => Promise<T>): Promise<T>;
  transaction<T>(mode: 'r' | 'r!' | 'rw' | 'rw!', table1: Table, scope: () => Promise<T>): Promise<T>;
  version(versionNumber: number): { stores(schema: { [key: string]: string | null }): any };
  table(tableName: string): Table;
  [key: string]: any;
}

export function liveQuery<T>(querier: () => T | Promise<T>): Observable<T>;

// Default export: the Dexie constructor
declare const Dexie: DexieConstructor & {
  liveQuery: typeof liveQuery;
  (databaseName: string, options?: any): DexieClass;
};

export default Dexie;
