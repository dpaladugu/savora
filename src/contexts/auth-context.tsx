
import React from 'react';

// Simplified auth context without hooks for now
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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Simple provider without hooks for now
export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider: Simple version loading');
  
  const mockContextValue: AuthContextType = {
    user: null,
    loading: false,
    signIn: async () => { throw new Error('Not implemented'); },
    signUp: async () => { throw new Error('Not implemented'); },
    signOut: async () => { throw new Error('Not implemented'); }
  };

  return (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
