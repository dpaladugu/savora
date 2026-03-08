/**
 * BackupRestore — §26
 * • Export: AES-256 encrypted .savbak file (all Dexie tables)
 * • Transfer to new device via file share (WhatsApp, AirDrop, USB, email)
 * • Restore: upload .savbak + password
 * • CSV export per table
 * • Stamps lastBackupAt to globalSettings after every successful export
 */
import React, { useRef, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download, Upload, ShieldCheck, FileText,
  AlertTriangle, CheckCircle2, RefreshCw, Smartphone,
  Share2, ArrowRight,
} from 'lucide-react';

// ─── AES-256 helpers ──────────────────────────────────────────────────────────
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptJSON(data: object, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const combined = new Uint8Array(salt.length + iv.length + ct.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ct), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptJSON(base64: string, password: string): Promise<any> {
  const raw  = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv   = raw.slice(16, 28);
  const ct   = raw.slice(28);
  const key  = await deriveKey(password, salt);
  const pt   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

// ─── ALL table names (v8 schema) ──────────────────────────────────────────────
const TABLE_NAMES = [
  'txns', 'rentalProperties', 'goals', 'vehicles', 'creditCards', 'loans',
  'insurance', 'tenants', 'investments', 'gold', 'subscriptions', 'emergencyFunds',
  'health', 'brotherRepayments', 'familyBankAccounts', 'familyTransfers',
  'auditLogs', 'globalSettings', 'expenses', 'incomes',
  'insurancePolicies', 'spendingLimits', 'willRows', 'digitalAssets',
  'recurringTransactions', 'gunturShops', 'waterfallProgress', 'gorantlaRooms',
  'pendingTxns', 'appSettings',
] as const;

async function dumpAllTables(): Promise<Record<string, any[]>> {
  const dump: Record<string, any[]> = {};
  for (const t of TABLE_NAMES) {
    try { dump[t] = await (db as any)[t].toArray(); }
    catch { dump[t] = []; }
  }
  return dump;
}

async function restoreAllTables(dump: Record<string, any[]>): Promise<void> {
  for (const t of TABLE_NAMES) {
    if (!Array.isArray(dump[t]) || !dump[t].length) continue;
    try {
      await (db as any)[t].clear();
      await (db as any)[t].bulkAdd(dump[t]);
    } catch (e) {
      console.warn(`[Restore] failed for ${t}:`, e);
    }
  }
}

async function stampBackupTime(): Promise<void> {
  try {
    const s = await db.globalSettings.limit(1).first();
    if (s) await db.globalSettings.update(s.id, { lastBackupAt: Date.now() } as any);
    localStorage.setItem('savora_last_backup_at', String(Date.now()));
  } catch { /* non-critical */ }
}

function tableToCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? v.toISOString() : String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')),
  ].join('\n');
}

function downloadBlob(content: string, filename: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ status, msg }: { status: 'idle'|'busy'|'done'|'error'; msg: string }) {
  if (status === 'idle' || !msg) return null;
  if (status === 'busy') return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
      <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />
      <span className="text-xs text-primary">{msg}</span>
    </div>
  );
  if (status === 'done') return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
      <span className="text-xs text-success">{msg}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="text-xs text-destructive">{msg}</span>
    </div>
  );
}

