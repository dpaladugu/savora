
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuthenticationService } from '@/services/AuthenticationService';

interface PrivacyMaskProps {
  amount: number;
  className?: string;
}

export function PrivacyMask({ amount, className = '' }: PrivacyMaskProps) {
  const [shouldMask, setShouldMask] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealSecret, setRevealSecret] = useState('');
  const [showRevealDialog, setShowRevealDialog] = useState(false);

  useEffect(() => {
    checkMaskStatus();
  }, []);

  const checkMaskStatus = async () => {
    try {
      const shouldMask = await AuthenticationService.shouldShowMaskedAmounts();
      const isCurrentlyRevealed = AuthenticationService.isRevealActive();
      
      setShouldMask(shouldMask);
      setIsRevealed(isCurrentlyRevealed);
    } catch (error) {
      console.error('Error checking mask status:', error);
    }
  };

  const handleRevealAttempt = async () => {
    try {
      const success = await AuthenticationService.verifyRevealSecret(revealSecret);
      if (success) {
        setIsRevealed(true);
        setShowRevealDialog(false);
        setRevealSecret('');
        
        // Auto-hide after 5 minutes
        setTimeout(() => {
          setIsRevealed(false);
        }, 5 * 60 * 1000);
      } else {
        // Handle incorrect secret
        setRevealSecret('');
      }
    } catch (error) {
      console.error('Error revealing amount:', error);
    }
  };

  if (!shouldMask || isRevealed) {
    return (
      <span className={className}>
        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span>₹***.**</span>
      <Dialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Eye className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reveal Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your reveal secret to temporarily show the amount (5 minutes):
            </p>
            <Input
              type="password"
              value={revealSecret}
              onChange={(e) => setRevealSecret(e.target.value)}
              placeholder="Enter reveal secret"
              onKeyPress={(e) => e.key === 'Enter' && handleRevealAttempt()}
            />
            <div className="flex gap-2">
              <Button onClick={handleRevealAttempt} disabled={!revealSecret.trim()}>
                Reveal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRevealDialog(false);
                  setRevealSecret('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hook for easy privacy masking in components
export function usePrivacyMask() {
  const [shouldMask, setShouldMask] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const shouldMask = await AuthenticationService.shouldShowMaskedAmounts();
        setShouldMask(shouldMask);
      } catch (error) {
        console.error('Error checking mask status:', error);
        setShouldMask(false);
      }
    };

    checkStatus();
  }, []);

  const maskAmount = (amount: number): string => {
    if (shouldMask && !AuthenticationService.isRevealActive()) {
      return AuthenticationService.maskAmount(amount);
    }
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return { shouldMask, maskAmount };
}
