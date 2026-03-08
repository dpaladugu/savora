/**
 * AuditLog — §19
 * Every create/update/delete recorded with entity, oldValues, newValues, role, deviceId.
 * Read-only UI accessible only to ADMIN.
 */
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRole } from '@/store/rbacStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Shield, Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLog } from '@/lib/db';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success/15 text-success border-success/30',
  update: 'bg-primary/15 text-primary border-primary/30',
  delete: 'bg-destructive/15 text-destructive border-destructive/30',
};

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const color = ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground border-border/50';

  return (
    <Card className="border-border/50">
      <CardContent className="py-2.5 px-3">
        <button
          className="w-full flex items-center gap-2 text-left"
          onClick={() => setExpanded(v => !v)}
        >
          <Badge className={`text-[10px] shrink-0 capitalize border ${color}`}>{log.action}</Badge>
          <span className="text-xs font-semibold text-foreground truncate flex-1">
            {log.entity ?? '—'}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{log.userId ?? 'GUEST'}</span>
          {expanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
        </button>
        {expanded && (log.oldValues || log.newValues) && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {log.oldValues && (
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Before</p>
                <pre className="text-[10px] text-foreground whitespace-pre-wrap font-mono overflow-auto max-h-32">
                  {JSON.stringify(log.oldValues, null, 2)}
                </pre>
              </div>
            )}
            {log.newValues && (
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">After</p>
                <pre className="text-[10px] text-foreground whitespace-pre-wrap font-mono overflow-auto max-h-32">
                  {JSON.stringify(log.newValues, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AuditLogViewer() {
  const role = useRole();
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const all = await db.auditLogs.orderBy('timestamp').reverse().toArray();
      setLogs(all);
    } catch { toast.error('Failed to load audit logs'); }
    setLoading(false);
  }

  async function clearLogs() {
    if (!confirm('Clear all audit logs? This cannot be undone.')) return;
    await db.auditLogs.clear();
    setLogs([]);
    toast.success('Audit logs cleared');
  }

  if (role !== 'ADMIN') {
    return (
      <div className="p-8 text-center space-y-2">
        <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Audit Log is restricted to ADMIN only.</p>
      </div>
    );
  }

  const filtered = logs.filter(l => {
    const matchAction = filterAction === 'all' || l.action === filterAction;
    const matchSearch = !search || (l.entity ?? '').toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Audit Log</h1>
          <p className="text-xs text-muted-foreground">{logs.length} events recorded</p>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive text-xs gap-1" onClick={clearLogs}>
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Filter by entity…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No audit events yet. Events are recorded automatically when you create, update, or delete records.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(log => <AuditRow key={log.id} log={log} />)}
        </div>
      )}
    </div>
  );
}

// ── Audit helpers (call these from services) ──────────────────────────────────
export async function auditLog(
  action: 'create' | 'update' | 'delete',
  entity: string,
  newValues?: any,
  oldValues?: any,
  role?: string,
) {
  try {
    await db.auditLogs.add({
      id:        crypto.randomUUID(),
      action,
      entity,
      timestamp: new Date(),
      userId:    role ?? 'GUEST',
      newValues,
      oldValues,
      deviceId:  navigator.userAgent.slice(0, 40),
    });
  } catch {
    // audit must never crash the main flow
  }
}
