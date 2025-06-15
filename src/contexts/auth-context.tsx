
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication - in real app, this would check Firebase auth state
    setTimeout(() => {
      setUser({
        uid: 'mock-user-id',
        email: 'user@example.com',
        displayName: 'Test User'
      });
      setLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    // Mock sign in
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({
      uid: 'mock-user-id',
      email,
      displayName: 'Test User'
    });
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
