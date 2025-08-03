
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthenticationService } from '@/services/AuthenticationService';

interface PinEntryProps {
  onAuthenticated: () => void;
}

export function PinEntry({ onAuthenticated }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(10);
  const { toast } = useToast();

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await AuthenticationService.verifyPIN(pin);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Authentication successful!',
        });
        onAuthenticated();
      } else {
        setAttemptsRemaining(result.attemptsRemaining);
        
        if (result.shouldSelfDestruct) {
          toast({
            title: 'Security Breach',
            description: 'Too many failed attempts. All data has been permanently deleted.',
            variant: 'destructive',
          });
          // The service handles the self-destruct, app will reload
          return;
        } else {
          setError(`Invalid PIN. ${result.attemptsRemaining} attempts remaining.`);
          toast({
            title: 'Invalid PIN',
            description: `${result.attemptsRemaining} attempts remaining before data deletion.`,
            variant: 'destructive',
          });
        }
      }
      
      setPin(''); // Clear PIN input
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
      toast({
        title: 'Error',
        description: 'Authentication failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border border-border/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Lock className="w-16 h-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Enter PIN</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Unlock Savora to access your financial data
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Enter your PIN"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.3em] font-mono h-14"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              {attemptsRemaining <= 3 && attemptsRemaining > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Only {attemptsRemaining} attempts remaining before all data is permanently deleted.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full text-lg py-3 h-auto"
                disabled={loading || pin.length < 4}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Unlock'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-xs text-muted-foreground text-center">
              <p>Forgot your PIN? There is no recovery option for security reasons.</p>
              <p>All data will be deleted after 10 failed attempts.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
