/**
 * AuditEngineService — §25 CFA/FRM-style Rules Engine
 * Deterministic financial auditing: DSCR, DIR, Debt-to-Freedom Velocity,
 * Yield-Cost Spread, and the Antifragile Risk Checklist.
 *
 * All calculations are offline-first (IndexedDB only).
 */

import { db } from '@/lib/db';
import { xirr } from '@/lib/xirr';

// ─── Thresholds ──────────────────────────────────────────────────────────────

/** Guntur DSCR thresholds */
export const DSCR_CRITICAL  = 1.0;
export const DSCR_WARNING   = 1.5;

/** DIR target: 180 days = "Antifragile" */
export const DIR_TARGET_DAYS   = 180;
export const DIR_WARNING_DAYS  = 90;

/** 2029 Freedom mission: ₹33L consolidated debt */
export const FREEDOM_TOTAL_DEBT = 3_300_000;

// ─── Enums ───────────────────────────────────────────────────────────────────

export type TrafficLight = 'critical' | 'warning' | 'healthy';

export function dscrSignal(v: number): TrafficLight {
  if (v < DSCR_CRITICAL) return 'critical';
  if (v < DSCR_WARNING)  return 'warning';
  return 'healthy';
}

export function dirSignal(days: number): TrafficLight {
  if (days < DIR_WARNING_DAYS) return 'critical';
  if (days < DIR_TARGET_DAYS)  return 'warning';
  return 'healthy';
}

// ─── Guntur Waterfall constants (from property-rental-engine) ─────────────────
const SINKING_FUND_MONTHLY = 5_400;  // priority bucket 2 deduction from rent

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface DSCRResult {
  /** Net Guntur rent (total occupied shop rents) */
  netGunturRent: number;
  /** Sinking fund monthly allocation deducted from rent */
  sinkingFundMonthly: number;
  /** Total monthly loan EMIs across active loans */
  totalMonthlyEMI: number;
  /** DSCR value: (net rent − sinking) / total EMI */
  value: number;
  signal: TrafficLight;
}

export interface DIRResult {
  /** Sum of cash, savings and liquid mutual fund balances */
  liquidAssets: number;
  /** Average daily expenses (trailing 90 days) */
  avgDailyExpenses: number;
  /** DIR in days */
  days: number;
  signal: TrafficLight;
}

export interface DebtFreedomResult {
  /** Current outstanding across all active loans + CC balances */
  currentOutstanding: number;
  /** Debt already reduced vs ₹33L baseline */
  debtReduced: number;
  /** Percentage of mission complete (0-100) */
  pct: number;
  /** Remaining months to 2029-01-01 from today */
  monthsRemaining: number;
  /** Required monthly paydown to hit zero by 2029 */
  requiredMonthlyPaydown: number;
}

export interface YieldCostSpreadResult {
  /** Weighted average interest rate of active loans (%) */
  weightedLoanRate: number;
  /** Trailing 12-month XIRR of investments (%) */
  investmentXIRR: number;
  /** Spread = XIRR − loan rate (positive = investments outperforming debt cost) */
  spread: number;
  signal: TrafficLight;
}

export interface AuditRisk {
  id: string;
  category: 'insurance' | 'liquidity' | 'coverage' | 'nominee';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  /** Navigation key to send to onMoreNavigation / handleTabChange */
  ctaLabel?: string;
  ctaAction?: 'insurance-manager' | 'debt-strike' | 'sip-planner' | 'insurance-gap' | 'recurring-transactions';
}

