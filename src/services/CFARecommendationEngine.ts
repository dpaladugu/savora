
/**
 * CFA-Level Recommendations Engine
 * Implements professional-grade financial advice algorithms per requirements spec
 */

import { db } from '@/lib/db';
import type { Txn, Investment, Insurance, Goal, Loan, GlobalSettings } from '@/lib/db';

// Core recommendation interfaces
export interface AssetAllocation {
  equity: number;
  debt: number;
  gold: number;
  age: number;
  isOptimal: boolean;
}

export interface RebalanceRecommendation {
  id: string;
  type: 'rebalance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  currentAllocation: AssetAllocation;
  targetAllocation: AssetAllocation;
  driftPercentage: number;
}

export interface InsuranceGap {
  id: string;
  type: 'insurance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  gapAmount: number;
  currentCoverage: number;
  recommendedCoverage: number;
  insuranceType: 'term' | 'health';
}

export interface SIPRecommendation {
  id: string;
  type: 'investment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  recommendedAmount: number;
  currentSIP: number;
  reason: string;
}

export interface TaxRecommendation {
  id: string;
  type: 'tax';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  potentialSaving: number;
  investmentRequired: number;
  deadline?: Date;
}

export interface PrepaymentAdvice {
  id: string;
  type: 'loan';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  interestSaved: number;
  recommendedAmount: number;
  loanType: string;
}

export interface MonthlyNudge {
  id: string;
  type: 'nudge';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  dueDate?: Date;
}

export class CFARecommendationEngine {
  /**
   * Get age-appropriate asset allocation (CFA Level 1 Portfolio Management)
   */
  static getAssetAllocation(age: number): AssetAllocation {
    let equity: number, debt: number, gold: number;
    
    // Age-based glide path per requirements spec Section 20.1
    if (age <= 35) {
      equity = 70; debt = 20; gold = 10;
    } else if (age <= 50) {
      equity = 60; debt = 30; gold = 10;
    } else {
      equity = 40; debt = 50; gold = 10;
    }

    return {
      equity,
      debt,
      gold,
      age,
      isOptimal: true
    };
  }

