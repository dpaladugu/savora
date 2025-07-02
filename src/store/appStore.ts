import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Auth Slice ---
interface AuthState {
  isUnlocked: boolean; // True if PIN has been successfully entered
  decryptedApiKey: string | null; // Store decrypted API key in memory for the session
  // userPINHash?: string; // For comparing PIN attempts if PIN is stored hashed (more advanced)
}

interface AuthActions {
  unlockApp: (apiKey: string) => void;
  lockApp: () => void;
  // setPINHash: (hash: string) => void; // For initial PIN setup
}

const initialAuthState: AuthState = {
  isUnlocked: false,
  decryptedApiKey: null,
};

const createAuthSlice = (set: any): AuthState & AuthActions => ({
  ...initialAuthState,
  unlockApp: (apiKey) => set({ isUnlocked: true, decryptedApiKey: apiKey }),
  lockApp: () => set({ isUnlocked: false, decryptedApiKey: null }),
  // setPINHash: (hash) => set({ userPINHash: hash }),
});


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
      ...initialAuthState,
      ...initialUiState,
      // Auth Actions
      unlockApp: (apiKey) => set({ isUnlocked: true, decryptedApiKey: apiKey }),
      lockApp: () => {
        set({ isUnlocked: false, decryptedApiKey: null });
        // Potentially clear other sensitive in-memory states here
      },
      // UI Actions
      setGlobalLoading: (isLoading) => set({ isLoadingGlobal: isLoading }),
    }),
    {
      name: 'savora-app-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      partialize: (state) => ({
        // Only persist non-sensitive parts if needed, e.g.,
        // isUnlocked: state.isUnlocked
        // theme: state.theme
      }),
    }
  )
);

// Individual selectors for convenience (optional, but good practice)
export const useIsUnlocked = () => useAppStore((state) => state.isUnlocked);
export const useDecryptedApiKey = () => useAppStore((state) => state.decryptedApiKey);
export const useIsLoadingGlobal = () => useAppStore((state) => state.isLoadingGlobal);

// Actions can be accessed directly from the store instance:
// const { unlockApp, lockApp, setGlobalLoading } = useAppStore.getState();
// Or from the hook:
// const unlockApp = useAppStore((state) => state.unlockApp);

// Example of how PinLock might use it:
// const unlockAppAction = useAppStore((state) => state.unlockApp);
// if (decryptionSuccessful) {
//   unlockAppAction(decryptedKeyFromEncryptionService);
//   onUnlockSuccess();
// }

// Example of how DeepseekAiService might use it:
// const apiKey = useAppStore.getState().decryptedApiKey;
// if (!apiKey) { /* handle locked state */ }
// // Use apiKey in fetch call
//
// // Example of how App.tsx or Index.tsx might lock on session end / logout
// const lockAppAction = useAppStore((state) => state.lockApp);
// // onSignOut -> lockAppAction();

// Note: Storing the decrypted API key in Zustand state means it's in JavaScript memory.
// This is generally safer than localStorage for sensitive session data, but it's cleared on full page reload
// unless `isUnlocked` and the *encrypted* key are persisted, and decryption happens on app load after PIN.
// The current persist middleware example is basic and would need careful thought for what to persist.
// For now, `decryptedApiKey` will be lost on refresh, requiring PIN re-entry, which is a secure default.
// The `unlockApp` action now takes the key to store it.
// `lockApp` clears it.
