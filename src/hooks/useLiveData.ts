
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export const useTxns = () => useLiveQuery(() => db.txns.toArray());
export const useRentals = () => useLiveQuery(() => db.rentalProperties.toArray());
export const useGoals = () => useLiveQuery(() => db.goals.toArray());
export const useVehicles = () => useLiveQuery(() => db.vehicles.toArray());
export const useCreditCards = () => useLiveQuery(() => db.creditCards.toArray());
export const useLoans = () => useLiveQuery(() => db.loans.toArray());
export const usePolicies = () => useLiveQuery(() => db.policies.toArray());
export const useHealthProfiles = () => useLiveQuery(() => db.healthProfiles.toArray());
export const useWallets = () => useLiveQuery(() => db.wallets.toArray());
