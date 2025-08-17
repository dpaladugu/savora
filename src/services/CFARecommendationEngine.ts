
import { db } from '@/lib/db';
import { extendedDb } from '@/lib/db-schema-extended';
import type { Investment } from '@/lib/db';

interface Recommendation {
  id: string;
  type: 'portfolio' | 'tax' | 'risk' | 'goal' | 'cash_flow';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  confidenceScore: number;
  category: string;
  expectedReturn?: number;
  riskLevel?: string;
}

interface PortfolioAnalysis {
  assetAllocation: Record<string, number>;
  riskScore: number;
  expectedReturn: number;
  sharpeRatio: number;
  diversificationScore: number;
  rebalanceNeeded: boolean;
}

export class CFARecommendationEngine {
  static async generateRecommendations(): Promise<Recommendation[]> {
    try {
      const [investments, expenses, goals] = await Promise.all([
        db.investments.toArray(),
        db.expenses.orderBy('date').reverse().limit(100).toArray(),
        db.goals.toArray()
      ]);

      const recommendations: Recommendation[] = [];

      // Portfolio recommendations
      if (investments.length > 0) {
        const portfolioRec = await this.analyzePortfolioBalance(investments);
        if (portfolioRec) recommendations.push(portfolioRec);
      }

      // Tax optimization recommendations
      const taxRec = this.generateTaxOptimizationRec();
      if (taxRec) recommendations.push(taxRec);

      // Risk management recommendations
      const riskRec = await this.generateRiskManagementRec(investments);
      if (riskRec) recommendations.push(riskRec);

      // Goal-based recommendations
      if (goals.length > 0) {
        const goalRec = this.generateGoalPlanningRec(goals);
        if (goalRec) recommendations.push(goalRec);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating CFA recommendations:', error);
      return [];
    }
  }

  static async analyzePortfolio(): Promise<PortfolioAnalysis> {
    try {
      const investments = await db.investments.toArray();
      
      if (investments.length === 0) {
        return {
          assetAllocation: {},
          riskScore: 0,
          expectedReturn: 0,
          sharpeRatio: 0,
          diversificationScore: 0,
          rebalanceNeeded: false
        };
      }

      // Calculate asset allocation
      const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
      const assetAllocation: Record<string, number> = {};

      investments.forEach(inv => {
        const category = inv.investment_type || 'Other';
        const weight = ((inv.current_value || 0) / totalValue) * 100;
        assetAllocation[category] = (assetAllocation[category] || 0) + weight;
      });

      // Calculate risk score (simplified)
      const riskScore = this.calculateRiskScore(investments);
      
      // Calculate expected return (simplified)
      const expectedReturn = this.calculateExpectedReturn(investments);
      
      // Calculate Sharpe ratio (simplified)
      const sharpeRatio = this.calculateSharpeRatio(expectedReturn, riskScore);
      
      // Calculate diversification score
      const diversificationScore = this.calculateDiversificationScore(assetAllocation);
      
      // Check if rebalancing is needed
      const rebalanceNeeded = this.checkRebalanceNeeded(assetAllocation);

      return {
        assetAllocation,
        riskScore,
        expectedReturn,
        sharpeRatio,
        diversificationScore,
        rebalanceNeeded
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      return {
        assetAllocation: {},
        riskScore: 0,
        expectedReturn: 0,
        sharpeRatio: 0,
        diversificationScore: 0,
        rebalanceNeeded: false
      };
    }
  }

  private static async analyzePortfolioBalance(investments: Investment[]): Promise<Recommendation | null> {
    const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    
    if (totalValue === 0) return null;

    // Analyze asset allocation
    const allocation: Record<string, number> = {};
    investments.forEach(inv => {
      const type = inv.investment_type || 'Other';
      allocation[type] = (allocation[type] || 0) + (inv.current_value || 0);
    });

    // Check for over-concentration
    const maxAllocation = Math.max(...Object.values(allocation)) / totalValue;
    
    if (maxAllocation > 0.6) {
      return {
        id: 'portfolio-concentration',
        type: 'portfolio',
        priority: 'high',
        title: 'Portfolio Over-Concentration Risk',
        description: 'Your portfolio is heavily concentrated in one asset class, increasing risk.',
        impact: 'Diversifying could reduce volatility by 15-25% while maintaining returns.',
        actionItems: [
          'Consider rebalancing to limit any single asset class to 40-50%',
          'Add international exposure if missing',
          'Include bonds or fixed income for stability'
        ],
        confidenceScore: 85,
        category: 'Risk Management',
        expectedReturn: 2.5,
        riskLevel: 'Medium'
      };
    }

    return null;
  }

  private static generateTaxOptimizationRec(): Recommendation {
    return {
      id: 'tax-optimization',
      type: 'tax',
      priority: 'medium',
      title: 'Tax-Loss Harvesting Opportunity',
      description: 'Review your portfolio for tax-loss harvesting opportunities to reduce tax liability.',
      impact: 'Could save 10-30% on capital gains taxes through strategic loss realization.',
      actionItems: [
        'Review underperforming investments for tax-loss harvesting',
        'Consider tax-efficient fund switches',
        'Maximize contributions to tax-advantaged accounts'
      ],
      confidenceScore: 70,
      category: 'Tax Strategy',
      riskLevel: 'Low'
    };
  }

  private static async generateRiskManagementRec(investments: Investment[]): Promise<Recommendation | null> {
    if (investments.length === 0) return null;

    return {
      id: 'risk-management',
      type: 'risk',
      priority: 'high',
      title: 'Risk Assessment & Insurance Review',
      description: 'Your investment portfolio needs appropriate risk management and insurance coverage.',
      impact: 'Proper risk management can protect 90% of your wealth from unexpected events.',
      actionItems: [
        'Review life and disability insurance coverage',
        'Ensure emergency fund covers 6+ months expenses',
        'Consider umbrella insurance policy'
      ],
      confidenceScore: 90,
      category: 'Risk Management',
      riskLevel: 'Low'
    };
  }

  private static generateGoalPlanningRec(goals: any[]): Recommendation {
    const totalGoalAmount = goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
    
    return {
      id: 'goal-planning',
      type: 'goal',
      priority: 'medium',
      title: 'Strategic Goal Alignment',
      description: 'Your investment strategy should align with your financial goals timeline and risk tolerance.',
      impact: `Optimizing for your ₹${totalGoalAmount.toLocaleString()} in goals could improve success probability by 20-40%.`,
      actionItems: [
        'Match investment time horizon with goal deadlines',
        'Adjust risk level based on goal priorities',
        'Set up systematic investment plans for each goal'
      ],
      confidenceScore: 80,
      category: 'Goal Planning',
      expectedReturn: 8.5,
      riskLevel: 'Medium'
    };
  }

  private static calculateRiskScore(investments: Investment[]): number {
    // Simplified risk calculation based on asset types
    const riskWeights: Record<string, number> = {
      'Equity': 8,
      'Mutual Fund': 6,
      'Crypto': 10,
      'Bond': 3,
      'FD': 1,
      'Gold': 5
    };

    const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    if (totalValue === 0) return 0;

    let weightedRisk = 0;
    investments.forEach(inv => {
      const type = inv.investment_type || 'Mutual Fund';
      const weight = (inv.current_value || 0) / totalValue;
      const risk = riskWeights[type] || 5;
      weightedRisk += weight * risk;
    });

    return Math.min(10, Math.max(1, weightedRisk));
  }

  private static calculateExpectedReturn(investments: Investment[]): number {
    // Simplified expected return calculation
    const returnRates: Record<string, number> = {
      'Equity': 12,
      'Mutual Fund': 10,
      'Crypto': 15,
      'Bond': 6,
      'FD': 5,
      'Gold': 8
    };

    const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    if (totalValue === 0) return 0;

    let weightedReturn = 0;
    investments.forEach(inv => {
      const type = inv.investment_type || 'Mutual Fund';
      const weight = (inv.current_value || 0) / totalValue;
      const expectedReturn = returnRates[type] || 8;
      weightedReturn += weight * expectedReturn;
    });

    return weightedReturn;
  }

  private static calculateSharpeRatio(expectedReturn: number, riskScore: number): number {
    const riskFreeRate = 6; // Assume 6% risk-free rate
    const volatility = riskScore * 2; // Convert risk score to volatility estimate
    
    if (volatility === 0) return 0;
    return (expectedReturn - riskFreeRate) / volatility;
  }

  private static calculateDiversificationScore(allocation: Record<string, number>): number {
    const values = Object.values(allocation);
    if (values.length <= 1) return 0;

    // Calculate Herfindahl-Hirschman Index and convert to diversification score
    const hhi = values.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
    const maxHHI = 10000; // Maximum concentration (100^2)
    const diversificationScore = Math.max(0, (1 - hhi / maxHHI) * 100);
    
    return diversificationScore;
  }

  private static checkRebalanceNeeded(allocation: Record<string, number>): boolean {
    // Check if any asset class is more than 60% or less than 5% (for significant holdings)
    const values = Object.values(allocation);
    return values.some(weight => weight > 60 || (weight > 0 && weight < 5));
  }
}