export interface AuditEngineResult {
  dscr: DSCRResult;
  dir: DIRResult;
  debtFreedom: DebtFreedomResult;
  yieldCostSpread: YieldCostSpreadResult;
  risks: AuditRisk[];
  /** ISO timestamp of when the snapshot was calculated */
  calculatedAt: string;
  /** Combined health score 0-100 */
  overallScore: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class AuditEngineService {
  /**
   * Run the full CFA/FRM audit.  Pure async — no React hooks.
   */
  static async run(): Promise<AuditEngineResult> {
    const [
      loans,
      investments,
      insurancePolicies,
      insurance,
      creditCards,
      emergencyFunds,
      gunturShops,
      waterfallProgress,
    ] = await Promise.all([
      db.loans.toArray(),
      db.investments.toArray(),
      db.insurancePolicies.toArray().catch(() => [] as any[]),
      db.insurance.toArray().catch(() => [] as any[]),
      db.creditCards.toArray(),
      db.emergencyFunds.toArray(),
      db.gunturShops.toArray().catch(() => [] as any[]),
      db.waterfallProgress.toArray().catch(() => [] as any[]),
    ]);

    // Txns + incomes need date-filtered queries
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo    = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [allTxns, allIncomes, allExpenses] = await Promise.all([
      db.txns.toArray(),
      db.incomes ? db.incomes.toArray().catch(() => [] as any[]) : Promise.resolve([] as any[]),
      db.expenses ? db.expenses.toArray().catch(() => [] as any[]) : Promise.resolve([] as any[]),
    ]);

    // ── 1. DSCR ──────────────────────────────────────────────────────────────
    const dscr = AuditEngineService._calcDSCR(loans, gunturShops);

    // ── 2. DIR ───────────────────────────────────────────────────────────────
    const dir = AuditEngineService._calcDIR(allTxns, allExpenses, ninetyDaysAgo, investments, emergencyFunds, creditCards);

    // ── 3. Debt-to-Freedom Velocity ──────────────────────────────────────────
    const debtFreedom = AuditEngineService._calcDebtFreedom(loans, creditCards);

    // ── 4. Yield-Cost Spread ─────────────────────────────────────────────────
    const yieldCostSpread = AuditEngineService._calcYieldCostSpread(loans, investments, oneYearAgo);

    // ── 5. Risk checklist ────────────────────────────────────────────────────
    const allPolicies = [...insurancePolicies, ...insurance];
    const annualIncome = AuditEngineService._calcAnnualIncome(allIncomes, allTxns, oneYearAgo);
    const risks = AuditEngineService._buildRisks({
      policies: allPolicies,
      investments,
      emergencyFunds,
      dscr,
      dir,
      yieldCostSpread,
      debtFreedom,
      annualIncome,
    });

    // ── 6. Overall score (0-100) ─────────────────────────────────────────────
    const overallScore = AuditEngineService._calcScore(dscr, dir, debtFreedom, yieldCostSpread, risks);

    const result: AuditEngineResult = {
      dscr,
      dir,
      debtFreedom,
      yieldCostSpread,
      risks,
      calculatedAt: now.toISOString(),
      overallScore,
    };

    // Log risk-status change to Audit Log
    await AuditEngineService._logRiskSnapshot(result).catch(() => {});

    return result;
  }

  // ── DSCR: (Net Guntur Rent − Sinking Fund) / Total Monthly EMI ─────────────
  private static _calcDSCR(loans: any[], gunturShops: any[]): DSCRResult {
    const occupiedShopRent = gunturShops
      .filter((s: any) => s.status === 'Occupied')
      .reduce((sum: number, s: any) => sum + (s.rent || 0), 0);

    // Fallback if gunturShops is empty: use constant from waterfall definition
    const netGunturRent = occupiedShopRent > 0 ? occupiedShopRent : 19_600; // sum of defaults

    const totalMonthlyEMI = loans
      .filter((l: any) => l.isActive !== false)
      .reduce((sum: number, l: any) => sum + (l.emi || l.emiAmount || 0), 0);

    const numerator = netGunturRent - SINKING_FUND_MONTHLY;
    const value = totalMonthlyEMI > 0
      ? +(numerator / totalMonthlyEMI).toFixed(3)
      : 999; // no debt = infinite coverage

    return {
      netGunturRent,
      sinkingFundMonthly: SINKING_FUND_MONTHLY,
      totalMonthlyEMI,
      value,
      signal: dscrSignal(value),
    };
  }

  // ── DIR: Liquid Assets / Average Daily Expenses ────────────────────────────
  private static _calcDIR(
    allTxns: any[],
    since: Date,
    investments: any[],
    emergencyFunds: any[],
    creditCards: any[],
  ): DIRResult {
    // Expenses in last 90 days
    const recentExpenses = allTxns
      .filter((t: any) => t.amount < 0 && new Date(t.date) >= since)
      .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

    const daysInWindow = 90;
    const avgDailyExpenses = recentExpenses / daysInWindow || 1; // avoid divide-by-zero

    // Liquid assets: savings accounts (EF), liquid MFs (type includes 'liquid', 'debt', 'FD')
    const liquidMFs = investments
      .filter((i: any) => {
        const t = (i.type || '').toLowerCase();
        return t.includes('liquid') || t.includes('debt') || t.includes('fd') || t.includes('fixed');
      })
      .reduce((s: number, i: any) => s + (i.currentValue || i.investedValue || i.amount || 0), 0);

    const efBalance = emergencyFunds
      .reduce((s: number, e: any) => s + (e.currentAmount || 0), 0);

    // Savings balances: infer from positive-balance credit cards or EF; rough proxy
    const liquidAssets = liquidMFs + efBalance;

    const days = liquidAssets / avgDailyExpenses;

    return {
      liquidAssets: Math.round(liquidAssets),
      avgDailyExpenses: Math.round(avgDailyExpenses),
      days: Math.round(days),
      signal: dirSignal(days),
    };
  }

  // ── Debt-to-Freedom Velocity ───────────────────────────────────────────────
  private static _calcDebtFreedom(loans: any[], creditCards: any[]): DebtFreedomResult {
    const totalOutstanding = loans
      .filter((l: any) => l.isActive !== false)
      .reduce((s: number, l: any) => s + (l.outstanding || l.remainingBalance || l.principal || 0), 0)
      + creditCards.reduce((s: number, c: any) => s + (c.currentBalance || c.balance || 0), 0);

    const debtReduced = Math.max(0, FREEDOM_TOTAL_DEBT - totalOutstanding);
    const pct = clamp(Math.round((debtReduced / FREEDOM_TOTAL_DEBT) * 100), 0, 100);

    // Months to 2029-01-01
    const now = new Date();
    const target = new Date('2029-01-01');
    const monthsRemaining = Math.max(1,
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth())
    );

    const requiredMonthlyPaydown = Math.round(totalOutstanding / monthsRemaining);

    return {
      currentOutstanding: Math.round(totalOutstanding),
      debtReduced: Math.round(debtReduced),
      pct,
      monthsRemaining,
      requiredMonthlyPaydown,
    };
  }

