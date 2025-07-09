import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/db';
import { EncryptionService } from '@/services/encryptionService';
import { useAppStore } from '@/store/appStore';
import { PinEntryModal } from './pin-entry-modal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';

const aiProviderOptions = [
  { value: 'deepseek', label: 'DeepSeek API' },
  { value: 'groq', label: 'Groq API' },
  { value: 'ollama_local', label: 'Ollama (Local)' },
  { value: 'google_gemini', label: 'Google Gemini API' },
];

const deepSeekModels = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (General)' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder (Programming)' },
];

// Default model for Ollama if none is specified by user (can be overridden in form)
const OLLAMA_DEFAULT_FORM_MODEL = 'llama2';

export function LLMSettingsForm() {
  const { toast } = useToast();
  const { decryptedAiConfig, setDecryptedAiConfig } = useAppStore(state => ({
    decryptedAiConfig: state.decryptedAiConfig,
    setDecryptedAiConfig: state.setDecryptedAiConfig,
  }));
  const { user } = useAuth();

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [baseUrlInput, setBaseUrlInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [useLocalLLM, setUseLocalLLM] = useState<boolean>(false);

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [dataToSave, setDataToSave] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [isApiKeyCurrentlySet, setIsApiKeyCurrentlySet] = useState<boolean>(false);

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      setIsConfigLoaded(false);

      let initialProvider = aiProviderOptions[0].value;
      let initialBaseUrl = '';
      let initialModel = '';
      let initialUseLocalLLM = false;
      let initialApiKeySet = false;

      if (!user) { // No user, load from Dexie only
        try {
          const settings = await db.appSettings.bulkGet(['currentAiProvider', 'useLocalLLM', 'aiServiceBaseUrl', 'encryptedAiConfig']);
          const providerSetting = settings[0];
          const useLocalLLMSetting = settings[1];
          const baseUrlSetting = settings[2];
          const encryptedConfigSetting = settings[3];

          if (providerSetting?.value) initialProvider = providerSetting.value as string;
          initialUseLocalLLM = useLocalLLMSetting?.value === true;
          initialApiKeySet = !!encryptedConfigSetting?.value;

          if (initialUseLocalLLM || initialProvider === 'ollama_local') {
            initialProvider = 'ollama_local';
            initialUseLocalLLM = true;
            initialBaseUrl = baseUrlSetting?.value as string || '';
            // For model, if Ollama, try to get from decrypted store, else default form model for Ollama
            if (decryptedAiConfig?.provider === 'ollama_local' && decryptedAiConfig.model) {
                initialModel = decryptedAiConfig.model;
            } else {
                initialModel = OLLAMA_DEFAULT_FORM_MODEL;
            }
          } else if (initialProvider === 'deepseek') {
            // If Deepseek, try to get from decrypted store, else default deepseek model
             if (decryptedAiConfig?.provider === 'deepseek' && decryptedAiConfig.model) {
                initialModel = decryptedAiConfig.model;
            } else {
                initialModel = deepSeekModels[0].value;
            }
          }

        } catch (dexieError) {
          console.error("Error loading LLM settings from Dexie (no user):", dexieError);
        }
      } else { // User is authenticated
        try {
          const { data: supabaseConfig, error: supabaseError } = await supabase
            .from('user_llm_configurations')
            .select('provider_id, encrypted_config, base_url, model_id')
            .eq('user_id', user.uid)
            .single();

          if (supabaseError && supabaseError.code !== 'PGRST116') throw supabaseError;

          if (supabaseConfig) {
            initialProvider = supabaseConfig.provider_id || initialProvider;
            initialBaseUrl = supabaseConfig.base_url || '';
            initialApiKeySet = !!supabaseConfig.encrypted_config;
            initialUseLocalLLM = initialProvider === 'ollama_local';
            initialModel = supabaseConfig.model_id || ''; // Load model_id from Supabase

            if(initialUseLocalLLM && !initialModel) initialModel = OLLAMA_DEFAULT_FORM_MODEL;
            if(initialProvider === 'deepseek' && !initialModel) initialModel = deepSeekModels[0].value;

          } else { // No config in Supabase, try Dexie
             const settings = await db.appSettings.bulkGet(['currentAiProvider', 'useLocalLLM', 'aiServiceBaseUrl', 'encryptedAiConfig']);
            const providerSetting = settings[0];
            const useLocalLLMSetting = settings[1];
            const baseUrlSetting = settings[2];
            const encryptedConfigSetting = settings[3];

            if (providerSetting?.value) initialProvider = providerSetting.value as string;
            initialUseLocalLLM = useLocalLLMSetting?.value === true;
            initialApiKeySet = !!encryptedConfigSetting?.value;

            if (initialUseLocalLLM || initialProvider === 'ollama_local') {
                initialProvider = 'ollama_local';
                initialUseLocalLLM = true;
                initialBaseUrl = baseUrlSetting?.value as string || '';
                 if (decryptedAiConfig?.provider === 'ollama_local' && decryptedAiConfig.model) {
                    initialModel = decryptedAiConfig.model;
                } else {
                    initialModel = OLLAMA_DEFAULT_FORM_MODEL;
                }
            } else if (initialProvider === 'deepseek') {
                 if (decryptedAiConfig?.provider === 'deepseek' && decryptedAiConfig.model) {
                    initialModel = decryptedAiConfig.model;
                } else {
                    initialModel = deepSeekModels[0].value;
                }
            }
          }
        } catch (error) {
          console.error("Error loading LLM settings (with user):", error);
          toast({ title: "Error", description: "Cloud sync for LLM settings failed. Using local cache.", variant: "destructive" });
          // Fallback to Dexie
          const settings = await db.appSettings.bulkGet(['currentAiProvider', 'useLocalLLM', 'aiServiceBaseUrl', 'encryptedAiConfig']);
          const providerSetting = settings[0];
          const useLocalLLMSetting = settings[1];
          const baseUrlSetting = settings[2];
          const encryptedConfigSetting = settings[3];

          if (providerSetting?.value) initialProvider = providerSetting.value as string;
          initialUseLocalLLM = useLocalLLMSetting?.value === true;
          initialApiKeySet = !!encryptedConfigSetting?.value;

          if (initialUseLocalLLM || initialProvider === 'ollama_local') {
              initialProvider = 'ollama_local';
              initialUseLocalLLM = true;
              initialBaseUrl = baseUrlSetting?.value as string || '';
              if (decryptedAiConfig?.provider === 'ollama_local' && decryptedAiConfig.model) {
                  initialModel = decryptedAiConfig.model;
              } else {
                  initialModel = OLLAMA_DEFAULT_FORM_MODEL;
              }
          } else if (initialProvider === 'deepseek') {
              if (decryptedAiConfig?.provider === 'deepseek' && decryptedAiConfig.model) {
                  initialModel = decryptedAiConfig.model;
              } else {
                  initialModel = deepSeekModels[0].value;
              }
          }
        }
      }

      setSelectedProvider(initialProvider);
      setBaseUrlInput(initialBaseUrl);
      setSelectedModel(initialModel);
      setUseLocalLLM(initialUseLocalLLM);
      setIsApiKeyCurrentlySet(initialApiKeySet);

      setIsLoading(false);
      setIsConfigLoaded(true);
    };
    loadConfig();
  }, [user?.uid, toast]); // Removed decryptedAiConfig from deps to avoid re-triggering on its own update

  const performSave = async (pin: string) => {
    if (!dataToSave) return;

    setIsLoading(true);
    const { provider, apiKey, baseUrl, model, useLocalLLMFlag } = dataToSave;

    const actualProviderToSave = useLocalLLMFlag ? 'ollama_local' : provider;
    const isActualOllama = actualProviderToSave === 'ollama_local';
    // Model to save: if it's Ollama, use the model from form; if Deepseek, use model from form; else null
    const modelToSaveForSupabase =
        isActualOllama ? model :
        actualProviderToSave === 'deepseek' ? model :
        null;

    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      setIsLoading(false); setIsPinModalOpen(false); return;
    }

    try {
      const configToUpsertSupabase: any = {
        user_id: user.uid,
        provider_id: actualProviderToSave,
        base_url: isActualOllama ? baseUrl : null,
        model_id: modelToSaveForSupabase,
        encrypted_config: null,
      };

      if (!apiKey && !isActualOllama && !useLocalLLMFlag) { // Clearing API key for a cloud provider
        await db.transaction('rw', db.appSettings, async () => {
          await db.appSettings.put({ key: 'currentAiProvider', value: actualProviderToSave });
          await db.appSettings.delete('encryptedAiConfig'); // Clear encrypted blob
          if (!isActualOllama) await db.appSettings.delete('aiServiceBaseUrl');
          await db.appSettings.put({ key: 'useLocalLLM', value: false }); // Explicitly false
        });
        configToUpsertSupabase.encrypted_config = null; // Ensure it's null for Supabase
      } else {
        const dataToEncrypt = {
          apiKey: isActualOllama ? '' : apiKey, // Don't encrypt API key for Ollama
          provider: actualProviderToSave,
          baseUrl: isActualOllama ? baseUrl : '',
          model: model || null, // Always include model in encrypted blob
          timestamp: new Date().toISOString()
        };

        const ciphertext = (isActualOllama || !apiKey) ? null : await EncryptionService.encryptData(dataToEncrypt, pin);

        if (!isActualOllama && apiKey && !ciphertext) {
          throw new Error("Encryption failed.");
        }
        configToUpsertSupabase.encrypted_config = ciphertext;

        await db.transaction('rw', db.appSettings, async () => {
          if (ciphertext) {
            await db.appSettings.put({ key: 'encryptedAiConfig', value: ciphertext });
          } else {
             // If no ciphertext (Ollama or clearing API key for cloud provider if API key field was empty but not explicitly clearing an old one)
            await db.appSettings.delete('encryptedAiConfig');
          }
          await db.appSettings.put({ key: 'currentAiProvider', value: actualProviderToSave });
          if (isActualOllama) {
            await db.appSettings.put({ key: 'aiServiceBaseUrl', value: baseUrl });
          } else {
            await db.appSettings.delete('aiServiceBaseUrl');
          }
          await db.appSettings.put({ key: 'useLocalLLM', value: useLocalLLMFlag });
        });
      }

      const { error: supabaseError } = await supabase
        .from('user_llm_configurations')
        .upsert(configToUpsertSupabase, { onConflict: 'user_id' });

      if (supabaseError) throw new Error(`Cloud sync failed: ${supabaseError.message}`);

      setDecryptedAiConfig({ // Update Zustand store
        apiKey: isActualOllama ? null : apiKey,
        provider: actualProviderToSave,
        baseUrl: isActualOllama ? baseUrl : null,
        model: model || null,
      });
      setIsApiKeyCurrentlySet(!isActualOllama && !!apiKey);
      if (apiKey && !isActualOllama) setApiKeyInput('');

      toast({ title: "Settings Saved", description: "LLM configuration updated and synced." });

    } catch (error: any) {
      toast({ title: "Error", description: `Save failed: ${error.message}`, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false); setIsPinModalOpen(false); setDataToSave(null);
    }
  };

  const handleSaveSettings = () => {
    const effectiveProvider = useLocalLLM ? 'ollama_local' : selectedProvider;

    if (!effectiveProvider) {
        toast({ title: "Validation Error", description: "Please select or enable an AI provider.", variant: "destructive" });
        return;
    }

    const isOllamaEffective = effectiveProvider === 'ollama_local';
    const apiKeyToSave = apiKeyInput.trim();
    const baseUrlToSave = baseUrlInput.trim();
    const modelToSave = selectedModel.trim();


    if (isOllamaEffective && !baseUrlToSave) {
      toast({ title: "Validation Error", description: "Ollama Base URL is required.", variant: "destructive" }); return;
    }
    if (isOllamaEffective && !modelToSave) {
      toast({ title: "Validation Error", description: "Ollama Model Name is required.", variant: "destructive" }); return;
    }
    if (effectiveProvider === 'deepseek' && !modelToSave) {
      toast({ title: "Validation Error", description: "DeepSeek Model is required.", variant: "destructive" }); return;
    }
    // Note: API key is not strictly "required" if one is already set and user doesn't want to change it.
    // The `needsPin` logic handles when encryption/re-encryption is necessary.

    const newConfig = {
      provider: effectiveProvider,
      apiKey: apiKeyToSave,
      baseUrl: baseUrlToSave,
      model: modelToSave,
      useLocalLLMFlag: useLocalLLM,
    };

    const needsPin = (!isOllamaEffective && apiKeyToSave) || (!isOllamaEffective && isApiKeyCurrentlySet && !apiKeyToSave);

    if (needsPin) {
      setDataToSave(newConfig);
      setIsPinModalOpen(true);
    } else {
      // This path is for:
      // 1. Ollama configuration (always, as API key isn't encrypted via PIN in the same way)
      // 2. Cloud provider selected, but no NEW API key entered AND no API key was previously set.
      //    (Essentially just saving provider preference without key)
      // 3. Cloud provider selected, no NEW API key, but one IS set (this means no change to encrypted key)
      if (isOllamaEffective || (!apiKeyToSave && !isApiKeyCurrentlySet) || (!apiKeyToSave && isApiKeyCurrentlySet) ) {
         setDataToSave(newConfig);
         performSave("DUMMY_PIN_FOR_NON_SENSITIVE_SAVE");
      } else {
         // This case should ideally not be reached if logic is correct
         toast({title: "Info", description: "No changes requiring PIN detected, or API key unchanged."});
      }
    }
  };

  const handleUseLocalLLMChange = (checked: boolean) => {
    setUseLocalLLM(checked);
    if (checked) {
      setSelectedProvider('ollama_local');
      setSelectedModel(baseUrlInput ? selectedModel || OLLAMA_DEFAULT_FORM_MODEL : OLLAMA_DEFAULT_FORM_MODEL); // Keep existing if baseUrl is set, else default
    } else {
      const firstCloudProvider = aiProviderOptions.find(p => p.value !== 'ollama_local')?.value || aiProviderOptions[0].value;
      setSelectedProvider(firstCloudProvider);
      if (firstCloudProvider === 'deepseek') {
        setSelectedModel(decryptedAiConfig?.provider === 'deepseek' && decryptedAiConfig.model ? decryptedAiConfig.model : deepSeekModels[0].value);
      } else {
        setSelectedModel('');
      }
    }
  };

  if (!isConfigLoaded) {
    return (
      <Card><CardHeader><CardTitle>LLM Configuration</CardTitle><CardDescription>Manage your LLM provider and API settings.</CardDescription></CardHeader>
        <CardContent><div className="flex items-center justify-center h-24"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>LLM Configuration</CardTitle><CardDescription>Manage your LLM provider and API settings. API keys are encrypted with your PIN and stored locally and synced if cloud backup is enabled.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 border-b pb-4">
          <div className="flex items-center justify-between">
            <div><Label htmlFor="useLocalLLMSwitch" className="text-base font-semibold">Use Local LLM Provider (Ollama)</Label>
              <p className="text-xs text-muted-foreground">Overrides cloud provider selection if enabled.</p>
            </div>
            <Switch id="useLocalLLMSwitch" checked={useLocalLLM} onCheckedChange={handleUseLocalLLMChange} aria-label="Toggle local LLM provider"/>
          </div>
        </div>

        {!useLocalLLM && (
          <div className="space-y-2">
            <Label htmlFor="aiProviderSelect">Cloud AI Provider</Label>
            <Select value={selectedProvider} onValueChange={provider => {
                setSelectedProvider(provider);
                if(provider === 'deepseek') setSelectedModel(deepSeekModels[0].value); else setSelectedModel('');
            }}>
              <SelectTrigger id="aiProviderSelect" aria-required={!useLocalLLM}><SelectValue placeholder="Select Cloud AI Provider" /></SelectTrigger>
              <SelectContent>
                {aiProviderOptions.filter(p => p.value !== 'ollama_local').map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedProvider === 'deepseek' && !useLocalLLM && (
          <div className="space-y-2">
            <Label htmlFor="deepseekModelSelect">DeepSeek Model</Label>
            <Select value={selectedModel || deepSeekModels[0].value} onValueChange={setSelectedModel}>
              <SelectTrigger id="deepseekModelSelect" aria-required={selectedProvider === 'deepseek' && !useLocalLLM}>
                <SelectValue placeholder="Select DeepSeek Model" />
              </SelectTrigger>
              <SelectContent>{deepSeekModels.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        )}

        {(useLocalLLM || selectedProvider === 'ollama_local') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ollamaBaseUrl">Ollama Base URL</Label>
              <Input id="ollamaBaseUrl" aria-required={useLocalLLM || selectedProvider === 'ollama_local'} type="text" value={baseUrlInput} onChange={(e) => setBaseUrlInput(e.target.value)} placeholder="e.g., http://localhost:11434"/>
              <p className="text-xs text-muted-foreground">Enter the base URL for your local Ollama service.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ollamaModelName">Ollama Model Name</Label>
              <Input id="ollamaModelName" aria-required={useLocalLLM || selectedProvider === 'ollama_local'} type="text" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} placeholder="e.g., llama2, mistral, codellama"/>
              <p className="text-xs text-muted-foreground">Enter the name of the model to use with Ollama (must be pulled locally).</p>
            </div>
          </>
        )}

        {selectedProvider && !useLocalLLM && selectedProvider !== 'ollama_local' && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key ({aiProviderOptions.find(p=>p.value === selectedProvider)?.label})</Label>
            <Input id="apiKey" aria-required={selectedProvider && !useLocalLLM && selectedProvider !== 'ollama_local'} type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder={isApiKeyCurrentlySet && !apiKeyInput ? "API Key is set (Enter new to change or blank to clear)" : `Enter API Key`}/>
            {isApiKeyCurrentlySet && !apiKeyInput && (<p className="text-xs text-muted-foreground">An API key is currently set. To change it, enter a new key. To clear it, leave this field blank and save (PIN required).</p>)}
            {!isApiKeyCurrentlySet && (<p className="text-xs text-muted-foreground">Enter your API key. It will be encrypted with your PIN.</p>)}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isLoading || (!useLocalLLM && !selectedProvider) || (useLocalLLM && (!baseUrlInput.trim() || !selectedModel.trim()))}>
          {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
          Save Configuration
        </Button>
      </CardFooter>

      <PinEntryModal isOpen={isPinModalOpen} onClose={() => { setIsPinModalOpen(false); setDataToSave(null); }} onSubmit={performSave} title="Confirm AI Configuration" description="Please enter your application PIN to encrypt and save your AI settings."/>
    </Card>
  );
}
