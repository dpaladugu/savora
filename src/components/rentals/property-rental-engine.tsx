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
  Phone, FileText, TrendingDown, ChevronDown, ChevronUp, User, PlusCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRole } from '@/store/rbacStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { GunturShopRow, GorantlaRoomRow, RentHikeLog } from '@/lib/db';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DWACRA_DEDUCTION         = 5000;
const INS_RECOVERY_TARGET      = 170000;
const INS_RECOVERY_MONTHLY     = 5400;
const INS_2029_MONTHLY_UPSHIFT = 8000;
const MEDICAL_INFLATION_RATE   = 0.14;
const INS_2029_TARGET          = Math.round(INS_RECOVERY_TARGET * Math.pow(1 + MEDICAL_INFLATION_RATE, 3));

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
      // Update the unit's current rent
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
// Reusable expandable row shown under each shop/room card
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

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
      >
        <span className="flex items-center gap-1">
          {tenantContact ? <Phone className="w-3 h-3 text-success" /> : <Phone className="w-3 h-3 opacity-40" />}
          {hikeHistory.length > 0 ? <span className="text-primary font-medium">{hikeHistory.length} hike{hikeHistory.length > 1 ? 's' : ''}</span> : <span className="opacity-60">No hikes logged</span>}
          {advanceShortfall > 0 && <Badge variant="outline" className="text-xs h-4 border-warning/50 text-warning">−{formatCurrency(advanceShortfall)} gap</Badge>}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-1 border-l-2 border-border">
          {/* Profile section */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tenant Profile</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{tenantContact || <em>No contact</em>}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{leaseStart ? format(new Date(leaseStart), 'MMM yyyy') : <em>Lease start unknown</em>}</span>
              </div>
              {tenantIdNote && (
                <div className="col-span-2 flex items-start gap-1 text-muted-foreground">
                  <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{tenantIdNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Advance liability */}
          {(advanceAmount ?? 0) > 0 && (
            <div className="text-xs space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Advance Liability</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Held: <span className="font-semibold text-foreground">{formatCurrency(advanceAmount ?? 0)}</span>{advanceDate ? ` · ${format(new Date(advanceDate), 'MMM yyyy')}` : ''}</span>
                {advanceShortfall > 0
                  ? <span className="text-warning font-medium">−{formatCurrency(advanceShortfall)} shortfall at vacating</span>
                  : <Badge variant="secondary" className="text-xs h-4">Covers full month</Badge>
                }
              </div>
            </div>
          )}

          {/* Hike history */}
          {hikeHistory.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rent History</p>
              <div className="space-y-0.5">
                {[...hikeHistory].sort((a, b) => new Date(a.hikeDate).getTime() - new Date(b.hikeDate).getTime()).map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-16 shrink-0">{format(new Date(h.hikeDate), 'MMM yyyy')}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span>{formatCurrency(h.oldRent)} → <span className="text-success font-semibold">{formatCurrency(h.newRent)}</span></span>
                    {h.note && <span className="italic truncate">· {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" variant="outline" className="h-6 text-xs flex-1 gap-1" onClick={() => setProfileOpen(true)}>
                <User className="w-3 h-3" />{tenantContact ? 'Edit Profile' : 'Add Profile'}
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-xs flex-1 gap-1" onClick={() => setHikeOpen(true)}>
                <PlusCircle className="w-3 h-3" />Log Rent Hike
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type ActivePage = 'guntur' | 'gorantla' | 'planner';

export function PropertyRentalEngine() {
  const role      = useRole();
  const isBrother = role === 'BROTHER';
  const [activePage, setActivePage] = React.useState<ActivePage>('guntur');

  useEffect(() => {
    (async () => {
      const shopCount = await db.gunturShops.count().catch(() => 0);
      if (shopCount === 0) await db.gunturShops.bulkAdd(DEFAULT_SHOPS.map(s => ({ ...s, updatedAt: new Date() }))).catch(() => {});
      const roomCount = await db.gorantlaRooms.count().catch(() => 0);
      if (roomCount === 0) await db.gorantlaRooms.bulkAdd(DEFAULT_GORANTLA.map(r => ({ ...r, updatedAt: new Date() }))).catch(() => {});
    })();
  }, []);

  const tabs: { id: ActivePage; label: string }[] = [
    { id: 'guntur',  label: 'Guntur Waterfall' },
    { id: 'gorantla',label: 'Gorantla' },
    { id: 'planner', label: '📊 Allocation Planner' },
  ];

  return (
    <div className="p-4 space-y-4">
      {isBrother && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <Home className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>You have <strong className="text-foreground">read-only access</strong> to Guntur &amp; Gorantla data.</span>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <Button key={t.id} variant={activePage === t.id ? 'default' : 'outline'} size="sm" onClick={() => setActivePage(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>
      {activePage === 'guntur'   && <GunturWaterfallPage readOnly={isBrother} />}
      {activePage === 'gorantla' && <GorantlaPage        readOnly={isBrother} />}
      {activePage === 'planner'  && <AllocationPlannerPage readOnly={isBrother} />}
    </div>
  );
}

// ─── GORANTLA PAGE ────────────────────────────────────────────────────────────
function GorantlaPage({ readOnly = false }: { readOnly?: boolean }) {
  const rooms = useLiveQuery(() => db.gorantlaRooms.toArray(), []) ?? [];

  const taxSetting = useLiveQuery(() => db.appSettings.get('gorantlaTaxSettings'), []);
  const taxValues  = React.useMemo(() => { try { return JSON.parse(taxSetting?.value ?? '{}'); } catch { return {}; } }, [taxSetting]);
  const [propertyTax, setPropertyTax] = React.useState(0);
  const [waterTax, setWaterTax]       = React.useState(0);
  useEffect(() => { if (taxSetting) { setPropertyTax(taxValues.propertyTax ?? 0); setWaterTax(taxValues.waterTax ?? 0); } }, [taxSetting, taxValues]);
  const saveTaxSettings = (pt: number, wt: number) =>
    db.appSettings.put({ key: 'gorantlaTaxSettings', value: JSON.stringify({ propertyTax: pt, waterTax: wt }) });

  const [advanceRoom, setAdvanceRoom] = useState<GorantlaRoomRow | null>(null);

  const totalTaxDeduction = propertyTax + waterTax;
  const grossRent     = rooms.reduce((s, r) => s + r.rent, 0);
  const collectedRent = rooms.filter(r => r.paid).reduce((s, r) => s + r.rent, 0);
  const netAfterAll   = Math.max(0, grossRent - totalTaxDeduction - DWACRA_DEDUCTION);
  const surplus       = Math.max(0, collectedRent - totalTaxDeduction - DWACRA_DEDUCTION);

  const togglePaid = async (id: string, current: boolean) => {
    if (readOnly) return;
    await db.gorantlaRooms.update(id, { paid: !current, updatedAt: new Date() });
  };

  const handleCollectSurplus = async () => {
    if (surplus <= 0) return;
    const existing = await db.waterfallProgress.where('bucketId').equals('grandma').first();
    if (existing) {
      await db.waterfallProgress.update(existing.id, { accumulated: existing.accumulated + surplus, updatedAt: new Date() });
    } else {
      await db.waterfallProgress.add({ id: crypto.randomUUID(), bucketId: 'grandma', accumulated: surplus, updatedAt: new Date() });
    }
    await db.gorantlaRooms.toCollection().modify({ paid: false, updatedAt: new Date() });
    toast.success(`₹${surplus.toLocaleString()} transferred to Grandma Care Fund`);
  };

  const grandmaProgress = useLiveQuery(() => db.waterfallProgress.where('bucketId').equals('grandma').first(), []);
  const grandmaFund = grandmaProgress?.accumulated ?? 0;

  if (rooms.length === 0) return <div className="text-center text-muted-foreground py-10 text-sm">Loading rooms…</div>;

  return (
    <div className="space-y-4">
      {advanceRoom && (
        <AdvanceDialog
          open={!!advanceRoom}
          onClose={() => setAdvanceRoom(null)}
          unitName={advanceRoom.name}
          currentAmount={advanceRoom.advanceAmount ?? 0}
          currentDate={advanceRoom.advanceDate ? new Date(advanceRoom.advanceDate) : null}
          onSave={async (amount, date) => {
            await db.gorantlaRooms.update(advanceRoom.id, { advanceAmount: amount, advanceDate: date, updatedAt: new Date() });
          }}
        />
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Home className="w-4 h-4 text-primary" />Gorantla (Nagaralu) — 4 Rooms</span>
            <Badge variant="outline">Gross: {formatCurrency(grossRent)}/mo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className={`p-3 rounded-lg border space-y-2 ${room.paid ? 'bg-success/5 border-success/30' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.tenant}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{formatCurrency(room.rent)}</span>
                  {readOnly
                    ? <Badge variant={room.paid ? 'default' : 'outline'} className="text-xs">{room.paid ? '✓ Paid' : 'Unpaid'}</Badge>
                    : <Button size="sm" variant={room.paid ? 'default' : 'outline'} onClick={() => togglePaid(room.id, room.paid)} className="h-7 text-xs">{room.paid ? '✓ Paid' : 'Mark Paid'}</Button>
                  }
                </div>
              </div>
              <UnitDetailStrip
                unitId={room.id}
                unitType="room"
                unitName={room.name}
                tenantName={room.tenant}
                currentRent={room.rent}
                tenantContact={room.tenantContact}
                leaseStart={room.leaseStart ?? null}
                tenantIdNote={room.tenantIdNote}
                advanceAmount={room.advanceAmount}
                advanceDate={room.advanceDate ?? null}
                readOnly={readOnly}
                onProfileSave={async (contact, ls, idNote) => {
                  await db.gorantlaRooms.update(room.id, { tenantContact: contact, leaseStart: ls ?? undefined, tenantIdNote: idNote, updatedAt: new Date() });
                }}
                onAdvanceEdit={() => setAdvanceRoom(room)}
              />
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-destructive" />P0 — Systemic Deductions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Property Tax /mo</label>
                <Input type="number" disabled={readOnly} value={propertyTax}
                  onChange={e => setPropertyTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)} className="h-7 text-xs" placeholder="₹0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Water Tax /mo</label>
                <Input type="number" disabled={readOnly} value={waterTax}
                  onChange={e => setWaterTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)} className="h-7 text-xs" placeholder="₹0" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            {totalTaxDeduction > 0 && (
              <div className="flex justify-between text-destructive">
                <span>− Property &amp; Water Tax</span>
                <span>−{formatCurrency(totalTaxDeduction)}</span>
              </div>
            )}
            <div className="flex justify-between text-destructive">
              <span>− Dwacra Loan</span>
              <span>−{formatCurrency(DWACRA_DEDUCTION)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Net Available</span>
              <span className="text-primary">{formatCurrency(netAfterAll)}</span>
            </div>
          </div>

          {surplus > 0 && !readOnly && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
              <p className="text-sm font-medium text-success">Surplus: {formatCurrency(surplus)} → Grandma Care Fund</p>
              <Button size="sm" onClick={handleCollectSurplus} className="w-full">Transfer to Grandma Care Fund</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><PiggyBank className="w-4 h-4 text-primary" />Grandma Care Fund</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatCurrency(grandmaFund)}</div>
          <p className="text-xs text-muted-foreground mt-1">Accumulated from rent surplus</p>
          <Progress value={Math.min(100, (grandmaFund / 500000) * 100)} className="mt-3" />
          <p className="text-xs text-muted-foreground mt-1">Target: {formatCurrency(500000)} ({Math.round((grandmaFund / 500000) * 100)}%)</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── GUNTUR WATERFALL PAGE ────────────────────────────────────────────────────
function GunturWaterfallPage({ readOnly = false }: { readOnly?: boolean }) {
  const shops    = useLiveQuery(() => db.gunturShops.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.waterfallProgress.toArray(), []) ?? [];

  const taxSetting = useLiveQuery(() => db.appSettings.get('gunturTaxSettings'), []);
  const taxValues  = React.useMemo(() => { try { return JSON.parse(taxSetting?.value ?? '{}'); } catch { return {}; } }, [taxSetting]);
  const [propertyTax, setPropertyTax] = React.useState(0);
  const [waterTax, setWaterTax]       = React.useState(0);
  useEffect(() => { if (taxSetting) { setPropertyTax(taxValues.propertyTax ?? 0); setWaterTax(taxValues.waterTax ?? 0); } }, [taxSetting, taxValues]);
  const saveTaxSettings = (pt: number, wt: number) =>
    db.appSettings.put({ key: 'gunturTaxSettings', value: JSON.stringify({ propertyTax: pt, waterTax: wt }) });

  const [advanceShop, setAdvanceShop] = useState<GunturShopRow | null>(null);

  const totalTaxDeduction = propertyTax + waterTax;
  const bucketProgress: Record<string, number> = {};
  progress.forEach(p => { bucketProgress[p.bucketId] = p.accumulated; });

  const shopIcons: Record<string, React.ReactNode> = {
    Milk: <Droplets className="w-3 h-3" />, Salon: <Scissors className="w-3 h-3" />,
    Tea: <Coffee className="w-3 h-3" />, Noodles: <ChefHat className="w-3 h-3" />, Bags: <ShoppingBag className="w-3 h-3" />,
  };

  const grossRent = shops.reduce((s, sh) => s + sh.rent, 0);
  const netRent   = Math.max(0, grossRent - totalTaxDeduction);

  const updateShopRent = async (id: string, rent: number) => {
    if (readOnly) return;
    await db.gunturShops.update(id, { rent, updatedAt: new Date() });
  };

  const runWaterfall = async () => {
    if (readOnly) { toast.error('Read-only access'); return; }
    let remaining = netRent;
    for (const bucket of WATERFALL_BUCKETS) {
      if (remaining <= 0) break;
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      remaining -= fill;
      const existing = await db.waterfallProgress.where('bucketId').equals(bucket.id).first();
      if (existing) {
        await db.waterfallProgress.update(existing.id, { accumulated: existing.accumulated + fill, updatedAt: new Date() });
      } else {
        await db.waterfallProgress.add({ id: crypto.randomUUID(), bucketId: bucket.id, accumulated: fill, updatedAt: new Date() });
      }
    }
    toast.success(`Waterfall executed! ₹${netRent.toLocaleString('en-IN')} net allocated.`);
  };

  const getWaterfallBars = () => {
    let remaining = netRent;
    return WATERFALL_BUCKETS.map(bucket => {
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      remaining -= fill;
      return { ...bucket, fill, pct: netRent > 0 ? (fill / netRent) * 100 : 0 };
    });
  };

  const bars = getWaterfallBars();

  if (shops.length === 0) return <div className="text-center text-muted-foreground py-10 text-sm">Loading shops…</div>;

  return (
    <div className="space-y-4">
      {advanceShop && (
        <AdvanceDialog
          open={!!advanceShop}
          onClose={() => setAdvanceShop(null)}
          unitName={advanceShop.name}
          currentAmount={advanceShop.advanceAmount ?? 0}
          currentDate={advanceShop.advanceDate ? new Date(advanceShop.advanceDate) : null}
          onSave={async (amount, date) => {
            await db.gunturShops.update(advanceShop.id, { advanceAmount: amount, advanceDate: date, updatedAt: new Date() });
          }}
        />
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Home className="w-4 h-4 text-primary" />Guntur — 6 Shops</span>
            <Badge variant="outline">Gross: {formatCurrency(grossRent)}/mo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {shops.map(shop => (
              <div key={shop.id} className={`p-3 rounded-lg border text-sm ${shop.status === 'Vacant' ? 'border-destructive/30 bg-destructive/5' : shop.paid ? 'border-success/40 bg-success/5' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{shop.name}</span>
                  {shop.status === 'Vacant'
                    ? <Badge variant="destructive" className="text-xs">Vacant</Badge>
                    : <Badge variant="secondary" className="text-xs flex items-center gap-1">{shopIcons[shop.tenant]}{shop.tenant}</Badge>
                  }
                </div>
                {!readOnly && shop.status === 'Occupied'
                  ? <Input type="number" defaultValue={shop.rent} className="h-7 text-xs font-semibold text-primary" onBlur={e => updateShopRent(shop.id, parseFloat(e.target.value) || 0)} />
                  : <div className="text-primary font-semibold">{shop.status === 'Vacant' ? '—' : formatCurrency(shop.rent)}</div>
                }
                {shop.status === 'Occupied' && (
                  readOnly
                    ? <Badge variant={shop.paid ? 'default' : 'outline'} className="mt-1 text-xs w-full justify-center">{shop.paid ? '✓ Paid' : 'Unpaid'}</Badge>
                    : <Button size="sm" variant={shop.paid ? 'default' : 'outline'}
                        onClick={() => db.gunturShops.update(shop.id, { paid: !shop.paid, updatedAt: new Date() })}
                        className="mt-1 h-6 text-xs w-full">
                        {shop.paid ? '✓ Paid' : 'Mark Paid'}
                      </Button>
                )}
                {shop.status === 'Occupied' && (
                  <UnitDetailStrip
                    unitId={shop.id}
                    unitType="shop"
                    unitName={shop.name}
                    tenantName={shop.tenant}
                    currentRent={shop.rent}
                    tenantContact={shop.tenantContact}
                    leaseStart={shop.leaseStart ?? null}
                    tenantIdNote={shop.tenantIdNote}
                    advanceAmount={shop.advanceAmount}
                    advanceDate={shop.advanceDate ?? null}
                    readOnly={readOnly}
                    onProfileSave={async (contact, ls, idNote) => {
                      await db.gunturShops.update(shop.id, { tenantContact: contact, leaseStart: ls ?? undefined, tenantIdNote: idNote, updatedAt: new Date() });
                    }}
                    onAdvanceEdit={() => setAdvanceShop(shop)}
                  />
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-destructive" />P0 — Systemic Deductions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Property Tax /mo</label>
                <Input type="number" disabled={readOnly} value={propertyTax}
                  onChange={e => setPropertyTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)} className="h-7 text-xs" placeholder="₹0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Water Tax /mo</label>
                <Input type="number" disabled={readOnly} value={waterTax}
                  onChange={e => setWaterTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)} className="h-7 text-xs" placeholder="₹0" />
              </div>
            </div>
            {totalTaxDeduction > 0 && (
              <div className="flex justify-between text-xs p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive">
                <span className="font-medium">Total P0 Deduction</span>
                <span className="font-semibold">−{formatCurrency(totalTaxDeduction)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Net to Waterfall</span>
              <span className="text-primary">{formatCurrency(netRent)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-primary" />Waterfall Allocation</span>
            {!readOnly && <Button size="sm" onClick={runWaterfall}>Run Waterfall</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {bars.map(bar => (
              <div key={bar.id} className={`${bar.colorClass} transition-all`} style={{ width: `${bar.pct}%` }} title={`${bar.label}: ${formatCurrency(bar.fill)}`} />
            ))}
          </div>
          <div className="space-y-2">
            {WATERFALL_BUCKETS.map((bucket, i) => {
              const fill          = bars[i].fill;
              const accumulated   = bucketProgress[bucket.id] ?? 0;
              const targetDisplay = bucket.id === 'debt' ? 'Overflow' : formatCurrency(bucket.target);
              const progressPct   = bucket.id === 'debt' ? 100 : Math.min(100, (accumulated / bucket.target) * 100);
              return (
                <div key={bucket.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />{bucket.icon}{bucket.label}
                    </span>
                    <span className="font-medium text-xs">{formatCurrency(fill)} this month</span>
                  </div>
                  {bucket.id !== 'debt' && (
                    <div className="ml-6">
                      <Progress value={progressPct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(accumulated)} / {targetDisplay}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ALLOCATION PLANNER PAGE ──────────────────────────────────────────────────
function AllocationPlannerPage({ readOnly = false }: { readOnly?: boolean }) {
  const shops    = useLiveQuery(() => db.gunturShops.toArray(), []) ?? [];
  const rooms    = useLiveQuery(() => db.gorantlaRooms.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.waterfallProgress.toArray(), []) ?? [];

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

      // Clear all paid flags
      await Promise.all([
        ...shops.map(s => db.gunturShops.update(s.id, { paid: false, updatedAt: now })),
        ...rooms.map(r => db.gorantlaRooms.update(r.id, { paid: false, updatedAt: now })),
      ]);

      // Log collection summary to appSettings history
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

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4">

      {/* ── Collection Status ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            This Month's Collection
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
                <div key={shop.id} className={`flex flex-col items-center p-2 rounded-lg border text-xs ${shop.paid ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
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
                <div key={room.id} className={`flex justify-between items-center p-2 rounded-lg border text-xs ${room.paid ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
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
        </CardContent>
      </Card>

      {/* ── Income → Bucket Mapping ── */}
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
          {/* NOI row */}
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
              {(actualFills['recovery'] ?? 0) < (expectedFills['recovery'] ?? 0) && (
                <p>P1 Recovery shortfall this month: {formatCurrency((expectedFills['recovery'] ?? 0) - (actualFills['recovery'] ?? 0))}</p>
              )}
            </div>
          ) : (
            <div className="mt-2 p-2 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              All units paid — {formatCurrency(combinedCollectedNet)} NOI flowing to waterfall ✓
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── P1 Insurance Recovery ── */}
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

      {/* ── P2 2029 Renewal ── */}
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

      {/* ── What-If Vacancy Simulator ── */}
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
              <div className="space-y-1.5 p-3 rounded-lg bg-card border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timeline Impact</p>
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
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Move the sliders to simulate vacancy impact on insurance timelines.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
