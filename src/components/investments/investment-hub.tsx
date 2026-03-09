/**
 * InvestmentHub — tabbed instrument-aware investment tracker
 * Tabs: Overview | SIP/MF | EPF | PPF | NPS | SGB | FD/RD
 */
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Investment } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format-utils';
import { MaskedAmount } from '@/components/ui/masked-value';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Plus, ChevronRight, Landmark, PiggyBank,
  Building2, Coins, BarChart3, CreditCard, Pencil, Trash2,
  AlertCircle, CalendarClock, Info
} from 'lucide-react';
import { SIPMFForm } from './forms/sip-mf-form';
import { EPFForm } from './forms/epf-form';
import { PPFForm } from './forms/ppf-form';
import { NPSForm } from './forms/nps-form';
import { SGBForm } from './forms/sgb-form';
import { FDRDForm } from './forms/fd-rd-form';
import { toast } from 'sonner';

type InstrumentTab = 'overview' | 'sip-mf' | 'epf' | 'ppf' | 'nps' | 'sgb' | 'fd-rd';

const TYPE_GROUPS = {
  'sip-mf': ['SIP', 'MF-Growth', 'MF-Dividend', 'Stocks'] as Investment['type'][],
  'epf':    ['EPF'] as Investment['type'][],
  'ppf':    ['PPF'] as Investment['type'][],
  'nps':    ['NPS-T1', 'NPS-T2'] as Investment['type'][],
  'sgb':    ['SGB', 'Gold-ETF'] as Investment['type'][],
  'fd-rd':  ['FD', 'RD', 'Bonds'] as Investment['type'][],
};

function groupInvestments(all: Investment[]) {
  const groups: Record<string, Investment[]> = { 'sip-mf': [], epf: [], ppf: [], nps: [], sgb: [], 'fd-rd': [], other: [] };
  for (const inv of all) {
    let placed = false;
    for (const [key, types] of Object.entries(TYPE_GROUPS)) {
      if ((types as string[]).includes(inv.type)) { groups[key].push(inv); placed = true; break; }
    }
    if (!placed) groups.other.push(inv);
  }
  return groups;
}

function totalOf(list: Investment[]) {
  return {
    current: list.reduce((s, i) => s + (i.currentValue || 0), 0),
    invested: list.reduce((s, i) => s + (i.investedValue || 0), 0),
  };
}

// ── Mini card shown in overview grid ─────────────────────────────────────────
function SummaryTile({ label, icon: Icon, current, invested, color, onClick }: {
  label: string; icon: React.ElementType; current: number; invested: number; color: string; onClick: () => void;
}) {
  const ret = current - invested;
  const retPct = invested > 0 ? (ret / invested) * 100 : 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 active:scale-[0.98] transition-all space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-base font-black tabular-nums text-foreground">
        <MaskedAmount amount={current} permission="showInvestments" />
      </p>
      <p className={cn('text-[10px] font-medium', ret >= 0 ? 'text-success' : 'text-destructive')}>
        {ret >= 0 ? '+' : ''}{retPct.toFixed(1)}% returns
      </p>
    </button>
  );
}

