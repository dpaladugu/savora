/**
 * GoldTracker — live Dexie useLiveQuery, current market price input,
 * unrealised gain/loss, and full CRUD.
 */
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Gold } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Coins, RefreshCw } from 'lucide-react';

const PURITY_MULTIPLIER: Record<string, number> = {
  '24K': 1.0, '22K': 22 / 24, '20K': 20 / 24, '18K': 18 / 24,
};

const FORMS = ['Jewelry', 'Coin', 'Bar', 'Biscuit', 'SGB', 'ETF'] as const;
const PURITY = ['24K', '22K', '20K', '18K'] as const;

const emptyForm = {
  form: 'Jewelry' as string,
  description: '',
  grossWeight: '',
  netWeight: '',
  purity: '22K' as string,
  purchasePrice: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  merchant: '',
  familyMember: '',
};

// Default gold prices per gram (approximate)
const DEFAULT_PRICE_24K = 9500; // ₹/g for 24K

export function GoldTracker() {
  const gold = useLiveQuery(
    () => db.gold.toArray().catch(() => []),
    []
  ) ?? [];

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [livePrice, setLivePrice] = useState<string>(String(DEFAULT_PRICE_24K));

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const livePriceNum = parseFloat(livePrice) || DEFAULT_PRICE_24K;

  // ── Compute portfolio value ────────────────────────────────────────────────
  const portfolio = useMemo(() => {
    return gold.map(g => {
      const netW    = g.netWeight ?? g.weight ?? 0;
      const mult    = PURITY_MULTIPLIER[String(g.purity) + 'K'] ?? PURITY_MULTIPLIER['22K'];
      const curVal  = netW * mult * livePriceNum;
      const buyVal  = g.purchasePrice ?? 0;
      const gain    = curVal - buyVal;
      const gainPct = buyVal > 0 ? (gain / buyVal) * 100 : 0;
      return { ...g, curVal, buyVal, gain, gainPct, netW };
    });
  }, [gold, livePriceNum]);

  const totalCurVal  = portfolio.reduce((s, g) => s + g.curVal, 0);
  const totalBuyVal  = portfolio.reduce((s, g) => s + g.buyVal, 0);
  const totalGain    = totalCurVal - totalBuyVal;
  const totalGainPct = totalBuyVal > 0 ? (totalGain / totalBuyVal) * 100 : 0;
  const totalGrams   = portfolio.reduce((s, g) => s + g.netW, 0);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (g: Gold) => {
    setEditId(g.id);
    setForm({
      form: (g as any).form ?? 'Jewelry',
      description: (g as any).description ?? '',
      grossWeight: String((g as any).grossWeight ?? g.weight ?? ''),
      netWeight: String(g.netWeight ?? g.weight ?? ''),
      purity: String(g.purity).replace('K', '') + 'K',
      purchasePrice: String(g.purchasePrice ?? ''),
      purchaseDate: g.purchaseDate ? new Date(g.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      merchant: (g as any).merchant ?? '',
      familyMember: (g as any).familyMember ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const netW = parseFloat(form.netWeight) || parseFloat(form.grossWeight);
    if (!netW || netW <= 0) { toast.error('Enter a valid weight'); return; }
    const now = new Date();
    const payload: Omit<Gold, 'id'> = {
      type: form.form,
      form: form.form as any,
      description: form.description || form.form,
      weight: netW,
      netWeight: netW,
      grossWeight: parseFloat(form.grossWeight) || netW,
      purity: parseInt(form.purity.replace('K', '')) as any,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : now,
      merchant: form.merchant,
      familyMember: form.familyMember,
      createdAt: now,
      updatedAt: now,
    } as any;
    try {
      if (editId) {
        await db.gold.update(editId, { ...payload, updatedAt: now });
        toast.success('Gold holding updated');
      } else {
        await db.gold.add({ ...payload, id: crypto.randomUUID() });
        toast.success('Gold holding added');
      }
      setShowModal(false);
    } catch (e) { toast.error('Failed to save gold holding'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gold holding?')) return;
    await db.gold.delete(id);
    toast.success('Deleted');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gold Holdings"
        subtitle={`${totalGrams.toFixed(1)}g · ${formatCurrency(totalCurVal)}`}
        icon={Coins}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {/* ── Live price input ── */}
      <Card className="glass border-warning/20 bg-warning/5">
        <CardContent className="p-3 flex items-center gap-3">
          <Coins className="h-4 w-4 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">24K Gold Price (₹/gram)</p>
            <p className="text-[10px] text-muted-foreground">Update for live valuation</p>
          </div>
          <Input
            type="number"
            value={livePrice}
            onChange={e => setLivePrice(e.target.value)}
            className="h-8 w-28 text-sm font-bold text-right tabular-nums"
          />
        </CardContent>
      </Card>

      {/* ── Portfolio summary ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Weight', value: `${totalGrams.toFixed(1)}g` },
          { label: 'Market Value', value: formatCurrency(totalCurVal) },
          { label: 'Unrealised P&L', value: `${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)}`, color: totalGain >= 0 ? 'text-success' : 'text-destructive' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${color ?? 'text-foreground'}`}>{value}</p>
              {label === 'Unrealised P&L' && totalBuyVal > 0 && (
                <p className={`text-[10px] tabular-nums ${totalGainPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Holdings list ── */}
      {gold.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Coins className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">No gold holdings yet</p>
            <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-xl gap-1" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add Gold
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {portfolio.map(g => (
            <Card key={g.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                      <Coins className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {(g as any).description || (g as any).form || g.type}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {String(g.purity).includes('K') ? String(g.purity) : String(g.purity) + 'K'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{g.netW.toFixed(2)}g net</span>
                        {(g as any).familyMember && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{(g as any).familyMember}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="text-right mr-1">
                      <p className="text-sm font-bold tabular-nums text-warning">{formatCurrency(g.curVal)}</p>
                      <p className={`text-[10px] tabular-nums ${g.gain >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {g.gain >= 0 ? '+' : ''}{formatCurrency(g.gain)} ({g.gainPct.toFixed(1)}%)
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(g as Gold)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(g.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buy Price</span>
                    <span className="tabular-nums">{formatCurrency(g.buyVal)}</span>
                  </div>
                  {g.purchaseDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bought</span>
                      <span>{new Date(g.purchaseDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={v => { if (!v) setShowModal(false); }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-warning" />
              {editId ? 'Edit Gold Holding' : 'Add Gold Holding'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Necklace, Sovereign coin" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Form</Label>
                <Select value={form.form} onValueChange={v => set('form', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purity</Label>
                <Select value={form.purity} onValueChange={v => set('purity', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PURITY.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Net Weight (g) *</Label>
                <Input type="number" step="0.01" value={form.netWeight} onChange={e => set('netWeight', e.target.value)} placeholder="10.5" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gross Weight (g)</Label>
                <Input type="number" step="0.01" value={form.grossWeight} onChange={e => set('grossWeight', e.target.value)} placeholder="11.2" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purchase Price (₹)</Label>
                <Input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="85000" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Merchant</Label>
                <Input value={form.merchant} onChange={e => set('merchant', e.target.value)} placeholder="e.g. Tanishq" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Family Member</Label>
                <Input value={form.familyMember} onChange={e => set('familyMember', e.target.value)} placeholder="e.g. Mother" className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs" onClick={handleSave}>{editId ? 'Update' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
