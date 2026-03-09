/**
 * EmergencyFundDashboard — 12-month target with Medical Sub-Bucket
 * Persisted to Dexie emergencyFunds table.
 */
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield, AlertCircle, CheckCircle2, TrendingUp,
  Plus, Minus, Heart, Edit2
} from 'lucide-react';
import type { EmergencyFund } from '@/types/financial';

const DEFAULT_MONTHS  = 12;
const DEFAULT_MONTHLY = 50000; // fallback monthly expenses

async function getOrCreate(): Promise<EmergencyFund> {
  const all = await db.emergencyFunds.toArray();
  if (all.length > 0) return all[0];
  const now = new Date();
  const obj: EmergencyFund = {
    id: crypto.randomUUID(),
    name: 'Emergency Fund',
    targetMonths: DEFAULT_MONTHS,
    targetAmount: DEFAULT_MONTHLY * DEFAULT_MONTHS,
    currentAmount: 0,
    lastReviewDate: now,
    status: 'Under-Target',
    medicalSubBucket: 100000,    // ₹1L default medical reserve target
    medicalSubBucketUsed: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.emergencyFunds.add(obj);
  return obj;
}

export function EmergencyFundDashboard() {
  const [fund, setFund]           = useState<EmergencyFund | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal]   = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [editForm, setEditForm]   = useState({
    monthlyExpenses: DEFAULT_MONTHLY.toString(),
    targetMonths: DEFAULT_MONTHS.toString(),
    medicalSubBucket: '100000',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const f = await getOrCreate();

      // Auto-pull actual avg monthly expenses from last 3 months to set a realistic target
      try {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
        const [txns, expRows] = await Promise.all([
          db.txns.toArray(),
          db.expenses.toArray(),
        ]);
        const totalExp = [
          ...txns.filter(t => t.amount < 0 && new Date(t.date) >= cutoff).map(t => Math.abs(t.amount)),
          ...expRows.filter(e => new Date(e.date) >= cutoff).map(e => Math.abs(e.amount)),
        ].reduce((s, a) => s + a, 0);
        const avgMonthly = Math.round(totalExp / 3);
        if (avgMonthly > 0 && f.targetAmount === DEFAULT_MONTHLY * DEFAULT_MONTHS) {
          // Only auto-update if still at default
          const newTarget = avgMonthly * (f.targetMonths || DEFAULT_MONTHS);
          await db.emergencyFunds.put({ ...f, targetAmount: newTarget, updatedAt: new Date() });
          const updated = { ...f, targetAmount: newTarget };
          setFund(updated);
          setEditForm({
            monthlyExpenses: avgMonthly.toString(),
            targetMonths: f.targetMonths?.toString() || DEFAULT_MONTHS.toString(),
            medicalSubBucket: (f.medicalSubBucket || 100000).toString(),
          });
          return;
        }
      } catch { /* non-critical */ }

      setFund(f);
      const implied = f.targetAmount / (f.targetMonths || DEFAULT_MONTHS);
      setEditForm({
        monthlyExpenses: Math.round(implied).toString(),
        targetMonths: f.targetMonths?.toString() || DEFAULT_MONTHS.toString(),
        medicalSubBucket: (f.medicalSubBucket || 100000).toString(),
      });
    } catch { toast.error('Failed to load emergency fund'); }
    finally { setLoading(false); }
  };

  const update = async (patch: Partial<EmergencyFund>) => {
    if (!fund) return;
    const updated = { ...fund, ...patch, updatedAt: new Date() };
    // Recalculate status
    const pct = updated.currentAmount / updated.targetAmount;
    updated.status = pct >= 1 ? 'Achieved' : pct >= 0.75 ? 'OnTrack' : 'Under-Target';
    await db.emergencyFunds.put(updated);
    setFund(updated);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;
    const amt = parseFloat(addAmount) || 0;
    await update({ currentAmount: fund.currentAmount + amt });
    toast.success(`Added ${formatCurrency(amt)} to emergency fund`);
    setAddModal(false);
    setAddAmount('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const months   = parseInt(editForm.targetMonths)   || DEFAULT_MONTHS;
    const monthly  = parseFloat(editForm.monthlyExpenses) || DEFAULT_MONTHLY;
    const medBucket= parseFloat(editForm.medicalSubBucket) || 0;
    await update({ targetMonths: months, targetAmount: months * monthly, medicalSubBucket: medBucket });
    toast.success('Emergency fund updated');
    setEditModal(false);
  };

  if (loading) return (
    <div className="space-y-3 animate-pulse px-4 py-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted" />)}
    </div>
  );

  if (!fund) return null;

  const pct          = fund.targetAmount > 0 ? Math.min(100, (fund.currentAmount / fund.targetAmount) * 100) : 0;
  const medPct       = (fund.medicalSubBucket || 0) > 0
    ? Math.min(100, ((fund.medicalSubBucketUsed || 0) / (fund.medicalSubBucket || 1)) * 100)
    : 0;
  const shortage     = Math.max(0, fund.targetAmount - fund.currentAmount);
  const monthlyNeed  = fund.targetAmount / (fund.targetMonths || DEFAULT_MONTHS);
  const monthsLeft   = shortage > 0 ? Math.ceil(shortage / (monthlyNeed * 0.2)) : 0; // assume saving 20%/mo

  const statusColor  = fund.status === 'Achieved' ? 'text-success' : fund.status === 'OnTrack' ? 'text-primary' : 'text-warning';
  const StatusIcon   = fund.status === 'Achieved' ? CheckCircle2 : fund.status === 'OnTrack' ? TrendingUp : AlertCircle;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Emergency Fund"
        subtitle="12-month safety net with Medical Sub-Bucket"
        icon={Shield}
        action={
          <div className="flex gap-1.5">
            <Button size="sm" className="h-9 text-xs gap-1 rounded-xl" onClick={() => setAddModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1 rounded-xl" onClick={() => setEditModal(true)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        }
      />

      {/* Main fund card */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {fund.targetMonths}-Month Target
            </CardTitle>
            <Badge className={`text-[10px] ${statusColor} bg-transparent border-current`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {fund.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amounts */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(fund.currentAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(fund.targetAmount)}</p>
            </div>
          </div>

          {/* Main progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold tabular-nums">{pct.toFixed(1)}%</span>
            </div>
            <Progress value={pct} className="h-2.5 rounded-full" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Monthly Exp.',  value: formatCurrency(monthlyNeed) },
              { label: 'Shortage',      value: formatCurrency(shortage) },
              { label: 'Est. Complete', value: monthsLeft > 0 ? `~${monthsLeft}mo` : '✓ Done' },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-xl bg-muted/40 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Quick add buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[10000, 25000, 50000].map(amt => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-8 flex-1"
                onClick={() => update({ currentAmount: fund.currentAmount + amt }).then(() => toast.success(`+${formatCurrency(amt)} added`))}
              >
                +{formatCurrency(amt)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Sub-Bucket */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            Medical Sub-Bucket
          </CardTitle>
          <p className="text-xs text-muted-foreground">Reserved for medical emergencies within the main fund</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-lg font-bold">{formatCurrency(fund.medicalSubBucketUsed || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Reserve</p>
              <p className="text-sm font-semibold">{formatCurrency(fund.medicalSubBucket || 0)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Utilisation</span>
              <span className="font-semibold">{medPct.toFixed(1)}%</span>
            </div>
            <Progress value={medPct} className="h-2 rounded-full" />
          </div>

          {/* Use medical funds */}
          <div className="flex gap-1.5">
            {[5000, 10000].map(amt => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/8"
                onClick={() => update({ medicalSubBucketUsed: (fund.medicalSubBucketUsed || 0) + amt }).then(() => toast.info(`Medical spend: ${formatCurrency(amt)}`))}
              >
                Use {formatCurrency(amt)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {pct < 100 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/8 border border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary">
            Save <strong>{formatCurrency(shortage)}</strong> more to reach your {fund.targetMonths}-month target.
            At ₹5,000/month that's <strong>{Math.ceil(shortage / 5000)} months</strong>.
          </p>
        </div>
      )}

      {/* Add funds modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Add to Emergency Fund</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (₹)</Label>
              <Input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="10000" required autoFocus />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setAddModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit settings modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Edit Fund Settings</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Expenses (₹)</Label>
              <Input type="number" value={editForm.monthlyExpenses} onChange={e => setEditForm({ ...editForm, monthlyExpenses: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Months</Label>
              <Input type="number" value={editForm.targetMonths} onChange={e => setEditForm({ ...editForm, targetMonths: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Medical Sub-Bucket Target (₹)</Label>
              <Input type="number" value={editForm.medicalSubBucket} onChange={e => setEditForm({ ...editForm, medicalSubBucket: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setEditModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
