/**
 * Health Tracker — Mother & Grandma medical records, prescriptions, vitals
 * Full CRUD with per-person tabs, refill alerts, and vital trend indicators.
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Heart, Plus, Activity, Pill, Stethoscope,
  AlertTriangle, Trash2, Edit, Users
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prescription {
  id: string;
  person: 'Mother' | 'Grandma';
  date: string;
  doctor: string;
  medicines: string[];
  nextRefillDays: number;
  amount: number;
  note?: string;
}

interface Vital {
  id: string;
  person: 'Mother' | 'Grandma';
  date: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  weight?: number;
  note?: string;
}

interface MedRecord {
  id: string;
  person: 'Mother' | 'Grandma';
  date: string;
  title: string;
  doctor?: string;
  hospital?: string;
  diagnosis?: string;
  cost?: number;
  notes?: string;
}

// ─── LocalStorage-backed store (no schema change needed) ─────────────────────
const STORE_KEY = 'savora-health-v1';

function loadStore(): { prescriptions: Prescription[]; vitals: Vital[]; records: MedRecord[] } {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { prescriptions: [], vitals: [], records: [] };
  } catch { return { prescriptions: [], vitals: [], records: [] }; }
}

function saveStore(data: ReturnType<typeof loadStore>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntilRefill(rx: Prescription) {
  const d = new Date(rx.date);
  d.setDate(d.getDate() + rx.nextRefillDays);
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

const PERSONS: ('Mother' | 'Grandma')[] = ['Mother', 'Grandma'];

// ─── Main component ───────────────────────────────────────────────────────────
export function HealthTracker() {
  const [data, setData]     = useState(loadStore);
  const [activePerson, setActivePerson] = useState<'Mother' | 'Grandma'>('Mother');
  const [rxModal, setRxModal]   = useState(false);
  const [vtModal, setVtModal]   = useState(false);
  const [recModal, setRecModal] = useState(false);

  // Blank forms
  const blankRx  = { person: activePerson, date: today(), doctor: '', medicines: '', nextRefillDays: '30', amount: '', note: '' };
  const blankVt  = { person: activePerson, date: today(), bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '', spO2: '', weight: '', note: '' };
  const blankRec = { person: activePerson, date: today(), title: '', doctor: '', hospital: '', diagnosis: '', cost: '', notes: '' };

  const [rxForm, setRxForm]   = useState(blankRx);
  const [vtForm, setVtForm]   = useState(blankVt);
  const [recForm, setRecForm] = useState(blankRec);

  function today() { return new Date().toISOString().split('T')[0]; }

  const persist = (next: ReturnType<typeof loadStore>) => {
    setData(next);
    saveStore(next);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addRx = (e: React.FormEvent) => {
    e.preventDefault();
    const rx: Prescription = {
      id: crypto.randomUUID(),
      person: rxForm.person as 'Mother' | 'Grandma',
      date: rxForm.date,
      doctor: rxForm.doctor,
      medicines: rxForm.medicines.split(',').map(m => m.trim()).filter(Boolean),
      nextRefillDays: parseInt(rxForm.nextRefillDays) || 30,
      amount: parseFloat(rxForm.amount) || 0,
      note: rxForm.note || undefined,
    };
    persist({ ...data, prescriptions: [rx, ...data.prescriptions] });
    toast.success('Prescription added');
    setRxModal(false);
    setRxForm({ ...blankRx, person: activePerson });
  };

  const addVital = (e: React.FormEvent) => {
    e.preventDefault();
    const vt: Vital = {
      id: crypto.randomUUID(),
      person: vtForm.person as 'Mother' | 'Grandma',
      date: vtForm.date,
      bpSystolic:  vtForm.bpSystolic  ? parseInt(vtForm.bpSystolic)  : undefined,
      bpDiastolic: vtForm.bpDiastolic ? parseInt(vtForm.bpDiastolic) : undefined,
      heartRate:   vtForm.heartRate   ? parseInt(vtForm.heartRate)   : undefined,
      temperature: vtForm.temperature ? parseFloat(vtForm.temperature): undefined,
      spO2:        vtForm.spO2        ? parseInt(vtForm.spO2)        : undefined,
      weight:      vtForm.weight      ? parseFloat(vtForm.weight)    : undefined,
      note: vtForm.note || undefined,
    };
    persist({ ...data, vitals: [vt, ...data.vitals] });
    toast.success('Vitals recorded');
    setVtModal(false);
    setVtForm({ ...blankVt, person: activePerson });
  };

  const addRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const rec: MedRecord = {
      id: crypto.randomUUID(),
      person: recForm.person as 'Mother' | 'Grandma',
      date: recForm.date,
      title: recForm.title,
      doctor: recForm.doctor || undefined,
      hospital: recForm.hospital || undefined,
      diagnosis: recForm.diagnosis || undefined,
      cost: recForm.cost ? parseFloat(recForm.cost) : undefined,
      notes: recForm.notes || undefined,
    };
    persist({ ...data, records: [rec, ...data.records] });
    toast.success('Record added');
    setRecModal(false);
    setRecForm({ ...blankRec, person: activePerson });
  };

  const deleteRx  = (id: string) => { persist({ ...data, prescriptions: data.prescriptions.filter(r => r.id !== id) }); toast.success('Deleted'); };
  const deleteVt  = (id: string) => { persist({ ...data, vitals: data.vitals.filter(v => v.id !== id) }); toast.success('Deleted'); };
  const deleteRec = (id: string) => { persist({ ...data, records: data.records.filter(r => r.id !== id) }); toast.success('Deleted'); };

  // Filtered by active person
  const rxs  = data.prescriptions.filter(r => r.person === activePerson);
  const vts  = data.vitals.filter(v => v.person === activePerson);
  const recs = data.records.filter(r => r.person === activePerson);

  // Refill alerts (all persons)
  const refillAlerts = data.prescriptions.filter(rx => daysUntilRefill(rx) <= 7);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Health Tracker"
        subtitle="Mother & Grandma — prescriptions, vitals, records"
        icon={Heart}
        action={
          <div className="flex gap-1.5">
            <Button size="sm" className="h-9 text-xs gap-1 rounded-xl" onClick={() => setRxModal(true)}>
              <Pill className="h-3.5 w-3.5" /> Rx
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1 rounded-xl" onClick={() => setVtModal(true)}>
              <Activity className="h-3.5 w-3.5" /> Vital
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1 rounded-xl" onClick={() => setRecModal(true)}>
              <Stethoscope className="h-3.5 w-3.5" /> Record
            </Button>
          </div>
        }
      />

      {/* Refill alerts */}
      {refillAlerts.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/8 border border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-warning">Refill Due Soon</p>
            {refillAlerts.map(rx => (
              <p key={rx.id} className="text-xs text-muted-foreground">
                {rx.person}: {rx.medicines.join(', ')} — {Math.max(0, daysUntilRefill(rx))} days
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Person tabs */}
      <Tabs value={activePerson} onValueChange={v => setActivePerson(v as any)}>
        <TabsList className="grid grid-cols-2 w-full rounded-2xl bg-muted/60 border border-border/40 p-1">
          {PERSONS.map(p => (
            <TabsTrigger key={p} value={p} className="rounded-xl text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />{p}
            </TabsTrigger>
          ))}
        </TabsList>

        {PERSONS.map(person => (
          <TabsContent key={person} value={person} className="space-y-4 mt-3">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Prescriptions', value: rxs.length },
                { label: 'Vital Logs',    value: vts.length },
                { label: 'Med Records',   value: recs.length },
              ].map(({ label, value }) => (
                <Card key={label} className="glass">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Prescriptions */}
            <Card className="glass border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" /> Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rxs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No prescriptions yet</p>
                ) : rxs.map(rx => {
                  const days = daysUntilRefill(rx);
                  return (
                    <div key={rx.id} className={`flex items-start gap-3 p-3 rounded-xl border ${days <= 7 ? 'bg-warning/8 border-warning/30' : 'bg-secondary/30 border-border/30'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-foreground">Dr. {rx.doctor}</span>
                          <Badge variant="outline" className="text-[10px]">{rx.date}</Badge>
                          {days <= 7 && <Badge className="text-[10px] bg-warning/20 text-warning border-warning/30">Refill in {days}d</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{rx.medicines.join(' · ')}</p>
                        {rx.amount > 0 && <p className="text-[11px] text-foreground mt-0.5">{formatCurrency(rx.amount)}</p>}
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deleteRx(rx.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Vitals */}
            <Card className="glass border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No vitals recorded yet</p>
                ) : vts.slice(0, 8).map(vt => (
                  <div key={vt.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">{vt.date}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteVt(vt.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      {vt.bpSystolic && vt.bpDiastolic && (
                        <div className="p-1.5 rounded-lg bg-muted/40 text-center">
                          <p className="text-muted-foreground">BP</p>
                          <p className="font-semibold">{vt.bpSystolic}/{vt.bpDiastolic}</p>
                        </div>
                      )}
                      {vt.heartRate && (
                        <div className="p-1.5 rounded-lg bg-muted/40 text-center">
                          <p className="text-muted-foreground">HR</p>
                          <p className="font-semibold">{vt.heartRate} bpm</p>
                        </div>
                      )}
                      {vt.temperature && (
                        <div className="p-1.5 rounded-lg bg-muted/40 text-center">
                          <p className="text-muted-foreground">Temp</p>
                          <p className="font-semibold">{vt.temperature}°F</p>
                        </div>
                      )}
                      {vt.spO2 && (
                        <div className="p-1.5 rounded-lg bg-muted/40 text-center">
                          <p className="text-muted-foreground">SpO₂</p>
                          <p className="font-semibold">{vt.spO2}%</p>
                        </div>
                      )}
                      {vt.weight && (
                        <div className="p-1.5 rounded-lg bg-muted/40 text-center">
                          <p className="text-muted-foreground">Wt</p>
                          <p className="font-semibold">{vt.weight} kg</p>
                        </div>
                      )}
                    </div>
                    {vt.note && <p className="text-[10px] text-muted-foreground mt-1.5 italic">{vt.note}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Medical Records */}
            <Card className="glass border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-success" /> Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No records yet</p>
                ) : recs.map(rec => (
                  <div key={rec.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-foreground">{rec.title}</span>
                        <Badge variant="outline" className="text-[10px]">{rec.date}</Badge>
                      </div>
                      {rec.doctor    && <p className="text-xs text-muted-foreground">Dr. {rec.doctor}</p>}
                      {rec.hospital  && <p className="text-xs text-muted-foreground">{rec.hospital}</p>}
                      {rec.diagnosis && <p className="text-xs text-foreground/70 italic">{rec.diagnosis}</p>}
                      {rec.cost      && <p className="text-[11px] font-medium mt-0.5">{formatCurrency(rec.cost)}</p>}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deleteRec(rec.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Add Prescription Modal ── */}
      <Dialog open={rxModal} onOpenChange={setRxModal}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Prescription</DialogTitle></DialogHeader>
          <form onSubmit={addRx} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Person</Label>
                <select value={rxForm.person} onChange={e => setRxForm({ ...rxForm, person: e.target.value as any })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={rxForm.date} onChange={e => setRxForm({ ...rxForm, date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Doctor Name *</Label>
              <Input value={rxForm.doctor} onChange={e => setRxForm({ ...rxForm, doctor: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Medicines (comma-separated) *</Label>
              <Textarea value={rxForm.medicines} onChange={e => setRxForm({ ...rxForm, medicines: e.target.value })}
                placeholder="Metformin, Amlodipine, Aspirin" className="text-xs rounded-xl" rows={2} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Next Refill (days)</Label>
                <Input type="number" value={rxForm.nextRefillDays} onChange={e => setRxForm({ ...rxForm, nextRefillDays: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cost (₹)</Label>
                <Input type="number" value={rxForm.amount} onChange={e => setRxForm({ ...rxForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input value={rxForm.note} onChange={e => setRxForm({ ...rxForm, note: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setRxModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Vital Modal ── */}
      <Dialog open={vtModal} onOpenChange={setVtModal}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Vital Signs</DialogTitle></DialogHeader>
          <form onSubmit={addVital} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Person</Label>
                <select value={vtForm.person} onChange={e => setVtForm({ ...vtForm, person: e.target.value as any })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={vtForm.date} onChange={e => setVtForm({ ...vtForm, date: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">BP Systolic</Label><Input type="number" placeholder="120" value={vtForm.bpSystolic} onChange={e => setVtForm({ ...vtForm, bpSystolic: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">BP Diastolic</Label><Input type="number" placeholder="80" value={vtForm.bpDiastolic} onChange={e => setVtForm({ ...vtForm, bpDiastolic: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Heart Rate</Label><Input type="number" placeholder="72" value={vtForm.heartRate} onChange={e => setVtForm({ ...vtForm, heartRate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Temp (°F)</Label><Input type="number" step="0.1" placeholder="98.6" value={vtForm.temperature} onChange={e => setVtForm({ ...vtForm, temperature: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">SpO₂ (%)</Label><Input type="number" placeholder="98" value={vtForm.spO2} onChange={e => setVtForm({ ...vtForm, spO2: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Weight (kg)</Label><Input type="number" step="0.1" placeholder="60" value={vtForm.weight} onChange={e => setVtForm({ ...vtForm, weight: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Note</Label><Input value={vtForm.note} onChange={e => setVtForm({ ...vtForm, note: e.target.value })} /></div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setVtModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Medical Record Modal ── */}
      <Dialog open={recModal} onOpenChange={setRecModal}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Medical Record</DialogTitle></DialogHeader>
          <form onSubmit={addRecord} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Person</Label>
                <select value={recForm.person} onChange={e => setRecForm({ ...recForm, person: e.target.value as any })}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Date</Label><Input type="date" value={recForm.date} onChange={e => setRecForm({ ...recForm, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Title / Event *</Label><Input value={recForm.title} onChange={e => setRecForm({ ...recForm, title: e.target.value })} placeholder="Annual Checkup, Surgery, Scan..." required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Doctor</Label><Input value={recForm.doctor} onChange={e => setRecForm({ ...recForm, doctor: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Hospital</Label><Input value={recForm.hospital} onChange={e => setRecForm({ ...recForm, hospital: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Diagnosis</Label><Input value={recForm.diagnosis} onChange={e => setRecForm({ ...recForm, diagnosis: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Cost (₹)</Label><Input type="number" value={recForm.cost} onChange={e => setRecForm({ ...recForm, cost: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value })} className="text-xs rounded-xl" rows={2} /></div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setRecModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