  // ── Yield-Cost Spread ─────────────────────────────────────────────────────
  private static _calcYieldCostSpread(loans: any[], investments: any[], since: Date): YieldCostSpreadResult {
    // Weighted average loan interest rate
    const activeLoans = loans.filter((l: any) => l.isActive !== false && (l.outstanding || l.principal));
    const totalDebt = activeLoans.reduce((s: number, l: any) => s + (l.outstanding || l.principal || 0), 0);
    const weightedLoanRate = totalDebt > 0
      ? activeLoans.reduce((s: number, l: any) => {
          const outstanding = l.outstanding || l.principal || 0;
          const rate = l.interestRate || l.roi || 0;
          return s + (outstanding / totalDebt) * rate;
        }, 0)
      : 0;

    // Trailing 12-month XIRR of investments
    let investmentXIRR = 0;
    try {
      const cashflows: { date: Date; amount: number }[] = [];
      investments.forEach((inv: any) => {
        const purchaseDate = inv.purchaseDate || inv.startDate;
        const invested = inv.amount || inv.investedValue || 0;
        const currentValue = inv.currentValue || invested;
        if (purchaseDate && invested > 0) {
          const pd = new Date(purchaseDate);
          // Only include if purchased within last 12 months or earlier
          cashflows.push({ date: pd, amount: -invested });
          cashflows.push({ date: new Date(), amount: currentValue });
        }
      });
      if (cashflows.length >= 2) {
        const raw = xirr(cashflows.sort((a, b) => a.date.getTime() - b.date.getTime()));
        if (!isNaN(raw)) investmentXIRR = +(raw * 100).toFixed(1);
      }
    } catch {
      investmentXIRR = 0;
    }

    const spread = +(investmentXIRR - weightedLoanRate).toFixed(2);

    // If investments are beating loan cost → healthy; otherwise warning/critical
    const signal: TrafficLight =
      spread >= 3 ? 'healthy' :
      spread >= 0 ? 'warning' :
      'critical';

    return {
      weightedLoanRate: +weightedLoanRate.toFixed(2),
      investmentXIRR,
      spread,
      signal,
    };
  }

