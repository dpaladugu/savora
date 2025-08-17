
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { usePrivacyMask } from '@/store/appStore';

interface PrivacyMaskProps {
  amount: number;
  className?: string;
}

export function PrivacyMask({ amount, className = '' }: PrivacyMaskProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealSecret, setRevealSecret] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const privacyMask = usePrivacyMask();

  if (!privacyMask) {
    return <span className={className}>₹{amount.toLocaleString()}</span>;
  }

  const handleReveal = async () => {
    // In a real implementation, this would verify the secret with Argon2id
    // For demo purposes, we'll use a simple check
    if (revealSecret === 'reveal123') {
      setIsRevealed(true);
      setShowDialog(false);
      setRevealSecret('');
      
      // Auto-hide after 30 seconds
      setTimeout(() => {
        setIsRevealed(false);
      }, 30000);
    }
  };

  if (isRevealed) {
    return <span className={className}>₹{amount.toLocaleString()}</span>;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span>₹••••••</span>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Eye className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reveal Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter reveal secret"
              value={revealSecret}
              onChange={(e) => setRevealSecret(e.target.value)}
            />
            <Button onClick={handleReveal} className="w-full">
              Reveal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
