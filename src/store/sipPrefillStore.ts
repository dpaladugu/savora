/**
 * SIP Pre-fill Store
 * Two roles:
 *  1. `prefill` — pre-populates the RecurringTransactionForm (Smart Nudge → Start SIP)
 *  2. `goalIdForPlanner` — deep-links the SIP Planner to a specific goal
 *     (GoalsManager "Plan SIP" button → navigates to sip-planner module)
 */
import { create } from 'zustand';

export interface SIPPrefill {
  description: string;
  amount: number;
  category: string;
  frequency: 'monthly';
  type: 'expense';
  account?: string;
  goalName?: string; // for banner display
}

interface SIPPrefillState {
  prefill: SIPPrefill | null;
  setPrefill: (p: SIPPrefill | null) => void;
  clearPrefill: () => void;

  /** Goal ID to pre-select in the SIP Planner component */
  goalIdForPlanner: string | null;
  setGoalIdForPlanner: (id: string | null) => void;
  clearGoalIdForPlanner: () => void;
}

export const useSIPPrefillStore = create<SIPPrefillState>((set) => ({
  prefill: null,
  setPrefill: (p) => set({ prefill: p }),
  clearPrefill: () => set({ prefill: null }),

  goalIdForPlanner: null,
  setGoalIdForPlanner: (id) => set({ goalIdForPlanner: id }),
  clearGoalIdForPlanner: () => set({ goalIdForPlanner: null }),
}));