  // ── Annual income estimate ─────────────────────────────────────────────────
  private static _calcAnnualIncome(incomes: any[], txns: any[], since: Date): number {
    const fromIncomeTable = incomes
      .filter((i: any) => new Date(i.date) >= since)
      .reduce((s: number, i: any) => s + (i.amount || 0), 0);
    if (fromIncomeTable > 0) return fromIncomeTable;

    // Fallback: positive txn inflows in last 12 months
    return txns
      .filter((t: any) => t.amount > 0 && new Date(t.date) >= since)
      .reduce((s: number, t: any) => s + t.amount, 0);
  }

  // ── Antifragile Risk Checklist ────────────────────────────────────────────
  private static _buildRisks(ctx: {
    policies: any[];
    investments: any[];
    emergencyFunds: any[];
    dscr: DSCRResult;
    dir: DIRResult;
    yieldCostSpread: YieldCostSpreadResult;
    debtFreedom: DebtFreedomResult;
    annualIncome: number;
  }): AuditRisk[] {
    const risks: AuditRisk[] = [];

    // ── 5a. Nominee Gap ──────────────────────────────────────────────────────
    const missingNominee = ctx.policies.filter(
      (p: any) => !(p.nominee || p.nomineeName || p.nomineeRelation)
    );
    if (missingNominee.length > 0) {
      risks.push({
        id: 'nominee-gap',
        category: 'nominee',
        severity: 'critical',
        title: `${missingNominee.length} polic${missingNominee.length > 1 ? 'ies' : 'y'} missing nominee`,
        detail: `${missingNominee.map((p: any) => p.name || p.type || 'Policy').join(', ')} — nominee not set. Critical estate risk.`,
        ctaLabel: 'Add Nominee',
        ctaAction: 'insurance-manager',
      });
    }

    // ── 5b. Liquidity Mismatch: >₹5L in low-yield savings while ignoring debt ─
    const lowYieldSavings = ctx.investments
      .filter((i: any) => {
        const t = (i.type || '').toLowerCase();
        return t.includes('savings') || t.includes('fd') || t.includes('fixed');
      })
      .reduce((s: number, i: any) => s + (i.currentValue || i.investedValue || i.amount || 0), 0);

    if (lowYieldSavings > 500_000 && ctx.debtFreedom.currentOutstanding > 0) {
      risks.push({
        id: 'liquidity-mismatch',
        category: 'liquidity',
        severity: 'warning',
        title: 'Liquidity mismatch detected',
        detail: `₹${(lowYieldSavings / 1_00_000).toFixed(1)}L sitting in low-yield savings while ₹${(ctx.debtFreedom.currentOutstanding / 1_00_000).toFixed(1)}L debt remains. Accelerate debt strike.`,
        ctaLabel: 'Increase ICICI Prepayment',
        ctaAction: 'debt-strike',
      });
    }

    // ── 5c. Coverage Gap (Term < 10× income, Health < 5× income) ──────────
    if (ctx.annualIncome > 0) {
      const termCover = ctx.policies
        .filter((p: any) => (p.type || '').toLowerCase().includes('term'))
        .reduce((s: number, p: any) => s + (p.sumInsured || p.sumAssured || p.coverAmount || 0), 0);
      const healthCover = ctx.policies
        .filter((p: any) => {
          const t = (p.type || '').toLowerCase();
          return t.includes('health') || t.includes('medical');
        })
        .reduce((s: number, p: any) => s + (p.sumInsured || p.sumAssured || p.coverAmount || 0), 0);

      const termRequired  = ctx.annualIncome * 10;
      const healthRequired = ctx.annualIncome * 5;

      if (termCover < termRequired) {
        risks.push({
          id: 'term-gap',
          category: 'coverage',
          severity: termCover === 0 ? 'critical' : 'warning',
          title: 'Term life coverage gap',
          detail: `Current: ₹${(termCover / 1_00_000).toFixed(0)}L. Required: ₹${(termRequired / 1_00_000).toFixed(0)}L (10× income). Gap: ₹${((termRequired - termCover) / 1_00_000).toFixed(0)}L.`,
          ctaLabel: 'View Insurance Gap',
          ctaAction: 'insurance-gap',
        });
      }

      if (healthCover < healthRequired) {
        risks.push({
          id: 'health-gap',
          category: 'coverage',
          severity: healthCover === 0 ? 'critical' : 'warning',
          title: 'Health cover below 5× income',
          detail: `Current: ₹${(healthCover / 1_00_000).toFixed(0)}L. Required: ₹${(healthRequired / 1_00_000).toFixed(0)}L. Gap: ₹${((healthRequired - healthCover) / 1_00_000).toFixed(0)}L.`,
          ctaLabel: 'Fix Health Cover',
          ctaAction: 'insurance-gap',
        });
      }
    }

    // ── 5d. DSCR critical ────────────────────────────────────────────────────
    if (ctx.dscr.signal === 'critical') {
      risks.push({
        id: 'dscr-critical',
        category: 'liquidity',
        severity: 'critical',
        title: 'Guntur DSCR below 1.0',
        detail: `Rent covers only ${(ctx.dscr.value * 100).toFixed(0)}% of loan EMIs. Risk of cash-flow shortfall.`,
        ctaLabel: 'Manage Loans',
        ctaAction: 'debt-strike',
      });
    }

    // ── 5e. DIR below target ─────────────────────────────────────────────────
    if (ctx.dir.signal !== 'healthy') {
      risks.push({
        id: 'dir-low',
        category: 'liquidity',
        severity: ctx.dir.signal,
        title: `Defensive interval: ${ctx.dir.days} days (target 180)`,
        detail: `Liquid assets cover only ${ctx.dir.days} days of expenses. Build to ₹${(ctx.dir.avgDailyExpenses * DIR_TARGET_DAYS / 1_00_000).toFixed(1)}L.`,
        ctaLabel: 'Start SIP',
        ctaAction: 'sip-planner',
      });
    }

    // ── 5f. Negative yield spread ────────────────────────────────────────────
    if (ctx.yieldCostSpread.signal === 'critical') {
      risks.push({
        id: 'yield-spread-negative',
        category: 'liquidity',
        severity: 'warning',
        title: 'Investments underperforming loan cost',
        detail: `Loan cost: ${ctx.yieldCostSpread.weightedLoanRate.toFixed(1)}% · Investment XIRR: ${ctx.yieldCostSpread.investmentXIRR.toFixed(1)}%. Consider prepaying high-interest loans.`,
        ctaLabel: 'Increase Prepayment',
        ctaAction: 'debt-strike',
      });
    }

    return risks;
  }

