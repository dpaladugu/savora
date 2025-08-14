
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- AI Config Interface (used by PinLock and this store) ---
export interface DecryptedAiConfig {
  apiKey: string | null;
  provider: string | null;
  baseUrl: string | null;
  model?: string | null; // Added model
}

// --- App State (combining Auth, UI, and new AI Config) ---
interface AppState {
  isUnlocked: boolean;
  isAuthenticated: boolean; // Added missing property
  privacyMask: boolean; // Added missing property
  decryptedAiApiKey: string | null; // Stores the raw API key in memory after decryption
  currentAiProvider: string | null; // e.g., 'deepseek', 'ollama_local'
  aiServiceBaseUrl: string | null;  // For providers like Ollama
  currentAiModel: string | null;    // e.g., 'deepseek-chat', 'deepseek-coder'
  isLoadingGlobal: boolean;
}

interface AppActions {
  setDecryptedAiConfig: (config: DecryptedAiConfig) => void; // Config now includes model
  lockApp: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setPrivacyMask: (privacyMask: boolean) => void;
}

const initialState: AppState = {
  isUnlocked: false,
  isAuthenticated: false, // Initialize new property
  privacyMask: false, // Initialize new property
  decryptedAiApiKey: null,
  currentAiProvider: null,
  aiServiceBaseUrl: null,
  currentAiModel: null, // Initialize new state
  isLoadingGlobal: false,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({ // Added get for reading current state if needed inside actions
      ...initialState,
      setDecryptedAiConfig: (config) => {
        set({
          isUnlocked: true,
          isAuthenticated: true,
          decryptedAiApiKey: config.apiKey,
          currentAiProvider: config.provider,
          aiServiceBaseUrl: config.baseUrl,
          currentAiModel: config.model || null, // Set model, default to null
        });
      },
      lockApp: () => {
        set({
          isUnlocked: false,
          isAuthenticated: false,
          decryptedAiApiKey: null,
          currentAiProvider: null,
          aiServiceBaseUrl: null,
          currentAiModel: null, // Reset model on lock
        });
      },
      setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setPrivacyMask: (privacyMask) => set({ privacyMask }),
    }),
    {
      name: 'savora-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user's preferred provider and model if set
        currentAiProvider: state.currentAiProvider,
        currentAiModel: state.currentAiModel,
        privacyMask: state.privacyMask,
        // Do NOT persist isUnlocked, decryptedAiApiKey, or aiServiceBaseUrl (if it can be sensitive)
      }),
    }
  )
);

// --- Selectors with error handling ---
export const useIsUnlocked = () => {
  try {
    return useAppStore((state) => state.isUnlocked);
  } catch (error) {
    console.error('useIsUnlocked hook error:', error);
    return false; // Safe fallback
  }
};

export const useIsAuthenticated = () => {
  try {
    return useAppStore((state) => state.isAuthenticated);
  } catch (error) {
    console.error('useIsAuthenticated hook error:', error);
    return false; // Safe fallback
  }
};

export const usePrivacyMask = () => {
  try {
    return useAppStore((state) => state.privacyMask);
  } catch (error) {
    console.error('usePrivacyMask hook error:', error);
    return false; // Safe fallback
  }
};

export const useDecryptedAiConfigState = () => {
  try {
    return useAppStore((state) => ({ // Selector for the whole config object
      apiKey: state.decryptedAiApiKey,
      provider: state.currentAiProvider,
      baseUrl: state.aiServiceBaseUrl,
      model: state.currentAiModel,
    }));
  } catch (error) {
    console.error('useDecryptedAiConfigState hook error:', error);
    return { apiKey: null, provider: null, baseUrl: null, model: null };
  }
};

// Individual selectors can still be useful
export const useDecryptedApiKey = () => {
  try {
    return useAppStore((state) => state.decryptedAiApiKey);
  } catch (error) {
    console.error('useDecryptedApiKey hook error:', error);
    return null;
  }
};

export const useCurrentAiProvider = () => {
  try {
    return useAppStore((state) => state.currentAiProvider);
  } catch (error) {
    console.error('useCurrentAiProvider hook error:', error);
    return null;
  }
};

export const useAiServiceBaseUrl = () => {
  try {
    return useAppStore((state) => state.aiServiceBaseUrl);
  } catch (error) {
    console.error('useAiServiceBaseUrl hook error:', error);
    return null;
  }
};

export const useCurrentAiModel = () => {
  try {
    return useAppStore((state) => state.currentAiModel);
  } catch (error) {
    console.error('useCurrentAiModel hook error:', error);
    return null;
  }
};

export const useIsLoadingGlobal = () => {
  try {
    return useAppStore((state) => state.isLoadingGlobal);
  } catch (error) {
    console.error('useIsLoadingGlobal hook error:', error);
    return false;
  }
};
