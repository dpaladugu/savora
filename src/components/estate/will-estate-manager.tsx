import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, FileText, Shield, Key, AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import type { WillRow, DigitalAsset } from '@/lib/db';

// ── helpers ──────────────────────────────────────────────────────────────────
function uid() { return crypto.randomUUID(); }
function now() { return new Date(); }

const BENEFICIARIES = ['Spouse (Himabindu)', 'Self', 'Mother', 'Grandmother', 'Brother', 'Charitable Trust', 'Other'];
const ASSET_TYPES   = ['Email/Social', 'Bank Login', 'Investment Portal', 'Crypto Wallet', 'Password Manager', 'Domain/Website', 'Cloud Storage', 'Streaming', 'Other'];

// ── Will Row Form ─────────────────────────────────────────────────────────────
function WillRowForm({ initial, onSave, onClose }: {
  initial?: Partial<WillRow>;
  onSave: (r: WillRow) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    assetDescription: initial?.assetDescription ?? '',
    assetType:        initial?.assetType ?? 'Property',
    beneficiary:      initial?.beneficiary ?? '',
    percentage:       initial?.percentage ?? 100,
    notes:            initial?.notes ?? '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.assetDescription.trim() || !form.beneficiary.trim()) {
      toast.error('Asset description and beneficiary are required');
      return;
    }
    onSave({
      id:               initial?.id ?? uid(),
      assetDescription: form.assetDescription.trim(),
      assetType:        form.assetType,
      beneficiary:      form.beneficiary.trim(),
      percentage:       Number(form.percentage),
      notes:            form.notes.trim(),
      createdAt:        initial?.createdAt ?? now(),
      updatedAt:        now(),
    });
    onClose();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Asset / Property Description</Label>
        <Input placeholder="e.g. Guntur Plot, SBI FD, LIC Policy" value={form.assetDescription} onChange={e => set('assetDescription', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Asset Type</Label>
          <Select value={form.assetType} onValueChange={v => set('assetType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Property', 'Bank Account', 'Investment', 'Insurance', 'Vehicle', 'Gold / Jewelry', 'Other'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Beneficiary</Label>
          <Select value={form.beneficiary} onValueChange={v => set('beneficiary', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {BENEFICIARIES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Share % (if split)</Label>
        <Input type="number" min={1} max={100} value={form.percentage} onChange={e => set('percentage', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Any specific instructions…" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Digital Asset Form ────────────────────────────────────────────────────────
function DigitalAssetForm({ initial, onSave, onClose }: {
  initial?: Partial<DigitalAsset>;
  onSave: (a: DigitalAsset) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    type:                initial?.type ?? 'Email/Social',
    name:                initial?.name ?? '',
    loginUrl:            initial?.loginUrl ?? '',
    username:            initial?.username ?? '',
    storageLocation:     initial?.storageLocation ?? '',
    nominee:             initial?.nominee ?? '',
    accessInstructions:  initial?.accessInstructions ?? '',
    notes:               initial?.notes ?? '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    onSave({
      id:                  initial?.id ?? uid(),
      type:                form.type,
      name:                form.name.trim(),
      loginUrl:            form.loginUrl.trim() || undefined,
      username:            form.username.trim() || undefined,
      storageLocation:     form.storageLocation.trim(),
      nominee:             form.nominee.trim(),
      accessInstructions:  form.accessInstructions.trim(),
      notes:               form.notes.trim() || undefined,
      createdAt:           initial?.createdAt ?? now(),
      updatedAt:           now(),
    });
    onClose();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Name / Platform</Label>
          <Input placeholder="e.g. Gmail, Zerodha, MetaMask" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Username / Email</Label>
          <Input placeholder="login email or username" value={form.username} onChange={e => set('username', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>URL</Label>
          <Input placeholder="https://…" value={form.loginUrl} onChange={e => set('loginUrl', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Nominee (who inherits)</Label>
          <Select value={form.nominee} onValueChange={v => set('nominee', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {BENEFICIARIES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Password / Key Location</Label>
          <Input placeholder="e.g. Encrypted vault, Safe" value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Access Instructions</Label>
        <Textarea placeholder="Steps for nominee to gain access…" rows={2} value={form.accessInstructions} onChange={e => set('accessInstructions', e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function WillEstateManager() {
  const [willRows, setWillRows]       = useState<WillRow[]>([]);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading]         = useState(true);
  const [willDialog, setWillDialog]   = useState(false);
  const [assetDialog, setAssetDialog] = useState(false);
  const [editWill, setEditWill]       = useState<WillRow | undefined>();
  const [editAsset, setEditAsset]     = useState<DigitalAsset | undefined>();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [w, d] = await Promise.all([db.willRows.toArray(), db.digitalAssets.toArray()]);
      setWillRows(w);
      setDigitalAssets(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveWillRow(row: WillRow) {
    await db.willRows.put(row);
    toast.success('Will entry saved');
    load();
  }

  async function deleteWillRow(id: string) {
    await db.willRows.delete(id);
    toast.success('Entry deleted');
    load();
  }

  async function saveDigitalAsset(asset: DigitalAsset) {
    await db.digitalAssets.put(asset);
    toast.success('Digital asset saved');
    load();
  }

  async function deleteDigitalAsset(id: string) {
    await db.digitalAssets.delete(id);
    toast.success('Asset deleted');
    load();
  }

  const totalPct = willRows.reduce((s, r) => s + r.percentage, 0);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Will &amp; Estate</h1>
          <p className="text-xs text-muted-foreground">Asset distribution + digital legacy</p>
        </div>
      </div>

      {/* nudge if no will */}
      {willRows.length === 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-4 pb-4">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning">No will entries found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add beneficiary allocations for your key assets to protect your family.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="will">
        <TabsList className="w-full">
          <TabsTrigger value="will" className="flex-1 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Will Rows ({willRows.length})
          </TabsTrigger>
          <TabsTrigger value="digital" className="flex-1 gap-1.5">
            <Key className="h-3.5 w-3.5" />
            Digital Assets ({digitalAssets.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Will Rows Tab ─────────────────────────────────────────── */}
        <TabsContent value="will" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Total allocated: <span className={`font-bold ${totalPct === 100 ? 'text-success' : 'text-warning'}`}>{totalPct}%</span>
              {totalPct === 100 && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1 text-success" />}
            </p>
            <Dialog open={willDialog} onOpenChange={v => { setWillDialog(v); if (!v) setEditWill(undefined); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" onClick={() => setEditWill(undefined)}>
                  <Plus className="h-3.5 w-3.5" /> Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editWill ? 'Edit Will Entry' : 'New Will Entry'}</DialogTitle></DialogHeader>
                <WillRowForm initial={editWill} onSave={saveWillRow} onClose={() => setWillDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {willRows.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">No entries yet. Add your first asset allocation.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {willRows.map(row => (
                <Card key={row.id} className="border-border/60">
                  <CardContent className="py-3 px-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{row.assetDescription}</p>
                      <p className="text-xs text-muted-foreground">{row.assetType}</p>
                      {row.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{row.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-xs">{row.beneficiary}</Badge>
                      <span className="text-xs font-bold text-primary">{row.percentage}%</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditWill(row); setWillDialog(true); }}>
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteWillRow(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Digital Assets Tab ────────────────────────────────────── */}
        <TabsContent value="digital" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{digitalAssets.length} digital assets documented</p>
            <Dialog open={assetDialog} onOpenChange={v => { setAssetDialog(v); if (!v) setEditAsset(undefined); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" onClick={() => setEditAsset(undefined)}>
                  <Plus className="h-3.5 w-3.5" /> Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editAsset ? 'Edit Digital Asset' : 'New Digital Asset'}</DialogTitle></DialogHeader>
                <DigitalAssetForm initial={editAsset} onSave={saveDigitalAsset} onClose={() => setAssetDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {digitalAssets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">No digital assets yet. Document accounts your family may need access to.</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {digitalAssets.map(asset => (
                <Card key={asset.id} className="border-border/60">
                  <CardContent className="py-3 px-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Key className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground leading-tight">{asset.name}</p>
                        <Badge variant="outline" className="text-[10px]">{asset.type}</Badge>
                      </div>
                      {asset.username && <p className="text-xs text-muted-foreground">@{asset.username}</p>}
                      {asset.storageLocation && <p className="text-xs text-muted-foreground/70">🔑 {asset.storageLocation}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {asset.nominee && <Badge variant="secondary" className="text-xs">{asset.nominee}</Badge>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditAsset(asset); setAssetDialog(true); }}>
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteDigitalAsset(asset.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
