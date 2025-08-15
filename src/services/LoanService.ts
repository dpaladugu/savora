
import { extendedDb } from '@/lib/db-schema-extended';
import type { Loan, BrotherRepayment, AmortRow } from '@/lib/db-schema-extended';

export class LoanService {
  /**
   * Create a new loan
   */
  static async createLoan(loan: Omit<Loan, 'id' | 'amortisationSchedule'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const amortisationSchedule = this.generateAmortisationSchedule(
        loan.principal,
        loan.roi,
        loan.tenureMonths
      );

      await extendedDb.loans.add({
        ...loan,
        id,
        amortisationSchedule
      });
      return id;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  /**
   * Generate amortisation schedule
   */
  private static generateAmortisationSchedule(
    principal: number,
    roi: number,
    tenureMonths: number
  ): AmortRow[] {
    const monthlyRate = roi / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    
    const schedule: AmortRow[] = [];
    let balance = principal;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestPart = balance * monthlyRate;
      const principalPart = emi - interestPart;
      balance -= principalPart;

      schedule.push({
        month,
        emi: Math.round(emi),
        principalPart: Math.round(principalPart),
        interestPart: Math.round(interestPart),
        balance: Math.round(Math.max(0, balance))
      });
    }

    return schedule;
  }

  /**
   * Get all loans
   */
  static async getAllLoans(): Promise<Loan[]> {
    try {
      return await extendedDb.loans.toArray();
    } catch (error) {
      console.error('Error fetching loans:', error);
      return [];
    }
  }

  /**
   * Get active loans
   */
  static async getActiveLoans(): Promise<Loan[]> {
    try {
      return await extendedDb.loans.where('isActive').equals(true).toArray();
    } catch (error) {
      console.error('Error fetching active loans:', error);
      return [];
    }
  }

  /**
   * Update loan
   */
  static async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    try {
      await extendedDb.loans.update(id, updates);
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  /**
   * Make prepayment
   */
  static async makePrepayment(loanId: string, amount: number): Promise<void> {
    try {
      const loan = await extendedDb.loans.get(loanId);
      if (!loan) throw new Error('Loan not found');

      const newOutstanding = Math.max(0, loan.outstanding - amount);
      const isFullyPaid = newOutstanding === 0;

      await extendedDb.loans.update(loanId, {
        outstanding: newOutstanding,
        isActive: !isFullyPaid
      });
    } catch (error) {
      console.error('Error making prepayment:', error);
      throw error;
    }
  }

  /**
   * Calculate loan analytics
   */
  static async getLoanAnalytics(): Promise<{
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number;
    totalEMI: number;
    highInterestLoans: number;
  }> {
    try {
      const allLoans = await extendedDb.loans.toArray();
      const activeLoans = allLoans.filter(loan => loan.isActive);
      
      return {
        totalLoans: allLoans.length,
        activeLoans: activeLoans.length,
        totalOutstanding: activeLoans.reduce((sum, loan) => sum + loan.outstanding, 0),
        totalEMI: activeLoans.reduce((sum, loan) => sum + loan.emi, 0),
        highInterestLoans: activeLoans.filter(loan => loan.roi > 8).length
      };
    } catch (error) {
      console.error('Error calculating loan analytics:', error);
      return {
        totalLoans: 0,
        activeLoans: 0,
        totalOutstanding: 0,
        totalEMI: 0,
        highInterestLoans: 0
      };
    }
  }
}

export class BrotherRepaymentService {
  /**
   * Add repayment
   */
  static async addRepayment(repayment: Omit<BrotherRepayment, 'id'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      await extendedDb.brotherRepayments.add({
        ...repayment,
        id
      });
      
      // Update loan outstanding
      const loan = await extendedDb.loans.get(repayment.loanId);
      if (loan) {
        const newOutstanding = Math.max(0, loan.outstanding - repayment.amount);
        await extendedDb.loans.update(repayment.loanId, {
          outstanding: newOutstanding,
          isActive: newOutstanding > 0
        });
      }
      
      return id;
    } catch (error) {
      console.error('Error adding repayment:', error);
      throw error;
    }
  }

  /**
   * Get repayments by loan
   */
  static async getRepaymentsByLoan(loanId: string): Promise<BrotherRepayment[]> {
    try {
      return await extendedDb.brotherRepayments.where('loanId').equals(loanId).toArray();
    } catch (error) {
      console.error('Error fetching repayments:', error);
      return [];
    }
  }
}
