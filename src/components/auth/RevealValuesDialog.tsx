import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useRBACStore, ROLE_PASSPHRASES, ROLE_NAMES, getSessionTTL, type AppRole } from '@/store/rbacStore';

interface RevealValuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevealValuesDialog({ open, onOpenChange }: RevealValuesDialogProps) {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useRBACStore();

  const handleReveal = async () => {
    if (!passphrase.trim()) {
      toast.error('Please enter a passphrase');
      return;
    }

    setLoading(true);
    try {
      // Simple passphrase lookup — in production, use PBKDF2 hash compare
      const role = ROLE_PASSPHRASES[passphrase.toLowerCase().trim()] as AppRole | undefined;

      if (!role) {
        toast.error('Wrong passphrase. Values remain masked.', {
          description: 'Check your passphrase and try again.',
        });
        setPassphrase('');
        return;
      }

      const expiresAt = Date.now() + getSessionTTL(role);
      setSession({ role, name: ROLE_NAMES[role], expiresAt });
      
      toast.success(`Welcome, ${ROLE_NAMES[role]}`, {
        description: 'Values are now revealed for this session.',
      });
      setPassphrase('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleReveal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Reveal Values
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Enter your passphrase to reveal masked financial values. Sessions expire automatically.
          </p>

          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase</Label>
            <div className="relative">
              <Input
                id="passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter passphrase..."
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleReveal} disabled={loading} className="flex-1">
              <Lock className="w-4 h-4 mr-2" />
              {loading ? 'Verifying...' : 'Reveal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