// ── Single investment card ────────────────────────────────────────────────────
function InvestmentCard({ inv, onEdit, onDelete }: {
  inv: Investment; onEdit: (i: Investment) => void; onDelete: (id: string) => void;
}) {
  const ret  = (inv.currentValue || 0) - (inv.investedValue || 0);
  const retP = (inv.investedValue || 0) > 0 ? (ret / (inv.investedValue || 0)) * 100 : 0;

  // ── XIRR calculation ──────────────────────────────────────────────────────
  // Simple: two cash-flows: -investedValue at purchaseDate, +currentValue today
  const xirrPct = useMemo(() => {
    const invested = inv.investedValue || 0;
    const current  = inv.currentValue  || 0;
    if (invested <= 0 || current <= 0) return null;
    const purchaseDate = inv.purchaseDate instanceof Date ? inv.purchaseDate : new Date(inv.purchaseDate);
    const yearsHeld = Math.max(0.01, (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 3600 * 1000));
    // Simple CAGR formula: (currentValue / investedValue)^(1/years) - 1
    const cagr = Math.pow(current / invested, 1 / yearsHeld) - 1;
    return isFinite(cagr) ? cagr * 100 : null;
  }, [inv.investedValue, inv.currentValue, inv.purchaseDate]);

  // Extra info chips based on type
  const chips: string[] = [];
  if (inv.isSIP && inv.sipAmount) chips.push(`SIP ₹${inv.sipAmount.toLocaleString('en-IN')}/mo`);
  if (inv.uan) chips.push(`UAN: ${inv.uan}`);
  if (inv.pran) chips.push(`PRAN: ${inv.pran}`);
  if (inv.ppfAccountNo) chips.push(`A/C: ${inv.ppfAccountNo}`);
  if (inv.sgbSeries) chips.push(inv.sgbSeries);
  if (inv.bankName && (inv.type === 'FD' || inv.type === 'RD')) chips.push(inv.bankName);
  if (inv.fdRate) chips.push(`${inv.fdRate}% p.a.`);
  if (inv.maturityDate) chips.push(`Matures: ${new Date(inv.maturityDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`);
  if (inv.npsEquityPct !== undefined) chips.push(`E:${inv.npsEquityPct}% C:${inv.npsCorpDebtPct ?? 0}% G:${inv.npsGovDebtPct ?? 0}%`);
  if (inv.sgbCouponAccount) chips.push(`Coupon → ${inv.sgbCouponAccount}`);

  // 80C/NPS limit warnings
  const warn80C = inv.type === 'PPF' && inv.ppfAnnualContribution && inv.ppfAnnualContribution > 150000;
  const warnNPS = (inv.type === 'NPS-T1') && inv.nps80CCDUsed && inv.nps80CCDUsed > 50000;

  return (
    <Card className="glass hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{inv.name}</p>
            <Badge variant="secondary" className="text-[10px] mt-1">{inv.type}</Badge>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(inv)}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(inv.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Current Value', val: formatCurrency(inv.currentValue || 0), cls: 'text-foreground' },
            { label: 'Invested',       val: formatCurrency(inv.investedValue  || 0), cls: 'text-foreground' },
            { label: 'Returns',        val: `${formatCurrency(ret)} (${retP.toFixed(1)}%)`, cls: ret >= 0 ? 'text-success' : 'text-destructive' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn('font-medium tabular-nums', cls)}>{val}</span>
            </div>
          ))}
          {xirrPct !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAGR</span>
              <span className={cn('font-semibold tabular-nums', xirrPct >= 0 ? 'text-success' : 'text-destructive')}>
                {xirrPct >= 0 ? '+' : ''}{xirrPct.toFixed(1)}% p.a.
              </span>
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>)}
          </div>
        )}

        {(warn80C || warnNPS) && (
          <div className="flex items-center gap-1.5 text-[10px] text-warning">
            <AlertCircle className="h-3 w-3" />
            {warn80C ? 'PPF contribution exceeds ₹1.5L 80C limit' : 'NPS 80CCD(1B) exceeds ₹50k limit'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyInstrument({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <PiggyBank className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No {label} entries yet.</p>
        <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-xl gap-1.5" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add {label}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── NPS 80CCD(1B) usage bar ───────────────────────────────────────────────────
function NPS80CCDBar({ npsList }: { npsList: Investment[] }) {
  const used = npsList.reduce((s, i) => s + (i.nps80CCDUsed || 0), 0);
  const pct  = Math.min(100, (used / 50000) * 100);
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> 80CCD(1B) NPS Limit
          </p>
          <span className="text-xs tabular-nums font-bold text-primary">{formatCurrency(used)} / ₹50,000</span>
        </div>
        <Progress value={pct} className={pct >= 100 ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'} />
        <p className="text-[10px] text-muted-foreground mt-1">
          {used >= 50000 ? 'Limit exhausted' : `₹${(50000 - used).toLocaleString('en-IN')} remaining for extra 80CCD(1B) deduction`}
        </p>
      </CardContent>
    </Card>
  );
}

// ── PPF maturity countdown ─────────────────────────────────────────────────────
function PPFMaturityInfo({ ppfList }: { ppfList: Investment[] }) {
  const withOpenDate = ppfList.filter(i => i.ppfOpenDate);
  if (!withOpenDate.length) return null;
  return (
    <div className="space-y-2">
      {withOpenDate.map(i => {
        const maturity = new Date(i.ppfOpenDate!);
        maturity.setFullYear(maturity.getFullYear() + 15);
        const yearsLeft = Math.max(0, (maturity.getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000));
        return (
          <Card key={i.id} className="border-success/20 bg-success/5">
            <CardContent className="p-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{i.name} — Maturity</p>
              <div className="text-right">
                <p className="text-xs font-bold text-success">{maturity.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                <p className="text-[10px] text-muted-foreground">{yearsLeft.toFixed(1)} yrs left</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── SGB coupon calendar ────────────────────────────────────────────────────────
function SGBCouponInfo({ sgbList }: { sgbList: Investment[] }) {
  if (!sgbList.length) return null;
  const totalCouponPA = sgbList.reduce((s, i) => {
    const val   = i.currentValue || (i.sgbUnits || 0) * (i.sgbIssuePrice || 0);
    const coupon = val * 0.025; // 2.5% p.a.
    return s + coupon;
  }, 0);
  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">SGB Annual Coupon (2.5% p.a.)</p>
          <p className="text-[10px] text-muted-foreground">Credited semi-annually to SBI account</p>
        </div>
        <p className="text-sm font-black text-warning tabular-nums">{formatCurrency(totalCouponPA)}/yr</p>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export function InvestmentHub() {
  const investments = useLiveQuery(() => db.investments.toArray()) ?? [];
  const [activeTab, setActiveTab]   = useState<InstrumentTab>('overview');
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<Investment | null>(null);

  const groups = groupInvestments(investments);

  const totalPortfolio = totalOf(investments);
  const totalReturns   = totalPortfolio.current - totalPortfolio.invested;
  const retPct         = totalPortfolio.invested > 0 ? (totalReturns / totalPortfolio.invested) * 100 : 0;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this investment?')) return;
    await db.investments.delete(id);
    toast.success('Deleted');
  };
  const handleEdit = (inv: Investment) => { setEditTarget(inv); setShowForm(true); };
  const handleAdd  = () => { setEditTarget(null); setShowForm(true); };
  const handleFormDone = () => { setShowForm(false); setEditTarget(null); };

  // ── Form dispatcher ────────────────────────────────────────────────────────
  const renderForm = () => {
    const formTab = activeTab === 'overview' ? 'sip-mf' : activeTab;
    const props = { initial: editTarget, onDone: handleFormDone };
    switch (formTab) {
      case 'sip-mf': return <SIPMFForm {...props} />;
      case 'epf':    return <EPFForm   {...props} />;
      case 'ppf':    return <PPFForm   {...props} />;
      case 'nps':    return <NPSForm   {...props} />;
      case 'sgb':    return <SGBForm   {...props} />;
      case 'fd-rd':  return <FDRDForm  {...props} />;
      default:       return <SIPMFForm {...props} />;
    }
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        {renderForm()}
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Overview',  Icon: BarChart3  },
    { key: 'sip-mf',   label: 'SIP/MF',   Icon: TrendingUp },
    { key: 'epf',      label: 'EPF',       Icon: Building2  },
    { key: 'ppf',      label: 'PPF',       Icon: PiggyBank  },
    { key: 'nps',      label: 'NPS',       Icon: Landmark   },
    { key: 'sgb',      label: 'SGB',       Icon: Coins      },
    { key: 'fd-rd',    label: 'FD/RD',     Icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-4">
      {/* ── Portfolio header ─────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Portfolio</p>
            <Button size="sm" onClick={handleAdd} className="h-7 text-xs px-3 gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <p className="text-2xl font-black tabular-nums text-foreground">
            <MaskedAmount amount={totalPortfolio.current} permission="showInvestments" />
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Invested {formatCurrency(totalPortfolio.invested)}</span>
            <span className={cn('text-xs font-bold', totalReturns >= 0 ? 'text-success' : 'text-destructive')}>
              {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)} ({retPct.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as InstrumentTab)}>
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
          {TABS.map(({ key, label, Icon }) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-fit">
              <Icon className="h-3 w-3" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="SIP / MF" icon={TrendingUp} color="bg-primary/10 text-primary"
              current={totalOf(groups['sip-mf']).current} invested={totalOf(groups['sip-mf']).invested}
              onClick={() => setActiveTab('sip-mf')} />
            <SummaryTile label="EPF" icon={Building2} color="bg-success/10 text-success"
              current={totalOf(groups.epf).current} invested={totalOf(groups.epf).invested}
              onClick={() => setActiveTab('epf')} />
            <SummaryTile label="PPF" icon={PiggyBank} color="bg-warning/10 text-warning"
              current={totalOf(groups.ppf).current} invested={totalOf(groups.ppf).invested}
              onClick={() => setActiveTab('ppf')} />
            <SummaryTile label="NPS" icon={Landmark} color="bg-secondary/60 text-secondary-foreground"
              current={totalOf(groups.nps).current} invested={totalOf(groups.nps).invested}
              onClick={() => setActiveTab('nps')} />
            <SummaryTile label="SGB" icon={Coins} color="bg-warning/20 text-warning"
              current={totalOf(groups.sgb).current} invested={totalOf(groups.sgb).invested}
              onClick={() => setActiveTab('sgb')} />
            <SummaryTile label="FD / RD" icon={CreditCard} color="bg-muted text-muted-foreground"
              current={totalOf(groups['fd-rd']).current} invested={totalOf(groups['fd-rd']).invested}
              onClick={() => setActiveTab('fd-rd')} />
          </div>
          <SGBCouponInfo sgbList={groups.sgb} />
          <NPS80CCDBar npsList={groups.nps} />
          <PPFMaturityInfo ppfList={groups.ppf} />
        </TabsContent>

        {/* ── SIP/MF ───────────────────────────────────────────────────────── */}
        <TabsContent value="sip-mf" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Active SIPs: <strong>{groups['sip-mf'].filter(i => i.isSIP && !i.sipEndDate).length}</strong>
              {' · '}Monthly debit: <strong>{formatCurrency(groups['sip-mf'].filter(i => i.isSIP).reduce((s,i) => s+(i.sipAmount||0),0))}</strong>
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          {groups['sip-mf'].length === 0 ? <EmptyInstrument label="SIP/MF" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups['sip-mf'].map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>

        {/* ── EPF ─────────────────────────────────────────────────────────── */}
        <TabsContent value="epf" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Employee Provident Fund</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          {groups.epf.length === 0 ? <EmptyInstrument label="EPF" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups.epf.map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>

        {/* ── PPF ─────────────────────────────────────────────────────────── */}
        <TabsContent value="ppf" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Public Provident Fund · 80C eligible</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          <PPFMaturityInfo ppfList={groups.ppf} />
          {groups.ppf.length === 0 ? <EmptyInstrument label="PPF" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups.ppf.map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>

        {/* ── NPS ─────────────────────────────────────────────────────────── */}
        <TabsContent value="nps" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">NPS Tier 1 (80CCD) & Tier 2</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          <NPS80CCDBar npsList={groups.nps} />
          {groups.nps.length === 0 ? <EmptyInstrument label="NPS" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups.nps.map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>

        {/* ── SGB ─────────────────────────────────────────────────────────── */}
        <TabsContent value="sgb" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Sovereign Gold Bond · 2.5% coupon → SBI</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          <SGBCouponInfo sgbList={groups.sgb} />
          {groups.sgb.length === 0 ? <EmptyInstrument label="SGB" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups.sgb.map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>

        {/* ── FD/RD ───────────────────────────────────────────────────────── */}
        <TabsContent value="fd-rd" className="space-y-3 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Fixed & Recurring Deposits</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-xl gap-1" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          {groups['fd-rd'].length === 0 ? <EmptyInstrument label="FD/RD" onAdd={handleAdd} /> : (
            <div className="grid grid-cols-1 gap-3">
              {groups['fd-rd'].map(i => <InvestmentCard key={i.id} inv={i} onEdit={handleEdit} onDelete={handleDelete} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
