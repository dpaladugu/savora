
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { InvestmentService } from '@/services/InvestmentService';
import type { DashboardData, Transaction, CategoryBreakdown } from '@/types/financial';

// Stable palette — no random, uses CSS vars mapped to fixed hues
const CAT_COLORS: Record<string, string> = {
  'Food & Dining':        'hsl(24 90% 55%)',
  'Groceries':            'hsl(88 55% 45%)',
  'Transport':            'hsl(210 80% 55%)',
  'Fuel':                 'hsl(195 75% 50%)',
  'Shopping':             'hsl(280 65% 60%)',
  'Utilities':            'hsl(240 50% 55%)',
  'Medical':              'hsl(350 75% 55%)',
  'Health':               'hsl(350 75% 55%)',
  'Entertainment':        'hsl(330 70% 60%)',
  'Education':            'hsl(48 90% 50%)',
  'Rent':                 'hsl(160 55% 42%)',
  'EMI':                  'hsl(4 80% 52%)',
  'Insurance / LIC':      'hsl(173 58% 40%)',
  'Festivals & Gifts':    'hsl(316 65% 58%)',
  'Vehicle Maintenance':  'hsl(30 80% 48%)',
  'Clothing':             'hsl(258 60% 58%)',
  'School Fees':          'hsl(48 80% 48%)',
  'Home Maintenance':     'hsl(200 50% 50%)',
  'Other':                'hsl(220 15% 55%)',
};

function stableColor(category: string, index: number): string {
  if (CAT_COLORS[category]) return CAT_COLORS[category];
  // deterministic fallback hue from index
  return `hsl(${(index * 47 + 180) % 360} 60% 52%)`;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 0,
    emergencyFundCurrent: 0,
    monthlyIncome: 0,
    savingsRate: 0,
    investmentValue: 0,
    creditCardDebt: 0,
    emergencyFund: 0,
    goals: [],
    recentTransactions: [],
    categoryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const monthStart = startOfMonth();

      const [txns, investments, creditCards, emergencyFunds, goals, incomes] = await Promise.all([
        db.txns.toArray(),
        InvestmentService.getInvestments(),
        db.creditCards.toArray(),
        db.emergencyFunds.toArray(),
        db.goals.toArray(),
        db.incomes.toArray(),
      ]);

      // ── Expenses (negative txns) ──────────────────────────────────
      const expenseTxns  = txns.filter(t => t.amount < 0);
      const monthlyTxns  = expenseTxns.filter(t => new Date(t.date) >= monthStart);
      const totalExpenses   = expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
      const monthlyExpenses = monthlyTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

      // ── Monthly income ─────────────────────────────────────────────
      const monthlyIncomeTxns = incomes.filter(i => new Date(i.date) >= monthStart);
      const monthlyIncome = monthlyIncomeTxns.reduce((s, i) => s + i.amount, 0)
        || incomes.reduce((s, i) => s + i.amount, 0); // fallback to all-time if no current month

      // ── Investments ────────────────────────────────────────────────
      const totalInvestments = investments.reduce((s, inv: any) => s + (inv.currentValue || inv.investedValue || 0), 0);

      // ── Credit card total balance ──────────────────────────────────
      const creditCardDebt = creditCards.reduce((s, c: any) => s + (c.currentBalance || c.balance || 0), 0);

      // ── Emergency fund ─────────────────────────────────────────────
      const ef = emergencyFunds[0];
      const emergencyFundCurrent = ef?.currentAmount ?? 0;
      const emergencyFundTarget  = ef?.targetAmount  ?? 0;

      // ── Goals ──────────────────────────────────────────────────────
      const now = new Date();
      const goalsMapped = goals.map((g: any) => ({
        id: g.id,
        name: g.name ?? g.title ?? '',
        title: g.title ?? g.name ?? '',
        targetAmount: g.targetAmount ?? 0,
        currentAmount: g.currentAmount ?? 0,
        deadline: g.deadline ?? (g.targetDate ? String(g.targetDate) : ''),
        category: g.category ?? 'Other',
        createdAt: g.createdAt ?? now,
        updatedAt: g.updatedAt ?? now,
      }));

      // ── Recent transactions (most recent 10 expense txns) ──────────
      const recentTransactions: Transaction[] = [...expenseTxns]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          amount: Math.abs(t.amount),
          description: t.note ?? t.category,
          category: t.category,
          date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
          type: 'expense' as const,
        }));

      // ── Category breakdown (current month) ────────────────────────
      const catTotals = monthlyTxns.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
      const categoryBreakdown: CategoryBreakdown[] = Object.entries(catTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount], idx) => ({
          category,
          amount: amount as number,
          percentage: monthlyExpenses > 0 ? ((amount as number) / monthlyExpenses) * 100 : 0,
          color: stableColor(category, idx),
        }));

      // ── Savings rate ───────────────────────────────────────────────
      const savingsRate = monthlyIncome > 0
        ? Math.max(0, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
        : 0;

      setDashboardData({
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenseTxns.length,
        investmentCount: investments.length,
        emergencyFundTarget,
        emergencyFundCurrent,
        monthlyIncome,
        savingsRate,
        investmentValue: totalInvestments,
        creditCardDebt,
        emergencyFund: emergencyFundCurrent,
        goals: goalsMapped,
        recentTransactions,
        categoryBreakdown,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  return { dashboardData, loading, error, refresh: fetchAll };
}
