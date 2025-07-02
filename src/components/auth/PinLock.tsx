import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react'; // Changed from LockIcon to LockKeyhole
import { Input } from '@/components/ui/input'; // Assuming you have an InputOTP or similar, using regular Input for now
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
// import { EncryptionService } from '@/services/encryptionService'; // Will be used later
// import { useAuthStore } from '@/store/appStore'; // Example if using Zustand for unlock state

interface PinLockProps {
  onUnlockSuccess: () => void;
  // setEncryptedApiKey: (key: string | null) => void; // Example prop for API key management
  // encryptedApiKeyFromStorage: string | null; // Example prop
}

export function PinLock({ onUnlockSuccess }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // const setDecryptedKey = useAuthStore((state) => state.setDecryptedApiKey); // Example

  const handlePinChange = (value: string) => {
    // Basic PIN input handling, allowing only numbers and max length
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

    // --- SIMULATED UNLOCK ---
    // In a real scenario, you would:
    // 1. Retrieve an encrypted item (e.g., API key) from localStorage or IndexedDB's appSettings.
    // const encryptedItem = localStorage.getItem('encryptedDeepSeekApiKey');
    //    or const setting = await db.appSettings.get('encryptedDeepSeekApiKey');
    //    const encryptedItem = setting?.value as string | undefined;
    //
    // 2. If encryptedItem exists:
    //    const decryptedData = await EncryptionService.decryptData(encryptedItem, pin);
    //    if (decryptedData && decryptedData.apiKey) {
    //      // Store decryptedKey in memory (e.g., Zustand store, or a non-persistent context)
    //      // setDecryptedKey(decryptedData.apiKey); // Example for Zustand
    //      toast({ title: 'Success', description: 'Application unlocked.' });
    //      onUnlockSuccess();
    //    } else {
    //      setError('Invalid PIN or corrupted data.');
    //      toast({ title: 'Error', description: 'Invalid PIN.', variant: 'destructive' });
    //    }
    // 3. If no encryptedItem exists (first time use / setup needed):
    //    setError('PIN not set up. Please go through setup.'); // Or handle setup flow
    //    toast({ title: 'Setup Needed', description: 'PIN not set up.', variant: 'destructive' });


    // For now, simulate a successful unlock with a known PIN for testing UI
    // Replace "1234" with your test PIN or implement actual decryption
    setTimeout(() => {
      if (pin === "1234") { // Placeholder for actual decryption logic
        toast({ title: 'Success', description: 'Application unlocked (Simulated).' });
        onUnlockSuccess();
      } else {
        setError('Invalid PIN (Simulated). Try "1234".');
        toast({ title: 'Error', description: 'Invalid PIN (Simulated).', variant: 'destructive' });
      }
      setLoading(false);
    }, 1000);
  };

  // Using a simple input for PIN for now.
  // Shadcn's InputOTP would be better for a real PIN input experience.
  // <InputOTP maxLength={6} value={pin} onChange={handlePinChange}>
  //   <InputOTPGroup>...</InputOTPGroup>
  // </InputOTP>

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
          <h2 className="text-2xl font-bold text-foreground">Enter Security PIN</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock Savora to access your financial data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password" // Use password type to mask input
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            placeholder="Enter your PIN"
            maxLength={6} // Consistent with handlePinChange
            className="text-center text-2xl tracking-[0.3em] font-mono h-14"
            autoFocus
          />

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full text-lg py-3 h-auto" disabled={loading || pin.length < 4}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              "Unlock"
            )}
          </Button>
        </form>
      </motion.div>
      <p className="text-xs text-muted-foreground mt-8">
        Your data is encrypted and stored locally on this device.
      </p>
    </div>
  );
}
