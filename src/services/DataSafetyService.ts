/**
 * DataSafetyService — Phase 2
 * • Lightweight auto-backup to localStorage after writes (every 10th mutating db call)
 * • Monthly backup reminder check
 * • Tracks lastBackupAt in globalSettings
 */
import { db } from '@/lib/db';

const LS_WRITE_COUNT_KEY = 'savora_write_count';
const LS_LAST_BACKUP_KEY = 'savora_last_backup_at';
const AUTO_BACKUP_EVERY  = 10;   // trigger full dump every N writes
const REMINDER_DAYS      = 30;   // warn if no backup in N days

// ─── Write counter (lightweight, does NOT persist across sessions intentionally) ──
let _writeCount = 0;

export const DataSafetyService = {

  /** Call this after any mutating DB operation (add/put/update/delete). */
  async recordWrite(): Promise<void> {
    _writeCount++;
    const stored = parseInt(localStorage.getItem(LS_WRITE_COUNT_KEY) || '0', 10);
    const total  = stored + 1;
    localStorage.setItem(LS_WRITE_COUNT_KEY, String(total));

    if (total % AUTO_BACKUP_EVERY === 0) {
      await this.autoBackupToLocalStorage();
    }
  },

  /** Dumps all key tables into a compact localStorage JSON (non-encrypted, ~50 KB typical). */
  async autoBackupToLocalStorage(): Promise<void> {
    try {
      const tables = ['txns', 'expenses', 'incomes', 'goals', 'creditCards', 'investments', 'globalSettings'] as const;
      const dump: Record<string, any[]> = {};
      for (const t of tables) {
        try { dump[t] = await (db as any)[t].toArray(); } catch { dump[t] = []; }
      }
      const snapshot = {
        __savora_auto: true,
        ts: Date.now(),
        dump,
      };
      localStorage.setItem('savora_auto_backup', JSON.stringify(snapshot));
      localStorage.setItem(LS_LAST_BACKUP_KEY, String(Date.now()));

      // Persist timestamp to globalSettings too
      const s = await db.globalSettings.limit(1).first();
      if (s) await db.globalSettings.update(s.id, { lastBackupAt: Date.now() } as any);
    } catch (e) {
      console.warn('Auto-backup failed (non-critical):', e);
    }
  },

  /** Returns ms since last backup, or null if never backed up. */
  getLastBackupMs(): number | null {
    const v = localStorage.getItem(LS_LAST_BACKUP_KEY);
    return v ? Date.now() - parseInt(v, 10) : null;
  },

  /** Returns true if the user should be nudged to do a manual backup. */
  shouldNudgeBackup(): boolean {
    const ms = this.getLastBackupMs();
    if (ms === null) return false; // first time user — let them settle in
    return ms > REMINDER_DAYS * 24 * 60 * 60 * 1000;
  },

  /** Returns the last backup as a downloadable JSON blob (no encryption). */
  async exportAutoBackupBlob(): Promise<Blob | null> {
    const raw = localStorage.getItem('savora_auto_backup');
    if (!raw) return null;
    return new Blob([raw], { type: 'application/json' });
  },
};
