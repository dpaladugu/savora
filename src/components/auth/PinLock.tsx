import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react'; // Changed from LockIcon to LockKeyhole
import { Input } from '@/components/ui/input'; // Assuming you have an InputOTP or similar, using regular Input for now
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/db'; // Import Dexie db instance
import { EncryptionService } from '@/services/encryptionService';
import { useAppStore } from '@/store/appStore';
import { useEffect } from 'react'; // Import useEffect

interface PinLockProps {
  onUnlockSuccess: () => void;
}

type PinLockMode = 'loading' | 'setup' | 'unlock';

export function PinLock({ onUnlockSuccess }: PinLockProps) {
  const [mode, setMode] = useState<PinLockMode>('loading');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState(''); // For setup mode
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const unlockApp = useAppStore((state) => state.unlockApp);

  useEffect(() => {
    const checkPinSetup = async () => {
      try {
        const setting = await db.appSettings.get('encryptedApiKey');
        if (setting && setting.value) {
          setMode('unlock');
        } else {
          setMode('setup');
        }
      } catch (e) {
        console.error("Error checking PIN setup:", e);
        setError("Could not verify PIN status. Please refresh.");
        setMode('unlock'); // Default to unlock mode on error, though it will likely fail
      }
    };
    checkPinSetup();
  }, []);

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 6) { // Assuming a 4 or 6 digit PIN
      setPin(numericValue);
      setError(''); // Clear error on new input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { // Basic validation
      setError('PIN must be at least 4 digits.');
      return;
    }
    setLoading(true);
    setError('');

    if (mode === 'setup') {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits.');
        setLoading(false);
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        setLoading(false);
        return;
      }
      try {
        const apiKeyToEncrypt = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (!apiKeyToEncrypt) {
          throw new Error('DeepSeek API Key not found in environment variables for setup.');
        }
        const ciphertext = await EncryptionService.encryptData({ apiKey: apiKeyToEncrypt }, pin);
        if (ciphertext) {
          await db.appSettings.put({ key: 'encryptedApiKey', value: ciphertext });
          // Optionally store a PIN hash for quick checks - not for decryption
          // const pinHash = await EncryptionService.deriveKey(pin, "savora-pin-verifier-salt"); // Example
          // await db.appSettings.put({ key: 'userPinHash', value: someRepresentationOf(pinHash) });

          unlockApp(apiKeyToEncrypt); // Unlock with the plaintext key for this session
          toast({ title: 'Success', description: 'PIN set up and application unlocked.' });
          onUnlockSuccess();
        } else {
          throw new Error('Encryption failed during PIN setup.');
        }
      } catch (e: any) {
        console.error("PIN Setup Error:", e);
        setError(e.message || 'PIN setup failed. Please try again.');
        toast({ title: 'Error', description: e.message || 'PIN setup failed.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else if (mode === 'unlock') {
      try {
        const setting = await db.appSettings.get('encryptedApiKey');
        const encryptedCiphertext = setting?.value as string | undefined;

        if (!encryptedCiphertext) {
          setError('PIN not set up. Please refresh to go through setup.');
          toast({ title: 'Error', description: 'PIN not set up.', variant: 'destructive' });
          setLoading(false);
          setMode('setup'); // Force setup mode
          return;
        }

        const decryptedPayload = await EncryptionService.decryptData(encryptedCiphertext, pin);
        if (decryptedPayload && decryptedPayload.apiKey) {
          unlockApp(decryptedPayload.apiKey);
          toast({ title: 'Success', description: 'Application unlocked.' });
          onUnlockSuccess();
        } else {
          setError('Invalid PIN.');
          toast({ title: 'Error', description: 'Invalid PIN.', variant: 'destructive' });
        }
      } catch (e: any) {
        console.error("PIN Unlock Error:", e);
        setError(e.message || 'Unlock failed. Please try again.');
        toast({ title: 'Error', description: e.message || 'Unlock failed.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs p-8 bg-background dark:bg-slate-800/50 shadow-2xl rounded-xl border border-border/20 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <LockKeyhole className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground">
            {mode === 'setup' ? 'Set Up Security PIN' : 'Enter Security PIN'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'setup'
              ? 'Create a PIN to secure your application data.'
              : 'Unlock Savora to access your financial data.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            placeholder="Enter PIN (4-6 digits)"
            maxLength={6}
            className="text-center text-2xl tracking-[0.3em] font-mono h-14"
            autoFocus
          />
          {mode === 'setup' && (
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                if (numericValue.length <= 6) setConfirmPin(numericValue);
                setError('');
              }}
              placeholder="Confirm PIN"
              maxLength={6}
              className="text-center text-2xl tracking-[0.3em] font-mono h-14"
            />
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full text-lg py-3 h-auto" disabled={loading || pin.length < 4 || (mode === 'setup' && confirmPin.length < 4)}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'setup' ? 'Set PIN & Unlock' : "Unlock"
            )}
          </Button>
        </form>
      </motion.div>
      <p className="text-xs text-muted-foreground mt-8">
        Your sensitive data (like API keys) is encrypted using this PIN and stored locally.
      </p>
    </div>
  );
}
