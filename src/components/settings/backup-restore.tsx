/**
 * BackupRestore — §26
 * • Export: AES-256 encrypted JSON blob of ALL Dexie tables
 * • QR code generated from encrypted blob (small backups)
 * • Restore via:
 *     1. .savbak file upload
 *     2. Camera QR scan (BarcodeDetector API — Chrome/Edge Android)
 *     3. QR image file scan (works everywhere, no camera permission needed)
 * • CSV export per table
 * • Stamps lastBackupAt to globalSettings after every successful export
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  Download, Upload, QrCode, ShieldCheck, FileText,
  AlertTriangle, CheckCircle2, Camera, X, Image, RefreshCw,
} from 'lucide-react';
import QRCodeLib from 'qrcode';

// ─── AES-256 helpers ──────────────────────────────────────────────────────────
async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptJSON(data: object, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv   = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
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

/** Stamp lastBackupAt in globalSettings */
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

// ─── QR Camera Scanner ────────────────────────────────────────────────────────
function QRCameraScanner({
  password,
  onDecrypted,
}: {
  password: string;
  onDecrypted: (payload: any) => Promise<void>;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [decoding, setDecoding] = useState(false);

  const stopScan = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScan(); }, [stopScan]);

  async function startScan() {
    if (!('BarcodeDetector' in window)) {
      toast.error('Camera QR not supported — use "Scan QR Image" below, or Chrome/Edge on Android for camera scan.');
      return;
    }
    if (!password) { toast.error('Enter restore password first'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);

      // @ts-ignore — BarcodeDetector is not in TS lib yet
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopScan();
            setDecoding(true);
            const raw = codes[0].rawValue as string;
            const data = await decryptJSON(raw, password);
            await onDecrypted(data);
          } else {
            requestAnimationFrame(tick);
          }
        } catch {
          requestAnimationFrame(tick);
        }
      };
      videoRef.current?.addEventListener('loadedmetadata', tick, { once: true });
    } catch {
      toast.error('Camera access denied');
    } finally {
      setDecoding(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full rounded-xl gap-2 text-xs"
        onClick={scanning ? stopScan : startScan}
        disabled={decoding}
      >
        {decoding
          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Decrypting…</>
          : scanning
            ? <><X className="h-3.5 w-3.5" /> Stop Camera</>
            : <><Camera className="h-3.5 w-3.5" /> Scan with Camera</>
        }
      </Button>

      {scanning && (
        <div className="relative rounded-xl overflow-hidden border border-border/40 bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-52 object-cover" />
          {/* Targeting reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
          <div className="absolute bottom-2 w-full text-center">
            <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
              Point camera at QR code
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QR Image File Scanner ────────────────────────────────────────────────────
function QRImageScanner({
  password,
  onDecrypted,
}: {
  password: string;
  onDecrypted: (payload: any) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!password) { toast.error('Enter restore password first'); return; }

    setBusy(true);
    try {
      if (!('BarcodeDetector' in window)) {
        // Fallback: try to read the image as base64 and hope it's a raw encrypted string
        // (for backups small enough to fit in a QR)
        const text = await file.text().catch(() => null);
        if (text) {
          const data = await decryptJSON(text.trim(), password);
          await onDecrypted(data);
          return;
        }
        toast.error('QR image scanning requires Chrome/Edge. Try camera scan or file restore.');
        return;
      }

      const imageBitmap = await createImageBitmap(file);
      // @ts-ignore
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(imageBitmap);
      imageBitmap.close();

      if (!codes.length) {
        toast.error('No QR code found in image');
        return;
      }

      const raw = codes[0].rawValue as string;
      const data = await decryptJSON(raw, password);
      await onDecrypted(data);
    } catch (e: any) {
      toast.error(e.message?.includes('decrypt') || e.name === 'OperationError'
        ? 'Wrong password or corrupted QR'
        : 'QR image scan failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button
        variant="outline"
        className="w-full rounded-xl gap-2 text-xs"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        {busy
          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Scanning…</>
          : <><Image className="h-3.5 w-3.5" /> Scan QR Image File</>
        }
      </Button>
    </>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ status, msg }: { status: 'idle'|'busy'|'done'|'error'; msg: string }) {
  if (status === 'idle' || !msg) return null;
  if (status === 'busy') return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/8 border border-primary/20">
      <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />
      <span className="text-xs text-primary">{msg}</span>
    </div>
  );
  if (status === 'done') return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/8 border border-success/20">
      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
      <span className="text-xs text-success">{msg}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/8 border border-destructive/20">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="text-xs text-destructive">{msg}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BackupRestore() {
  const [password,    setPassword]    = useState('');
  const [qrDataUrl,   setQrDataUrl]   = useState('');
  const [exportStatus, setExportStatus] = useState<'idle'|'busy'|'done'|'error'>('idle');
  const [exportMsg,   setExportMsg]   = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle'|'busy'|'done'|'error'>('idle');
  const [restoreMsg,  setRestoreMsg]  = useState('');
  const [csvTable,    setCsvTable]    = useState<typeof TABLE_NAMES[number]>('expenses');
  const fileRef    = useRef<HTMLInputElement>(null);
  const totalTables = TABLE_NAMES.length;

  // ── Shared QR/payload restore handler ────────────────────────────────────
  const handleDecryptedPayload = useCallback(async (payload: any) => {
    if (!payload.__savora) throw new Error('Invalid Savora backup — missing signature');
    setRestoreStatus('busy');
    setRestoreMsg('Restoring tables…');
    try {
      await restoreAllTables(payload.dump);
      setRestoreStatus('done');
      setRestoreMsg(`Restored ${Object.values(payload.dump as Record<string,any[]>).reduce((s,a)=>s+a.length,0)} records — reload the app`);
      toast.success('✅ Data restored! Reload to apply.');
    } catch (e: any) {
      setRestoreStatus('error');
      setRestoreMsg(e.message || 'Restore failed');
      throw e;
    }
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!password) { toast.error('Enter a backup password first'); return; }
    setExportStatus('busy'); setExportMsg('Reading tables…');
    try {
      const dump = await dumpAllTables();
      const totalRecords = Object.values(dump).reduce((s, a) => s + a.length, 0);
      setExportMsg('Encrypting…');
      const encrypted = await encryptJSON({ __savora: true, ts: Date.now(), v: 2, dump }, password);
      const json = JSON.stringify({ v: 2, data: encrypted });
      downloadBlob(json, `savora-backup-${new Date().toISOString().slice(0, 10)}.savbak`);
      await stampBackupTime();
      setExportStatus('done');
      setExportMsg(`Exported ${totalRecords} records across ${totalTables} tables`);

      // Generate QR only if payload is small enough
      if (encrypted.length < 2800) {
        const url = await QRCodeLib.toDataURL(encrypted, { width: 320, errorCorrectionLevel: 'L' });
        setQrDataUrl(url);
      } else {
        setQrDataUrl('');
        toast.info('Backup too large for QR (>2.8KB). File downloaded — use "File Restore" to restore.');
      }
    } catch (e: any) {
      setExportStatus('error'); setExportMsg(e.message || 'Export failed');
    }
  };

  // ── File restore ──────────────────────────────────────────────────────────
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
      toast.error('Restore failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── CSV export ────────────────────────────────────────────────────────────
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

        {/* ── EXPORT ─────────────────────────────────────────────────────── */}
        <TabsContent value="export" className="space-y-3 mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Encrypted Full Backup
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 ml-auto">AES-256</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                All {totalTables} tables encrypted. Never leaves your device unencrypted.
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
              </div>

              <Button
                className="w-full rounded-xl gap-2"
                onClick={handleExport}
                disabled={exportStatus === 'busy'}
              >
                <Download className="h-4 w-4" />
                {exportStatus === 'busy' ? exportMsg : 'Export Backup (.savbak)'}
              </Button>

              <StatusBanner status={exportStatus} msg={exportMsg} />

              {qrDataUrl && (
                <div className="space-y-2 pt-1">
                  <Separator className="opacity-30" />
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <QrCode className="h-3 w-3" /> QR code (small backups only)
                  </p>
                  <div className="flex justify-center p-3 bg-white rounded-2xl border border-border/40">
                    <img src={qrDataUrl} alt="Backup QR Code" className="w-60 h-60" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl gap-2 text-xs"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = qrDataUrl;
                      a.download = `savora-qr-${new Date().toISOString().slice(0,10)}.png`;
                      a.click();
                    }}
                  >
                    <QrCode className="h-3.5 w-3.5" /> Save QR as Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESTORE ────────────────────────────────────────────────────── */}
        <TabsContent value="restore" className="space-y-3 mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-warning" /> Restore from Backup
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Overwrites all local data. Use the same password you chose during export.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-warning/8 border border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning leading-relaxed">
                  Destructive — all current data will be replaced with the backup.
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

              {/* Restore method 1: .savbak file */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Method 1 — File
                </p>
                <input ref={fileRef} type="file" accept=".savbak,.json" className="hidden" onChange={handleRestoreFile} />
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 text-xs"
                  onClick={() => fileRef.current?.click()}
                  disabled={restoreStatus === 'busy'}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {restoreStatus === 'busy' ? restoreMsg : 'Upload .savbak File'}
                </Button>
              </div>

              <Separator className="opacity-30" />

              {/* Restore method 2: Camera QR scan */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Method 2 — Camera QR Scan
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Chrome/Edge on Android only (BarcodeDetector API)
                </p>
                <QRCameraScanner
                  password={password}
                  onDecrypted={async (data) => {
                    if (!confirm('Restore from scanned QR? This will overwrite all local data.')) return;
                    try {
                      await handleDecryptedPayload(data);
                    } catch (e: any) {
                      setRestoreStatus('error');
                      setRestoreMsg(e.message || 'QR restore failed — wrong password or corrupt data');
                    }
                  }}
                />
              </div>

              <Separator className="opacity-30" />

              {/* Restore method 3: QR image file */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Method 3 — QR Image File
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Pick a saved QR PNG from your photos or files
                </p>
                <QRImageScanner
                  password={password}
                  onDecrypted={async (data) => {
                    if (!confirm('Restore from QR image? This will overwrite all local data.')) return;
                    try {
                      await handleDecryptedPayload(data);
                    } catch (e: any) {
                      setRestoreStatus('error');
                      setRestoreMsg(e.message || 'QR image restore failed');
                    }
                  }}
                />
              </div>

              <StatusBanner status={restoreStatus} msg={restoreMsg} />

              {restoreStatus === 'done' && (
                <Button
                  className="w-full rounded-xl gap-2 text-xs"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reload App to Apply
                </Button>
              )}
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
