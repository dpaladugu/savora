
// Minimal auth context without React imports or hooks
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

// Static mock context value
const mockContextValue: AuthContextType = {
  user: null,
  loading: false,
  signIn: async () => { throw new Error('Not implemented'); },
  signUp: async () => { throw new Error('Not implemented'); },
  signOut: async () => { throw new Error('Not implemented'); }
};

// Simple provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children;
}

// Hook that returns static mock value
export function useAuth() {
  return mockContextValue;
}
