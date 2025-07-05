import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/db'; // For local Dexie storage
import { EncryptionService } from '@/services/encryptionService';
import { useAppStore } from '@/store/appStore'; // To update global state
import { PinEntryModal } from './pin-entry-modal'; // Import the PIN modal
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
import { useAuth } from '@/contexts/auth-context'; // To get current user ID

// Re-using the options from PinLock for consistency
const aiProviderOptions = [
  { value: 'deepseek', label: 'DeepSeek API' },
  { value: 'groq', label: 'Groq API' }, // Assuming Groq might be added later
  { value: 'ollama_local', label: 'Ollama (Local)' },
  { value: 'google_gemini', label: 'Google Gemini API' },
];

const deepSeekModels = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (General)' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder (Programming)' },
];
// Add other provider-specific models here if needed e.g.
// const groqModels = [ { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B'} ];

export function LLMSettingsForm() {
  const { toast } = useToast();
  // Ensure appStore's DecryptedAiConfig includes 'model'
  const { currentAiProvider, decryptedAiConfig, setDecryptedAiConfig } = useAppStore(state => ({
    currentAiProvider: state.currentAiProvider,
    decryptedAiConfig: state.decryptedAiConfig,
    setDecryptedAiConfig: state.setDecryptedAiConfig,
  }));
  const { user } = useAuth();

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [baseUrlInput, setBaseUrlInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(''); // New state for selected model

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [dataToSave, setDataToSave] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [isApiKeyCurrentlySet, setIsApiKeyCurrentlySet] = useState<boolean>(false); // Track if an API key is already configured

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      setIsConfigLoaded(false); // Ensure loading state is accurate

      if (!user) {
        // Attempt to load from Dexie if no user (e.g., initial load before auth context resolves, though unlikely here)
        // Or, more likely, auth hasn't kicked in yet or this screen is somehow shown pre-auth.
        // For robust multi-device sync, we primarily care about when user *is* present.
        // If user is null, it implies a state where synced settings aren't relevant yet.
        try {
          const localProvider = await db.appSettings.get('currentAiProvider');
          if (localProvider?.value) {
            setSelectedProvider(localProvider.value as string);
            if (localProvider.value === 'ollama_local') {
              const localBaseUrl = await db.appSettings.get('aiServiceBaseUrl');
              setBaseUrlInput(localBaseUrl?.value as string || '');
            }
            const localEncryptedConfig = await db.appSettings.get('encryptedAiConfig');
            setIsApiKeyCurrentlySet(!!localEncryptedConfig?.value);
          } else {
            setSelectedProvider(aiProviderOptions[0].value); // Default if nothing in Dexie
            setIsApiKeyCurrentlySet(false);
          }
        } catch (dexieError) {
          console.error("Error loading LLM settings from Dexie (no user):", dexieError);
          setSelectedProvider(aiProviderOptions[0].value); // Default
        } finally {
          setIsLoading(false);
          setIsConfigLoaded(true);
        }
        return;
      }

      // User is authenticated, try loading from Supabase first
      try {
        const { data: supabaseConfig, error: supabaseError } = await supabase
          .from('user_llm_configurations')
          // Add 'model_id' to select list
          .select('provider_id, encrypted_config, base_url, model_id')
          .eq('user_id', user.uid)
          .single();

        if (supabaseError && supabaseError.code !== 'PGRST116') { // PGRST116: 'No rows found'
          throw supabaseError;
        }

        if (supabaseConfig) {
          const provider = supabaseConfig.provider_id || aiProviderOptions[0].value;
          setSelectedProvider(provider);
          setBaseUrlInput(supabaseConfig.base_url || '');
          setIsApiKeyCurrentlySet(!!supabaseConfig.encrypted_config);
          // Set selected model based on provider and stored model_id
          if (provider === 'deepseek') {
            setSelectedModel(supabaseConfig.model_id || deepSeekModels[0].value);
          } else {
            setSelectedModel(''); // Reset if provider doesn't use this model list
          }

          // Update Dexie cache (Dexie doesn't store model_id directly, it's part of encryptedAiConfig)
          await db.transaction('rw', db.appSettings, async () => {
            await db.appSettings.put({ key: 'currentAiProvider', value: provider });
            if (supabaseConfig.encrypted_config) {
              await db.appSettings.put({ key: 'encryptedAiConfig', value: supabaseConfig.encrypted_config });
            } else {
              await db.appSettings.delete('encryptedAiConfig');
            }
            if (supabaseConfig.base_url && provider === 'ollama_local') {
              await db.appSettings.put({ key: 'aiServiceBaseUrl', value: supabaseConfig.base_url });
            } else {
              await db.appSettings.delete('aiServiceBaseUrl');
            }
          });
          // Decrypted config in Zustand is updated when PIN is entered or on app load by PinLock
          // Here we are just setting the form's display state.
        } else {
          // No config in Supabase, try Dexie as a fallback
          const localProviderSetting = await db.appSettings.get('currentAiProvider');
          const localEncryptedConfig = await db.appSettings.get('encryptedAiConfig');

          if (localProviderSetting?.value) {
            const localProvider = localProviderSetting.value as string;
            setSelectedProvider(localProvider);
            setIsApiKeyCurrentlySet(!!localEncryptedConfig?.value);
            if (localProvider === 'ollama_local') {
              const localBaseUrl = await db.appSettings.get('aiServiceBaseUrl');
              setBaseUrlInput(localBaseUrl?.value as string || '');
            }
            // Try to get model from decrypted config if available (e.g., from previous session)
            if (localProvider === 'deepseek' && decryptedAiConfig?.provider === 'deepseek') {
              setSelectedModel(decryptedAiConfig.model || deepSeekModels[0].value);
            } else {
              setSelectedModel('');
            }
          } else {
            setSelectedProvider(aiProviderOptions[0].value); // Default provider
            setIsApiKeyCurrentlySet(false);
            setSelectedModel(deepSeekModels[0].value); // Default model for default provider if it's deepseek
          }
        }
      } catch (error) {
        console.error("Error loading LLM settings:", error);
        toast({ title: "Error", description: "Could not load LLM settings from cloud. Displaying local cache if available.", variant: "destructive" });
        // Fallback to Dexie if Supabase fails for reasons other than 'no row'
        try {
          const localProvider = await db.appSettings.get('currentAiProvider');
          if (localProvider?.value) {
            setSelectedProvider(localProvider.value as string);
             if (localProvider.value === 'ollama_local') {
              const localBaseUrl = await db.appSettings.get('aiServiceBaseUrl');
              setBaseUrlInput(localBaseUrl?.value as string || '');
            }
            const localEncryptedConfig = await db.appSettings.get('encryptedAiConfig');
            setIsApiKeyCurrentlySet(!!localEncryptedConfig?.value);
          } else {
            setSelectedProvider(aiProviderOptions[0].value);
          }
        } catch (dexieError) {
          console.error("Error loading LLM settings from Dexie (after Supabase fail):", dexieError);
          setSelectedProvider(aiProviderOptions[0].value); // Final fallback
        }
      } finally {
        setIsLoading(false);
        setIsConfigLoaded(true);
      }
    };
    loadConfig();
  }, [user, toast]); // Depend on user to re-load if user context changes

  const performSave = async (pin: string) => {
    if (!dataToSave) return; // Should not happen if modal was triggered correctly

    setIsLoading(true);
    // dataToSave now includes 'model'
    const { provider, apiKey, baseUrl, model } = dataToSave;
    const isOllamaProvider = provider === 'ollama_local';

    if (!user) {
      toast({ title: "Error", description: "User not authenticated. Cannot save settings.", variant: "destructive" });
      setIsLoading(false);
      setIsPinModalOpen(false);
      return;
    }

    try {
      const configToUpsertSupabase: any = {
        user_id: user.uid,
        provider_id: provider,
        base_url: isOllamaProvider ? baseUrl : null,
        model_id: (provider === 'deepseek' && model) ? model : null, // Store model_id if deepseek
        encrypted_config: null,
      };

      // Logic for handling API key and encryption (remains largely the same)
      if (!apiKey && !isOllamaProvider) { // Clearing API key
        await db.transaction('rw', db.appSettings, async () => {
          await db.appSettings.put({ key: 'currentAiProvider', value: provider });
          await db.appSettings.delete('encryptedAiConfig');
          await db.appSettings.delete('aiServiceBaseUrl');
        });
      } else { // Setting/changing API key or Ollama (which doesn't use apiKey in encryption)
        // Ensure dataToEncrypt includes the model for all providers if set
        const dataToEncrypt = {
          apiKey: isOllamaProvider ? '' : apiKey,
          provider: provider, // Store provider in encrypted blob for consistency
          baseUrl: isOllamaProvider ? baseUrl : '', // Store baseUrl in encrypted blob
          model: model || null, // Store model in encrypted blob
          timestamp: new Date().toISOString()
        };

        const ciphertext = (isOllamaProvider || !apiKey) ? null : await EncryptionService.encryptData(dataToEncrypt, pin);

        if (!isOllamaProvider && apiKey && !ciphertext) {
          throw new Error("Encryption failed. Please check your PIN or try again.");
        }
        configToUpsertSupabase.encrypted_config = ciphertext;

        // Dexie update
        await db.transaction('rw', db.appSettings, async () => {
          if (ciphertext) {
            await db.appSettings.put({ key: 'encryptedAiConfig', value: ciphertext });
          } else {
            await db.appSettings.delete('encryptedAiConfig');
          }
          await db.appSettings.put({ key: 'currentAiProvider', value: provider });
          if (isOllamaProvider) {
            await db.appSettings.put({ key: 'aiServiceBaseUrl', value: baseUrl });
          } else {
            await db.appSettings.delete('aiServiceBaseUrl');
          }
          // Note: Dexie doesn't have a separate 'model' field; it's inside encryptedConfig
        });
      }

      // Upsert to Supabase
      const { error: supabaseError } = await supabase
        .from('user_llm_configurations')
        .upsert(configToUpsertSupabase, { onConflict: 'user_id' });

      if (supabaseError) {
        console.error("Supabase save error:", supabaseError);
        throw new Error(`Failed to save settings to cloud: ${supabaseError.message}`);
      }

      // Update Zustand store, now including model
      setDecryptedAiConfig({
        apiKey: isOllamaProvider ? null : apiKey,
        provider: provider,
        baseUrl: isOllamaProvider ? baseUrl : null,
        model: model || null, // Add model to Zustand store
      });
      setIsApiKeyCurrentlySet(!isOllamaProvider && !!apiKey);
      if (apiKey) setApiKeyInput('');

      toast({ title: "Settings Saved", description: "LLM configuration updated and synced." });

    } catch (error: any) {
      console.error("Error saving LLM settings:", error);
      toast({ title: "Error", description: `Could not save LLM settings: ${error.message}`, variant: "destructive" });
      throw error; // Re-throw to be caught by PinEntryModal if desired
    } finally {
      setIsLoading(false);
      setIsPinModalOpen(false); // Close modal regardless of success/failure here
      setDataToSave(null); // Clear temporary data
    }
  };

  const handleSaveSettings = () => {
    if (!selectedProvider) {
      toast({ title: "Error", description: "Please select an AI provider.", variant: "destructive" });
      return;
    }

    const isOllama = selectedProvider === 'ollama_local';
    const apiKeyToSave = apiKeyInput.trim();
    const baseUrlToSave = baseUrlInput.trim();

    if (isOllama && !baseUrlToSave) {
      toast({ title: "Error", description: "Please enter the Base URL for Ollama.", variant: "destructive" });
      return;
    }

    const newConfig = {
      provider: selectedProvider,
      apiKey: apiKeyToSave,
      baseUrl: baseUrlToSave,
      model: selectedModel, // Include selectedModel in the config to save
    };

    // If it's not Ollama and an API key is provided, or if an API key was set and now it's being cleared
    // for a cloud provider, then we need PIN.
    const needsPin = (!isOllama && apiKeyToSave) || (!isOllama && isApiKeyCurrentlySet && !apiKeyToSave);

    if (needsPin) {
      setDataToSave(newConfig);
      setIsPinModalOpen(true);
    } else {
      // No PIN needed (e.g. setting Ollama, or changing provider to Ollama from nothing,
      // or changing provider from cloud to cloud without changing key - though this path is less common without re-encrypt)
      // This direct save path without PIN is primarily for Ollama or clearing config IF no API key was involved.
      // For simplicity here, we assume if no API key is being *set*, and it's not Ollama, it means clearing.
      // A more robust check for "clearing an existing encrypted key" would be better.

      // Let's refine: if it's not Ollama and no API key is input, and no key was set, just save provider.
      // If it's not Ollama and no API key is input, BUT a key WAS set, this is a "clear" operation, needs PIN.
      // The `needsPin` logic above covers the "setting a new key" and "clearing an existing key".
      // So, if `needsPin` is false, it means:
      // 1. Setting Ollama (baseUrlToSave might be empty or not, handled by validation)
      // 2. Changing to a cloud provider WITHOUT providing an API key AND no API key was previously set.
      // 3. (Less likely) Switching between cloud providers without changing the key (not handled by this simple form)

      if(isOllama){
         setDataToSave(newConfig); // Store data
         performSave("DUMMY_PIN_FOR_OLLAMA_OR_NO_KEY_SAVE"); // Ollama doesn't need PIN for its data, but service expects it.
                                                        // Or if we're just saving the provider choice without a key.
      } else if (!apiKeyToSave && !isApiKeyCurrentlySet) {
        // Cloud provider selected, no new API key, no old API key. Just save provider preference.
         setDataToSave({ ...newConfig, apiKey: '' }); // Ensure API key is empty string
         performSave("DUMMY_PIN_FOR_OLLAMA_OR_NO_KEY_SAVE");
      } else {
         // This case should ideally be covered by needsPin, but as a fallback:
         toast({title: "Info", description: "No changes requiring PIN detected for this configuration."});
      }
    }
  };

  if (!isConfigLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
          <CardDescription>Manage your Large Language Model provider and API settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Configuration</CardTitle>
        <CardDescription>
          Manage your Large Language Model provider and API settings. API keys are encrypted and stored locally.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="aiProviderSelect">AI Provider</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger id="aiProviderSelect">
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

        {/* Conditional Model Selection for DeepSeek */}
        {selectedProvider === 'deepseek' && (
          <div className="space-y-2">
            <Label htmlFor="deepseekModelSelect">DeepSeek Model</Label>
            <Select value={selectedModel || deepSeekModels[0].value} onValueChange={setSelectedModel}>
              <SelectTrigger id="deepseekModelSelect">
                <SelectValue placeholder="Select DeepSeek Model" />
              </SelectTrigger>
              <SelectContent>
                {deepSeekModels.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedProvider === 'ollama_local' && (
          <div className="space-y-2">
            <Label htmlFor="ollamaBaseUrl">Ollama Base URL</Label>
            <Input
              id="ollamaBaseUrl"
              type="text"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              placeholder="e.g., http://localhost:11434"
            />
            <p className="text-xs text-muted-foreground">
              Enter the base URL for your local Ollama service.
            </p>
          </div>
        )}

        {selectedProvider && selectedProvider !== 'ollama_local' && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={isApiKeyCurrentlySet && !apiKeyInput ? "API Key is set (Enter new key to change)" : `Enter ${aiProviderOptions.find(p => p.value === selectedProvider)?.label || ''} API Key`}
            />
             {isApiKeyCurrentlySet && !apiKeyInput && (
                <p className="text-xs text-muted-foreground">
                    An API key is currently set. To change it, enter a new key. To clear it, leave this field blank and save (you will be prompted for your PIN).
                </p>
            )}
             {!isApiKeyCurrentlySet && (
                <p className="text-xs text-muted-foreground">
                    Enter your API key. It will be encrypted with your PIN.
                </p>
            )}
          </div>
        )}
        {/* Message for when Ollama is selected (no API key needed) */}
        {selectedProvider && selectedProvider === 'ollama_local' && (
             <p className="text-sm text-muted-foreground">
                Ollama (Local) uses a Base URL and does not require an API key.
             </p>
        )}
        {/* Message for when no provider is selected (should ideally not happen if defaulted) */}
         {!selectedProvider && (
            <p className="text-sm text-muted-foreground">
                Please select an AI provider to see configuration options.
            </p>
        )}

      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isLoading || !selectedProvider}>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : null}
          Save Configuration
        </Button>
      </CardFooter>

      <PinEntryModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setDataToSave(null); // Clear data if modal is cancelled
        }}
        onSubmit={performSave}
        title="Confirm AI Configuration"
        description="Please enter your application PIN to encrypt and save your AI settings."
      />
    </Card>
  );
}
