
import React, { useState, useEffect } from 'react';
import { AuthenticationService } from '@/services/AuthenticationService';
import { PinEntry } from './PinEntry';
import { PinSetup } from './PinSetup';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  };

  const handlePinSetup = async () => {
    setHasPIN(true);
    setIsAuthenticated(true);
  };

  const handlePinVerification = async () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasPIN) {
    return <PinSetup onPinSet={handlePinSetup} />;
  }

  if (!isAuthenticated) {
    return <PinEntry onAuthenticated={handlePinVerification} />;
  }

  return <>{children}</>;
}
