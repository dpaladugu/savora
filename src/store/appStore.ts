
import * as React from 'react';
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
}

const initialState: AppState = {
  isUnlocked: false,
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
        // console.log("appStore: setDecryptedAiConfig called with:", config);
        // console.log("appStore: Previous state - provider:", get().currentAiProvider, "model:", get().currentAiModel);
        set({
          isUnlocked: true,
          decryptedAiApiKey: config.apiKey,
          currentAiProvider: config.provider,
          aiServiceBaseUrl: config.baseUrl,
          currentAiModel: config.model || null, // Set model, default to null
        });
        // console.log("appStore: New state - provider:", get().currentAiProvider, "model:", get().currentAiModel);
      },
      lockApp: () => {
        // console.log("appStore: lockApp called");
        // console.log("appStore: Previous state - isUnlocked:", get().isUnlocked);
        set({
          isUnlocked: false,
          decryptedAiApiKey: null,
          currentAiProvider: null,
          aiServiceBaseUrl: null,
          currentAiModel: null, // Reset model on lock
        });
        // console.log("appStore: New state - isUnlocked:", get().isUnlocked);
      },
      setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
    }),
    {
      name: 'savora-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user's preferred provider and model if set
        currentAiProvider: state.currentAiProvider,
        currentAiModel: state.currentAiModel,
        // Do NOT persist isUnlocked, decryptedAiApiKey, or aiServiceBaseUrl (if it can be sensitive)
      }),
    }
  )
);

// --- Selectors ---
export const useIsUnlocked = () => useAppStore((state) => state.isUnlocked);
export const useDecryptedAiConfigState = () => useAppStore((state) => ({ // Selector for the whole config object
  apiKey: state.decryptedAiApiKey,
  provider: state.currentAiProvider,
  baseUrl: state.aiServiceBaseUrl,
  model: state.currentAiModel,
}));
// Individual selectors can still be useful
export const useDecryptedApiKey = () => useAppStore((state) => state.decryptedAiApiKey);
export const useCurrentAiProvider = () => useAppStore((state) => state.currentAiProvider);
export const useAiServiceBaseUrl = () => useAppStore((state) => state.aiServiceBaseUrl);
export const useCurrentAiModel = () => useAppStore((state) => state.currentAiModel); // New selector
export const useIsLoadingGlobal = () => useAppStore((state) => state.isLoadingGlobal);

// --- Actions can be accessed directly or via hooks ---
// const { setDecryptedAiConfig, lockApp } = useAppStore.getState();
// const setDecryptedAiConfig = useAppStore((state) => state.setDecryptedAiConfig);

// Notes:
// - The old `unlockApp(apiKey: string)` is replaced by `setDecryptedAiConfig`.
// - `lockApp` now also clears `currentAiProvider` and `aiServiceBaseUrl`.
// - The `persist` middleware is configured to be very conservative;
//   only `currentAiProvider` is suggested as potentially persistable.
//   `decryptedApiKey` and `aiServiceBaseUrl` (if it contains sensitive parts) should NOT be persisted.
//   `isUnlocked` is also not persisted by default, meaning PIN is required on each app load/refresh.
