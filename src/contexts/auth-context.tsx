
import * as React from 'react';
import { AuthService, AuthUser } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check for stored user on mount
    const storedUser = AuthService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);

    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const authUser = await AuthService.signIn(email, password);
    setUser(authUser);
    return authUser;
  };

  const signUp = async (email: string, password: string) => {
    const authUser = await AuthService.signUp(email, password);
    setUser(authUser);
    return authUser;
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, signIn, signUp, signOut } },
    children
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
