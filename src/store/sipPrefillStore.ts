/**
 * SIP Pre-fill Store
 * Used by SmartNudgeEngine to pass a pre-filled payload to RecurringTransactionsPage
 * when the user taps "Start SIP →" on a nudge card.
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
}

export const useSIPPrefillStore = create<SIPPrefillState>((set) => ({
  prefill: null,
  setPrefill: (p) => set({ prefill: p }),
  clearPrefill: () => set({ prefill: null }),
}));
