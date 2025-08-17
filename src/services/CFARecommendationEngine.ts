
import { db } from '@/lib/db';
import { ExpenseService } from './ExpenseService';
import { InvestmentService } from './InvestmentService';
import { GlobalSettingsService } from './GlobalSettingsService';

export interface CFARecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Investment' | 'Insurance' | 'Tax' | 'Goal' | 'Risk';
  action: string;
  impact: string;
  timeframe: string;
}

export interface InsuranceGap {
  id: string;
  title: string;
  currentCoverage: number;
  recommendedCoverage: number;
  gapAmount: number;
  priority: 'High' | 'Medium' | 'Low';
}

export class CFARecommendationEngine {
  static async generateRecommendations(): Promise<CFARecommendation[]> {
    try {
      const recommendations: CFARecommendation[] = [];
      
      // Get financial data
      const expenses = await ExpenseService.getExpenses();
      const investments = await InvestmentService.getInvestments();
      
      // Portfolio rebalancing recommendations
      const rebalanceRecs = await this.checkRebalancingNeeds();
      recommendations.push(...rebalanceRecs);
      
      // Insurance gap analysis
      const insuranceRecs = await this.analyzeInsuranceGaps(1200000); // Default annual income
      recommendations.push(...insuranceRecs.map(gap => ({
        id: gap.id,
        title: gap.title,
        description: `Current coverage: ₹${gap.currentCoverage.toLocaleString()}, Recommended: ₹${gap.recommendedCoverage.toLocaleString()}`,
        priority: gap.priority,
        category: 'Insurance' as const,
        action: `Increase coverage by ₹${gap.gapAmount.toLocaleString()}`,
        impact: 'Risk mitigation',
        timeframe: '30 days'
      })));
      
      // SIP recommendations
      const sipRecs = await this.getSIPRecommendations();
      recommendations.push(...sipRecs);
      
      // Tax optimization
      const taxRecs = await this.getTaxOptimizationSuggestions();
      recommendations.push(...taxRecs);
      
      return recommendations;
    } catch (error) {
      console.error('Error generating CFA recommendations:', error);
      return [];
    }
  }

  static async checkRebalancingNeeds(): Promise<CFARecommendation[]> {
    try {
      const investments = await InvestmentService.getInvestments();
      const recommendations: CFARecommendation[] = [];
      
      if (investments.length === 0) {
        return [{
          id: 'no-investments',
          title: 'Start Your Investment Journey',
          description: 'No investments found. Consider starting with diversified mutual funds.',
          priority: 'High',
          category: 'Investment',
          action: 'Invest in equity and debt mutual funds',
          impact: 'Wealth creation',
          timeframe: '7 days'
        }];
      }
      
      // Calculate current allocation
      const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
      const equityValue = investments
        .filter(inv => inv.type?.includes('Equity') || inv.type?.includes('MF-Growth'))
        .reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
      
      const equityPercent = totalValue > 0 ? (equityValue / totalValue) * 100 : 0;
      
      // Age-based recommendation (assuming user is 35)
      const recommendedEquity = 70;
      const drift = Math.abs(equityPercent - recommendedEquity);
      
      if (drift > 5) {
        recommendations.push({
          id: 'rebalance-portfolio',
          title: 'Portfolio Rebalancing Required',
          description: `Current equity allocation: ${equityPercent.toFixed(1)}%, Recommended: ${recommendedEquity}%`,
          priority: 'Medium',
          category: 'Investment',
          action: equityPercent > recommendedEquity ? 'Reduce equity allocation' : 'Increase equity allocation',
          impact: 'Risk optimization',
          timeframe: '30 days'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error checking rebalancing needs:', error);
      return [];
    }
  }

  static async analyzeInsuranceGaps(annualIncome: number): Promise<InsuranceGap[]> {
    try {
      const gaps: InsuranceGap[] = [];
      
      // Term insurance gap (10x income)
      const recommendedTerm = annualIncome * 10;
      gaps.push({
        id: 'term-insurance',
        title: 'Term Life Insurance',
        currentCoverage: 0, // Would need to fetch from insurance table
        recommendedCoverage: recommendedTerm,
        gapAmount: recommendedTerm,
        priority: 'High'
      });
      
      // Health insurance gap (5x income)
      const recommendedHealth = Math.min(annualIncome * 0.5, 1000000);
      gaps.push({
        id: 'health-insurance',
        title: 'Health Insurance',
        currentCoverage: 0,
        recommendedCoverage: recommendedHealth,
        gapAmount: recommendedHealth,
        priority: 'High'
      });
      
      return gaps;
    } catch (error) {
      console.error('Error analyzing insurance gaps:', error);
      return [];
    }
  }

  static async getSIPRecommendations(): Promise<CFARecommendation[]> {
    try {
      const recommendations: CFARecommendation[] = [];
      const investments = await InvestmentService.getInvestments();
      
      const activeSIPs = investments.filter(inv => inv.type === 'SIP');
      
      if (activeSIPs.length === 0) {
        recommendations.push({
          id: 'start-sip',
          title: 'Start Systematic Investment Plan',
          description: 'No active SIPs found. SIPs help in rupee cost averaging.',
          priority: 'High',
          category: 'Investment',
          action: 'Start SIP in diversified equity funds',
          impact: 'Long-term wealth creation',
          timeframe: '7 days'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting SIP recommendations:', error);
      return [];
    }
  }

  static async getTaxOptimizationSuggestions(): Promise<CFARecommendation[]> {
    try {
      const recommendations: CFARecommendation[] = [];
      const settings = await GlobalSettingsService.getGlobalSettings();
      
      if (settings.taxRegime === 'New') {
        recommendations.push({
          id: 'nps-tax-benefit',
          title: 'NPS Tax Benefit',
          description: 'Utilize ₹50,000 additional deduction under 80CCD(1B)',
          priority: 'Medium',
          category: 'Tax',
          action: 'Invest in NPS Tier-1',
          impact: 'Tax savings up to ₹15,000',
          timeframe: 'Before March 31'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting tax optimization suggestions:', error);
      return [];
    }
  }

  static async generateMonthlyNudges(): Promise<CFARecommendation[]> {
    try {
      const nudges: CFARecommendation[] = [];
      
      // Emergency fund nudge
      nudges.push({
        id: 'emergency-fund-review',
        title: 'Emergency Fund Review',
        description: 'Review and top-up your emergency fund if needed',
        priority: 'Medium',
        category: 'Goal',
        action: 'Check emergency fund adequacy',
        impact: 'Financial security',
        timeframe: '15 days'
      });
      
      return nudges;
    } catch (error) {
      console.error('Error generating monthly nudges:', error);
      return [];
    }
  }
}