// ─── Transfer Steps ───────────────────────────────────────────────────────────
function TransferSteps() {
  const steps = [
    { icon: <Download className="h-4 w-4 text-primary" />, label: 'Export', desc: 'Create encrypted .savbak on this device' },
    { icon: <Share2 className="h-4 w-4 text-primary" />, label: 'Share', desc: 'Send via WhatsApp, AirDrop, email, or USB' },
    { icon: <Smartphone className="h-4 w-4 text-primary" />, label: 'Open', desc: 'Open Savora on the new device' },
    { icon: <Upload className="h-4 w-4 text-primary" />, label: 'Restore', desc: 'Upload .savbak + enter your password' },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        Device-to-Device Transfer Guide
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/40 border border-border/30 text-center">
            <div className="p-1.5 rounded-lg bg-primary/10">{s.icon}</div>
            <span className="text-[10px] font-semibold text-foreground">{s.label}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{s.desc}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-muted/30 border border-border/30">
        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Air-gapped & encrypted.</span>{' '}
          No server. No cloud. Your data never leaves your devices unencrypted.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BackupRestore() {
  const [password,      setPassword]      = useState('');
  const [exportStatus,  setExportStatus]  = useState<'idle'|'busy'|'done'|'error'>('idle');
  const [exportMsg,     setExportMsg]     = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle'|'busy'|'done'|'error'>('idle');
  const [restoreMsg,    setRestoreMsg]    = useState('');
  const [csvTable,      setCsvTable]      = useState<typeof TABLE_NAMES[number]>('expenses');
  const fileRef    = useRef<HTMLInputElement>(null);
  const totalTables = TABLE_NAMES.length;

  // ── Restore handler ────────────────────────────────────────────────────────
  const handleDecryptedPayload = useCallback(async (payload: any) => {
    if (!payload.__savora) throw new Error('Invalid Savora backup — missing signature');
    setRestoreStatus('busy');
    setRestoreMsg('Restoring tables…');
    await restoreAllTables(payload.dump);
    const total = Object.values(payload.dump as Record<string, any[]>).reduce((s, a) => s + a.length, 0);
    setRestoreStatus('done');
    setRestoreMsg(`Restored ${total} records — reload to apply`);
    toast.success('✅ Data restored! Reload to apply.');
  }, []);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!password) { toast.error('Enter a backup password first'); return; }
    setExportStatus('busy'); setExportMsg('Reading tables…');
    try {
      const dump = await dumpAllTables();
      const totalRecords = Object.values(dump).reduce((s, a) => s + a.length, 0);
      setExportMsg('Encrypting…');
      const encrypted = await encryptJSON({ __savora: true, ts: Date.now(), v: 2, dump }, password);
      const json = JSON.stringify({ v: 2, data: encrypted });
      const filename = `savora-backup-${new Date().toISOString().slice(0, 10)}.savbak`;
      downloadBlob(json, filename);
      await stampBackupTime();
      setExportStatus('done');
      setExportMsg(`✅ ${totalRecords} records across ${totalTables} tables — share the file to transfer`);
      toast.success(`Backup saved: ${filename}`);
    } catch (e: any) {
      setExportStatus('error'); setExportMsg(e.message || 'Export failed');
    }
  };

  // ── File restore ───────────────────────────────────────────────────────────
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!password) { toast.error('Enter backup password to decrypt'); return; }
    if (!confirm('This will OVERWRITE all local data. Continue?')) return;
    setRestoreStatus('busy'); setRestoreMsg('Reading file…');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setRestoreMsg('Decrypting…');
      const payload = await decryptJSON(parsed.data, password);
      await handleDecryptedPayload(payload);
    } catch (e: any) {
      setRestoreStatus('error');
      setRestoreMsg(e.message?.includes('signature') ? e.message : 'Restore failed — wrong password?');
      toast.error('Restore failed — check your password');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── CSV export ─────────────────────────────────────────────────────────────
  const handleCSVExport = async () => {
    try {
      const rows = await (db as any)[csvTable].toArray();
      if (!rows.length) { toast.info('No data in this table'); return; }
      downloadBlob(tableToCSV(rows), `${csvTable}-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      toast.success(`Exported ${rows.length} rows from ${csvTable}`);
    } catch { toast.error('CSV export failed'); }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid grid-cols-3 w-full rounded-2xl bg-muted/60 border border-border/40 p-1">
          <TabsTrigger value="export"  className="rounded-xl text-xs">Export</TabsTrigger>
          <TabsTrigger value="restore" className="rounded-xl text-xs">Restore</TabsTrigger>
          <TabsTrigger value="csv"     className="rounded-xl text-xs">CSV</TabsTrigger>
        </TabsList>

        {/* ── EXPORT ──────────────────────────────────────────────────────── */}
        <TabsContent value="export" className="space-y-3 mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Encrypted Full Backup
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 ml-auto">AES-256</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                All {totalTables} tables encrypted into a single <code className="text-[10px] bg-muted px-1 rounded">.savbak</code> file. Never leaves your device unencrypted.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Backup Password</Label>
                <Input
                  type="password"
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Remember this — you'll need it to restore on any device.</p>
              </div>

              <Button
                className="w-full rounded-xl gap-2"
                onClick={handleExport}
                disabled={exportStatus === 'busy'}
              >
                {exportStatus === 'busy'
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> {exportMsg}</>
                  : <><Download className="h-4 w-4" /> Export Backup (.savbak)</>
                }
              </Button>

              <StatusBanner status={exportStatus} msg={exportMsg} />

              {exportStatus === 'done' && (
                <>
                  <Separator className="opacity-30" />
                  <TransferSteps />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESTORE ─────────────────────────────────────────────────────── */}
        <TabsContent value="restore" className="space-y-3 mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-warning" /> Restore from Backup
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Upload a <code className="text-[10px] bg-muted px-1 rounded">.savbak</code> file and enter the password used during export.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-warning/10 border border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning leading-relaxed">
                  Destructive — all current data will be replaced with the backup contents.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Backup Password</Label>
                <Input
                  type="password"
                  placeholder="Password used during export"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <input ref={fileRef} type="file" accept=".savbak,.json" className="hidden" onChange={handleRestoreFile} />
              <Button
                className="w-full rounded-xl gap-2"
                onClick={() => fileRef.current?.click()}
                disabled={restoreStatus === 'busy'}
              >
                {restoreStatus === 'busy'
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> {restoreMsg}</>
                  : <><Upload className="h-4 w-4" /> Upload .savbak File</>
                }
              </Button>

              <StatusBanner status={restoreStatus} msg={restoreMsg} />

              {restoreStatus === 'done' && (
                <Button
                  className="w-full rounded-xl gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" /> Reload App to Apply
                </Button>
              )}

              <Separator className="opacity-30" />
              <TransferSteps />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CSV ─────────────────────────────────────────────────────────── */}
        <TabsContent value="csv" className="space-y-3 mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> CSV Table Export
              </CardTitle>
              <p className="text-xs text-muted-foreground">Export any single table as CSV for spreadsheet analysis.</p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Table</Label>
                <select
                  value={csvTable}
                  onChange={e => setCsvTable(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                >
                  {TABLE_NAMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Button className="w-full rounded-xl gap-2" onClick={handleCSVExport}>
                <Download className="h-4 w-4" /> Export {csvTable}.csv
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
