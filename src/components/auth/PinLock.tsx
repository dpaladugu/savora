import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/db';
import { EncryptionService } from '@/services/encryptionService';
import { useAppStore } from '@/store/appStore';

interface PinLockProps {
  onUnlockSuccess: () => void;
}

type PinLockMode = 'loading' | 'setup' | 'unlock';

const aiProviderOptions = [
  { value: 'deepseek', label: 'DeepSeek API' },
  { value: 'groq', label: 'Groq API' },
  { value: 'ollama_local', label: 'Ollama (Local)' },
  { value: 'google_gemini', label: 'Google Gemini API' },
  // Add other providers here as needed, e.g.:
  // { value: 'openai', label: 'OpenAI API' },
];

export function PinLock({ onUnlockSuccess }: PinLockProps) {
  console.log("PinLock rendering/mounting."); // DEBUG LOG
  const [mode, setMode] = useState<PinLockMode>('loading');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiProvider, setAiProvider] = useState<string>(aiProviderOptions[0].value); // Default to first provider
  const [aiBaseUrl, setAiBaseUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setDecryptedAiConfig = useAppStore(state => state.setDecryptedAiConfig); // Select only the needed action


  useEffect(() => {
    console.log("PinLock: useEffect for checkPinSetup running. Current mode:", mode); // DEBUG LOG
    const checkPinSetup = async () => {
      console.log("PinLock: checkPinSetup called."); // DEBUG LOG
      try {
        const aiConfigSetting = await db.appSettings.get('encryptedAiConfig');
        if (aiConfigSetting && aiConfigSetting.value) {
          console.log("PinLock: Found existing encryptedAiConfig. Attempting to set mode to 'unlock'."); // DEBUG LOG
          const providerSetting = await db.appSettings.get('currentAiProvider');
          if (providerSetting?.value) {
            setAiProvider(providerSetting.value as string);
          }
          const baseUrlSetting = await db.appSettings.get('aiServiceBaseUrl');
          if (baseUrlSetting?.value) {
            setAiBaseUrl(baseUrlSetting.value as string);
          }
          setMode('unlock');
        } else {
          console.log("PinLock: No encryptedAiConfig found. Attempting to set mode to 'setup'."); // DEBUG LOG
          setMode('setup');
        }
      } catch (e) {
        console.error("PinLock: Error checking PIN setup:", e); // DEBUG LOG
        setError("Could not verify PIN status. Please refresh.");
        setMode('unlock'); // Default to unlock on error
      }
    };
    checkPinSetup();
  }, []); // Empty dependency array ensures this runs once on mount

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

    if (mode === 'setup') {
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
        const apiKeyToStore = (aiProvider === 'ollama_local' || !currentApiKey) ? '' : currentApiKey;
        const dataToEncrypt = {
          apiKey: apiKeyToStore,
          provider: aiProvider,
          baseUrl: (aiProvider === 'ollama_local') ? currentBaseUrl : '', // Store baseUrl only if ollama
          timestamp: new Date().toISOString()
        };
        const ciphertext = await EncryptionService.encryptData(dataToEncrypt, pin);

        if (ciphertext) {
          await db.transaction('rw', db.appSettings, async () => {
            await db.appSettings.put({ key: 'encryptedAiConfig', value: ciphertext }); // Store all config
            await db.appSettings.put({ key: 'currentAiProvider', value: aiProvider }); // Store for easy access
            if (aiProvider === 'ollama_local' && currentBaseUrl) {
              await db.appSettings.put({ key: 'aiServiceBaseUrl', value: currentBaseUrl });
            } else {
              await db.appSettings.delete('aiServiceBaseUrl');
            }
            await db.appSettings.put({ key: 'pinLastSet', value: new Date().toISOString() });
          });

          console.log("PinLock: Setup handleSubmit - Calling setDecryptedAiConfig with:", { apiKey: apiKeyToStore, provider: aiProvider, baseUrl: (aiProvider === 'ollama_local') ? currentBaseUrl : null }); // DEBUG LOG
          setDecryptedAiConfig({
            apiKey: apiKeyToStore,
            provider: aiProvider,
            baseUrl: (aiProvider === 'ollama_local') ? currentBaseUrl : null,
          });
          toast({ title: 'Success', description: 'PIN successfully set and application unlocked.' });
          onUnlockSuccess();
        } else {
          console.error("PinLock: Encryption process failed during PIN setup."); // DEBUG LOG
          throw new Error('Encryption process failed during PIN setup.');
        }
      } catch (err: any) {
        console.error("PIN Setup Error:", err);
        setError(err.message || 'PIN setup failed. Please try again.');
        toast({ title: 'Error', description: err.message || 'PIN setup failed.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    } else if (mode === 'unlock') {
      try {
        const encryptedSetting = await db.appSettings.get('encryptedAiConfig');
        const encryptedCiphertext = encryptedSetting?.value as string | undefined;

        if (!encryptedCiphertext) {
          console.warn('encryptedAiConfig not found in unlock mode, switching to setup.');
          toast({ title: 'Setup Required', description: 'Please set up your PIN and AI provider.', variant: 'default' });
          setMode('setup');
          setLoading(false);
          return;
        }

        const decryptedPayload = await EncryptionService.decryptData(encryptedCiphertext, pin);

        if (decryptedPayload && typeof decryptedPayload.apiKey === 'string' && decryptedPayload.provider) {
          console.log("PinLock: Unlock handleSubmit - Decryption successful. Calling setDecryptedAiConfig with:", decryptedPayload); // DEBUG LOG
           setDecryptedAiConfig({
            apiKey: decryptedPayload.apiKey,
            provider: decryptedPayload.provider,
            baseUrl: decryptedPayload.baseUrl || null,
          });
          toast({ title: 'Success!', description: 'Application unlocked.' });
          onUnlockSuccess();
        } else {
          console.warn("PinLock: Unlock handleSubmit - Decryption failed or payload malformed. Decrypted:", decryptedPayload); // DEBUG LOG
          setError('Invalid PIN or corrupted data. Please try again.');
          toast({ title: 'Unlock Failed', description: 'Invalid PIN or data corruption.', variant: 'destructive' });
        }
      } catch (err: any) {
        console.error("PIN Unlock Process Error:", err);
        setError('An unexpected error occurred during unlock.');
        toast({ title: 'Error', description: 'Unlock failed due to an unexpected error.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
  };

  if (mode === 'loading') {
    console.log("PinLock: Rendering Loading state. Current mode state:", mode); // DEBUG LOG
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  console.log(`PinLock: Rendering ${mode} mode form. Current mode state:`, mode); // DEBUG LOG
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-background dark:bg-slate-800/50 shadow-2xl rounded-xl border border-border/20 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <LockKeyhole className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground">
            {mode === 'setup' ? 'Set Up Security PIN & AI' : 'Enter Security PIN'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'setup'
              ? 'Secure your app and configure your AI provider.'
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
              <div className="space-y-4"> {/* Increased spacing */}
                <div>
                  <Label htmlFor="aiProviderSelect" className="mb-1 block">AI Provider</Label>
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
                    <Label htmlFor="aiBaseUrlInput" className="mb-1 block">Ollama Base URL</Label>
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

                {aiProvider !== 'ollama_local' && (
                  <div>
                    <Label htmlFor="apiKeyInput" className="mb-1 block">API Key</Label>
                    <Input
                      id="apiKeyInput"
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={`Paste ${aiProviderOptions.find(p=>p.value === aiProvider)?.label || ''} API Key`}
                      className="text-sm h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      This key will be encrypted with your PIN and stored locally.
                    </p>
                  </div>
                )}
                 {aiProvider === 'ollama_local' && (
                    <p className="text-sm text-muted-foreground mt-1 px-1">
                      Ollama (Local) typically does not require an API key. The Base URL is used.
                    </p>
                  )}
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
                (pin !== confirmPin || confirmPin.length <4 || // ensure confirmPin is also valid
                 (aiProvider !== 'ollama_local' && apiKeyInput.trim() === '') ||
                 (aiProvider === 'ollama_local' && aiBaseUrl.trim() === '')
                )
              )
            }
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'setup' ? 'Set PIN & Configure AI' : "Unlock"
            )}
          </Button>
        </form>
      </motion.div>
      <p className="text-xs text-muted-foreground mt-8">
        Your sensitive AI configuration is encrypted using this PIN and stored locally.
      </p>
    </div>
  );
}
