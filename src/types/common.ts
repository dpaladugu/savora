
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string | null;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export type NavigationTab = 'dashboard' | 'expenses' | 'credit-cards' | 'investments' | 'goals' | 'upload' | 'settings' | 'more';

export type MoreModule = 
  | 'emergency-fund' 
  | 'rentals' 
  | 'recommendations' 
  | 'cfa-recommendations'
  | 'cashflow' 
  | 'telegram'
  | 'credit-cards'
  | 'credit-card-statements'
  | 'recurring-transactions'
  | 'vehicles'
  | 'insurance'
  | 'health-tracker'
  | 'subscriptions'
  | 'family-banking'
  | null;

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}
