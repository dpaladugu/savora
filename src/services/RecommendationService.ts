
/**
 * src/services/RecommendationService.ts
 *
 * Expert Recommendation Engine implementing CFA-level rules as per requirements.
 */

import { db } from '@/lib/db';
import type { Txn, Investment, Insurance, Goal, Loan } from '@/lib/db';

export interface Recommendation {
  id: string;
  type: 'investment' | 'insurance' | 'loan' | 'expense' | 'tax';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  amount?: number;
  dueDate?: Date;
}

export class RecommendationService {

  /**
   * Generates all recommendations for the user.
   * @returns A promise that resolves to an array of recommendations.
   */
  static async generateRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Get all necessary data using the new schema
      const [transactions, investments, insurance, goals, loans] = await Promise.all([
        db.txns.toArray(),
        db.investments.toArray(),
        db.insurance.toArray(),
        db.goals.toArray(),
        db.loans.toArray()
      ]);

      // Calculate current financial position
      const totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const monthlyIncome = totalIncome / 12; // Assuming annual calculation
      const monthlyExpenses = totalExpenses / 12;

      // Generate investment recommendations
      recommendations.push(...this.getInvestmentRecommendations(investments, monthlyIncome));

      // Generate insurance recommendations  
      recommendations.push(...this.getInsuranceRecommendations(insurance, monthlyIncome));

      // Generate loan recommendations
      recommendations.push(...this.getLoanRecommendations(loans, monthlyIncome));

      // Generate expense recommendations
      recommendations.push(...this.getExpenseRecommendations(transactions));

      // Generate tax recommendations
      recommendations.push(...this.getTaxRecommendations(investments));

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Investment & Asset Allocation Recommendations
   */
  private static getInvestmentRecommendations(investments: Investment[], monthlyIncome: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Calculate current allocation
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedValue, 0);
    const equityInvestments = investments.filter(inv => 
      inv.type.includes('MF-Growth') || inv.type === 'Stocks'
    );
    const debtInvestments = investments.filter(inv => 
      inv.type === 'PPF' || inv.type === 'EPF' || inv.type === 'FD'
    );
    const goldInvestments = investments.filter(inv => 
      inv.type.includes('Gold') || inv.type === 'SGB'
    );

    if (totalInvested === 0) {
      recommendations.push({
        id: `start-investing-${Date.now()}`,
        type: 'investment',
        priority: 'high',
        title: 'Start Your Investment Journey',
        description: 'You haven\'t started investing yet. Begin with a diversified portfolio.',
        action: 'Start a monthly SIP of ₹5,000',
        amount: 5000
      });
      return recommendations;
    }

    const equityAllocation = equityInvestments.reduce((sum, inv) => sum + inv.investedValue, 0) / totalInvested;
    const debtAllocation = debtInvestments.reduce((sum, inv) => sum + inv.investedValue, 0) / totalInvested;
    const goldAllocation = goldInvestments.reduce((sum, inv) => sum + inv.investedValue, 0) / totalInvested;

    // Age-based glide path (assuming user is 30 for demo)
    const targetAge = 30; // This should come from user profile
    let targetEquity = 0.7, targetDebt = 0.2, targetGold = 0.1;
    
    if (targetAge > 35 && targetAge <= 50) {
      targetEquity = 0.6; targetDebt = 0.3; targetGold = 0.1;
    } else if (targetAge > 50) {
      targetEquity = 0.4; targetDebt = 0.5; targetGold = 0.1;
    }

    // Rebalance alerts
    if (Math.abs(equityAllocation - targetEquity) > 0.05) {
      recommendations.push({
        id: `rebalance-equity-${Date.now()}`,
        type: 'investment',
        priority: 'medium',
        title: 'Portfolio Rebalancing Required',
        description: `Your equity allocation is ${(equityAllocation * 100).toFixed(1)}%, target is ${(targetEquity * 100).toFixed(1)}%`,
        action: equityAllocation > targetEquity ? 'Reduce equity exposure' : 'Increase equity allocation'
      });
    }

    // SIP recommendations
    if (monthlyIncome > 0 && totalInvested < monthlyIncome * 6) {
      recommendations.push({
        id: `sip-increase-${Date.now()}`,
        type: 'investment',
        priority: 'high',
        title: 'Increase SIP Investment',
        description: 'Your investment corpus is low compared to your income',
        action: 'Consider increasing monthly SIP by ₹5,000',
        amount: 5000
      });
    }