  /**
   * Analyze current portfolio and recommend rebalancing
   */
  static async checkRebalancingNeeds(): Promise<RebalanceRecommendation[]> {
    const recommendations: RebalanceRecommendation[] = [];
    
    try {
      const investments = await db.investments.toArray();
      const settings = await db.globalSettings.limit(1).first();
      
      if (investments.length === 0) return recommendations;

      // Calculate current allocation
      const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
      const equityValue = investments
        .filter(inv => ['MF-Growth', 'Stocks', 'SIP'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);
      const debtValue = investments
        .filter(inv => ['PPF', 'EPF', 'FD', 'RD', 'Bonds'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);
      const goldValue = investments
        .filter(inv => ['Gold', 'SGB'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);

      const currentAllocation: AssetAllocation = {
        equity: Math.round((equityValue / totalValue) * 100),
        debt: Math.round((debtValue / totalValue) * 100),
        gold: Math.round((goldValue / totalValue) * 100),
        age: 30, // Default age - should come from user profile
        isOptimal: false
      };

      const targetAllocation = this.getAssetAllocation(currentAllocation.age);
      
      // Check for drift > 5% per spec
      const equityDrift = Math.abs(currentAllocation.equity - targetAllocation.equity);
      const debtDrift = Math.abs(currentAllocation.debt - targetAllocation.debt);
      const goldDrift = Math.abs(currentAllocation.gold - targetAllocation.gold);

      const maxDrift = Math.max(equityDrift, debtDrift, goldDrift);

      if (maxDrift > 5) {
        recommendations.push({
          id: `rebalance-${Date.now()}`,
          type: 'rebalance',
          priority: maxDrift > 10 ? 'high' : 'medium',
          title: 'Portfolio Rebalancing Required',
          description: `Your portfolio has drifted ${maxDrift}% from target allocation`,
          action: 'Rebalance portfolio to maintain optimal risk-return profile',
          currentAllocation,
          targetAllocation,
          driftPercentage: maxDrift
        });
      }

    } catch (error) {
      console.error('Error analyzing rebalancing needs:', error);
    }

    return recommendations;
  }

  /**
   * Insurance gap analysis (CFA Level 1 Risk Management)
   */
  static async analyzeInsuranceGaps(annualIncome: number): Promise<InsuranceGap[]> {
    const gaps: InsuranceGap[] = [];
    
    try {
      const insurancePolicies = await db.insurance.toArray();
      
      // Term insurance analysis (10x income rule per spec)
      const termPolicies = insurancePolicies.filter(policy => 
        policy.type === 'Term' || policy.type === 'Life'
      );
      const totalTermCoverage = termPolicies.reduce((sum, policy) => 
        sum + policy.sumInsured, 0
      );
      const recommendedTermCoverage = annualIncome * 10;

      if (totalTermCoverage < recommendedTermCoverage) {
        gaps.push({
          id: `term-gap-${Date.now()}`,
          type: 'insurance',
          priority: 'high',
          title: 'Term Insurance Gap Detected',
          description: `Current term coverage is insufficient for income protection`,
          action: `Increase term insurance coverage by ₹${(recommendedTermCoverage - totalTermCoverage).toLocaleString()}`,
          gapAmount: recommendedTermCoverage - totalTermCoverage,
          currentCoverage: totalTermCoverage,
          recommendedCoverage: recommendedTermCoverage,
          insuranceType: 'term'
        });
      }

      // Health insurance analysis (5x income rule per spec)
      const healthPolicies = insurancePolicies.filter(policy => 
        policy.type === 'Health'
      );
      const totalHealthCoverage = healthPolicies.reduce((sum, policy) => 
        sum + policy.sumInsured, 0
      );
      const recommendedHealthCoverage = annualIncome * 5;

      if (totalHealthCoverage < recommendedHealthCoverage) {
        gaps.push({
          id: `health-gap-${Date.now()}`,
          type: 'insurance',
          priority: 'high',
          title: 'Health Insurance Gap Detected',
          description: `Current health coverage may be inadequate for medical emergencies`,
          action: `Increase health insurance coverage by ₹${(recommendedHealthCoverage - totalHealthCoverage).toLocaleString()}`,
          gapAmount: recommendedHealthCoverage - totalHealthCoverage,
          currentCoverage: totalHealthCoverage,
          recommendedCoverage: recommendedHealthCoverage,
          insuranceType: 'health'
        });
      }

    } catch (error) {
      console.error('Error analyzing insurance gaps:', error);
    }

    return gaps;
  }

  /**
   * SIP recommendations based on income growth
   */
  static async getSIPRecommendations(): Promise<SIPRecommendation[]> {
    const recommendations: SIPRecommendation[] = [];
    
    try {
      const investments = await db.investments.toArray();
      const sipInvestments = investments.filter(inv => inv.frequency !== 'OneTime');
      
      // Basic SIP recommendation for new users
      if (sipInvestments.length === 0) {
        recommendations.push({
          id: `start-sip-${Date.now()}`,
          type: 'investment',
          priority: 'high',
          title: 'Start Systematic Investment Plan',
          description: 'Begin building wealth through disciplined monthly investments',
          action: 'Start a diversified equity SIP of ₹5,000 per month',
          recommendedAmount: 5000,
          currentSIP: 0,
          reason: 'No systematic investments detected'
        });
      }

      // SIP step-up recommendations could be added based on income growth

    } catch (error) {
      console.error('Error generating SIP recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Tax optimization under New Tax Regime
   */
  static async getTaxOptimizationSuggestions(): Promise<TaxRecommendation[]> {
    const recommendations: TaxRecommendation[] = [];
    
    try {
      const investments = await db.investments.toArray();
      
      // NPS Tier-1 80CCD(1B) benefit - ₹50,000 limit per spec
      const npsT1Investments = investments.filter(inv => inv.type === 'NPS-T1');
      const totalNpsT1 = npsT1Investments.reduce((sum, inv) => sum + inv.investedValue, 0);
      
      if (totalNpsT1 < 50000) {
        const remainingLimit = 50000 - totalNpsT1;
        const taxSaving = remainingLimit * 0.3; // Assuming 30% tax bracket
        
        recommendations.push({
          id: `nps-tax-${Date.now()}`,
          type: 'tax',
          priority: 'medium',
          title: 'NPS Tax Benefit Available',
          description: `Save ₹${taxSaving.toLocaleString()} in taxes through NPS Tier-1 investment`,
          action: `Invest additional ₹${remainingLimit.toLocaleString()} in NPS Tier-1`,
          potentialSaving: taxSaving,
          investmentRequired: remainingLimit,
          deadline: new Date(new Date().getFullYear() + 1, 2, 31) // 31st March
        });
      }

    } catch (error) {
      console.error('Error generating tax recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Loan prepayment analysis
   */
  static async analyzeLoanPrepayments(): Promise<PrepaymentAdvice[]> {
    const advice: PrepaymentAdvice[] = [];
    
    try {
      const loans = await db.loans.where('isActive').equals(true).toArray();
      
      for (const loan of loans) {
        // High interest rate loans (>8% per spec)
        if (loan.roi > 8) {
          const remainingYears = loan.tenureMonths / 12;
          const interestSaved = loan.outstanding * (loan.roi / 100) * remainingYears;
          
          if (interestSaved > 10000) { // ₹10k threshold per spec
            advice.push({
              id: `prepay-${loan.id}`,
              type: 'loan',
              priority: 'medium',
              title: 'Loan Prepayment Opportunity',
              description: `Prepaying ${loan.type} loan can save significant interest`,
              action: `Consider partial prepayment of ₹${Math.min(loan.outstanding * 0.2, 200000).toLocaleString()}`,
              interestSaved: Math.round(interestSaved),
              recommendedAmount: Math.min(loan.outstanding * 0.2, 200000),
              loanType: loan.type
            });
          }
        }
      }

    } catch (error) {
      console.error('Error analyzing loan prepayments:', error);
    }

    return advice;
  }

  /**
   * Generate monthly financial nudges
   */
  static async generateMonthlyNudges(): Promise<MonthlyNudge[]> {
    const nudges: MonthlyNudge[] = [];
    
    try {
      // Insurance renewal reminders (30 days before)
      const insurancePolicies = await db.insurance.toArray();
      const today = new Date();
      
      for (const policy of insurancePolicies) {
        const daysToExpiry = Math.floor((policy.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          nudges.push({
            id: `renewal-${policy.id}`,
            type: 'nudge',
            priority: 'high',
            title: 'Insurance Renewal Due',
            description: `${policy.type} insurance expires in ${daysToExpiry} days`,
            action: 'Review and renew policy to avoid coverage gaps',
            dueDate: policy.endDate
          });
        }
      }

      // Emergency fund check
      const emergencyFunds = await db.emergencyFunds.toArray();
      const totalEmergencyFund = emergencyFunds.reduce((sum, fund) => sum + fund.currentAmount, 0);
      
      if (totalEmergencyFund < 500000) { // Basic threshold
        nudges.push({
          id: `emergency-fund-${Date.now()}`,
          type: 'nudge',
          priority: 'high',
          title: 'Build Emergency Fund',
          description: 'Strengthen your financial safety net',
          action: 'Allocate surplus funds to emergency corpus'
        });
      }

    } catch (error) {
      console.error('Error generating monthly nudges:', error);
    }

    return nudges;
  }
}
