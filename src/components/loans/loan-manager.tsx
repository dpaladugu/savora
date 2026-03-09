
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus, Edit, Trash2, Banknote, AlertTriangle,
  TableIcon, TrendingDown, Calendar, Target, Zap, ChevronDown, ChevronUp,
  PlusCircle, History,
} from 'lucide-react';
import { LoanService } from '@/services/LoanService';
import { toast } from 'sonner';
import { auditLog } from '@/components/audit/audit-log-viewer';
import { formatCurrency } from '@/lib/format-utils';
import { format, addMonths } from 'date-fns';
import { db } from '@/lib/db';
import type { Loan, AmortRow } from '@/lib/db';
import { MaskedAmount } from '@/components/ui/masked-value';
import { useLiveQuery } from 'dexie-react-hooks';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildLiveSchedule(
  outstanding: number,
  annualRoi: number,
  emi: number,
  monthlyPrepay: number,
): { rows: (AmortRow & { date: Date; prepay: number })[]; totalInterest: number } {
  const r = annualRoi / 100 / 12;
  let balance = outstanding;
  let totalInterest = 0;
  const rows: (AmortRow & { date: Date; prepay: number })[] = [];
  let month = 0;

  while (balance > 0 && month < 600) {
    month++;
    const interestPart  = balance * r;
    const principalPart = Math.min(balance, emi - interestPart);
    const prepay        = monthlyPrepay > 0 ? Math.min(balance - principalPart, monthlyPrepay) : 0;
    balance = Math.max(0, balance - principalPart - prepay);
    totalInterest += interestPart;

    rows.push({
      month,
      emi,
      principalPart: Math.round(principalPart),
      interestPart:  Math.round(interestPart),
      balance:       Math.round(balance),
      date:          addMonths(new Date(), month),
      prepay:        Math.round(prepay),
    });

    if (balance <= 0) break;
  }
  return { rows, totalInterest: Math.round(totalInterest) };
}

const fmt = (d: Date) => format(d, 'MMM yyyy');
const feb2029 = new Date(2029, 1, 1);

// ─── PREPAYMENT LOG ───────────────────────────────────────────────────────────
interface PrepayEntry {
  id: string;
  loanId: string;
  loanName: string;
  amount: number;
  date: Date;
  note?: string;
}

function PrepaymentLogModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const [amount,  setAmount]  = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const historyRow = useLiveQuery(() => db.appSettings.get('prepaymentHistory'), []);
  const history: PrepayEntry[] = useMemo(() => {
    if (!historyRow) return [];
    try { return (historyRow.value as PrepayEntry[]).filter(p => p.loanId === loan.id); }
    catch { return []; }
  }, [historyRow, loan.id]);

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      // Update outstanding on the loan
      const current = await db.loans.get(loan.id);
      if (current) {
        const newOutstanding = Math.max(0, (current.outstanding ?? current.principal) - val);
        await db.loans.update(loan.id, { outstanding: newOutstanding, updatedAt: new Date() });
      }

      // Append to prepayment history in appSettings
      const existingRow = await db.appSettings.get('prepaymentHistory');
      const prev: PrepayEntry[] = existingRow?.value ?? [];
      const newEntry: PrepayEntry = {
        id: crypto.randomUUID(),
        loanId: loan.id,
        loanName: loan.name ?? loan.type ?? 'Loan',
        amount: val,
        date: new Date(date),
        note: note || undefined,
      };
      await db.appSettings.put({ key: 'prepaymentHistory', value: [newEntry, ...prev].slice(0, 100) });

      toast.success(`₹${val.toLocaleString('en-IN')} prepayment logged`);
      setAmount(''); setNote('');
    } catch { toast.error('Failed to log prepayment'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <PlusCircle className="h-4 w-4 text-primary" />
            Log Prepayment — {loan.name ?? loan.type}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pb-2">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Outstanding</span>
              <span className="font-semibold text-destructive">{formatCurrency(loan.outstanding ?? loan.principal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate / EMI</span>
              <span className="font-medium">{loan.roi}% · {formatCurrency(loan.emi ?? 0)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" placeholder="25000" value={amount} onChange={e => setAmount(e.target.value)} className="h-10" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional)</Label>
              <Input placeholder="e.g. Bonus surplus — P1 strike" value={note} onChange={e => setNote(e.target.value)} className="h-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Log Prepayment'}
              </Button>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <History className="w-3 h-3" /> Prepayment History
              </p>
              <div className="space-y-1.5">
                {history.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                      <p className="text-muted-foreground">{p.note ?? '—'}</p>
                    </div>
                    <p className="text-muted-foreground tabular-nums">
                      {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AMORTISATION MODAL ───────────────────────────────────────────────────────
function AmortModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const [monthlyPrepay, setMonthlyPrepay] = useState(0);
  const [showFullTable,  setShowFullTable]  = useState(false);

  const roi         = loan.roi ?? loan.interestRate ?? 0;
  const outstanding = loan.outstanding ?? loan.principal;
  const emi         = loan.emi ?? 0;

  const base = useMemo(() => buildLiveSchedule(outstanding, roi, emi, 0),             [outstanding, roi, emi]);
  const sim  = useMemo(() => buildLiveSchedule(outstanding, roi, emi, monthlyPrepay), [outstanding, roi, emi, monthlyPrepay]);

  const baseFreedomDate = base.rows.length > 0 ? base.rows[base.rows.length - 1].date : null;
  const simFreedomDate  = sim.rows.length  > 0 ? sim.rows[sim.rows.length  - 1].date  : null;

  const monthsSaved   = base.rows.length - sim.rows.length;
  const interestSaved = base.totalInterest - sim.totalInterest;
  const baseOnTrack   = baseFreedomDate ? baseFreedomDate <= feb2029 : false;
  const simOnTrack    = simFreedomDate  ? simFreedomDate  <= feb2029 : false;

  const paidOff  = Math.max(0, loan.principal - outstanding);
  const paidPct  = loan.principal > 0 ? Math.round((paidOff / loan.principal) * 100) : 0;

  const now = new Date();
  const monthsTo2029 = Math.max(0,
    (feb2029.getFullYear() - now.getFullYear()) * 12 + (feb2029.getMonth() - now.getMonth())
  );

  const prepayNeededFor2029 = useMemo(() => {
    if (baseOnTrack) return 0;
    let lo = 0, hi = outstanding;
    for (let i = 0; i < 40; i++) {
      const mid = Math.round((lo + hi) / 2);
      const s = buildLiveSchedule(outstanding, roi, emi, mid);
      const fd = s.rows.length > 0 ? s.rows[s.rows.length - 1].date : null;
      if (fd && fd <= feb2029) hi = mid; else lo = mid + 1;
    }
    return hi >= outstanding ? null : hi;
  }, [outstanding, roi, emi, baseOnTrack]);

  const tableRows = showFullTable ? sim.rows : sim.rows.slice(0, 24);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="w-4 h-4 text-primary" />
            {loan.name ?? loan.type} — Amortisation Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 space-y-0.5">
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-bold text-destructive">{formatCurrency(outstanding)}</p>
            </div>
            <div className="p-2 rounded-lg bg-card border space-y-0.5">
              <p className="text-muted-foreground">Rate / EMI</p>
              <p className="font-bold">{roi}% · {formatCurrency(emi)}</p>
            </div>
            <div className={`p-2 rounded-lg border space-y-0.5 ${baseOnTrack ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'}`}>
              <p className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Freedom</p>
              <p className={`font-bold ${baseOnTrack ? 'text-success' : 'text-warning'}`}>{baseFreedomDate ? fmt(baseFreedomDate) : '—'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Paid off: {formatCurrency(paidOff)} ({paidPct}%)</span>
              <span className="text-muted-foreground">Principal: {formatCurrency(loan.principal)}</span>
            </div>
            <Progress value={paidPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Interest remaining: {formatCurrency(base.totalInterest)}</span>
              <span>{base.rows.length} months left</span>
            </div>
          </div>

          {!baseOnTrack && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-warning">⚠ Misses Feb 2029 deadline by {base.rows.length - monthsTo2029} months</p>
                {prepayNeededFor2029 !== null && prepayNeededFor2029 !== undefined && (
                  <p className="text-muted-foreground">Need <span className="font-semibold text-foreground">{formatCurrency(prepayNeededFor2029)}/mo extra</span> prepayment to hit Feb 2029</p>
                )}
              </div>
            </div>
          )}
          {baseOnTrack && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success">
              <Target className="w-4 h-4 shrink-0" />
              <span className="font-semibold">On track for debt-freedom before Feb 2029 ✓</span>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />Prepayment Simulator
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-muted-foreground">Extra monthly prepayment</label>
                <span className="font-semibold text-primary">{monthlyPrepay > 0 ? formatCurrency(monthlyPrepay) : 'None'}</span>
              </div>
              <Slider min={0} max={30000} step={500} value={[monthlyPrepay]} onValueChange={([v]) => setMonthlyPrepay(v)} />
              <div className="grid grid-cols-4 gap-1">
                {[0, 5000, 10000, 20000].map(v => (
                  <Button key={v} size="sm" variant={monthlyPrepay === v ? 'default' : 'outline'} className="h-6 text-xs" onClick={() => setMonthlyPrepay(v)}>
                    {v === 0 ? 'None' : `+${formatCurrency(v)}`}
                  </Button>
                ))}
              </div>
            </div>

            {monthlyPrepay > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-lg border space-y-1 ${simOnTrack ? 'bg-success/5 border-success/30' : 'bg-card'}`}>
                  <p className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />New Freedom Date</p>
                  <p className={`font-bold text-base ${simOnTrack ? 'text-success' : 'text-foreground'}`}>{simFreedomDate ? fmt(simFreedomDate) : '—'}</p>
                  {simOnTrack && <Badge variant="default" className="text-xs">✓ Hits Feb 2029</Badge>}
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                  <p className="text-muted-foreground">You Save</p>
                  <p className="font-bold text-base text-primary">{formatCurrency(interestSaved)}</p>
                  <p className="text-muted-foreground">{monthsSaved} month{monthsSaved !== 1 ? 's' : ''} faster</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TableIcon className="w-3 h-3" />Month-by-Month Schedule
              {monthlyPrepay > 0 && <Badge variant="secondary" className="text-xs">With prepay</Badge>}
            </p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Month</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground">Principal</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground">Interest</th>
                    {monthlyPrepay > 0 && <th className="text-right p-2 font-semibold text-primary">Prepay</th>}
                    <th className="text-right p-2 font-semibold text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => {
                    const isFeb2029Row = row.date >= feb2029 && (i === 0 || tableRows[i - 1].date < feb2029);
                    return (
                      <React.Fragment key={row.month}>
                        {isFeb2029Row && (
                          <tr className="bg-warning/10">
                            <td colSpan={monthlyPrepay > 0 ? 5 : 4} className="p-1.5 text-center text-warning font-semibold text-xs">── Feb 2029 deadline ──</td>
                          </tr>
                        )}
                        <tr className={`border-t ${row.balance === 0 ? 'bg-success/5' : ''}`}>
                          <td className="p-2 text-muted-foreground">{fmt(row.date)}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(row.principalPart)}</td>
                          <td className="p-2 text-right text-destructive">{formatCurrency(row.interestPart)}</td>
                          {monthlyPrepay > 0 && <td className="p-2 text-right text-primary font-medium">{row.prepay > 0 ? formatCurrency(row.prepay) : '—'}</td>}
                          <td className="p-2 text-right font-semibold">{row.balance === 0 ? <span className="text-success">✓ PAID</span> : formatCurrency(row.balance)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sim.rows.length > 24 && (
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1" onClick={() => setShowFullTable(v => !v)}>
                {showFullTable ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {sim.rows.length} months</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── FORM DEFAULTS ────────────────────────────────────────────────────────────
const emptyForm = {
  type: 'Personal' as 'Personal' | 'Personal-Brother' | 'Education-Brother',
  borrower: 'Me' as 'Me' | 'Brother',
  name: '',
  principal: '', roi: '', tenureMonths: '', emi: '', outstanding: '',
  startDate: new Date().toISOString().split('T')[0],
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function LoanManager() {
  const [showModal,   setShowModal]   = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [amortLoan,   setAmortLoan]   = useState<Loan | null>(null);
  const [prepayLoan,  setPrepayLoan]  = useState<Loan | null>(null);
  const [form,        setForm]        = useState({ ...emptyForm });

  // Live reactive
  const loans   = useLiveQuery(() => db.loans.toArray().catch(() => []), []) ?? [];
  const loading = loans === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: form.name || form.type,
        type: form.type, borrower: form.borrower,
        principal: +form.principal, roi: +form.roi,
        tenureMonths: +form.tenureMonths, emi: +form.emi,
        outstanding: +form.outstanding,
        startDate: new Date(form.startDate), isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      };
      if (editingLoan) {
        const old = await db.loans.get(editingLoan.id);
        await LoanService.updateLoan(editingLoan.id, data);
        await auditLog('update', `Loan:${data.name}`, data, old);
      } else {
        await LoanService.createLoan(data);
        await auditLog('create', `Loan:${data.name}`, data);
      }
      toast.success(editingLoan ? 'Loan updated' : 'Loan added');
      setForm({ ...emptyForm }); setShowModal(false); setEditingLoan(null);
    } catch { toast.error('Failed to save loan'); }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setForm({
      name: loan.name ?? '',
      type: loan.type, borrower: loan.borrower,
      principal: loan.principal.toString(), roi: loan.roi.toString(),
      tenureMonths: loan.tenureMonths.toString(), emi: loan.emi.toString(),
      outstanding: loan.outstanding.toString(),
      startDate: new Date(loan.startDate).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Mark loan as inactive?')) return;
    try {
      await LoanService.updateLoan(id, { isActive: false });
      toast.success('Loan marked inactive');
    } catch { toast.error('Failed to update loan'); }
  };

  const active   = loans.filter(l => l.isActive);
  const totalOut = active.reduce((s, l) => s + (l.outstanding ?? 0), 0);
  const totalEMI = active.reduce((s, l) => s + (l.emi ?? 0), 0);
  const hiCount  = active.filter(l => (l.roi ?? 0) > 12).length;

  return (
    <div className="space-y-4">
      {amortLoan  && <AmortModal         loan={amortLoan}  onClose={() => setAmortLoan(null)}  />}
      {prepayLoan && <PrepaymentLogModal loan={prepayLoan} onClose={() => setPrepayLoan(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Loans & EMIs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track balances and repayment schedules</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)} className="h-9 gap-1.5 shrink-0 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Loan
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="glass">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight">Outstanding</p>
            <p className="text-sm font-bold tabular-nums value-negative">
              <MaskedAmount amount={totalOut} permission="showSalary" />
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight">Monthly EMI</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              <MaskedAmount amount={totalEMI} permission="showSalary" />
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight">High Rate</p>
            <p className={`text-sm font-bold tabular-nums ${hiCount > 0 ? 'value-negative' : 'value-positive'}`}>{hiCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan List */}
      <div className="space-y-2">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Banknote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No loans recorded yet.</p>
            </CardContent>
          </Card>
        ) : loans.map(loan => (
          <Card key={loan.id} className={`glass ${!loan.isActive ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{loan.name ?? loan.type} Loan</h3>
                  <Badge variant={loan.isActive ? 'default' : 'secondary'} className="text-[10px]">{loan.isActive ? 'Active' : 'Closed'}</Badge>
                  <Badge variant="outline" className="text-[10px]">{loan.borrower}</Badge>
                  {(loan.roi ?? 0) > 12 && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> High Rate
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {loan.isActive && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-success hover:bg-success/10"
                        onClick={() => setPrepayLoan(loan)} title="Log prepayment">
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                        onClick={() => setAmortLoan(loan)} title="Amortisation schedule">
                        <TableIcon className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(loan)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(loan.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {[
                  { label: 'Principal',   val: formatCurrency(loan.principal)        },
                  { label: 'Rate',        val: `${loan.roi ?? 0}%`                   },
                  { label: 'EMI',         val: formatCurrency(loan.emi ?? 0)         },
                  { label: 'Outstanding', val: formatCurrency(loan.outstanding ?? 0) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <span className="text-muted-foreground">{label}: </span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
              {loan.isActive && loan.outstanding && loan.roi && loan.emi && (() => {
                const s = buildLiveSchedule(loan.outstanding, loan.roi, loan.emi, 0);
                const fd = s.rows.length > 0 ? s.rows[s.rows.length - 1].date : null;
                if (!fd) return null;
                const onTrack = fd <= feb2029;
                return (
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1 font-medium ${onTrack ? 'text-success' : 'text-warning'}`}>
                      <Calendar className="w-3 h-3" />
                      Debt-free: {fmt(fd)} {onTrack ? '✓' : '⚠'}
                    </span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => setPrepayLoan(loan)}>
                      <PlusCircle className="w-3 h-3" /> Prepay
                    </Button>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Loan Name</Label>
              <Input placeholder="e.g. InCred Education Loan" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal" className="text-xs">Personal</SelectItem>
                    <SelectItem value="Personal-Brother" className="text-xs">Personal-Brother</SelectItem>
                    <SelectItem value="Education-Brother" className="text-xs">Education-Brother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Borrower</Label>
                <Select value={form.borrower} onValueChange={(v: any) => setForm(p => ({ ...p, borrower: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Me" className="text-xs">Me</SelectItem>
                    <SelectItem value="Brother" className="text-xs">Brother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {[
              { id: 'principal',    label: 'Principal (₹)',   key: 'principal'    },
              { id: 'roi',          label: 'Interest Rate %', key: 'roi'          },
              { id: 'tenureMonths', label: 'Tenure (months)', key: 'tenureMonths' },
              { id: 'emi',          label: 'EMI (₹)',          key: 'emi'          },
              { id: 'outstanding',  label: 'Outstanding (₹)', key: 'outstanding'  },
            ].map(({ id, label, key }) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs">{label}</Label>
                <Input id={id} type="number" step="0.01" value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="h-9 text-sm" required />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input id="startDate" type="date" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="h-9 text-sm" required />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingLoan ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs"
                onClick={() => { setShowModal(false); setEditingLoan(null); setForm({ ...emptyForm }); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