    return recommendations;
  }

  /**
   * Insurance Gap Analysis
   */
  private static getInsuranceRecommendations(insurance: Insurance[], monthlyIncome: number): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const annualIncome = monthlyIncome * 12;

    const termInsurance = insurance.filter(ins => ins.type === 'Term');
    const healthInsurance = insurance.filter(ins => ins.type === 'Health');

    // Term insurance gap
    const totalTermCover = termInsurance.reduce((sum, ins) => sum + ins.sumInsured, 0);
    const targetTermCover = annualIncome * 10;

    if (totalTermCover < targetTermCover) {
      recommendations.push({
        id: `term-gap-${Date.now()}`,
        type: 'insurance',
        priority: 'high',
        title: 'Term Insurance Gap',
        description: `Current term cover: ₹${totalTermCover.toLocaleString()}, Recommended: ₹${targetTermCover.toLocaleString()}`,
        action: `Increase term insurance by ₹${(targetTermCover - totalTermCover).toLocaleString()}`,
        amount: targetTermCover - totalTermCover
      });
    }

    // Health insurance gap
    const totalHealthCover = healthInsurance.reduce((sum, ins) => sum + ins.sumInsured, 0);
    const targetHealthCover = annualIncome * 5;

    if (totalHealthCover < targetHealthCover) {
      recommendations.push({
        id: `health-gap-${Date.now()}`,
        type: 'insurance',
        priority: 'high',
        title: 'Health Insurance Gap',
        description: `Current health cover: ₹${totalHealthCover.toLocaleString()}, Recommended: ₹${targetHealthCover.toLocaleString()}`,
        action: `Increase health insurance by ₹${(targetHealthCover - totalHealthCover).toLocaleString()}`,
        amount: targetHealthCover - totalHealthCover
      });
    }

    // Renewal reminders
    const renewalDue = insurance.filter(ins => {
      const daysUntilRenewal = Math.floor((ins.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal <= 30 && daysUntilRenewal > 0;
    });

    renewalDue.forEach(ins => {
      recommendations.push({
        id: `renewal-${ins.id}`,
        type: 'insurance',
        priority: 'medium',
        title: 'Policy Renewal Due',
        description: `${ins.type} insurance with ${ins.provider} expires soon`,
        action: 'Renew policy',
        dueDate: ins.endDate
      });
    });

    return recommendations;
  }

  /**
   * Loan Management Recommendations
   */
  private static getLoanRecommendations(loans: Loan[], monthlyIncome: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const activeLoans = loans.filter(loan => loan.isActive);
    const totalEMI = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);

    // EMI to income ratio check
    if (totalEMI / monthlyIncome > 0.4) {
      recommendations.push({
        id: `debt-stress-${Date.now()}`,
        type: 'loan',
        priority: 'high',
        title: 'Debt Stress Alert',
        description: `Your EMI-to-income ratio is ${((totalEMI / monthlyIncome) * 100).toFixed(1)}%, recommended maximum is 40%`,
        action: 'Consider loan restructuring or prepayment'
      });
    }

    // Prepayment recommendations
    activeLoans.forEach(loan => {
      if (loan.roi > 8) { // High interest rate
        const interestSaved = loan.outstanding * (loan.roi / 100) * (loan.tenureMonths / 12);
        if (interestSaved > 10000) {
          recommendations.push({
            id: `prepay-${loan.id}`,
            type: 'loan',
            priority: 'medium',
            title: 'Prepayment Opportunity',
            description: `Prepaying ${loan.type} loan can save ₹${interestSaved.toLocaleString()} in interest`,
            action: 'Consider partial prepayment',
            amount: interestSaved
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Expense Analysis
   */
  private static getExpenseRecommendations(transactions: Txn[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Category-wise expense analysis
    const expensesByCategory = transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

    // Find categories with high spending
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      const percentage = (amount / totalExpenses) * 100;
      if (percentage > 25 && category !== 'EMI' && category !== 'Rent') {
        recommendations.push({
          id: `expense-${category}-${Date.now()}`,
          type: 'expense',
          priority: 'low',
          title: 'High Spending Alert',
          description: `${category} expenses account for ${percentage.toFixed(1)}% of total spending`,
          action: `Review and optimize ${category} expenses`
        });
      }
    });

    return recommendations;
  }

  /**
   * Tax Optimization
   */
  private static getTaxRecommendations(investments: Investment[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // NPS T1 recommendation (80CCD(1B) limit of ₹50,000)
    const npsT1Investments = investments.filter(inv => inv.type === 'NPS-T1');
    const totalNpsT1 = npsT1Investments.reduce((sum, inv) => sum + inv.investedValue, 0);

    if (totalNpsT1 < 50000) {
      recommendations.push({
        id: `nps-tax-${Date.now()}`,
        type: 'tax',
        priority: 'medium',
        title: 'NPS Tax Benefit Available',
        description: `You can save additional tax of ₹${((50000 - totalNpsT1) * 0.3).toLocaleString()} by investing in NPS Tier 1`,
        action: `Invest ₹${(50000 - totalNpsT1).toLocaleString()} more in NPS T1`,
        amount: 50000 - totalNpsT1
      });
    }

    return recommendations;
  }
}
