/**
 * Dexie shim — provides TypeScript types for dexie without the
 * `declare module Dexie {}` block that triggers TS1540 in TypeScript ≥ 5.5.
 *
 * tsconfig.app.json maps "dexie" → "./src/lib/dexie-shim" via paths.
 * At runtime, Vite resolves the actual dexie package normally.
 * At typecheck time, TypeScript never visits node_modules/dexie/dist/dexie.d.ts.
 */

export type IndexableType = string | number | Date | ArrayBuffer | ArrayBufferView | DataView;
export type IndexableTypeArray = Array<IndexableType>;

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
  noneOf(...keys: Array<any>): Collection<T, TKey>;
  notEqual(key: any): Collection<T, TKey>;
  startsWith(key: string): Collection<T, TKey>;
  startsWithAnyOf(...prefixes: string[]): Collection<T, TKey>;
  startsWithIgnoreCase(key: string): Collection<T, TKey>;
}

export interface Collection<T = any, TKey = any> {
  and(filter: (x: T) => boolean): Collection<T, TKey>;
  count(): Promise<number>;
  delete(): Promise<number>;
  each(callback: (obj: T) => any): Promise<void>;
  filter(filter: (x: T) => boolean): Collection<T, TKey>;
  first(): Promise<T | undefined>;
  keys(): Promise<TKey[]>;
  last(): Promise<T | undefined>;
  limit(n: number): Collection<T, TKey>;
  modify(changes: Partial<T> | ((obj: T, ctx: { value: T }) => void | boolean)): Promise<number>;
  offset(n: number): Collection<T, TKey>;
  or(indexOrPrimaryKey: string): WhereClause<T, TKey>;
  primaryKeys(): Promise<TKey[]>;
  reverse(): Collection<T, TKey>;
  sortBy(keyPath: string): Promise<T[]>;
  toArray(): Promise<T[]>;
  uniqueKeys(): Promise<TKey[]>;
}

export interface Table<T = any, TKey = any, TInsertType = T> {
  name: string;
  schema: any;
  db: any;
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

export type EntityTable<T, TPrimaryKey extends keyof T> =
  Table<T, T[TPrimaryKey], Omit<T, TPrimaryKey> & Partial<Pick<T, TPrimaryKey>>>;

export interface Transaction {
  abort(): void;
}

export interface Observable<T> {
  subscribe(observer: {
    next?: (value: T) => void;
    error?: (error: any) => void;
    complete?: () => void;
  }): { unsubscribe(): void };
}

export interface DexieClass {
  name: string;
  tables: Table[];
  verno: number;
  open(): Promise<DexieClass>;
  close(): void;
  delete(): Promise<void>;
  isOpen(): boolean;
  on: any;
  transaction<T>(
    mode: 'r' | 'r!' | 'rw' | 'rw!',
    tables: Table | Table[],
    scope: () => Promise<T>
  ): Promise<T>;
  version(versionNumber: number): { stores(schema: { [key: string]: string | null }): any };
  table(tableName: string): Table;
  [key: string]: any;
}

export interface DexieConstructor {
  new(
    databaseName: string,
    options?: {
      autoOpen?: boolean;
      indexedDB?: any;
      IDBKeyRange?: any;
      cache?: 'immutable' | 'cloned' | 'disabled';
    }
  ): DexieClass;
  prototype: DexieClass;
  semVer: string;
  version: string;
  liveQuery: typeof liveQuery;
  exists(databaseName: string): Promise<boolean>;
  delete(databaseName: string): Promise<void>;
}

export declare function liveQuery<T>(querier: () => T | Promise<T>): Observable<T>;

declare const Dexie: DexieConstructor;
export { Dexie };
export default Dexie;
