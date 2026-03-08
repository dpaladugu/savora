import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Home, PiggyBank, ShieldCheck,
  ChefHat, Droplets, ShoppingBag, Coffee, Scissors,
  ArrowDown, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Calendar, IndianRupee,
  Phone, FileText, TrendingDown, ChevronDown, ChevronUp, User, PlusCircle, BarChart2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { toast } from 'sonner';
import { useRole } from '@/store/rbacStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { GunturShopRow, GorantlaRoomRow, RentHikeLog } from '@/lib/db';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DWACRA_DEDUCTION         = 5000;
const INS_RECOVERY_TARGET      = 170000;
const INS_RECOVERY_MONTHLY     = 5400;
const INS_2029_MONTHLY_UPSHIFT = 8000;
const MEDICAL_INFLATION_RATE   = 0.14;
const INS_2029_TARGET          = Math.round(INS_RECOVERY_TARGET * Math.pow(1 + MEDICAL_INFLATION_RATE, 3));

// Debt-freedom constants (kept in sync with sequential-strike-engine)
const INCRED_OUTSTANDING = 10_21_156;
const INCRED_ROI         = 14.2;
const INCRED_EMI         = 32641;
const ICICI_OUTSTANDING  = 33_00_000;
const ICICI_ROI          = 9.99;
const ICICI_EMI          = 61424;
const INCRED_MIN_PART    = 25_000;
const DEADLINE           = new Date(2029, 11, 31);

// ── Amort sim ───────────────────────────────────────────────────────────────
function simSequential(
  incredOut: number, iciciOut: number,
  p5Monthly: number,
): { totalMonths: number; onTrack: boolean } {
  function simLoan(out: number, roi: number, emi: number, extra: number, minPart = 0): number {
    if (out <= 0) return 0;
    const r = roi / 100 / 12;
    let bal = out, m = 0, acc = 0;
    while (bal > 0 && m < 600) {
      m++;
      bal -= Math.min(bal, emi - bal * r);
      if (extra > 0) {
        acc += extra;
        if (minPart > 0 ? acc >= minPart : true) { bal = Math.max(0, bal - acc); acc = 0; }
      }
      if (bal <= 0) break;
    }
    return m;
  }
  const ph1 = simLoan(incredOut, INCRED_ROI, INCRED_EMI, p5Monthly, INCRED_MIN_PART);
  const ph2 = simLoan(iciciOut,  ICICI_ROI,  ICICI_EMI,  INCRED_EMI + p5Monthly, 0);
  const total = ph1 + ph2;
  return { totalMonths: total, onTrack: addMonths(new Date(), total) <= DEADLINE };
}

const DEFAULT_GORANTLA: Omit<GorantlaRoomRow, 'updatedAt'>[] = [
  { id: 'gr-kitchen',  roomId: 'kitchen',    name: 'Kitchen',         tenant: 'Tenant A', rent: 3000, paid: false },
  { id: 'gr-main',     roomId: 'main-house', name: 'Main House',      tenant: 'Tenant B', rent: 4500, paid: false },
  { id: 'gr-damini',   roomId: 'damini',     name: 'Damini/Sudhakar', tenant: 'Damini',   rent: 3500, paid: false },
  { id: 'gr-sudhakar', roomId: 'sudhakar',   name: 'Sudhakar',        tenant: 'Sudhakar', rent: 3000, paid: false },
];

const DEFAULT_SHOPS: Omit<GunturShopRow, 'updatedAt'>[] = [
  { id: 'gs-1', shopId: 'shop-1', name: 'Shop 1', tenant: '',        rent: 0,    status: 'Vacant',   paid: false },
  { id: 'gs-2', shopId: 'shop-2', name: 'Shop 2', tenant: 'Milk',    rent: 5500, status: 'Occupied', paid: false },
  { id: 'gs-3', shopId: 'shop-3', name: 'Shop 3', tenant: 'Salon',   rent: 3700, status: 'Occupied', paid: false },
  { id: 'gs-4', shopId: 'shop-4', name: 'Shop 4', tenant: 'Noodles', rent: 3900, status: 'Occupied', paid: false },
  { id: 'gs-5', shopId: 'shop-5', name: 'Shop 5', tenant: 'Tea',     rent: 4000, status: 'Occupied', paid: false },
  { id: 'gs-6', shopId: 'shop-6', name: 'Shop 6', tenant: 'Bags',    rent: 2500, status: 'Occupied', paid: false },
];

interface WaterfallBucket {
  id: string;
  label: string;
  target: number;
  monthly?: number;
  icon: React.ReactNode;
  colorClass: string;
}

const WATERFALL_BUCKETS: WaterfallBucket[] = [
  { id: 'recovery',  label: 'Ins. Recovery (₹1.7L Paid)',  target: INS_RECOVERY_TARGET,  monthly: INS_RECOVERY_MONTHLY,  icon: <ShieldCheck className="w-4 h-4" />, colorClass: 'bg-primary'     },
  { id: 'sinking',   label: "Mother's Health Ins. (2029)", target: INS_2029_TARGET,       monthly: INS_RECOVERY_MONTHLY,  icon: <PiggyBank className="w-4 h-4" />,   colorClass: 'bg-accent'      },
  { id: 'household', label: 'Household Expenses',          target: 45000, monthly: 45000, icon: <Home className="w-4 h-4" />,                                         colorClass: 'bg-success'     },
  { id: 'grandma',   label: "Grandma's Safety Net",        target: 500000,                icon: <CheckCircle className="w-4 h-4" />,                                   colorClass: 'bg-warning'     },
  { id: 'debt',      label: 'ICICI Loan Prepayment',       target: Infinity,              icon: <ArrowDown className="w-4 h-4" />,                                     colorClass: 'bg-destructive' },
];

