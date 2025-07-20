
// Simplified auth context without any hooks
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

// Create a static mock context value
const mockContextValue: AuthContextType = {
  user: null,
  loading: false,
  signIn: async () => { throw new Error('Not implemented'); },
  signUp: async () => { throw new Error('Not implemented'); },
  signOut: async () => { throw new Error('Not implemented'); }
};

// Simple provider that just passes through the mock value
export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider: Static mock version');
  
  return (
    <div>
      {children}
    </div>
  );
}

export function useAuth() {
  console.log('useAuth: Returning static mock value');
  return mockContextValue;
}
