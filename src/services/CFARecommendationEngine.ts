
import type { Investment } from '@/lib/db';

export interface PortfolioAnalysis {
  totalValue: number;
  allocation: {
    equity: number;
    debt: number;
    other: number;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
  diversificationScore: number;
}

export interface Recommendation {
  id: string;
  type: 'portfolio' | 'tax' | 'risk' | 'goal';
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  category: string;
}

export interface CFARecommendations {
  portfolio: Recommendation[];
  tax: Recommendation[];
  risk: Recommendation[];
  goals: Recommendation[];
  summary: {
    totalRecommendations: number;
    highPriority: number;
    estimatedBenefit: string;
  };
}

export class CFARecommendationEngine {
  static async analyzePortfolio(investments: Investment[]): Promise<PortfolioAnalysis> {
    if (!investments.length) {
      return {
        totalValue: 0,
        allocation: { equity: 0, debt: 0, other: 0 },
        riskLevel: 'Low',
        diversificationScore: 0
      };
    }

    const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    
    const allocation = {
      equity: 0,
      debt: 0,
      other: 0
    };

    investments.forEach(inv => {
      const value = inv.currentValue || 0;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      if (inv.type === 'equity' || inv.type === 'mutual_fund') {
        allocation.equity += percentage;
      } else if (inv.type === 'debt' || inv.type === 'bond') {
        allocation.debt += percentage;
      } else {
        allocation.other += percentage;
      }
    });

    const riskLevel = allocation.equity > 70 ? 'High' : 
                     allocation.equity > 30 ? 'Medium' : 'Low';

    const diversificationScore = Math.min(100, investments.length * 10);

    return {
      totalValue,
      allocation,
      riskLevel,
      diversificationScore
    };
  }

  static async generatePortfolioRecommendations(investments: Investment[]): Promise<Recommendation[]> {
    const analysis = await this.analyzePortfolio(investments);
    const recommendations: Recommendation[] = [];

    // Asset allocation recommendations
    if (analysis.allocation.equity > 80) {
      recommendations.push({
        id: 'rebalance-equity',
        type: 'portfolio',
        priority: 'High',
        title: 'Rebalance High Equity Exposure',
        description: 'Your portfolio has over 80% equity allocation, which may be too risky.',
        actionItems: [
          'Consider moving 10-15% to debt instruments',
          'Add government bonds or FDs for stability',
          'Review risk tolerance vs age'
        ],
        expectedImpact: 'Reduced portfolio volatility by 15-20%',
        category: 'Asset Allocation'
      });
    }

    if (analysis.diversificationScore < 30) {
      recommendations.push({
        id: 'improve-diversification',
        type: 'portfolio',
        priority: 'Medium',
        title: 'Improve Portfolio Diversification',
        description: 'Your portfolio lacks sufficient diversification across asset classes.',
        actionItems: [
          'Add international equity exposure',
          'Consider REITs for real estate exposure',
          'Include gold/commodities (5-10%)'
        ],
        expectedImpact: 'Better risk-adjusted returns',
        category: 'Diversification'
      });
    }

    return recommendations;
  }

  static async generateTaxRecommendations(investments: Investment[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue > 250000) {
      recommendations.push({
        id: 'tax-optimization',
        type: 'tax',
        priority: 'High',
        title: 'Optimize Tax Strategy',
        description: 'Consider tax-saving investments to reduce tax liability.',
        actionItems: [
          'Maximize ELSS investments (₹1.5L limit)',
          'Consider PPF/VPF contributions',
          'Review LTCG harvesting opportunities'
        ],
        expectedImpact: 'Save up to ₹46,800 in taxes annually',
        category: 'Tax Planning'
      });
    }

    return recommendations;
  }

  static async generateRiskRecommendations(investments: Investment[]): Promise<Recommendation[]> {
    const analysis = await this.analyzePortfolio(investments);
    const recommendations: Recommendation[] = [];

    if (analysis.riskLevel === 'High') {
      recommendations.push({
        id: 'reduce-risk',
        type: 'risk',
        priority: 'Medium',
        title: 'Consider Risk Reduction',
        description: 'Your portfolio carries high risk. Consider your investment horizon.',
        actionItems: [
          'Review emergency fund adequacy',
          'Consider term insurance coverage',
          'Evaluate debt component increase'
        ],
        expectedImpact: 'More stable returns with lower volatility',
        category: 'Risk Management'
      });
    }

    return recommendations;
  }

  static async generateGoalRecommendations(investments: Investment[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue < 500000) {
      recommendations.push({
        id: 'sip-increase',
        type: 'goal',
        priority: 'High',
        title: 'Increase SIP Contributions',
        description: 'Current investment pace may not meet long-term goals.',
        actionItems: [
          'Increase monthly SIP by 10-15%',
          'Set up automatic step-up SIPs',
          'Review and set specific financial goals'
        ],
        expectedImpact: 'Reach financial goals 2-3 years earlier',
        category: 'Goal Planning'
      });
    }

    return recommendations;
  }

  static async generateRecommendations(investments: Investment[], expenses: any[]): Promise<CFARecommendations> {
    const portfolioRecs = await this.generatePortfolioRecommendations(investments);
    const taxRecs = await this.generateTaxRecommendations(investments);
    const riskRecs = await this.generateRiskRecommendations(investments);
    const goalRecs = await this.generateGoalRecommendations(investments);

    const allRecommendations = [...portfolioRecs, ...taxRecs, ...riskRecs, ...goalRecs];
    const highPriority = allRecommendations.filter(r => r.priority === 'High').length;

    return {
      portfolio: portfolioRecs,
      tax: taxRecs,
      risk: riskRecs,
      goals: goalRecs,
      summary: {
        totalRecommendations: allRecommendations.length,
        highPriority,
        estimatedBenefit: 'Potential 15-25% improvement in risk-adjusted returns'
      }
    };
  }
}
