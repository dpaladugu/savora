/**
 * dexie-react-hooks shim — provides TypeScript types for dexie-react-hooks
 * without triggering TS1540 from the transitive dexie dependency.
 */
import type { Observable } from './dexie-shim';

export declare function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps?: any[],
  defaultResult?: T
): T | undefined;

export declare function useObservable<T>(
  observable: Observable<T>,
  defaultResult?: T
): T | undefined;
