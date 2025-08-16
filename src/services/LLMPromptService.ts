
import { GlobalSettingsService } from './GlobalSettingsService';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

interface PromptTemplate {
  id: string;
  name: string;
  category: 'expense_analysis' | 'investment_advice' | 'tax_planning' | 'goal_setting' | 'general';
  prompt: string;
  variables: string[];
  description: string;
}

export class LLMPromptService {
  private static readonly DEFAULT_PROMPTS: PromptTemplate[] = [
    {
      id: 'expense-categorization',
      name: 'Expense Categorization',
      category: 'expense_analysis',
      prompt: `Analyze the following expense: "{description}" for amount ₹{amount}.
      
      Based on the description, suggest:
      1. The most appropriate category from: {categories}
      2. Any relevant tags
      3. Whether this seems like a reasonable expense for the amount
      
      Respond in JSON format with: {"category": "...", "tags": [...], "analysis": "..."}`,
      variables: ['description', 'amount', 'categories'],
      description: 'Automatically categorize expenses based on description and amount'
    },
    {
      id: 'investment-advice',
      name: 'Investment Portfolio Analysis',
      category: 'investment_advice',
      prompt: `Analyze this investment portfolio:
      
      Current Investments: {investments}
      Monthly Income: ₹{income}
      Monthly Expenses: ₹{expenses}
      Age: {age}
      Risk Tolerance: {risk_tolerance}
      
      Provide specific recommendations for:
      1. Asset allocation optimization
      2. Missing investment categories
      3. Risk assessment
      4. Rebalancing suggestions
      
      Format as professional financial advice.`,
      variables: ['investments', 'income', 'expenses', 'age', 'risk_tolerance'],
      description: 'Get personalized investment advice based on your portfolio'
    },
    {
      id: 'tax-optimization',
      name: 'Tax Optimization Strategy',
      category: 'tax_planning',
      prompt: `Review tax optimization opportunities:
      
      Annual Income: ₹{income}
      Current Tax Regime: {tax_regime}
      Existing Deductions: {deductions}
      Investment Details: {investments}
      
      Suggest:
      1. Section 80C optimization strategies
      2. Other applicable deductions
      3. Tax-efficient investment options
      4. Whether to switch tax regimes
      
      Provide specific amounts and actionable steps.`,
      variables: ['income', 'tax_regime', 'deductions', 'investments'],
      description: 'Optimize your tax planning with AI-powered recommendations'
    },
    {
      id: 'goal-planning',
      name: 'Financial Goal Planning',
      category: 'goal_setting',
      prompt: `Help plan for this financial goal:
      
      Goal: {goal_name}
      Target Amount: ₹{target_amount}
      Time Horizon: {years} years
      Current Savings: ₹{current_savings}
      Monthly Budget: ₹{monthly_budget}
      Risk Tolerance: {risk_tolerance}
      
      Calculate and suggest:
      1. Required monthly SIP amount
      2. Suitable investment instruments
      3. Risk-adjusted returns needed
      4. Milestone tracking plan
      
      Provide a detailed action plan.`,
      variables: ['goal_name', 'target_amount', 'years', 'current_savings', 'monthly_budget', 'risk_tolerance'],
      description: 'Create detailed plans to achieve your financial goals'
    },
    {
      id: 'spending-analysis',
      name: 'Spending Pattern Analysis',
      category: 'expense_analysis',
      prompt: `Analyze spending patterns from this data:
      
      Monthly Expenses by Category: {expense_breakdown}
      Income: ₹{income}
      Previous Month Comparison: {previous_month}
      
      Identify:
      1. Unusual spending patterns
      2. Areas for cost optimization
      3. Budget recommendations
      4. Potential savings opportunities
      
      Provide actionable insights with specific amounts.`,
      variables: ['expense_breakdown', 'income', 'previous_month'],
      description: 'Get insights into your spending habits and optimization opportunities'
    }
  ];

  static async getLLMConfig(): Promise<LLMConfig | null> {
    try {
      const settings = await GlobalSettingsService.getGlobalSettings();
      
      // In a real implementation, this would be stored securely
      return {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        baseUrl: 'https://api.openai.com/v1'
      };
    } catch (error) {
      console.error('Error getting LLM config:', error);
      return null;
    }
  }

