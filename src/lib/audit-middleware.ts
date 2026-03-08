/**
 * Dexie Audit Middleware (§19)
 * 
 * Intercepts ALL mutating operations (add, put, update, delete, bulkAdd, bulkPut, bulkDelete)
 * on every table and automatically writes an AuditLog entry — no manual calls needed in services.
 * 
 * Tables excluded from audit (too noisy): auditLogs itself, appSettings, globalSettings.
 * 
 * Usage: call installAuditMiddleware(db) once during app bootstrap (in main.tsx or db.ts).
 */

import type Dexie from 'dexie';

const EXCLUDED_TABLES = new Set(['auditLogs', 'appSettings', 'globalSettings']);

export function installAuditMiddleware(db: Dexie) {
  db.use({
    stack: 'dbcore',
    name: 'AuditMiddleware',
    create(downlevelDatabase) {
      return {
        ...downlevelDatabase,
        table(tableName: string) {
          const downlevelTable = downlevelDatabase.table(tableName);

          // Skip audit-log writes for excluded tables to prevent recursion / noise
          if (EXCLUDED_TABLES.has(tableName)) return downlevelTable;

          return {
            ...downlevelTable,

            // ── ADD ────────────────────────────────────────────────────────
            async add(req: any) {
              const result = await downlevelTable.add(req);
              try {
                const auditTable = downlevelDatabase.table('auditLogs');
                await auditTable.add({
                  req: {
                    type: 'add',
                    keys: [result],
                    values: [{ ...req.value }],
                    trans: req.trans,
                    wantResults: false,
                    putOrAdd: req.putOrAdd,
                  },
                });
              } catch {}
              return result;
            },

            // ── mutate (covers add, put, update, delete in modern Dexie core) ──
            async mutate(req: any) {
              const result = await downlevelTable.mutate(req);
              try {
                const logEntry = {
                  id: crypto.randomUUID(),
                  action: req.type,              // 'add' | 'put' | 'delete'
                  entity: tableName,
                  entityId: (req.keys?.[0] ?? req.values?.[0]?.id ?? null)?.toString(),
                  newValues: req.type !== 'delete' ? req.values?.[0] : undefined,
                  oldValues: undefined,           // Dexie core doesn't expose pre-read cheaply; skip
                  timestamp: new Date(),
                };
                // Write directly to avoid circular middleware invocation
                const auditTable = downlevelDatabase.table('auditLogs');
                await auditTable.mutate({
                  type: 'add',
                  keys: [logEntry.id],
                  values: [logEntry],
                  trans: req.trans,
                  wantResults: false,
                });
              } catch {
                // Never let audit failure break the real operation
              }
              return result;
            },
          };
        },
      };
    },
  });
}
