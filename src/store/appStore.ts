import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- AI Config Interface (used by PinLock and this store) ---
export interface DecryptedAiConfig {
  apiKey: string | null;
  provider: string | null;
  baseUrl: string | null;
}

// --- App State (combining Auth, UI, and new AI Config) ---
interface AppState {
  isUnlocked: boolean;
  decryptedApiKey: string | null;
  currentAiProvider: string | null;
  aiServiceBaseUrl: string | null;
  isLoadingGlobal: boolean;
}

interface AppActions {
  setDecryptedAiConfig: (config: DecryptedAiConfig) => void;
  lockApp: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
}

const initialState: AppState = {
  isUnlocked: false,
  decryptedApiKey: null,
  currentAiProvider: null, // Default to null or a sensible default like 'deepseek'
  aiServiceBaseUrl: null,
  decryptedAiApiKey: null,
  currentAiProvider: null,
  aiServiceBaseUrl: null,
};

// createAuthSlice is not directly used when defining the store like this,
// but the logic is incorporated into the main create function.
// If we were to split into actual slices, it would be:
/*
const createAuthSlice = (set: any): AuthState & AuthActions => ({
  ...initialAuthState,
  unlockApp: (apiKey, provider, baseUrl) => set({
    isUnlocked: true,
    decryptedAiApiKey: apiKey,
    currentAiProvider: provider,
    aiServiceBaseUrl: baseUrl || null
  }),
  lockApp: () => set({
    isUnlocked: false,
    decryptedAiApiKey: null,
    currentAiProvider: null,
    aiServiceBaseUrl: null
  }),
});
*/


// --- UI Slice ---
interface UiState {
  isLoadingGlobal: boolean;
  // theme: 'light' | 'dark'; // Theme is currently handled by ThemeContext, can be moved here if needed
}

interface UiActions {
  setGlobalLoading: (isLoading: boolean) => void;
  // toggleTheme: () => void;
}

const initialUiState: UiState = {
  isLoadingGlobal: false,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,
      setDecryptedAiConfig: (config) => set({
        isUnlocked: true,
        decryptedApiKey: config.apiKey,
        currentAiProvider: config.provider,
        aiServiceBaseUrl: config.baseUrl,
      }),
      lockApp: () => set({
        isUnlocked: false,
        decryptedApiKey: null,
        currentAiProvider: null, // Reset AI config on lock
        aiServiceBaseUrl: null,
      }),
      setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
    }),
    {
      name: 'savora-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only non-sensitive data.
        // `currentAiProvider` might be okay to persist if user preference.
        // `isUnlocked` could be persisted for session convenience if desired, but requires re-auth logic.
        // For now, to be safe, not persisting these auth/session related states.
        // Only persist things like theme or other non-sensitive UI preferences if added.
        // Example: theme: state.theme (if theme was part of this store)
        // currentAiProvider: state.currentAiProvider, // Persist preferred provider
      }),
    }
  )
);

// --- Selectors ---
export const useIsUnlocked = () => useAppStore((state) => state.isUnlocked);
export const useDecryptedApiKey = () => useAppStore((state) => state.decryptedApiKey);
export const useCurrentAiProvider = () => useAppStore((state) => state.currentAiProvider);
export const useAiServiceBaseUrl = () => useAppStore((state) => state.aiServiceBaseUrl);
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
