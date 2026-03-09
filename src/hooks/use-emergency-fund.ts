import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { EmergencyFund } from '@/lib/db';

interface EmergencyFundCalculation {
  monthlyRequired: number;
  emergencyFundRequired: number;
  currentCoverage: number;
  shortfall: number;
}

interface EmergencyFundData {
  monthlyExpenses: number;
  dependents: number;
  monthlyEMIs: number;
  insurancePremiums: number;
  bufferPercentage: number;
  currentCorpus: number;
  rentalIncome: number;
  emergencyMonths: number;
  numIncomeSources?: number;
  jobStability?: 'high' | 'medium' | 'low';
  otherLiquidSavings?: number;
  efRiskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

interface UseEmergencyFundReturn {
  data: EmergencyFundData;
  updateData: (field: keyof EmergencyFundData | any, value?: any) => void;
  loading: boolean;
  missingData: string[];
  calculation: EmergencyFundCalculation;
  refreshData: () => void;
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  monthsCovered: number;
  emergencyFunds: EmergencyFund[];
}

export const useEmergencyFund = (): UseEmergencyFundReturn => {
  const [data, setData] = useState<EmergencyFundData>({
    monthlyExpenses: 0,
    dependents: 0,
    monthlyEMIs: 0,
    insurancePremiums: 0,
    bufferPercentage: 20,
    currentCorpus: 0,
    rentalIncome: 0,
    emergencyMonths: 6,
    numIncomeSources: 1,
    jobStability: 'medium',
    otherLiquidSavings: 0,
    efRiskTolerance: 'moderate',
  });

  const [loading, setLoading] = useState(true);
  const [emergencyFunds, setEmergencyFunds] = useState<EmergencyFund[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  const updateData = (field: keyof EmergencyFundData | any, value?: any) => {
    if (typeof field === 'object') {
      setData(prev => ({ ...prev, ...field }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6-month window

      const [txns, expenseRows, incomeRows, efData, loanRows, insuranceRows, rentalRows] = await Promise.all([
        db.txns.toArray(),
        db.expenses.toArray().catch(() => []),
        db.incomes.toArray().catch(() => []),
        db.emergencyFunds.toArray(),
        db.loans.toArray().catch(() => []),
        db.insurance.toArray().catch(() => []),
        db.rentalProperties?.toArray().catch(() => []) ?? [],
      ]);

      // ── Determine actual months of data available ─────────────────────────
      const allDates: Date[] = [
        ...txns.map(t => new Date(t.date)),
        ...expenseRows.map(e => new Date(e.date)),
        ...incomeRows.map(i => new Date(i.date)),
      ].filter(d => !isNaN(d.getTime()));

      const monthSet = new Set(allDates.map(d => d.toISOString().slice(0, 7)));
      const numMonths = Math.max(1, monthSet.size);

      // ── Total expense from last 6 months ──────────────────────────────────
      const expenseFromTxns = txns
        .filter(t => t.amount < 0 && new Date(t.date) >= start)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      const expenseFromRows = expenseRows
        .filter(e => new Date(e.date) >= start)
        .reduce((s, e) => s + e.amount, 0);
      const totalExpense6m = expenseFromTxns + expenseFromRows;

      // ── Monthly average (based on actual months, capped at 6) ─────────────
      const activeMonths = Math.min(6, numMonths);
      const monthlyExpenses = totalExpense6m / activeMonths;

      // ── Monthly income ────────────────────────────────────────────────────
      const income6m = incomeRows
        .filter(i => new Date(i.date) >= start)
        .reduce((s, i) => s + i.amount, 0);
      const monthlyIncome = income6m / activeMonths;

      // ── EMI from active loans ─────────────────────────────────────────────
      const monthlyEMIs = loanRows
        .filter(l => l.isActive !== false && (l.outstanding ?? l.principal ?? 0) > 0)
        .reduce((s, l) => s + (l.emi ?? 0), 0);

      // ── Annual insurance premiums ─────────────────────────────────────────
      const annualInsurance = insuranceRows
        .filter(i => i.isActive !== false)
        .reduce((s, i) => s + (i.premium ?? i.premiumAmount ?? 0), 0);

      // ── Rental income ─────────────────────────────────────────────────────
      const rentalIncome = (rentalRows as any[]).reduce((s: number, r: any) => s + (r.monthlyRent ?? r.rent ?? 0), 0);

      // ── Emergency fund corpus ─────────────────────────────────────────────
      const savings = efData.reduce((s, f) => s + f.currentAmount, 0);

      setTotalExpenses(monthlyExpenses);
      setTotalIncome(monthlyIncome);
      setTotalSavings(savings);
      setEmergencyFunds(efData);

      setData(prev => ({
        ...prev,
        monthlyExpenses:   prev.monthlyExpenses  || Math.round(monthlyExpenses),
        monthlyEMIs:       prev.monthlyEMIs       || Math.round(monthlyEMIs),
        insurancePremiums: prev.insurancePremiums || Math.round(annualInsurance),
        rentalIncome:      prev.rentalIncome      || Math.round(rentalIncome),
        currentCorpus:     prev.currentCorpus     || savings,
      }));
    } catch (err) {
      console.error('useEmergencyFund fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calculation: EmergencyFundCalculation = {
    monthlyRequired: Math.max(0,
      (data.monthlyExpenses * (1 + data.bufferPercentage / 100))
      + data.monthlyEMIs
      + (data.insurancePremiums / 12)
      - data.rentalIncome
    ),
    get emergencyFundRequired() { return this.monthlyRequired * data.emergencyMonths; },
    get currentCoverage()       { return this.monthlyRequired > 0 ? data.currentCorpus / this.monthlyRequired : 0; },
    get shortfall()             { return Math.max(0, this.emergencyFundRequired - data.currentCorpus); },
  };

  const missingData: string[] = [];
  if (data.monthlyExpenses === 0) missingData.push('Monthly expenses — add transactions or expenses');
  if (data.currentCorpus   === 0) missingData.push('Emergency fund corpus — set current savings');

  const monthsCovered = totalExpenses > 0 ? totalSavings / totalExpenses : 0;

  return {
    data, updateData, loading, missingData, calculation,
    refreshData: fetchData,
    totalExpenses, totalIncome, totalSavings, monthsCovered, emergencyFunds,
  };
};
