
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export const useTxns = () => useLiveQuery(() => db.txns.toArray());
export const useRentals = () => useLiveQuery(() => db.rentalProperties.toArray());
export const useGoals = () => useLiveQuery(() => db.goals.toArray());
export const useVehicles = () => useLiveQuery(() => db.vehicles.toArray());
export const useCreditCards = () => useLiveQuery(() => db.creditCards.toArray());
export const useLoans = () => useLiveQuery(() => db.loans.toArray());
export const useInsurance = () => useLiveQuery(() => db.insurance.toArray());
export const useWallets = () => useLiveQuery(() => db.wallets.toArray());
export const useTenants = () => useLiveQuery(() => db.tenants.toArray());
export const useInvestments = () => useLiveQuery(() => db.investments.toArray());
export const useGold = () => useLiveQuery(() => db.gold.toArray());
export const useSubscriptions = () => useLiveQuery(() => db.subscriptions.toArray());
export const useEmergencyFunds = () => useLiveQuery(() => db.emergencyFunds.toArray());
