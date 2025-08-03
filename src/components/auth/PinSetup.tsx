
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthenticationService } from '@/services/AuthenticationService';

interface PinSetupProps {
  onPinSet: () => void;
}

export function PinSetup({ onPinSet }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [revealSecret, setRevealSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handlePinChange = (value: string, isConfirm: boolean = false) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 6) {
      if (isConfirm) {
        setConfirmPin(numericValue);
      } else {
        setPin(numericValue);
      }
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthenticationService.setPIN(pin);
      
      if (revealSecret.trim()) {
        await AuthenticationService.enablePrivacyMask(revealSecret.trim());
      }

      toast({
        title: 'Success',
        description: 'PIN set successfully! Your app is now secure.',
      });
      
      onPinSet();
    } catch (error) {
      console.error('PIN setup error:', error);
      setError('Failed to set PIN. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to set PIN. Please try again.',
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
            <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Secure Your App</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Set up a PIN to protect your financial data
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Create PIN (4-6 digits)
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="Enter PIN"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.3em] font-mono h-14"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm PIN
                  </label>
                  <Input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, true)}
                    placeholder="Confirm PIN"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.3em] font-mono h-14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Privacy Reveal Secret (Optional)
                  </label>
                  <Input
                    type="text"
                    value={revealSecret}
                    onChange={(e) => setRevealSecret(e.target.value)}
                    placeholder="Secret word to reveal amounts"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a secret word to temporarily reveal masked amounts
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full text-lg py-3 h-auto"
                disabled={
                  loading || 
                  pin.length < 4 || 
                  pin !== confirmPin
                }
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Secure My App'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-xs text-muted-foreground text-center space-y-1">
              <p>• Your PIN is stored securely using encryption</p>
              <p>• After 10 failed attempts, all data will be permanently deleted</p>
              <p>• Privacy masking helps protect amounts from shoulder surfing</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
