
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthenticationService } from '@/services/AuthenticationService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPIN: boolean;
  login: (pin: string) => Promise<{ success: boolean; shouldSelfDestruct: boolean; attemptsRemaining: number }>;
  setupPIN: (pin: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPIN, setHasPIN] = useState(false);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const pinExists = await AuthenticationService.hasPIN();
      setHasPIN(pinExists);
      
      if (pinExists) {
        const sessionValid = AuthenticationService.isSessionValid();
        setIsAuthenticated(sessionValid);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setHasPIN(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (pin: string) => {
    const result = await AuthenticationService.verifyPIN(pin);
    if (result.success) {
      AuthenticationService.createSession();
      setIsAuthenticated(true);
    }
    return result;
  };

  const setupPIN = async (pin: string) => {
    await AuthenticationService.setPIN(pin);
    setHasPIN(true);
    AuthenticationService.createSession();
    setIsAuthenticated(true);
  };

  const logout = () => {
    AuthenticationService.clearSession();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuthStatus();

    // Set up auto-lock timer
    let autoLockTimer: NodeJS.Timeout;
    
    const resetAutoLockTimer = () => {
      if (autoLockTimer) {
        clearTimeout(autoLockTimer);
      }
      
      if (isAuthenticated) {
        autoLockTimer = setTimeout(() => {
          logout();
        }, 5 * 60 * 1000); // 5 minutes default
      }
    };

    const handleActivity = () => {
      if (isAuthenticated) {
        resetAutoLockTimer();
      }
    };

    if (isAuthenticated) {
      resetAutoLockTimer();
      document.addEventListener('mousedown', handleActivity);
      document.addEventListener('keydown', handleActivity);
      document.addEventListener('touchstart', handleActivity);
    }

    return () => {
      if (autoLockTimer) {
        clearTimeout(autoLockTimer);
      }
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      hasPIN,
      login,
      setupPIN,
      logout,
      checkAuthStatus
    }}>
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
