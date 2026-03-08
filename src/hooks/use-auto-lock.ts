/**
 * useAutoLock — idles-out the RBAC session after configurable minutes.
 * Listens to mousemove / keydown / touchstart / scroll to reset the timer.
 * When timer fires: clearSession() + toast "Session locked — values masked."
 */
import { useEffect, useRef, useCallback } from 'react';
import { useRBACStore, useRole } from '@/store/rbacStore';
import { toast } from 'sonner';

const EVENTS = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;
const DEFAULT_MINUTES = 5;

export function useAutoLock(autoLockMinutes: number = DEFAULT_MINUTES) {
  const role = useRole();
  const { clearSession } = useRBACStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    clearSession();
    toast.info('Session locked — values are masked.', { duration: 4000 });
  }, [clearSession]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Only arm timer when an active (non-GUEST) session exists
    if (role === 'GUEST') return;
    const ms = Math.max(1, autoLockMinutes) * 60 * 1000;
    timerRef.current = setTimeout(lock, ms);
  }, [role, autoLockMinutes, lock]);

  useEffect(() => {
    // Start timer on mount / role change
    resetTimer();

    EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [resetTimer]);
}
