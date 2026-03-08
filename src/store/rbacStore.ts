// RBAC Role System — Passphrase-based, no cloud, IndexedDB-persisted
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppRole = 'ADMIN' | 'SPOUSE' | 'BROTHER' | 'GUEST';

export interface RoleSession {
  role: AppRole;
  name: string;
  expiresAt: number; // timestamp ms
}

interface RBACState {
  session: RoleSession | null;
  setSession: (session: RoleSession | null) => void;
  clearSession: () => void;
  isExpired: () => boolean;
}

// Passphrase → Role map. In production these would be hashed.
// They are stored in GlobalSettings.revealSecret + role-specific phrases.
export const ROLE_PASSPHRASES: Record<string, AppRole> = {
  // These are defaults — overridden by GlobalSettings
  'savora-admin': 'ADMIN',
  'himabindu': 'SPOUSE',
  'brother-us': 'BROTHER',
};

export const ROLE_NAMES: Record<AppRole, string> = {
  ADMIN: 'Admin (Full Access)',
  SPOUSE: 'Himabindu',
  BROTHER: 'Brother (US)',
  GUEST: 'Guest',
};

/** 
 * Session TTL: 8 hours for ADMIN/SPOUSE, 4 hours for BROTHER
 */
export function getSessionTTL(role: AppRole): number {
  return role === 'BROTHER' ? 4 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
}

export const useRBACStore = create<RBACState>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      isExpired: () => {
        const { session } = get();
        if (!session) return true;
        return Date.now() > session.expiresAt;
      },
    }),
    {
      name: 'savora-rbac-session',
      storage: createJSONStorage(() => sessionStorage), // Session-only, cleared on tab close
      partialize: (state) => ({ session: state.session }),
    }
  )
);

// Role-based visibility rules
export const ROLE_PERMISSIONS = {
  ADMIN: {
    showSalary: true,
    showInvestments: true,
    showBrotherUS: true,
    showHyderabadHealth: true,
    showGorantlaRentals: true,
    showGunturWaterfall: true,
    showUSDSandbox: false,
  },
  SPOUSE: {
    showSalary: false,
    showInvestments: false,
    showBrotherUS: false,
    showHyderabadHealth: true,
    showGorantlaRentals: true,
    showGunturWaterfall: true,
    showUSDSandbox: false,
  },
  BROTHER: {
    showSalary: false,
    showInvestments: false,
    showBrotherUS: true,
    showHyderabadHealth: false,
    showGorantlaRentals: false,
    showGunturWaterfall: false,
    showUSDSandbox: true,
  },
  GUEST: {
    showSalary: false,
    showInvestments: false,
    showBrotherUS: false,
    showHyderabadHealth: false,
    showGorantlaRentals: false,
    showGunturWaterfall: false,
    showUSDSandbox: false,
  },
};

export function useRole(): AppRole {
  const { session, isExpired } = useRBACStore();
  if (!session || isExpired()) return 'GUEST';
  return session.role;
}

export function usePermissions() {
  const role = useRole();
  return ROLE_PERMISSIONS[role];
}
