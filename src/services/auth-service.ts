
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('AuthProvider: Component initializing');
  console.log('AuthProvider: React check:', typeof React, React);
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect running');
    // Check for stored user on mount
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    // Mock implementation - replace with actual auth when configured
    throw new Error('Authentication not configured');
  };

  const signUp = async (email: string, password: string): Promise<AuthUser> => {
    // Mock implementation - replace with actual auth when configured
    throw new Error('Authentication not configured');
  };

  const signOut = async (): Promise<void> => {
    localStorage.removeItem('savora-user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };

  console.log('AuthProvider: Rendering with value:', value);
  return React.createElement(AuthContext.Provider, { value }, children);
}

// Hook that uses the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get stored user
function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('savora-user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
