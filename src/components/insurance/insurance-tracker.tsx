/**
 * InsuranceTracker — fully migrated to Dexie useLiveQuery
 * Uses db.insurancePolicies (canonical table) with renewal alerts + gap banner.
 */
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Insurance } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { MaskedAmount } from '@/components/ui/masked-value';
import { toast } from 'sonner';
import {
  Shield, Plus, Edit, Trash2, AlertTriangle,
  Heart, Car, Users, Briefcase, CheckCircle2, Clock, Activity, Info
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const INSURANCE_TYPES = [
  'Health', 'Super Top-Up Health', 'Critical Illness', 'Term Life',
  'Personal Accident', 'Vehicle', 'Home', 'Travel',
  'Corporate Group Health', 'Corporate Group Term', 'Corporate Parental Health',
  'Maternity Rider', 'Other',
] as const;

const POLICY_SOURCE = ['Personal', 'Corporate / Employer', 'Government Scheme'] as const;

const FAMILY_MEMBERS = [
  'Me', 'Spouse', 'Baby / Child', 'Mother', 'Father',
  'Mother-in-Law', 'Father-in-Law', 'Grandmother', 'Brother', 'Family Floater',
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  'Health': Heart, 'Super Top-Up Health': Heart, 'Critical Illness': Activity,
  'Term Life': Shield, 'Corporate Group Health': Briefcase,
  'Corporate Group Term': Briefcase, 'Corporate Parental Health': Users,
  'Maternity Rider': Heart, 'Vehicle': Car, 'Personal Accident': Users,
  'Home': Briefcase, 'Travel': Briefcase, 'Other': Shield,
};

const emptyForm = {
  type: 'Health' as string,
  policySource: 'Personal' as string,
  provider: '',
  policyNo: '',
  familyMember: 'Me',
  sumInsured: '',
  premium: '',
  premiumTermYears: '1',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  nomineeName: '',
  nomineeRelation: '',
  notes: '',
};

function daysUntilExpiry(endDate: Date | undefined) {
  if (!endDate) return null;
  return differenceInDays(new Date(endDate), new Date());
}

export function InsuranceTracker() {
  const policies = useLiveQuery(
    () => db.insurancePolicies.filter(p => p.isActive !== false).sortBy('endDate').catch(() => []),
    []
  ) ?? [];

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [tab, setTab] = useState('all');

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPremium   = useMemo(() => policies.reduce((s, p) => s + (p.premium ?? 0), 0), [policies]);
  const expiringSoon   = useMemo(() => policies.filter(p => { const d = daysUntilExpiry(p.endDate); return d !== null && d >= 0 && d <= 30; }), [policies]);
  const expired        = useMemo(() => policies.filter(p => { const d = daysUntilExpiry(p.endDate); return d !== null && d < 0; }), [policies]);

  // Filter by tab
  const filtered = useMemo(() => {
    if (tab === 'expiring') return expiringSoon;
    if (tab === 'corporate') return policies.filter(p => p.policySource === 'Corporate / Employer' || p.isCorporate);
    if (tab === 'govt') return policies.filter(p => p.policySource === 'Government Scheme');
    return policies;
  }, [tab, policies, expiringSoon]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (p: Insurance) => {
    setEditId(p.id);
    setForm({
      type: p.type ?? 'Health',
      policySource: p.policySource ?? 'Personal',
      provider: p.provider ?? p.company ?? '',
      policyNo: p.policyNo ?? p.policyNumber ?? '',
      familyMember: p.familyMember ?? 'Me',
      sumInsured: String(p.sumInsured ?? ''),
      premium: String(p.premium ?? ''),
      premiumTermYears: String((p as any).premiumTermYears ?? 1),
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      nomineeName: p.nomineeName ?? p.nominee ?? '',
      nomineeRelation: p.nomineeRelation ?? '',
      notes: p.notes ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.provider || !form.sumInsured || !form.endDate) {
      toast.error('Provider, Sum Insured, and Expiry Date are required'); return;
    }
    const now = new Date();
    const payload: Omit<Insurance, 'id'> = {
      name: `${form.type} – ${form.provider}`,
      type: form.type,
      policySource: form.policySource as any,
      provider: form.provider,
      company: form.provider,
      policyNo: form.policyNo,
      policyNumber: form.policyNo,
      familyMember: form.familyMember,
      sumInsured: parseFloat(form.sumInsured) || 0,
      premium: parseFloat(form.premium) || 0,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      nomineeName: form.nomineeName,
      nominee: form.nomineeName,
      nomineeRelation: form.nomineeRelation,
      notes: form.notes,
      isActive: true,
      isCorporate: form.policySource === 'Corporate / Employer',
      createdAt: now,
      updatedAt: now,
    };
    try {
      if (editId) {
        await db.insurancePolicies.update(editId, { ...payload, updatedAt: now });
        toast.success('Policy updated');
      } else {
        await db.insurancePolicies.add({ ...payload, id: crypto.randomUUID() });
        toast.success('Policy added');
      }
      setShowModal(false);
    } catch (e) { toast.error('Failed to save policy'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    await db.insurancePolicies.update(id, { isActive: false });
    toast.success('Policy removed');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Insurance"
        subtitle={`${policies.length} policies · ${formatCurrency(totalPremium)}/yr`}
        icon={Shield}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {/* ── Alert strips ── */}
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-warning/40 bg-warning/5 text-xs">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-warning font-medium">
            {expiringSoon.length} polic{expiringSoon.length === 1 ? 'y' : 'ies'} expiring within 30 days — renew now!
          </span>
        </div>
      )}
      {expired.length > 0 && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">
            {expired.length} polic{expired.length === 1 ? 'y' : 'ies'} expired — update or remove them.
          </span>
        </div>
      )}

      {/* ── Summary row ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Policies', value: String(policies.length) },
          { label: 'Annual Premium', value: formatCurrency(totalPremium) },
          { label: 'Expiring Soon', value: String(expiringSoon.length), danger: expiringSoon.length > 0 },
        ].map(({ label, value, danger }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${danger ? 'text-warning' : 'text-foreground'}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full h-8 text-xs rounded-xl">
          <TabsTrigger value="all" className="flex-1 text-xs rounded-lg">All ({policies.length})</TabsTrigger>
          <TabsTrigger value="expiring" className="flex-1 text-xs rounded-lg">
            Expiring {expiringSoon.length > 0 && <span className="ml-1 px-1 rounded-full bg-warning text-warning-foreground text-[9px]">{expiringSoon.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="corporate" className="flex-1 text-xs rounded-lg">Corporate</TabsTrigger>
          <TabsTrigger value="govt" className="flex-1 text-xs rounded-lg">Govt</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-2 mt-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Shield className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
                <p className="text-sm text-muted-foreground">No policies found</p>
                <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-xl gap-1" onClick={openAdd}>
                  <Plus className="h-3.5 w-3.5" /> Add Policy
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map(policy => {
              const Icon = TYPE_ICONS[policy.type] ?? Shield;
              const daysLeft = daysUntilExpiry(policy.endDate);
              const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
              const isExpired  = daysLeft !== null && daysLeft < 0;
              return (
                <Card key={policy.id} className={`glass ${isExpired ? 'border-destructive/30' : isExpiring ? 'border-warning/30' : ''}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isExpired ? 'bg-destructive/10' : isExpiring ? 'bg-warning/10' : 'bg-primary/10'
                        }`}>
                          <Icon className={`h-4 w-4 ${isExpired ? 'text-destructive' : isExpiring ? 'text-warning' : 'text-primary'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{policy.type}</p>
                          <p className="text-xs text-muted-foreground">{policy.provider ?? policy.company}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {policy.familyMember && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{policy.familyMember}</Badge>
                            )}
                            {policy.policySource === 'Corporate / Employer' && (
                              <Badge className="text-[10px] h-4 px-1.5 bg-warning/15 text-warning border-warning/30">Corporate</Badge>
                            )}
                            {policy.policySource === 'Government Scheme' && (
                              <Badge className="text-[10px] h-4 px-1.5 bg-success/15 text-success border-success/30">Govt</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(policy)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(policy.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sum Insured</span>
                        <span className="font-semibold tabular-nums">
                          <MaskedAmount amount={policy.sumInsured ?? 0} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Premium</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(policy.premium ?? 0)}/yr</span>
                      </div>
                      {policy.endDate && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">Expiry</span>
                          <span className={`font-semibold tabular-nums ${isExpired ? 'text-destructive' : isExpiring ? 'text-warning' : 'text-foreground'}`}>
                            {format(new Date(policy.endDate), 'dd MMM yyyy')}
                            {daysLeft !== null && (
                              <span className="ml-1 font-normal">
                                ({isExpired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {policy.policySource === 'Corporate / Employer' && (
                      <div className="flex items-start gap-1.5 text-[10px] text-warning bg-warning/5 rounded-lg px-2.5 py-1.5">
                        <Info className="h-3 w-3 shrink-0 mt-0.5" />
                        Job-dependent — coverage lapses if you change employers
                      </div>
                    )}
                    {policy.nomineeName && (
                      <p className="text-[10px] text-muted-foreground">
                        Nominee: {policy.nomineeName} {policy.nomineeRelation ? `(${policy.nomineeRelation})` : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add/Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={v => { if (!v) setShowModal(false); }}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              {editId ? 'Edit Policy' : 'Add Policy'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Policy Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{INSURANCE_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Policy Source</Label>
                <Select value={form.policySource} onValueChange={v => set('policySource', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{POLICY_SOURCE.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Provider / Insurer *</Label>
                <Input value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="e.g. HDFC Ergo" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Policy Number</Label>
                <Input value={form.policyNo} onChange={e => set('policyNo', e.target.value)} placeholder="e.g. P001234" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Family Member</Label>
                <Select value={form.familyMember} onValueChange={v => set('familyMember', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FAMILY_MEMBERS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sum Insured (₹) *</Label>
                <Input type="number" value={form.sumInsured} onChange={e => set('sumInsured', e.target.value)} placeholder="500000" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual Premium (₹)</Label>
                <Input type="number" value={form.premium} onChange={e => set('premium', e.target.value)} placeholder="12000" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiry Date *</Label>
                <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nominee Name</Label>
                <Input value={form.nomineeName} onChange={e => set('nomineeName', e.target.value)} placeholder="e.g. Spouse" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nominee Relation</Label>
                <Input value={form.nomineeRelation} onChange={e => set('nomineeRelation', e.target.value)} placeholder="e.g. Wife" className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" className="h-9 text-sm" />
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
