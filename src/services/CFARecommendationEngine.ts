
import { ExpenseService } from './ExpenseService';
import { InvestmentService } from './InvestmentService';
import { GoalService } from './goal-service';
import { GlobalSettingsService } from './GlobalSettingsService';

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
      const [expenses, investments, goals, settings] = await Promise.all([
        ExpenseService.getAllExpenses(),
        InvestmentService.getAllInvestments(),
        GoalService.getAllGoals(),
        GlobalSettingsService.getGlobalSettings()
      ]);

      const recommendations: Recommendation[] = [];

      // Portfolio optimization recommendations
      recommendations.push(...await this.generatePortfolioRecommendations(investments));

      // Tax optimization recommendations
      recommendations.push(...await this.generateTaxRecommendations(expenses, investments, settings));

      // Risk management recommendations
      recommendations.push(...await this.generateRiskRecommendations(investments, expenses));

      // Goal-based recommendations
      recommendations.push(...await this.generateGoalRecommendations(goals, investments));

      // Cash flow recommendations
      recommendations.push(...await this.generateCashFlowRecommendations(expenses));

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  static async analyzePortfolio(): Promise<PortfolioAnalysis> {
    try {
      const investments = await InvestmentService.getAllInvestments();
      
      // Calculate asset allocation
      const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
      const assetAllocation: Record<string, number> = {};
      
      investments.forEach(inv => {
        const value = inv.current_value || inv.amount;
        const percentage = (value / totalValue) * 100;
        assetAllocation[inv.type] = (assetAllocation[inv.type] || 0) + percentage;
      });

      // Calculate risk score (simplified)
      const riskScore = this.calculateRiskScore(investments);
      
      // Calculate expected return
      const expectedReturn = investments.reduce((sum, inv) => {
        const weight = (inv.current_value || inv.amount) / totalValue;
        return sum + (weight * (inv.expected_return || 8));
      }, 0);

      // Calculate Sharpe ratio (simplified)
      const sharpeRatio = (expectedReturn - 6) / Math.sqrt(riskScore * 2);

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
        riskScore: 5,
        expectedReturn: 8,
        sharpeRatio: 0.5,
        diversificationScore: 50,
        rebalanceNeeded: false
      };
    }
  }

  private static async generatePortfolioRecommendations(investments: any[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (investments.length === 0) {
      recommendations.push({
        id: 'start-investing',
        type: 'portfolio',
        priority: 'high',
        title: 'Start Building Your Investment Portfolio',
        description: 'You have no recorded investments. Building a diversified investment portfolio is crucial for long-term wealth creation.',
        impact: 'Starting with a diversified portfolio can help you achieve long-term financial goals and beat inflation.',
        actionItems: [
          'Start with low-cost index funds or ETFs',
          'Consider a mix of equity and debt instruments',
          'Set up systematic investment plans (SIPs)',
          'Maintain emergency fund before significant investments'
        ],
        confidenceScore: 95,
        category: 'Portfolio Building',
        expectedReturn: 12,
        riskLevel: 'Medium'
      });
      return recommendations;
    }

    // Check for diversification
    const assetTypes = new Set(investments.map(inv => inv.type));
    if (assetTypes.size < 3) {
      recommendations.push({
        id: 'diversify-portfolio',
        type: 'portfolio',
        priority: 'high',
        title: 'Diversify Your Investment Portfolio',
        description: 'Your portfolio lacks diversification across asset classes, which increases concentration risk.',
        impact: 'Proper diversification can reduce portfolio volatility by 20-30% without sacrificing returns.',
        actionItems: [
          'Add different asset classes (equity, debt, commodities)',
          'Consider international exposure',
          'Include REITs for real estate exposure',
          'Maintain appropriate sector allocation'
        ],
        confidenceScore: 88,
        category: 'Risk Management',
        expectedReturn: 2.5,
        riskLevel: 'Low'
      });
    }

    return recommendations;
  }

  private static async generateTaxRecommendations(expenses: any[], investments: any[], settings: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Tax regime optimization
    if (settings.taxRegime === 'Old') {
      recommendations.push({
        id: 'optimize-tax-regime',
        type: 'tax',
        priority: 'medium',
        title: 'Consider Switching to New Tax Regime',
        description: 'Based on your expense patterns, the new tax regime might be more beneficial for your income bracket.',
        impact: 'Switching could save you ₹15,000 - ₹50,000 annually in taxes.',
        actionItems: [
          'Calculate taxes under both regimes',
          'Consider your deduction eligibility',
          'Factor in future income growth',
          'Consult with a tax advisor'
        ],
        confidenceScore: 75,
        category: 'Tax Planning',
        riskLevel: 'Low'
      });
    }

    // 80C utilization
    const investmentDeductions = investments.filter(inv => 
      ['ELSS', 'PPF', 'EPF', 'Tax Saver FD'].includes(inv.type)
    );
    const totalDeductions = investmentDeductions.reduce((sum, inv) => sum + inv.amount, 0);

    if (totalDeductions < 150000) {
      recommendations.push({
        id: 'maximize-80c',
        type: 'tax',
        priority: 'high',
        title: 'Maximize Section 80C Deductions',
        description: `You're only utilizing ₹${totalDeductions.toLocaleString()} of the ₹1.5L limit under Section 80C.`,
        impact: `Save up to ₹${((150000 - totalDeductions) * 0.3).toLocaleString()} in taxes annually.`,
        actionItems: [
          'Invest in ELSS mutual funds',
          'Increase PPF contributions',
          'Consider NSC or tax-saver FDs',
          'Utilize home loan principal repayment'
        ],
        confidenceScore: 90,
        category: 'Tax Savings',
        expectedReturn: 30,
        riskLevel: 'Low'
      });
    }

    return recommendations;
  }

  private static async generateRiskRecommendations(investments: any[], expenses: any[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Emergency fund check
    const monthlyExpenses = expenses
      .filter(exp => exp.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, exp) => sum + exp.amount, 0);

    const liquidInvestments = investments.filter(inv => 
      ['Savings Account', 'Liquid Fund', 'FD'].includes(inv.type)
    );
    const emergencyFund = liquidInvestments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

    if (emergencyFund < monthlyExpenses * 6) {
      recommendations.push({
        id: 'build-emergency-fund',
        type: 'risk',
        priority: 'high',
        title: 'Build Adequate Emergency Fund',
        description: `Your emergency fund covers only ${Math.round(emergencyFund / monthlyExpenses)} months of expenses. Aim for 6-12 months.`,
        impact: 'Adequate emergency fund prevents forced liquidation of investments during emergencies.',
        actionItems: [
          'Set aside 6-12 months of expenses in liquid funds',
          'Keep emergency fund in high-yield savings or liquid funds',
          'Automate monthly contributions to emergency fund',
          'Review and adjust fund size annually'
        ],
        confidenceScore: 95,
        category: 'Financial Security',
        riskLevel: 'Critical'
      });
    }

    return recommendations;
  }

  private static async generateGoalRecommendations(goals: any[], investments: any[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (goals.length === 0) {
      recommendations.push({
        id: 'set-financial-goals',
        type: 'goal',
        priority: 'medium',
        title: 'Define Clear Financial Goals',
        description: 'Having specific, measurable financial goals is essential for effective wealth building.',
        impact: 'Clear goals improve investment discipline and help optimize asset allocation strategies.',
        actionItems: [
          'Set short-term goals (1-3 years)',
          'Define medium-term goals (3-7 years)',
          'Plan long-term goals (retirement, children\'s education)',
          'Assign target amounts and timelines'
        ],
        confidenceScore: 85,
        category: 'Goal Planning',
        riskLevel: 'Low'
      });
    }

    return recommendations;
  }

  private static async generateCashFlowRecommendations(expenses: any[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Analyze spending patterns
    const monthlyExpenses = expenses
      .filter(exp => exp.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, exp) => sum + exp.amount, 0);

    const discretionaryExpenses = expenses
      .filter(exp => 
        exp.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) &&
        ['Entertainment', 'Dining', 'Shopping', 'Travel'].includes(exp.category)
      )
      .reduce((sum, exp) => sum + exp.amount, 0);

    const discretionaryRatio = discretionaryExpenses / monthlyExpenses;

    if (discretionaryRatio > 0.3) {
      recommendations.push({
        id: 'optimize-discretionary-spending',
        type: 'cash_flow',
        priority: 'medium',
        title: 'Optimize Discretionary Spending',
        description: `${Math.round(discretionaryRatio * 100)}% of your expenses are discretionary. Consider optimizing for better savings rate.`,
        impact: `Reducing discretionary spending by 20% could free up ₹${Math.round(discretionaryExpenses * 0.2).toLocaleString()} monthly for investments.`,
        actionItems: [
          'Track and categorize all expenses',
          'Set monthly budgets for discretionary categories',
          'Use the 50/30/20 rule for budgeting',
          'Automate investments to pay yourself first'
        ],
        confidenceScore: 80,
        category: 'Cash Flow Management',
        riskLevel: 'Low'
      });
    }

    return recommendations;
  }

  private static calculateRiskScore(investments: any[]): number {
    const riskWeights: Record<string, number> = {
      'Equity': 8,
      'Mutual Fund': 7,
      'Stock': 9,
      'Bond': 3,
      'FD': 1,
      'PPF': 2,
      'Gold': 6,
      'Real Estate': 5
    };

    const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
    
    return investments.reduce((weightedRisk, inv) => {
      const weight = (inv.current_value || inv.amount) / totalValue;
      const risk = riskWeights[inv.type] || 5;
      return weightedRisk + (weight * risk);
    }, 0);
  }

  private static calculateDiversificationScore(allocation: Record<string, number>): number {
    const allocations = Object.values(allocation);
    const idealAllocation = 100 / allocations.length;
    
    const deviation = allocations.reduce((sum, alloc) => {
      return sum + Math.abs(alloc - idealAllocation);
    }, 0);

    return Math.max(0, 100 - deviation);
  }

  private static checkRebalanceNeeded(allocation: Record<string, number>): boolean {
    const allocations = Object.values(allocation);
    const maxAllocation = Math.max(...allocations);
    const minAllocation = Math.min(...allocations);
    
    return (maxAllocation - minAllocation) > 40;
  }
}
