/**
 * SubscriptionManager — with category breakdown, annual totals,
 * renewal alerts, monthly burn chart and renewal calendar.
 */
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import {
  Plus, Edit, Trash2, Calendar, AlertTriangle,
  Tv, Music, Cloud, Smartphone, BookOpen, Gamepad2,
  BarChart3, RefreshCw, Rss, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, addQuarters, addYears, differenceInDays, format, getDaysInMonth, startOfMonth } from 'date-fns';
import type { Subscription } from '@/lib/db';

// ── Category icons ──────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Streaming:  Tv,
  Music:      Music,
  Cloud:      Cloud,
  Mobile:     Smartphone,
  Education:  BookOpen,
  Gaming:     Gamepad2,
  News:       Rss,
  Software:   BarChart3,
  Other:      RefreshCw,
};

const CATEGORY_COLORS: Record<string, string> = {
  Streaming:  'hsl(0 72% 51%)',
  Music:      'hsl(142 71% 45%)',
  Cloud:      'hsl(217 91% 60%)',
  Mobile:     'hsl(25 95% 53%)',
  Education:  'hsl(262 83% 58%)',
  Gaming:     'hsl(198 93% 50%)',
  News:       'hsl(43 96% 56%)',
  Software:   'hsl(168 76% 42%)',
  Other:      'hsl(220 9% 46%)',
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

function toMonthly(amount: number, cycle: string) {
  if (cycle === 'Quarterly') return amount / 3;
  if (cycle === 'Yearly')    return amount / 12;
  return amount;
}

function nextDueDate(start: Date, cycle: string): Date {
  const now  = new Date();
  let next   = new Date(start);
  while (next <= now) {
    if (cycle === 'Monthly')        next = addMonths(next, 1);
    else if (cycle === 'Quarterly') next = addQuarters(next, 1);
    else                            next = addYears(next, 1);
  }
  return next;
}

const emptyForm = {
  name: '',
  amount: '',
  cycle: 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly',
  category: 'Streaming',
  startDate: new Date().toISOString().split('T')[0],
  reminderDays: '3',
};

export function SubscriptionManager() {
  const subs = useLiveQuery(
    () => db.subscriptions?.filter(s => s.isActive !== false).toArray() ?? Promise.resolve([]),
  ) ?? [];

  const [showModal, setShowModal]       = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState({ ...emptyForm });
  const [showBreakdown, setShowBreakdown] = useState(false);

  const totalMonthly = useMemo(
    () => subs.reduce((s, sub) => s + toMonthly(sub.amount, sub.cycle), 0),
    [subs],
  );
  const totalAnnual = totalMonthly * 12;

  // Upcoming within 7 days
  const upcoming = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 7);
    return subs.filter(s => nextDueDate(new Date(s.startDate), s.cycle) <= cutoff);
  }, [subs]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    subs.forEach(s => {
      const cat = (s as any).category ?? 'Other';
      map[cat] = (map[cat] ?? 0) + toMonthly(s.amount, s.cycle);
    });
    return Object.entries(map)
      .map(([cat, monthly]) => ({ cat, monthly, annual: monthly * 12 }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [subs]);

  const openAdd  = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (s: Subscription) => {
    setEditId(s.id);
    setForm({
      name: s.name, amount: s.amount.toString(), cycle: s.cycle,
      category: (s as any).category || 'Other',
      startDate: new Date(s.startDate).toISOString().split('T')[0],
      reminderDays: s.reminderDays.toString(),
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.name || !amt) { toast.error('Name and amount are required'); return; }
    const startDate = new Date(form.startDate);
    const nd  = nextDueDate(startDate, form.cycle);
    const now = new Date();
    const data = {
      name: form.name, cost: amt, billingCycle: form.cycle, nextBilling: nd,
      amount: amt, cycle: form.cycle, category: form.category,
      startDate, nextDue: nd,
      reminderDays: parseInt(form.reminderDays) || 3,
      isActive: true, createdAt: now, updatedAt: now,
    };
    try {
      if (editId) {
        await db.subscriptions?.update(editId, { ...data, updatedAt: now });
        toast.success('Subscription updated');
      } else {
        await db.subscriptions?.add({ id: crypto.randomUUID(), ...data });
        toast.success('Subscription added');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save subscription'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return;
    await db.subscriptions?.update(id, { isActive: false });
    toast.success('Subscription removed');
  };

  // ── Renewal Calendar: 12 months of upcoming renewals ────────────────────────
  const renewalCalendar = useMemo(() => {
    const months: { label: string; date: Date; subs: { name: string; amount: number; cycle: string }[]; total: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const d = addMonths(startOfMonth(new Date()), m);
      const monthSubs = subs.filter(s => {
        const due = nextDueDate(new Date(s.startDate), s.cycle);
        return due.getFullYear() === d.getFullYear() && due.getMonth() === d.getMonth();
      }).map(s => ({ name: s.name, amount: s.amount, cycle: s.cycle }));
      months.push({
        label: format(d, 'MMM yy'),
        date: d,
        subs: monthSubs,
        total: monthSubs.reduce((s, x) => s + x.amount, 0),
      });
    }
    return months;
  }, [subs]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subscriptions"
        subtitle="Track recurring digital & service costs"
        icon={RefreshCw}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Active',       value: subs.length,               color: 'text-foreground' },
          { label: 'Monthly',      value: formatCurrency(totalMonthly), color: 'text-destructive' },
          { label: 'Annual Burn',  value: formatCurrency(totalAnnual),  color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className={`text-sm font-black tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming alert */}
      {upcoming.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/8 border border-warning/25 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>{upcoming.length}</strong> renewal{upcoming.length > 1 ? 's' : ''} due within 7 days:{' '}
            {upcoming.map(s => s.name).join(', ')}
          </span>
        </div>
      )}

      {/* Category breakdown (collapsible) */}
      {categoryBreakdown.length > 0 && (
        <Card className="glass">
          <button
            onClick={() => setShowBreakdown(b => !b)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-xs font-semibold text-foreground">Category Breakdown</span>
            {showBreakdown ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showBreakdown && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {categoryBreakdown.map(({ cat, monthly }) => {
                const pct = totalMonthly > 0 ? (monthly / totalMonthly) * 100 : 0;
                const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
                const Icon  = CATEGORY_ICONS[cat] ?? RefreshCw;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                        <span className="text-foreground">{cat}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {formatCurrency(monthly)}/mo · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                <span className="font-semibold text-foreground">Total Annual</span>
                <span className="font-bold text-destructive tabular-nums">{formatCurrency(totalAnnual)}</span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* List */}
      {subs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No subscriptions yet</p>
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add first subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const Icon     = CATEGORY_ICONS[(sub as any).category ?? 'Other'] ?? RefreshCw;
            const due      = nextDueDate(new Date(sub.startDate), sub.cycle);
            const daysLeft = differenceInDays(due, new Date());
            const isUrgent = daysLeft <= 7;
            const monthly  = toMonthly(sub.amount, sub.cycle);
            return (
              <Card key={sub.id} className={`glass ${isUrgent ? 'border-warning/40' : 'border-border/40'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{sub.name}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{sub.cycle}</Badge>
                        {isUrgent && (
                          <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30 shrink-0">
                            Due in {daysLeft}d
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Amount </span>
                          <span className="font-medium">{formatCurrency(sub.amount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">≈/mo </span>
                          <span className="font-medium text-destructive">{formatCurrency(monthly)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next </span>
                          <span className="font-medium">{format(due, 'd MMM')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(sub)}>
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(sub.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Netflix, Spotify…"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Billing Cycle</Label>
                <Select value={form.cycle} onValueChange={v => setForm(f => ({ ...f, cycle: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly"   className="text-xs">Monthly</SelectItem>
                    <SelectItem value="Quarterly" className="text-xs">Quarterly</SelectItem>
                    <SelectItem value="Yearly"    className="text-xs">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Reminder (days before due)</Label>
              <Input type="number" value={form.reminderDays}
                onChange={e => setForm(f => ({ ...f, reminderDays: e.target.value }))}
                className="h-9 text-sm" min="1" max="30" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-9 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-9 rounded-xl">{editId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
