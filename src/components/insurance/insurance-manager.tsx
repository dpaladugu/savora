/**
 * InsuranceManager — full CRUD for policies (Health, Term, Vehicle, etc.)
 * with 30-day renewal alerts, nominee tracking, and built-in Gap Analysis tab (§20).
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { MaskedAmount } from '@/components/ui/masked-value';
import { formatCurrency } from '@/lib/format-utils';
import { InsuranceGapAnalysis } from './insurance-gap-analysis';
import { toast } from 'sonner';
import {
  Shield, Plus, Edit, Trash2, AlertTriangle,
  Heart, Car, Users, Briefcase, CheckCircle2, Clock, TrendingUp
} from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Insurance } from '@/lib/db';

const INSURANCE_TYPES = [
  'Health', 'Term Life', 'Vehicle', 'Personal Accident', 'Home', 'Travel', 'Other'
] as const;

const FAMILY_MEMBERS = ['Me', 'Spouse', 'Mother', 'Grandmother', 'Brother', 'Family Floater'];

const TYPE_ICONS: Record<string, React.ElementType> = {
  'Health': Heart,
  'Term Life': Shield,
  'Vehicle': Car,
  'Personal Accident': Users,
  'Home': Briefcase,
  'Travel': Briefcase,
  'Other': Shield,
};

const emptyForm = {
  type: 'Health' as string,
  provider: '',
  policyNo: '',
  familyMember: 'Me',
  sumInsured: '',
  premium: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  nomineeName: '',
  nomineeRelation: '',
  notes: '',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function RenewalBadge({ endDate }: { endDate: string }) {
  const days = daysUntil(endDate);
  if (days < 0)   return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
  if (days <= 30) return <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">Renew in {days}d</Badge>;
  return <Badge variant="outline" className="text-[10px] text-success border-success/30">Active</Badge>;
}

export function InsuranceManager() {
  const policies = useLiveQuery(() => db.insurancePolicies?.toArray() ?? Promise.resolve([])) || [];
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const totalCover   = policies.reduce((s, p) => s + (p.sumInsured || 0), 0);
  const totalPremium = policies.reduce((s, p) => s + (p.premium || 0), 0);
  const expiringSoon = policies.filter(p => p.endDate && daysUntil(p.endDate.toString()) <= 30 && daysUntil(p.endDate.toString()) >= 0);
  const expired      = policies.filter(p => p.endDate && daysUntil(p.endDate.toString()) < 0);
  const missingNominee = policies.filter(p => !p.nomineeName || p.nomineeName.trim() === '');

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (p: Insurance) => {
    setEditingId(p.id);
    setForm({
      type: p.type, provider: p.provider ?? '', policyNo: p.policyNo || '',
      familyMember: p.familyMember || 'Me',
      sumInsured: p.sumInsured.toString(), premium: p.premium.toString(),
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      nomineeName: p.nomineeName || '', nomineeRelation: p.nomineeRelation || '',
      notes: p.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<Insurance, 'id'> = {
      name: `${form.provider} ${form.type}`,
      type: form.type, provider: form.provider, policyNo: form.policyNo,
      familyMember: form.familyMember,
      sumInsured: parseFloat(form.sumInsured) || 0,
      premium: parseFloat(form.premium) || 0,
      startDate: form.startDate ? new Date(form.startDate) : new Date(),
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      nomineeName: form.nomineeName, nomineeRelation: form.nomineeRelation,
      notes: form.notes,
      createdAt: new Date(), updatedAt: new Date(),
    };
    try {
      if (editingId) {
        await db.insurancePolicies?.update(editingId, { ...data, updatedAt: new Date() });
        toast.success('Policy updated');
      } else {
        const newId = crypto.randomUUID();
        await db.insurancePolicies?.add({ id: newId, ...data });
        toast.success('Policy added');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save policy');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    await db.insurancePolicies?.delete(id);
    toast.success('Policy deleted');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Insurance"
        subtitle="Policies, renewals & gap analysis"
        icon={Shield}
        action={
          <Button size="sm" onClick={openAdd} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Policy
          </Button>
        }
      />

      <Tabs defaultValue="policies">
        <TabsList className="w-full h-9 rounded-xl">
          <TabsTrigger value="policies" className="flex-1 text-xs rounded-lg">
            Policies ({policies.length})
            {(expiringSoon.length > 0 || expired.length > 0 || missingNominee.length > 0) && (
              <span className="ml-1 h-2 w-2 rounded-full bg-destructive inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="gap" className="flex-1 text-xs rounded-lg flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Gap Analysis
          </TabsTrigger>
        </TabsList>

        {/* ── Gap Analysis Tab ─────────────────────────────────────────────── */}
        <TabsContent value="gap" className="mt-3">
          <InsuranceGapAnalysis />
        </TabsContent>

        {/* ── Policies Tab ────────────────────────────────────────────────── */}
        <TabsContent value="policies" className="space-y-4 mt-3">

          {/* Alerts */}
          {(expiringSoon.length > 0 || expired.length > 0 || missingNominee.length > 0) && (
            <div className="space-y-2">
              {expired.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span><strong>{p.provider} {p.type}</strong> expired — renew immediately.</span>
                </div>
              ))}
              {expiringSoon.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-warning/8 border border-warning/20 text-xs text-warning">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span><strong>{p.provider} {p.type}</strong> renews in {daysUntil(p.endDate!.toString())} days.</span>
                </div>
              ))}
              {missingNominee.map(p => (
                <div key={`nominee-${p.id}`} className="flex items-start gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">Nominee missing — {p.provider} {p.type}</span>
                    <span className="text-destructive/80"> ({p.familyMember || 'Me'})</span>
                    <p className="mt-0.5 text-destructive/70">A policy without a nominee is an antifragility failure point. Tap edit to add one.</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive border border-destructive/30 rounded-lg shrink-0" onClick={() => openEdit(p)}>Fix →</Button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Cover',    value: <MaskedAmount amount={totalCover}   permission="showSalary" />, color: 'text-foreground' },
              { label: 'Annual Premium', value: <MaskedAmount amount={totalPremium} permission="showSalary" />, color: 'value-negative'  },
              { label: 'Policies',       value: <span>{policies.length}</span>,                                 color: 'text-foreground' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="glass">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                  <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Policy list */}
          <div className="space-y-2">
            {policies.length === 0 ? (
              <Card><CardContent className="py-10 text-center">
                <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No policies yet.</p>
                <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={openAdd}>
                  <Plus className="h-3.5 w-3.5" /> Add first policy
                </Button>
              </CardContent></Card>
            ) : policies.map(p => {
              const Icon = TYPE_ICONS[p.type] || Shield;
              return (
                <Card key={p.id} className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{p.provider}</p>
                          <p className="text-xs text-muted-foreground">{p.type} · {p.familyMember}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.endDate && <RenewalBadge endDate={p.endDate.toString()} />}
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-muted-foreground">Sum Insured: </span><span className="font-medium">{formatCurrency(p.sumInsured)}</span></div>
                      <div><span className="text-muted-foreground">Premium/yr: </span><span className="font-medium">{formatCurrency(p.premium)}</span></div>
                      {p.policyNo && <div><span className="text-muted-foreground">Policy No: </span><span className="font-medium">{p.policyNo}</span></div>}
                      {p.nomineeName
                        ? <div><span className="text-muted-foreground">Nominee: </span><span className="font-medium">{p.nomineeName}</span></div>
                        : <div className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /><span className="font-medium">No Nominee</span></div>
                      }
                      {p.endDate && <div><span className="text-muted-foreground">Renewal: </span><span className="font-medium">{new Date(p.endDate).toLocaleDateString('en-IN')}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Policy' : 'Add Policy'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{INSURANCE_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Family Member</Label>
                <Select value={form.familyMember} onValueChange={v => setForm(f => ({ ...f, familyMember: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FAMILY_MEMBERS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {[
              { id: 'provider',   label: 'Provider *',         key: 'provider',   required: true             },
              { id: 'policyNo',   label: 'Policy Number',      key: 'policyNo',   required: false            },
              { id: 'sumInsured', label: 'Sum Insured (₹)',     key: 'sumInsured', required: true, type:'number' },
              { id: 'premium',    label: 'Annual Premium (₹)', key: 'premium',    required: true, type:'number' },
            ].map(({ id, label, key, required, type }) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs">{label}</Label>
                <Input id={id} type={type || 'text'} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="h-9 text-sm" required={required} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Renewal Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nominee Name <span className="text-destructive">*</span></Label>
                <Input value={form.nomineeName} onChange={e => setForm(f => ({ ...f, nomineeName: e.target.value }))} className="h-9 text-sm" placeholder="Required" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Relation</Label>
                <Input value={form.nomineeRelation} onChange={e => setForm(f => ({ ...f, nomineeRelation: e.target.value }))} className="h-9 text-sm" placeholder="Spouse / Child" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-9 text-sm" placeholder="Optional" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingId ? 'Update' : 'Add Policy'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
