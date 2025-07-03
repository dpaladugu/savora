import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Auth Slice ---
interface AuthState {
  isUnlocked: boolean; // True if PIN has been successfully entered
  decryptedAiApiKey: string | null; // Store decrypted API key in memory for the session
  currentAiProvider: string | null; // e.g., 'deepseek', 'groq', 'ollama_local'
  aiServiceBaseUrl: string | null; // Optional base URL for services like Ollama
  // userPINHash?: string; // For comparing PIN attempts if PIN is stored hashed (more advanced)
}

interface AuthActions {
  unlockApp: (apiKey: string, provider: string, baseUrl?: string) => void;
  lockApp: () => void;
  // setPINHash: (hash: string) => void; // For initial PIN setup
}

const initialAuthState: AuthState = {
  isUnlocked: false,
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
  // theme: 'light',
};

const createUiSlice = (set: any): UiState & UiActions => ({
  ...initialUiState,
  setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
  // toggleTheme: () => set((state: UiState) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
});


// --- Combined Store ---
// We can combine slices as the store grows. For now, let's export them separately or a combined one.
// Using persist middleware for parts of the store we might want to persist (e.g., user preferences, theme)
// For sensitive data like decryptedApiKey, persist should NOT be used directly.
// isUnlocked could be persisted to remember unlock status across page refreshes (session-like).

type AppState = AuthState & UiState;
type AppActions = AuthActions & UiActions;

export const useAppStore = create<AppState & AppActions>()(
  // Example of persisting part of the store - be careful with what you persist
  // For now, let's not persist auth-related sensitive runtime data like decryptedApiKey
  // isUnlocked might be okay to persist to keep the app unlocked across refreshes if desired.
  persist(
    (set, get) => ({
      ...initialAuthState, // This now includes currentAiProvider and aiServiceBaseUrl as null
      ...initialUiState,
      // Auth Actions
      unlockApp: (apiKey, provider, baseUrl) => set({
        isUnlocked: true,
        decryptedAiApiKey: apiKey,
        currentAiProvider: provider,
        aiServiceBaseUrl: baseUrl || null,
      }),
      lockApp: () => {
        set({
          isUnlocked: false,
          decryptedAiApiKey: null,
          currentAiProvider: null,
          aiServiceBaseUrl: null,
        });
        // Potentially clear other sensitive in-memory states here
      },
      // UI Actions
      setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
    }),
    {
      name: 'savora-app-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      partialize: (state) => ({
        // Only persist non-sensitive parts.
        // isUnlocked: state.isUnlocked, // Persisting isUnlocked can be a choice
        // currentAiProvider: state.currentAiProvider, // Persist provider choice
        // aiServiceBaseUrl: state.aiServiceBaseUrl, // Persist base URL if set
        // DO NOT persist decryptedAiApiKey
      }),
    }
  )
);

// Individual selectors for convenience
export const useIsUnlocked = () => useAppStore((state) => state.isUnlocked);
export const useDecryptedAiApiKey = () => useAppStore((state) => state.decryptedAiApiKey);
export const useCurrentAiProvider = () => useAppStore((state) => state.currentAiProvider);
export const useAiServiceBaseUrl = () => useAppStore((state) => state.aiServiceBaseUrl);
export const useIsLoadingGlobal = () => useAppStore((state) => state.isLoadingGlobal);

// Actions can be accessed directly from the store instance:
// const { unlockApp, lockApp, setGlobalLoading } = useAppStore.getState();

// Example of how PinLock might use it:
// const unlockAppAction = useAppStore((state) => state.unlockApp);
// if (decryptionSuccessful) {
//   unlockAppAction(decryptedKey, provider, baseUrl);
//   onUnlockSuccess();
// }

// Example of how AiChatService might use it:
// const { decryptedAiApiKey, currentAiProvider, aiServiceBaseUrl } = useAppStore.getState();
// if (!decryptedAiApiKey) { /* handle locked state */ }
// // Use these details to initialize the correct provider
//
// // Example of how App.tsx or Index.tsx might lock on session end / logout
// const lockAppAction = useAppStore((state) => state.lockApp);
// // onSignOut -> lockAppAction();

// Note: Storing the decrypted API key in Zustand state means it's in JavaScript memory.
// This is cleared on full page reload unless `isUnlocked` and the *encrypted* key are persisted,
// and decryption happens on app load after PIN.
// The `partialize` function in persist middleware is crucial for controlling what is stored.
// `decryptedAiApiKey` should NEVER be persisted.
// `currentAiProvider` and `aiServiceBaseUrl` could be persisted if desired, so the user doesn't
// have to re-select them on every session, only re-enter PIN to decrypt the key.
// For now, the partialize is commented out to default to not persisting these new fields either,
// meaning provider and base URL would need to be re-established via PinLock on each session start
// if the app is fully closed/reloaded. This can be adjusted based on desired UX.