function cascadeIncome(netCollected: number): Record<string, number> {
  let rem = netCollected;
  const result: Record<string, number> = {};
  for (const b of WATERFALL_BUCKETS) {
    if (rem <= 0) { result[b.id] = 0; continue; }
    const cap  = b.monthly ?? (b.target === Infinity ? rem : b.target);
    const fill = Math.min(rem, cap);
    result[b.id] = fill;
    rem -= fill;
  }
  return result;
}

// ─── ADVANCE DIALOG ───────────────────────────────────────────────────────────
interface AdvanceDialogProps {
  open: boolean;
  onClose: () => void;
  unitName: string;
  currentAmount: number;
  currentDate: Date | null;
  onSave: (amount: number, date: Date) => Promise<void>;
}

function AdvanceDialog({ open, onClose, unitName, currentAmount, currentDate, onSave }: AdvanceDialogProps) {
  const [amount, setAmount] = useState(currentAmount || 0);
  const [date, setDate]     = useState(currentDate ? format(currentDate, 'yyyy-MM-dd') : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(currentAmount || 0);
      setDate(currentDate ? format(currentDate, 'yyyy-MM-dd') : '');
    }
  }, [open, currentAmount, currentDate]);

  const handleSave = async () => {
    if (!date) { toast.error('Please enter the date advance was received'); return; }
    setSaving(true);
    try {
      await onSave(amount, new Date(date));
      toast.success(`Advance updated for ${unitName}`);
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            Advance — {unitName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Advance Amount (₹)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Date Received</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {currentAmount > 0 && currentDate && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Current Record</p>
              <p>Amount: <span className="font-semibold text-primary">{formatCurrency(currentAmount)}</span></p>
              <p>Received: <span className="font-semibold">{format(new Date(currentDate), 'dd MMM yyyy')}</span></p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save Advance'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── TENANT PROFILE DIALOG ───────────────────────────────────────────────────
interface TenantProfileDialogProps {
  open: boolean;
  onClose: () => void;
  unitName: string;
  tenantName: string;
  currentContact: string;
  currentLeaseStart: Date | null;
  currentIdNote: string;
  onSave: (contact: string, leaseStart: Date | null, idNote: string) => Promise<void>;
}

function TenantProfileDialog({ open, onClose, unitName, tenantName, currentContact, currentLeaseStart, currentIdNote, onSave }: TenantProfileDialogProps) {
  const [contact,    setContact]    = useState(currentContact || '');
  const [leaseStart, setLeaseStart] = useState(currentLeaseStart ? format(new Date(currentLeaseStart), 'yyyy-MM-dd') : '');
  const [idNote,     setIdNote]     = useState(currentIdNote || '');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (open) {
      setContact(currentContact || '');
      setLeaseStart(currentLeaseStart ? format(new Date(currentLeaseStart), 'yyyy-MM-dd') : '');
      setIdNote(currentIdNote || '');
    }
  }, [open, currentContact, currentLeaseStart, currentIdNote]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(contact, leaseStart ? new Date(leaseStart) : null, idNote);
      toast.success(`Profile saved for ${unitName}`);
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Tenant Profile — {unitName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-2 rounded-lg bg-muted text-xs text-muted-foreground">
            Tenant: <span className="font-semibold text-foreground">{tenantName || '(Vacant)'}</span>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Phone className="w-3 h-3" />Contact Number</Label>
            <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g. 9876543210" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Calendar className="w-3 h-3" />Lease Start Date</Label>
            <Input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><FileText className="w-3 h-3" />ID / Notes</Label>
            <Textarea value={idNote} onChange={e => setIdNote(e.target.value)} placeholder="Aadhaar last 4 digits, guarantor name, notes…" rows={2} className="text-sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save Profile'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── RENT HIKE DIALOG ────────────────────────────────────────────────────────
interface RentHikeDialogProps {
  open: boolean;
  onClose: () => void;
  unitName: string;
  unitId: string;
  unitType: 'shop' | 'room';
  currentRent: number;
  hikeHistory: RentHikeLog[];
  onHikeAdded: () => void;
}

function RentHikeDialog({ open, onClose, unitName, unitId, unitType, currentRent, hikeHistory, onHikeAdded }: RentHikeDialogProps) {
  const [newRent,   setNewRent]   = useState(currentRent);
  const [hikeDate,  setHikeDate]  = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note,      setNote]      = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { if (open) { setNewRent(currentRent); setHikeDate(format(new Date(), 'yyyy-MM-dd')); setNote(''); } }, [open, currentRent]);

  const handleSave = async () => {
    if (newRent <= 0 || newRent === currentRent) { toast.error('Enter a different rent amount'); return; }
    setSaving(true);
    try {
      const logEntry: RentHikeLog = {
        id: crypto.randomUUID(),
        unitId,
        unitType,
        oldRent: currentRent,
        newRent,
        hikeDate: new Date(hikeDate),
        note: note || undefined,
        createdAt: new Date(),
      };
      await db.rentHikeLogs.add(logEntry);
      if (unitType === 'shop') {
        await db.gunturShops.update(unitId, { rent: newRent, updatedAt: new Date() });
      } else {
        await db.gorantlaRooms.update(unitId, { rent: newRent, updatedAt: new Date() });
      }
      toast.success(`Rent updated to ${formatCurrency(newRent)} for ${unitName}`);
      onHikeAdded();
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const pctChange = currentRent > 0 ? Math.round(((newRent - currentRent) / currentRent) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            Rent Hike — {unitName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted text-sm">
            <div><p className="text-xs text-muted-foreground">Current Rent</p><p className="font-bold text-foreground">{formatCurrency(currentRent)}</p></div>
            <div><p className="text-xs text-muted-foreground">Change</p><p className={`font-bold ${pctChange > 0 ? 'text-success' : pctChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{pctChange > 0 ? '+' : ''}{pctChange}%</p></div>
          </div>
          <div className="space-y-2">
            <Label>New Rent (₹)</Label>
            <Input type="number" value={newRent} onChange={e => setNewRent(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input type="date" value={hikeDate} onChange={e => setHikeDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Annual hike, tenant agreed" />
          </div>

          {hikeHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hike History</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {[...hikeHistory].sort((a, b) => new Date(b.hikeDate).getTime() - new Date(a.hikeDate).getTime()).map(h => (
                  <div key={h.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border">
                    <span className="text-muted-foreground">{format(new Date(h.hikeDate), 'MMM yyyy')}</span>
                    <span className="font-medium">{formatCurrency(h.oldRent)} → <span className="text-success font-semibold">{formatCurrency(h.newRent)}</span></span>
                    {h.note && <span className="text-muted-foreground italic truncate ml-2">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Log Hike'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── UNIT DETAIL STRIP ───────────────────────────────────────────────────────
interface UnitDetailStripProps {
  unitId: string;
  unitType: 'shop' | 'room';
  unitName: string;
  tenantName: string;
  currentRent: number;
  tenantContact?: string;
  leaseStart?: Date | null;
  tenantIdNote?: string;
  advanceAmount?: number;
  advanceDate?: Date | null;
  readOnly: boolean;
  onProfileSave: (contact: string, leaseStart: Date | null, idNote: string) => Promise<void>;
  onAdvanceEdit: () => void;
}

function UnitDetailStrip({ unitId, unitType, unitName, tenantName, currentRent, tenantContact, leaseStart, tenantIdNote, advanceAmount, advanceDate, readOnly, onProfileSave, onAdvanceEdit }: UnitDetailStripProps) {
  const [expanded,        setExpanded]        = useState(false);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [hikeOpen,        setHikeOpen]        = useState(false);
  const [hikeCount,       setHikeCount]       = useState(0);

  const hikeHistory = useLiveQuery(
    () => db.rentHikeLogs.where('unitId').equals(unitId).toArray(),
    [unitId]
  ) ?? [];

  const advanceShortfall = advanceAmount && advanceAmount > 0 ? Math.max(0, currentRent - advanceAmount) : 0;

  return (
    <>
      <TenantProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        unitName={unitName}
        tenantName={tenantName}
        currentContact={tenantContact ?? ''}
        currentLeaseStart={leaseStart ?? null}
        currentIdNote={tenantIdNote ?? ''}
        onSave={onProfileSave}
      />
      <RentHikeDialog
        open={hikeOpen}
        onClose={() => setHikeOpen(false)}
        unitName={unitName}
        unitId={unitId}
        unitType={unitType}
        currentRent={currentRent}
        hikeHistory={hikeHistory}
        onHikeAdded={() => setHikeCount(c => c + 1)}
      />

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
      >
        <span className="flex items-center gap-1">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {tenantContact ? <Phone className="w-3 h-3 text-primary" /> : null}
          {leaseStart ? <Calendar className="w-3 h-3 text-primary" /> : null}
          {hikeHistory.length > 0 ? <TrendingUp className="w-3 h-3 text-success" /> : null}
          {advanceAmount && advanceAmount > 0 ? <IndianRupee className="w-3 h-3 text-warning" /> : null}
          <span className="ml-0.5">Details{hikeHistory.length > 0 ? ` · ${hikeHistory.length} hike${hikeHistory.length !== 1 ? 's' : ''}` : ''}</span>
        </span>
        {!readOnly && (
          <span className="flex items-center gap-2">
            <span className="text-primary underline-offset-2 hover:underline" onClick={e => { e.stopPropagation(); setProfileOpen(true); }}>Edit profile</span>
            <span className="text-success underline-offset-2 hover:underline" onClick={e => { e.stopPropagation(); setHikeOpen(true); }}>Log hike</span>
            <span className="text-warning underline-offset-2 hover:underline" onClick={e => { e.stopPropagation(); onAdvanceEdit(); }}>Advance</span>
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 ml-1 p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {tenantContact && (
              <div className="flex items-center gap-1 col-span-2">
                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-foreground font-medium">{tenantContact}</span>
              </div>
            )}
            {leaseStart && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>Lease: <span className="font-medium">{format(new Date(leaseStart), 'MMM yyyy')}</span></span>
              </div>
            )}
            {advanceAmount && advanceAmount > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-warning shrink-0" />
                <span>Advance: <span className="font-semibold text-warning">{formatCurrency(advanceAmount)}</span>
                  {advanceDate && <span className="text-muted-foreground ml-1">{format(new Date(advanceDate), 'dd MMM yy')}</span>}
                </span>
              </div>
            )}
            {advanceShortfall > 0 && (
              <div className="col-span-2 flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Balance due: <span className="font-semibold">{formatCurrency(advanceShortfall)}</span></span>
              </div>
            )}
            {tenantIdNote && (
              <div className="col-span-2 flex items-start gap-1">
                <FileText className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{tenantIdNote}</span>
              </div>
            )}
          </div>
          {hikeHistory.length > 0 && (
            <div className="pt-1 border-t border-border/30 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Rent History</p>
              {[...hikeHistory]
                .sort((a, b) => new Date(b.hikeDate).getTime() - new Date(a.hikeDate).getTime())
                .slice(0, 3)
                .map(h => (
                  <div key={h.id} className="flex justify-between">
                    <span className="text-muted-foreground">{format(new Date(h.hikeDate), 'MMM yyyy')}</span>
                    <span>{formatCurrency(h.oldRent)} → <span className="text-success font-semibold">{formatCurrency(h.newRent)}</span></span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── RENT COLLECTION HISTORY CHART ───────────────────────────────────────────
interface CollectionHistoryEntry {
  month: string;
  date: string;
  gunturCollected: number;
  gorantlaCollected: number;
  total: number;
  paidUnits: number;
  totalUnits: number;
}

function RentCollectionHistoryChart() {
  const historyRow = useLiveQuery(() => db.appSettings.get('rentalCollectionHistory'), []);
  const history: CollectionHistoryEntry[] = historyRow?.value ?? [];

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Collection History (12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No history yet.</p>
            <p className="text-xs text-muted-foreground">Use <strong>Month-End Reset</strong> each month to log collections here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reverse to show oldest → newest left-to-right
  const chartData = [...history].reverse().map(h => ({
    month: h.month?.split(' ')[0] ?? '?', // just "March" not "March 2026"
    guntur: h.gunturCollected ?? 0,
    gorantla: h.gorantlaCollected ?? 0,
    total: h.total ?? 0,
    pct: h.totalUnits > 0 ? Math.round((h.paidUnits / h.totalUnits) * 100) : 0,
  }));

  const maxTotal = Math.max(...chartData.map(d => d.total), 1);
  const avgTotal = Math.round(chartData.reduce((s, d) => s + d.total, 0) / chartData.length);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Collection History (last {history.length} months)
          </span>
          <span className="text-xs font-normal text-muted-foreground">avg {formatCurrency(avgTotal)}/mo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={18} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: any, name: string) => [formatCurrency(v), name === 'guntur' ? 'Guntur' : 'Gorantla']}
              labelFormatter={l => `Month: ${l}`}
              contentStyle={{ fontSize: 11 }}
            />
            <ReferenceLine y={avgTotal} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={1} />
            <Bar dataKey="guntur" name="guntur" stackId="a" fill="hsl(var(--primary))" opacity={0.85} radius={[0, 0, 0, 0]} />
            <Bar dataKey="gorantla" name="gorantla" stackId="a" fill="hsl(var(--accent))" opacity={0.85} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-card border text-center">
            <p className="text-muted-foreground">Best Month</p>
            <p className="font-bold text-success tabular-nums">{formatCurrency(maxTotal)}</p>
          </div>
          <div className="p-2 rounded-lg bg-card border text-center">
            <p className="text-muted-foreground">Average</p>
            <p className="font-bold tabular-nums">{formatCurrency(avgTotal)}</p>
          </div>
          <div className="p-2 rounded-lg bg-card border text-center">
            <p className="text-muted-foreground">Months logged</p>
            <p className="font-bold tabular-nums">{history.length}</p>
          </div>
        </div>

        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/80" /> Guntur</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent/80" /> Gorantla</span>
          <span className="flex items-center gap-1"><span className="inline-block w-8 border-t border-dashed border-muted-foreground/60 mt-1" /> Avg</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT TABS ─────────────────────────────────────────────────────
type Tab = 'collection' | 'waterfall' | 'history';

export function PropertyRentalEngine() {
  const role = useRole();
  const readOnly = role === 'GUEST';

  const [activeTab, setActiveTab] = React.useState<Tab>('collection');

  const shops    = useLiveQuery(() => db.gunturShops.toArray(),    [], []) ?? [];
  const rooms    = useLiveQuery(() => db.gorantlaRooms.toArray(),  [], []) ?? [];
  const progress = useLiveQuery(() => db.waterfallProgress.toArray(), [], []) ?? [];
  const loans    = useLiveQuery(() => db.loans.toArray(), []) ?? [];

  // Seed defaults if tables are empty
  useEffect(() => {
    (async () => {
      const sc = await db.gunturShops.count();
      if (sc === 0) {
        const now = new Date();
        await db.gunturShops.bulkAdd(DEFAULT_SHOPS.map(s => ({ ...s, updatedAt: now })));
      }
      const rc = await db.gorantlaRooms.count();
      if (rc === 0) {
        const now = new Date();
        await db.gorantlaRooms.bulkAdd(DEFAULT_GORANTLA.map(r => ({ ...r, updatedAt: now })));
      }
    })();
  }, []);

  // Advance dialog state
  const [advanceDialog, setAdvanceDialog] = React.useState<{
    open: boolean; unitId: string; unitType: 'shop' | 'room'; unitName: string;
    currentAmount: number; currentDate: Date | null;
  } | null>(null);

  const gunturTaxSetting   = useLiveQuery(() => db.appSettings.get('gunturTaxSettings'), []);
  const gorantlaTaxSetting = useLiveQuery(() => db.appSettings.get('gorantlaTaxSettings'), []);

  const gunturTax   = React.useMemo(() => { try { return JSON.parse(gunturTaxSetting?.value ?? '{}'); } catch { return {}; } }, [gunturTaxSetting]);
  const gorantlaTax = React.useMemo(() => { try { return JSON.parse(gorantlaTaxSetting?.value ?? '{}'); } catch { return {}; } }, [gorantlaTaxSetting]);

  // ── Per-unit collection breakdown ──
  const occupiedShops      = shops.filter(s => s.status === 'Occupied');
  const gunturExpected     = occupiedShops.reduce((s, sh) => s + sh.rent, 0);
  const gunturCollected    = occupiedShops.filter(s => s.paid).reduce((s, sh) => s + sh.rent, 0);
  const gorantlaExpected   = rooms.reduce((s, r) => s + r.rent, 0);
  const gorantlaCollected  = rooms.filter(r => r.paid).reduce((s, r) => s + r.rent, 0);
  const gunturUnpaid       = occupiedShops.filter(s => !s.paid);
  const gorantlaUnpaid     = rooms.filter(r => !r.paid);

  // ── P0 deductions ──
  const gunturP0   = (gunturTax.propertyTax ?? 0) + (gunturTax.waterTax ?? 0);
  const gorantlaP0 = (gorantlaTax.propertyTax ?? 0) + (gorantlaTax.waterTax ?? 0) + DWACRA_DEDUCTION;

  const gunturExpectedNet   = Math.max(0, gunturExpected  - gunturP0);
  const gorantlaExpectedNet = Math.max(0, gorantlaExpected - gorantlaP0);
  const combinedExpectedNet = gunturExpectedNet + gorantlaExpectedNet;

  const gunturCollectedNet   = Math.max(0, gunturCollected  - gunturP0);
  const gorantlaCollectedNet = Math.max(0, gorantlaCollected - gorantlaP0);
  const combinedCollectedNet = gunturCollectedNet + gorantlaCollectedNet;

  const actualFills   = cascadeIncome(combinedCollectedNet);
  const expectedFills = cascadeIncome(combinedExpectedNet);

  const collectionPct = combinedExpectedNet > 0 ? Math.round((combinedCollectedNet / combinedExpectedNet) * 100) : 0;

  // ── P1 / P2 timelines ──
  const recoveryAccumulated = progress.find(p => p.bucketId === 'recovery')?.accumulated ?? 0;
  const p2Accumulated       = progress.find(p => p.bucketId === 'sinking')?.accumulated  ?? 0;

  const p1Remaining    = Math.max(0, INS_RECOVERY_TARGET - recoveryAccumulated);
  const p1PctDone      = Math.min(100, (recoveryAccumulated / INS_RECOVERY_TARGET) * 100);
  const p1MonthsLeft   = combinedExpectedNet > 0 ? Math.ceil(p1Remaining / Math.min(combinedExpectedNet, INS_RECOVERY_MONTHLY)) : 999;
  const p1MaturityDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + p1MonthsLeft); return d; })();
  const p1Done         = p1Remaining <= 0;

  const p2Saving       = p1Done ? INS_2029_MONTHLY_UPSHIFT : INS_RECOVERY_MONTHLY;
  const p2Remaining    = Math.max(0, INS_2029_TARGET - p2Accumulated);
  const p2PctDone      = Math.min(100, (p2Accumulated / INS_2029_TARGET) * 100);
  const p2MonthsLeft   = p2Saving > 0 ? Math.ceil(p2Remaining / p2Saving) : 999;
  const p2MaturityDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + (p1Done ? 0 : p1MonthsLeft) + p2MonthsLeft); return d; })();

  const feb2029          = new Date(2029, 1, 1);
  const p2SafeByDeadline = p2MaturityDate <= feb2029;

  // ── What-If ──
  const [vacantShops,  setVacantShops]  = React.useState(0);
  const [vacantMonths, setVacantMonths] = React.useState(1);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const totalCollected = gunturCollected + gorantlaCollected;
  const allPaidCount = occupiedShops.filter(s => s.paid).length + rooms.filter(r => r.paid).length;
  const totalUnits = occupiedShops.length + rooms.length;

  const handleMonthEndReset = async () => {
    setResetting(true);
    try {
      const now = new Date();
      const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      await Promise.all([
        ...shops.map(s => db.gunturShops.update(s.id, { paid: false, updatedAt: now })),
        ...rooms.map(r => db.gorantlaRooms.update(r.id, { paid: false, updatedAt: now })),
      ]);

      const histKey = 'rentalCollectionHistory';
      const existing = await db.appSettings.get(histKey);
      const prev: any[] = existing?.value ?? [];
      await db.appSettings.put({
        key: histKey,
        value: [{
          month: monthLabel,
          date: now.toISOString(),
          gunturCollected,
          gorantlaCollected,
          total: totalCollected,
          paidUnits: allPaidCount,
          totalUnits,
        }, ...prev].slice(0, 12),
      });

      toast.success(`Month-end reset done! ₹${totalCollected.toLocaleString('en-IN')} collected in ${monthLabel} logged.`);
      setShowResetConfirm(false);
    } catch {
      toast.error('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const avgShopRent  = occupiedShops.length > 0 ? gunturExpected / occupiedShops.length : 0;
  const vacancyLoss  = vacantShops * avgShopRent * vacantMonths;
  const whatIfNet    = Math.max(0, combinedExpectedNet - vacantShops * avgShopRent);
  const whatIfP1Mo   = whatIfNet > 0 ? Math.ceil(p1Remaining / Math.min(whatIfNet, INS_RECOVERY_MONTHLY)) : 999;
  const whatIfP1Date = (() => { const d = new Date(); d.setMonth(d.getMonth() + whatIfP1Mo); return d; })();
  const p1Slip       = Math.max(0, whatIfP1Mo - p1MonthsLeft);
  const whatIfP2Mo   = p2Saving > 0 ? Math.ceil(p2Remaining / p2Saving) : 999;
  const whatIfP2Date = (() => { const d = new Date(); d.setMonth(d.getMonth() + whatIfP1Mo + whatIfP2Mo); return d; })();
  const p2SlipSafe   = whatIfP2Date <= feb2029;

  // ── Debt-freedom What-If impact ──
  const activeLoans = loans.filter(l => l.isActive !== false);
  const incredLoan  = activeLoans.find(l => l.id === 'loan-incred-2026') ?? activeLoans.find(l => { const n = (l.name ?? '').toLowerCase(); return n.includes('incred') || n.includes('education'); });
  const iciciLoan   = activeLoans.find(l => l.id === 'loan-icici-master-2026') ?? activeLoans.find(l => { const n = (l.name ?? '').toLowerCase(); return n.includes('master') || (n.includes('icici') && (l.principal ?? 0) > 20_00_000); });
  const incredOut   = incredLoan ? (incredLoan.outstanding ?? incredLoan.principal) : INCRED_OUTSTANDING;
  const iciciOut    = iciciLoan  ? (iciciLoan.outstanding  ?? iciciLoan.principal)  : ICICI_OUTSTANDING;

  // P5 = what's left after P0-P4
  const baseP5      = Math.max(0, combinedExpectedNet - INS_RECOVERY_MONTHLY - INS_RECOVERY_MONTHLY - 45000);
  const whatIfP5    = Math.max(0, whatIfNet - INS_RECOVERY_MONTHLY - INS_RECOVERY_MONTHLY - 45000);
  const baseSim     = simSequential(incredOut, iciciOut, baseP5);
  const whatIfSim   = simSequential(incredOut, iciciOut, whatIfP5);
  const debtSlipMo  = Math.max(0, whatIfSim.totalMonths - baseSim.totalMonths);

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  const TABS: { id: Tab; label: string }[] = [
    { id: 'collection', label: 'Collection' },
    { id: 'waterfall',  label: 'Waterfall'  },
    { id: 'history',    label: 'History'    },
  ];

  return (
    <div className="space-y-4">

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── COLLECTION TAB ── */}
      {activeTab === 'collection' && (
        <>
          {/* Collection Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  This Month's Collection
                </span>
                <Button
                  size="sm" variant="outline"
                  className="h-7 text-xs border-warning/40 text-warning hover:bg-warning/10"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Month-End Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Collected {formatCurrency(gunturCollected + gorantlaCollected)} of {formatCurrency(gunturExpected + gorantlaExpected)} gross</span>
                  <span className={`font-semibold ${collectionPct === 100 ? 'text-success' : collectionPct >= 70 ? 'text-warning' : 'text-destructive'}`}>{collectionPct}%</span>
                </div>
                <Progress value={collectionPct} className="h-2" />
              </div>

              {/* Guntur per-shop grid */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Guntur — {occupiedShops.filter(s => s.paid).length}/{occupiedShops.length} shops paid
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {occupiedShops.map(shop => (
                    <div
                      key={shop.id}
                      className={`flex flex-col items-center p-2 rounded-lg border text-xs cursor-pointer transition-colors ${shop.paid ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}
                      onClick={async () => {
                        if (!readOnly) {
                          await db.gunturShops.update(shop.id, { paid: !shop.paid, updatedAt: new Date() });
                        }
                      }}
                    >
                      <span className="font-medium">{shop.name}</span>
                      <span>{shop.paid ? '✓' : '✗'} {formatCurrency(shop.rent)}</span>
                    </div>
                  ))}
                </div>
                {gunturUnpaid.length > 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {gunturUnpaid.map(s => s.name).join(', ')} unpaid — missing {formatCurrency(gunturUnpaid.reduce((s, sh) => s + sh.rent, 0))}
                  </p>
                )}
              </div>

              {/* Gorantla per-room grid */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Gorantla — {rooms.filter(r => r.paid).length}/{rooms.length} rooms paid
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className={`flex justify-between items-center p-2 rounded-lg border text-xs cursor-pointer transition-colors ${room.paid ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}
                      onClick={async () => {
                        if (!readOnly) {
                          await db.gorantlaRooms.update(room.id, { paid: !room.paid, updatedAt: new Date() });
                        }
                      }}
                    >
                      <span className="font-medium truncate">{room.name}</span>
                      <span>{room.paid ? '✓' : '✗'} {formatCurrency(room.rent)}</span>
                    </div>
                  ))}
                </div>
                {gorantlaUnpaid.length > 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {gorantlaUnpaid.map(r => r.name).join(', ')} unpaid — missing {formatCurrency(gorantlaUnpaid.reduce((s, r) => s + r.rent, 0))}
                  </p>
                )}
              </div>

              {/* Unit detail strips */}
              <Separator />
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tenant Profiles & Hike Log</p>
                {occupiedShops.map(shop => (
                  <UnitDetailStrip
                    key={shop.id}
                    unitId={shop.id} unitType="shop" unitName={shop.name}
                    tenantName={shop.tenant} currentRent={shop.rent}
                    tenantContact={shop.tenantContact} leaseStart={shop.leaseStart}
                    tenantIdNote={shop.tenantIdNote} advanceAmount={shop.advanceAmount}
                    advanceDate={shop.advanceDate} readOnly={readOnly}
                    onProfileSave={async (c, ls, note) => {
                      await db.gunturShops.update(shop.id, { tenantContact: c, leaseStart: ls ?? undefined, tenantIdNote: note, updatedAt: new Date() });
                    }}
                    onAdvanceEdit={() => setAdvanceDialog({ open: true, unitId: shop.id, unitType: 'shop', unitName: shop.name, currentAmount: shop.advanceAmount ?? 0, currentDate: shop.advanceDate ? new Date(shop.advanceDate) : null })}
                  />
                ))}
                {rooms.map(room => (
                  <UnitDetailStrip
                    key={room.id}
                    unitId={room.id} unitType="room" unitName={room.name}
                    tenantName={room.tenant} currentRent={room.rent}
                    tenantContact={room.tenantContact} leaseStart={room.leaseStart}
                    tenantIdNote={room.tenantIdNote} advanceAmount={room.advanceAmount}
                    advanceDate={room.advanceDate} readOnly={readOnly}
                    onProfileSave={async (c, ls, note) => {
                      await db.gorantlaRooms.update(room.id, { tenantContact: c, leaseStart: ls ?? undefined, tenantIdNote: note, updatedAt: new Date() });
                    }}
                    onAdvanceEdit={() => setAdvanceDialog({ open: true, unitId: room.id, unitType: 'room', unitName: room.name, currentAmount: room.advanceAmount ?? 0, currentDate: room.advanceDate ? new Date(room.advanceDate) : null })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Month-End Reset Dialog */}
          <Dialog open={showResetConfirm} onOpenChange={v => !v && setShowResetConfirm(false)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-warning" />
                  Month-End Reset
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="p-3 rounded-xl bg-muted/50 border space-y-2 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Month's Summary</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guntur Shops</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(gunturCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gorantla Rooms</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(gorantlaCollected)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total Collected</span>
                    <span className="text-success tabular-nums">{formatCurrency(totalCollected)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Units paid</span>
                    <span>{allPaidCount} / {totalUnits}</span>
                  </div>
                </div>
                {allPaidCount < totalUnits && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                    <p className="text-warning">{totalUnits - allPaidCount} unit{totalUnits - allPaidCount !== 1 ? 's' : ''} not yet marked paid. Reset anyway?</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  This will log today's collection totals to history and clear all paid flags for the new month.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowResetConfirm(false)} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleMonthEndReset}
                    disabled={resetting}
                    className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90"
                  >
                    {resetting ? 'Resetting…' : 'Confirm Reset'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ── WATERFALL TAB ── */}
      {activeTab === 'waterfall' && (
        <>
          {/* Income → Bucket Mapping */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-primary" />
                Income → Priority Mapping (Actual vs Expected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs pb-1 border-b">
                <div className="text-muted-foreground">Bucket</div>
                <div className="text-center font-semibold text-muted-foreground">Collected</div>
                <div className="text-center font-semibold text-muted-foreground">Expected</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs items-center py-1 border-b border-dashed">
                <span className="text-muted-foreground font-medium">Net after P0</span>
                <span className="text-center font-semibold text-primary">{formatCurrency(combinedCollectedNet)}</span>
                <span className="text-center text-muted-foreground">{formatCurrency(combinedExpectedNet)}</span>
              </div>
              {WATERFALL_BUCKETS.map(bucket => {
                const actual    = actualFills[bucket.id]   ?? 0;
                const expected  = expectedFills[bucket.id] ?? 0;
                const shortfall = expected - actual;
                return (
                  <div key={bucket.id} className="grid grid-cols-3 gap-2 text-xs items-center py-1">
                    <span className="flex items-center gap-1 text-muted-foreground truncate">
                      <ArrowRight className="w-3 h-3 shrink-0" />{bucket.label}
                    </span>
                    <span className={`text-center font-semibold ${actual >= expected ? 'text-success' : actual > 0 ? 'text-warning' : 'text-destructive'}`}>
                      {formatCurrency(actual)}
                    </span>
                    <span className="text-center text-muted-foreground">
                      {formatCurrency(expected)}
                      {shortfall > 0 && <span className="text-destructive ml-1">−{formatCurrency(shortfall)}</span>}
                    </span>
                  </div>
                );
              })}

              {(gunturUnpaid.length > 0 || gorantlaUnpaid.length > 0) ? (
                <div className="mt-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-xs space-y-1">
                  <p className="font-semibold text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Action Required</p>
                  {gunturUnpaid.length > 0 && <p>Chase {gunturUnpaid.map(s => s.name).join(', ')} (Guntur) — {formatCurrency(gunturUnpaid.reduce((s, sh) => s + sh.rent, 0))} pending</p>}
                  {gorantlaUnpaid.length > 0 && <p>Chase {gorantlaUnpaid.map(r => r.name).join(', ')} (Gorantla) — {formatCurrency(gorantlaUnpaid.reduce((s, r) => s + r.rent, 0))} pending</p>}
                </div>
              ) : (
                <div className="mt-2 p-2 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  All units paid — {formatCurrency(combinedCollectedNet)} NOI flowing to waterfall ✓
                </div>
              )}
            </CardContent>
          </Card>

          {/* P1 Insurance Recovery */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                P1 — Insurance Recovery (₹1.7L paid Feb 2026)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={p1PctDone} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(recoveryAccumulated)} recovered</span>
                <span className="font-medium">{formatCurrency(INS_RECOVERY_TARGET)} target</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-card border space-y-1">
                  <p className="text-muted-foreground">Monthly Allocation</p>
                  <p className="font-semibold text-primary">{formatCurrency(INS_RECOVERY_MONTHLY)}/mo</p>
                </div>
                <div className={`p-2 rounded-lg border space-y-1 ${p1Done ? 'bg-success/10 border-success/30' : 'bg-card'}`}>
                  <p className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Est. Completion</p>
                  <p className={`font-semibold ${p1Done ? 'text-success' : 'text-foreground'}`}>{p1Done ? '✓ Complete' : fmt(p1MaturityDate)}</p>
                </div>
              </div>
              {p1Done && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20 text-xs text-success">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  P1 complete — auto-upshifts to <strong>{formatCurrency(INS_2029_MONTHLY_UPSHIFT)}/mo</strong> for P2.
                </div>
              )}
            </CardContent>
          </Card>

          {/* P2 2029 Renewal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-accent" />
                P2 — Mother's Health Ins. Reserve (Feb 2029)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">14% medical inflation × 3 yrs → target</span>
                <span className="font-semibold text-accent">{formatCurrency(INS_2029_TARGET)}</span>
              </div>
              <Progress value={p2PctDone} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(p2Accumulated)} saved</span>
                <span className="font-medium">{formatCurrency(INS_2029_TARGET)} target</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-card border space-y-1">
                  <p className="text-muted-foreground">Saving Rate</p>
                  <p className="font-semibold text-accent">
                    {formatCurrency(p2Saving)}/mo
                    {!p1Done && <span className="text-muted-foreground"> (upshifts after P1)</span>}
                  </p>
                </div>
                <div className={`p-2 rounded-lg border space-y-1 ${p2SafeByDeadline ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <p className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Est. Ready</p>
                  <p className={`font-semibold ${p2SafeByDeadline ? 'text-success' : 'text-destructive'}`}>{fmt(p2MaturityDate)}</p>
                </div>
              </div>
              {!p2SafeByDeadline && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>⚠ Current saving rate <strong>won't meet Feb 2029</strong>. Increase P2 allocation or reduce P4 prepayment temporarily.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What-If Vacancy Simulator — now with debt-freedom impact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                What-If: Vacancy Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <label className="text-muted-foreground">Vacant Guntur Shops</label>
                    <span className="font-semibold">{vacantShops} shop{vacantShops !== 1 ? 's' : ''}</span>
                  </div>
                  <Slider min={0} max={5} step={1} value={[vacantShops]} onValueChange={([v]) => setVacantShops(v)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <label className="text-muted-foreground">Duration</label>
                    <span className="font-semibold">{vacantMonths} month{vacantMonths !== 1 ? 's' : ''}</span>
                  </div>
                  <Slider min={1} max={12} step={1} value={[vacantMonths]} onValueChange={([v]) => setVacantMonths(v)} />
                </div>
              </div>

              {vacantShops > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1">
                      <p className="text-muted-foreground">Income Loss</p>
                      <p className="font-bold text-destructive">−{formatCurrency(vacancyLoss)}</p>
                      <p className="text-muted-foreground">over {vacantMonths} mo</p>
                    </div>
                    <div className="p-2 rounded-lg bg-card border space-y-1">
                      <p className="text-muted-foreground">Monthly NOI drops to</p>
                      <p className="font-bold text-warning">{formatCurrency(whatIfNet)}</p>
                      <p className="text-muted-foreground">from {formatCurrency(combinedExpectedNet)}</p>
                    </div>
                  </div>

                  {/* Insurance timeline impact */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-card border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurance Timeline Impact</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P1 Maturity</span>
                      <span className={`font-semibold ${p1Slip > 0 ? 'text-warning' : 'text-success'}`}>
                        {fmt(whatIfP1Date)} {p1Slip > 0 ? `(+${p1Slip} mo slip)` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P2 Ready by</span>
                      <span className={`font-semibold ${p2SlipSafe ? 'text-success' : 'text-destructive'}`}>
                        {fmt(whatIfP2Date)} {!p2SlipSafe ? '⚠ Misses Feb 2029' : '✓ Safe'}
                      </span>
                    </div>
                  </div>

                  {/* Debt-freedom impact */}
                  <div className={`space-y-1.5 p-3 rounded-lg border ${debtSlipMo > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'}`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Debt-Freedom Impact</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P5 surplus drops</span>
                      <span className="font-semibold text-warning">
                        {formatCurrency(baseP5)} → {formatCurrency(whatIfP5)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Debt-free date slips</span>
                      <span className={`font-semibold ${debtSlipMo > 0 ? 'text-destructive' : 'text-success'}`}>
                        {debtSlipMo > 0
                          ? `+${debtSlipMo} months (${fmt(addMonths(new Date(), whatIfSim.totalMonths))})`
                          : 'No impact'}
                      </span>
                    </div>
                    {!whatIfSim.onTrack && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Misses Dec 2029 deadline by {debtSlipMo} months!
                      </p>
                    )}
                    {whatIfSim.onTrack && debtSlipMo === 0 && (
                      <p className="text-xs text-success flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        Still on track for Dec 2029 ✓
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Move the sliders to simulate vacancy impact on insurance timelines and debt-freedom date.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <RentCollectionHistoryChart />
      )}

      {/* Advance dialog */}
      {advanceDialog && (
        <AdvanceDialog
          open={advanceDialog.open}
          onClose={() => setAdvanceDialog(null)}
          unitName={advanceDialog.unitName}
          currentAmount={advanceDialog.currentAmount}
          currentDate={advanceDialog.currentDate}
          onSave={async (amount, date) => {
            if (advanceDialog.unitType === 'shop') {
              await db.gunturShops.update(advanceDialog.unitId, { advanceAmount: amount, advanceDate: date, updatedAt: new Date() });
            } else {
              await db.gorantlaRooms.update(advanceDialog.unitId, { advanceAmount: amount, advanceDate: date, updatedAt: new Date() });
            }
          }}
        />
      )}
    </div>
  );
}
