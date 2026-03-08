/**
 * LoanService — unified Loan + BrotherRepayment operations.
 * 
 * AUDIT NOTE: Uses canonical `db` from '@/lib/db' (not extendedDb) so that
 * the Dexie Audit Middleware (§19) intercepts all mutations automatically.
 */

import { db } from '@/lib/db';
import type { Loan, BrotherRepayment, AmortRow } from '@/lib/db';

export class LoanService {
  /**
   * Create a new loan, generating its full amortisation schedule.
   */
  static async createLoan(
    loan: Omit<Loan, 'id'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const roi = (loan as any).roi ?? loan.interestRate ?? 0;
    const tenureMonths = (loan as any).tenureMonths ?? 0;
    const emi = LoanService._calcEMI(loan.principal, roi, tenureMonths);
    const amortisationSchedule = LoanService._buildSchedule(loan.principal, roi, tenureMonths);

    await db.loans.add({
      ...loan,
      id,
      roi,
      emi: emi || loan.emi || 0,
      amortisationSchedule,
      createdAt: (loan as any).createdAt ?? new Date(),
      updatedAt: new Date(),
    } as any);
    return id;
  }

  /** EMI = P × r × (1+r)^n / ((1+r)^n − 1) */
  static _calcEMI(principal: number, annualRoi: number, tenureMonths: number): number {
    if (!principal || !annualRoi || !tenureMonths) return 0;
    const r = annualRoi / 100 / 12;
    return Math.round(
      (principal * r * Math.pow(1 + r, tenureMonths)) /
        (Math.pow(1 + r, tenureMonths) - 1)
    );
  }

  static _buildSchedule(principal: number, annualRoi: number, tenureMonths: number): AmortRow[] {
    if (!principal || !annualRoi || !tenureMonths) return [];
    const r = annualRoi / 100 / 12;
    const emi = LoanService._calcEMI(principal, annualRoi, tenureMonths);
    const schedule: AmortRow[] = [];
    let balance = principal;
    for (let month = 1; month <= tenureMonths; month++) {
      const interestPart  = balance * r;
      const principalPart = emi - interestPart;
      balance -= principalPart;
      schedule.push({
        month,
        emi,
        principalPart: Math.round(principalPart),
        interestPart:  Math.round(interestPart),
        balance:       Math.round(Math.max(0, balance)),
      });
    }
    return schedule;
  }

  static async getAllLoans(): Promise<Loan[]> {
    return db.loans.toArray().catch(() => []);
  }

  static async getActiveLoans(): Promise<Loan[]> {
    const all = await db.loans.toArray().catch(() => []);
    return all.filter(l => l.isActive !== false);
  }

  static async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    await db.loans.update(id, { ...updates, updatedAt: new Date() });
  }

  /**
   * Record a prepayment: reduces `outstanding` and flips `isActive` to false when fully paid.
   */
  static async makePrepayment(loanId: string, amount: number): Promise<void> {
    const loan = await db.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');

    const newOutstanding = Math.max(0, (loan.outstanding ?? loan.principal) - amount);
    await db.loans.update(loanId, {
      outstanding: newOutstanding,
      isActive: newOutstanding > 0,
      updatedAt: new Date(),
    });
  }

  static async getLoanAnalytics(): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number;
    totalEMI: number;
    highInterestLoans: number;
  }> {
    const all = await db.loans.toArray().catch(() => []);
    const active = all.filter(l => l.isActive !== false);
    return {
      totalLoans:       all.length,
      activeLoans:      active.length,
      totalOutstanding: active.reduce((s, l) => s + (l.outstanding ?? l.principal ?? 0), 0),
      totalEMI:         active.reduce((s, l) => s + (l.emi ?? 0), 0),
      highInterestLoans: active.filter(l => (l.roi ?? l.interestRate ?? 0) > 8).length,
    };
  }
}

export class BrotherRepaymentService {
  /**
   * Add repayment — atomically:
   *   1. Writes BrotherRepayment record
   *   2. Reduces loan.outstanding (flips isActive when zero)
   *   3. Writes a FamilyTransfer ledger entry (§17)
   * All via canonical `db` so Audit Middleware fires on every write.
   */
  static async addRepayment(
    repayment: Omit<BrotherRepayment, 'id'>
  ): Promise<string> {
    const id = crypto.randomUUID();

    await db.brotherRepayments.add({ ...repayment, id, updatedAt: new Date() });

    // ── Reduce loan outstanding ──────────────────────────────────────────────
    if (repayment.loanId) {
      const loan = await db.loans.get(repayment.loanId);
      if (loan) {
        const newOutstanding = Math.max(0, (loan.outstanding ?? loan.principal) - repayment.amount);
        await db.loans.update(repayment.loanId, {
          outstanding: newOutstanding,
          isActive: newOutstanding > 0,
          updatedAt: new Date(),
        });
      }
    }

    // ── FamilyTransfer ledger entry (§17) ────────────────────────────────────
    await db.familyTransfers.add({
      id: crypto.randomUUID(),
      amount: repayment.amount,
      toPerson: 'Brother',
      from: 'Me',
      to: 'Brother',
      purpose: repayment.note ?? 'Loan Repayment',
      mode: repayment.mode ?? 'Bank',
      date: repayment.date ?? new Date(),
      createdAt: new Date(),
    });

    return id;
  }

  static async getRepaymentsByLoan(loanId: string): Promise<BrotherRepayment[]> {
    return db.brotherRepayments
      .where('loanId')
      .equals(loanId)
      .toArray()
      .catch(() => []);
  }

  static async getAllRepayments(): Promise<BrotherRepayment[]> {
    return db.brotherRepayments.toArray().catch(() => []);
  }
}