  // ── Overall Score (0-100) ─────────────────────────────────────────────────
  private static _calcScore(
    dscr: DSCRResult,
    dir: DIRResult,
    df: DebtFreedomResult,
    ycs: YieldCostSpreadResult,
    risks: AuditRisk[],
  ): number {
    let score = 100;

    // DSCR penalties
    if (dscr.signal === 'critical') score -= 20;
    else if (dscr.signal === 'warning') score -= 10;

    // DIR penalties
    if (dir.signal === 'critical') score -= 20;
    else if (dir.signal === 'warning') score -= 10;

    // Debt freedom (max 20 pts)
    score -= Math.round((1 - df.pct / 100) * 20);

    // Yield spread
    if (ycs.signal === 'critical') score -= 15;
    else if (ycs.signal === 'warning') score -= 7;

    // Each risk
    const critCount = risks.filter(r => r.severity === 'critical').length;
    const warnCount = risks.filter(r => r.severity === 'warning').length;
    score -= critCount * 8;
    score -= warnCount * 3;

    return clamp(score, 0, 100);
  }

  // ── Audit-Log snapshot ────────────────────────────────────────────────────
  private static async _logRiskSnapshot(result: AuditEngineResult): Promise<void> {
    const critCount = result.risks.filter(r => r.severity === 'critical').length;
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      action: 'AUDIT_ENGINE_RUN',
      timestamp: new Date(),
      entity: 'AuditEngine',
      entityId: 'audit-engine',
      newValues: {
        score: result.overallScore,
        dscr: result.dscr.value,
        dirDays: result.dir.days,
        debtPct: result.debtFreedom.pct,
        criticalRisks: critCount,
      },
    });
  }
}
