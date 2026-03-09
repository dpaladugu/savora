/**
 * Family Financial Dashboard — live Dexie data
 * Shows: family bank accounts, transfers, brother repayments, health vitals summary
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { MaskedAmount } from '@/components/ui/masked-value';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users, Wallet, TrendingUp, Shield, Heart,
  ArrowRight, Banknote, Globe, Activity,
} from 'lucide-react';

const EDUCATION_LOAN_PRINCIPAL = 2_321_156;

export function FamilyFinancialDashboard() {
  // ── Live queries ────────────────────────────────────────────────────────────
  const bankAccounts  = useLiveQuery(() => db.familyBankAccounts?.toArray() ?? Promise.resolve([])) ?? [];
  const transfers     = useLiveQuery(() => db.familyTransfers?.orderBy('date').reverse().limit(10).toArray() ?? Promise.resolve([])) ?? [];
  const repayments    = useLiveQuery(() => db.brotherRepayments?.toArray() ?? Promise.resolve([])) ?? [];
  const healthRecords = useLiveQuery(() => db.healthRecords?.toArray() ?? Promise.resolve([])) ?? [];
  const loans         = useLiveQuery(() => db.loans.toArray()) ?? [];
  const investments   = useLiveQuery(() => db.investments.toArray()) ?? [];

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const totalFamilyBalance = bankAccounts.reduce((s, a) => s + (a.currentBalance ?? 0), 0);
  const totalTransferred   = transfers.reduce((s, t) => s + t.amount, 0);

  const totalRepaid   = repayments.reduce((s, r) => s + r.amount, 0);
  const brotherOutstanding = Math.max(0, EDUCATION_LOAN_PRINCIPAL - totalRepaid);
  const brotherPct = EDUCATION_LOAN_PRINCIPAL > 0 ? Math.min(100, (totalRepaid / EDUCATION_LOAN_PRINCIPAL) * 100) : 0;

  const motherRecords = healthRecords.filter(r => r.familyMember === 'Mother');
  const grandmaRecords = healthRecords.filter(r => r.familyMember === 'Grandmother' || r.familyMember === 'Grandma');

  const totalDebt    = loans.reduce((s, l) => s + (l.outstanding ?? l.principal), 0);
  const totalAssets  = investments.reduce((s, i) => s + (i.currentValue ?? i.investedValue ?? 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        title="Family Dashboard"
        subtitle="Accounts, transfers, health & liabilities"
        icon={Users}
      />

      {/* ── Net Family Position ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Family Bank Balances', value: totalFamilyBalance, icon: Wallet,      color: 'text-success'     },
          { label: 'Total Transferred',    value: totalTransferred,   icon: ArrowRight,  color: 'text-primary'     },
          { label: 'Family Investments',   value: totalAssets,        icon: TrendingUp,  color: 'text-success'     },
          { label: 'Total Debt Burden',    value: totalDebt,          icon: Banknote,    color: 'text-destructive' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3">
              <Icon className={`h-4 w-4 mb-1.5 ${color}`} />
              <p className={`text-base font-bold tabular-nums ${color}`}>
                <MaskedAmount amount={value} permission="showSalary" />
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Family Bank Accounts ──────────────────────────────────────── */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Family Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {bankAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No accounts added. Go to Family Banking to add accounts.</p>
          ) : bankAccounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/30">
              <div>
                <p className="text-xs font-semibold text-foreground">{acc.owner} — {acc.bankName}</p>
                <p className="text-[10px] text-muted-foreground">{acc.type} {acc.accountNo ? `·  ****${acc.accountNo.slice(-4)}` : ''}</p>
              </div>
              <p className="text-sm font-bold text-success tabular-nums">
                <MaskedAmount amount={acc.currentBalance ?? 0} permission="showSalary" />
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Brother Education Loan ────────────────────────────────────── */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Brother — InCred Repayment
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold text-destructive tabular-nums">
                <MaskedAmount amount={brotherOutstanding} permission="showBrotherUS" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Principal</p>
              <p className="text-sm font-semibold text-muted-foreground">{formatCurrency(EDUCATION_LOAN_PRINCIPAL)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Repaid</span>
              <span className="font-semibold">{brotherPct.toFixed(1)}% · {formatCurrency(totalRepaid)}</span>
            </div>
            <Progress value={brotherPct} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-muted/30 text-center">
              <p className="text-muted-foreground">Payments made</p>
              <p className="font-bold text-foreground">{repayments.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 text-center">
              <p className="text-muted-foreground">Total repaid</p>
              <p className="font-bold text-success">{formatCurrency(totalRepaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Transfers ──────────────────────────────────────────── */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5" /> Recent Family Transfers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1.5">
          {transfers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No transfers recorded yet.</p>
          ) : transfers.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">→ {t.toPerson}</p>
                <p className="text-[10px] text-muted-foreground">{t.purpose} · {t.mode}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold tabular-nums text-primary">{formatCurrency(t.amount)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Health Summary ────────────────────────────────────────────── */}
      <Card className="glass border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" /> Health Records Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Mother', count: motherRecords.length,  icon: Heart },
              { label: 'Grandma', count: grandmaRecords.length, icon: Activity },
            ].map(({ label, count, icon: Icon }) => (
              <div key={label} className="p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center gap-2">
                <Icon className="h-4 w-4 text-destructive/70 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} record{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
          {healthRecords.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">No health records. Go to Health Tracker to add.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