  static async updateLLMConfig(config: Partial<LLMConfig>): Promise<void> {
    try {
      // In a real implementation, this would securely store the configuration
      await GlobalSettingsService.updateGlobalSettings({
        // Store encrypted config
      });
    } catch (error) {
      console.error('Error updating LLM config:', error);
      throw error;
    }
  }

  static getPromptTemplates(): PromptTemplate[] {
    return [...this.DEFAULT_PROMPTS];
  }

  static getPromptTemplate(id: string): PromptTemplate | null {
    return this.DEFAULT_PROMPTS.find(template => template.id === id) || null;
  }

  static async executePrompt(templateId: string, variables: Record<string, any>): Promise<string> {
    try {
      const template = this.getPromptTemplate(templateId);
      if (!template) {
        throw new Error(`Prompt template ${templateId} not found`);
      }

      const config = await this.getLLMConfig();
      if (!config) {
        throw new Error('LLM configuration not found');
      }

      // Replace variables in prompt
      let prompt = template.prompt;
      template.variables.forEach(variable => {
        const value = variables[variable] || `[${variable} not provided]`;
        prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), value);
      });

      // In a real implementation, this would call the actual LLM API
      console.log('Executing prompt:', prompt);
      
      // Mock response for now
      return this.getMockResponse(templateId, variables);
    } catch (error) {
      console.error('Error executing prompt:', error);
      throw error;
    }
  }

  private static getMockResponse(templateId: string, variables: Record<string, any>): string {
    switch (templateId) {
      case 'expense-categorization':
        return JSON.stringify({
          category: 'Food & Dining',
          tags: ['restaurant', 'dinner'],
          analysis: 'This appears to be a reasonable restaurant expense for the amount.'
        });
      
      case 'investment-advice':
        return `Based on your portfolio analysis:

1. **Asset Allocation Optimization**:
   - Increase equity allocation to 70% for your age group
   - Add international equity exposure (10-15%)
   - Consider adding REITs for diversification

2. **Missing Investment Categories**:
   - No exposure to international markets
   - Consider adding gold ETFs (5-10%)
   - Small-cap funds are underrepresented

3. **Risk Assessment**:
   - Current risk level: Moderate
   - Portfolio volatility: Medium
   - Suitable for long-term wealth creation

4. **Rebalancing Suggestions**:
   - Reduce debt allocation from 40% to 30%
   - Increase equity exposure gradually
   - Review and rebalance quarterly`;

      case 'tax-optimization':
        return `**Tax Optimization Strategy**:

1. **Section 80C Optimization**:
   - Current utilization: ₹1,20,000/₹1,50,000
   - Opportunity: Save ₹9,000 in taxes by investing additional ₹30,000
   - Recommend: ELSS funds for better returns

2. **Other Deductions**:
   - Section 80D: Health insurance premiums
   - Section 24: Home loan interest
   - NPS under 80CCD(1B): Additional ₹50,000 deduction

3. **Tax Regime Analysis**:
   - Old regime more beneficial given your deductions
   - Annual tax savings: ₹25,000-₹40,000

4. **Action Items**:
   - Invest ₹30,000 more in ELSS before March 31st
   - Consider NPS for additional tax benefits
   - Maintain comprehensive health insurance`;

      default:
        return 'Analysis completed. Please refer to the detailed recommendations above.';
    }
  }

  static async generateExpenseInsights(expenses: any[]): Promise<string> {
    const expenseBreakdown = this.calculateExpenseBreakdown(expenses);
    const totalIncome = 100000; // Mock income
    
    return await this.executePrompt('spending-analysis', {
      expense_breakdown: JSON.stringify(expenseBreakdown),
      income: totalIncome,
      previous_month: JSON.stringify({})
    });
  }

  static async generateInvestmentAdvice(investments: any[], userProfile: any): Promise<string> {
    return await this.executePrompt('investment-advice', {
      investments: JSON.stringify(investments),
      income: userProfile.income || 0,
      expenses: userProfile.expenses || 0,
      age: userProfile.age || 30,
      risk_tolerance: userProfile.riskTolerance || 'moderate'
    });
  }

  private static calculateExpenseBreakdown(expenses: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    expenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });
    return breakdown;
  }
}
