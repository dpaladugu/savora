
// Static auth service - no React dependencies
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
const mockAuthService: AuthContextType = {
  user: null,
  loading: false,
  signIn: async () => { throw new Error('Not implemented'); },
  signUp: async () => { throw new Error('Not implemented'); },
  signOut: async () => { throw new Error('Not implemented'); }
};

// Hook that returns static mock value
export function useAuth() {
  return mockAuthService;
}

// Simple provider function - returns children as-is
export function AuthProvider({ children }: { children: any }) {
  return children;
}
