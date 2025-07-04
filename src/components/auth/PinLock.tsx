import React, { useState, useEffect } from 'react'; // Ensure useEffect is imported here
import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import { Label } from "@/components/ui/label"; // Added Label
import { useToast } from '@/hooks/use-toast'; // Ensure this is the correct path
import { db } from '@/db';
import { EncryptionService } from '@/services/encryptionService';
import { useAppStore } from '@/store/appStore';
// Removed the redundant/commented out useEffect import from below

interface PinLockProps {
  onUnlockSuccess: () => void;
}

type PinLockMode = 'loading' | 'setup' | 'unlock';

export function PinLock({ onUnlockSuccess }: PinLockProps) {
  const [mode, setMode] = useState<PinLockMode>('loading');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState(''); // For setup mode
  const [apiKeyInput, setApiKeyInput] = useState(''); // For API key input in setup mode
  const [aiProvider, setAiProvider] = useState<string>('deepseek');
  const [aiBaseUrl, setAiBaseUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const unlockApp = useAppStore((state) => state.unlockApp);

  React.useEffect(() => { // Changed to React.useEffect to be explicit if default import is preferred for React
    const checkPinSetup = async () => {
      try {
        // We still check for encryptedApiKey to determine if setup has been done.
        // The specific provider details will be loaded during unlock or re-verified.
        const apiKeySetting = await db.appSettings.get('encryptedAiApiKey'); // Use new key name
        if (apiKeySetting && apiKeySetting.value) {
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
      // PIN length and match validation already handled by button's disabled state logic implicitly
      // but good to keep explicit checks too.
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

      const currentApiKey = apiKeyInput.trim();
      const currentBaseUrl = aiBaseUrl.trim();

      if (aiProvider !== 'ollama_local' && !currentApiKey) {
        setError(`API Key is required for ${aiProviderOptions.find(p => p.value === aiProvider)?.label || 'selected provider'}.`);
        toast({ title: 'Input Required', description: 'Please enter the API Key.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (aiProvider === 'ollama_local' && !currentBaseUrl) {
        setError('Base URL is required for Ollama (Local).');
        toast({ title: 'Input Required', description: 'Please enter the Ollama Base URL.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      try {
        // For Ollama, if no API key is used, we still encrypt a placeholder (like the provider name or an empty string)
        // to ensure the PIN verification mechanism works consistently. The actual API key field in the payload can be empty.
        const apiKeyToStore = aiProvider === 'ollama_local' ? '' : currentApiKey;
        const dataToEncrypt = { apiKey: apiKeyToStore, provider: aiProvider, baseUrl: currentBaseUrl, timestamp: new Date().toISOString() };
        const ciphertext = await EncryptionService.encryptData(dataToEncrypt, pin);

        if (ciphertext) {
          await db.transaction('rw', db.appSettings, async () => {
            await db.appSettings.put({ key: 'encryptedAiApiKey', value: ciphertext }); // Generic key name
            await db.appSettings.put({ key: 'currentAiProvider', value: aiProvider });
            if (aiProvider === 'ollama_local' && currentBaseUrl) {
              await db.appSettings.put({ key: 'aiServiceBaseUrl', value: currentBaseUrl });
            } else {
              // Remove or nullify if not needed to avoid stale data
              await db.appSettings.delete('aiServiceBaseUrl');
            }
            await db.appSettings.put({ key: 'pinLastSet', value: new Date().toISOString() });
          });

          unlockApp(apiKeyToStore, aiProvider, (aiProvider === 'ollama_local' ? currentBaseUrl : null));
          toast({ title: 'Success', description: 'PIN successfully set and application unlocked.' });
          onUnlockSuccess();
        } else {
          throw new Error('Encryption process failed during PIN setup.');
        }
      } catch (e: any) {
        console.error("PIN Setup Error:", e);
        setError(e.message || 'PIN setup failed. Please try again.');
        toast({ title: 'Error', description: e.message || 'PIN setup failed.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else if (mode === 'unlock') {
      setError('');
      try {
        const encryptedSetting = await db.appSettings.get('encryptedAiApiKey'); // Use new key name
        const providerSetting = await db.appSettings.get('currentAiProvider');
        const baseUrlSetting = await db.appSettings.get('aiServiceBaseUrl');

        const encryptedCiphertext = encryptedSetting?.value as string | undefined;

        if (!encryptedCiphertext) {
          console.warn('encryptedAiApiKey not found in unlock mode, switching to setup.');
          toast({ title: 'Setup Required', description: 'Please set up your PIN and AI provider.', variant: 'default' });
          setMode('setup');
          setLoading(false);
          return;
        }

        const decryptedPayload = await EncryptionService.decryptData(encryptedCiphertext, pin);

        // The payload now contains apiKey, provider, and baseUrl from the time of encryption
        if (decryptedPayload && typeof decryptedPayload.apiKey === 'string') {
          const storedProvider = providerSetting?.value as string || decryptedPayload.provider || 'deepseek'; // Fallback
          const storedBaseUrl = baseUrlSetting?.value as string || decryptedPayload.baseUrl || null; // Fallback

          unlockApp(decryptedPayload.apiKey, storedProvider, storedBaseUrl);
          toast({ title: 'Success!', description: 'Application unlocked.' });
          onUnlockSuccess();
        } else {
          setError('Invalid PIN. Please try again.');
          toast({ title: 'Unlock Failed', description: 'Invalid PIN entered.', variant: 'destructive' });
        }
      } catch (e: any) {
        // Catch any other errors during the process
        console.error("PIN Unlock Process Error:", e);
        setError('An unexpected error occurred during unlock.');
        toast({ title: 'Error', description: 'Unlock failed due to an unexpected error.', variant: 'destructive' });
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
            <>
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
              <div className="space-y-3">
                <div>
                  <Label htmlFor="aiProviderSelect">AI Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger id="aiProviderSelect" className="h-12">
                      <SelectValue placeholder="Select AI Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviderOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {aiProvider === 'ollama_local' && (
                  <div>
                    <Label htmlFor="aiBaseUrlInput">Ollama Base URL</Label>
                    <Input
                      id="aiBaseUrlInput"
                      type="text"
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                      placeholder="e.g., http://localhost:11434"
                      className="text-sm h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      Enter the base URL for your local Ollama service.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="apiKeyInput" className={aiProvider === 'ollama_local' ? 'sr-only' : ''}>API Key</Label>
                  {aiProvider !== 'ollama_local' && (
                    <Input
                      id="apiKeyInput"
                      type="password" // Masked, but user is pasting
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste API Key here"
                      className="text-sm h-12"
                    />
                  )}
                  {aiProvider !== 'ollama_local' && (
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      This key will be encrypted with your PIN and stored locally.
                    </p>
                  )}
                   {aiProvider === 'ollama_local' && (
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      Ollama (Local) typically does not require an API key. The Base URL is used.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full text-lg py-3 h-auto"
            disabled={
              loading ||
              pin.length < 4 ||
              (mode === 'setup' &&
                (confirmPin.length < 4 ||
                 (aiProvider !== 'ollama_local' && apiKeyInput.trim() === '') ||
                 (aiProvider === 'ollama_local' && aiBaseUrl.trim() === '')
                )
              )
            }
          >
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
