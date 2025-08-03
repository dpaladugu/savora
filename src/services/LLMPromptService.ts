
/**
 * Privacy-First LLM Prompt Generator
 * Generates anonymous financial prompts for external LLM analysis per requirements spec Section 25
 */

import { db } from '@/lib/db';
import type { Investment, Loan, Goal, Txn } from '@/lib/db';

export interface AnonymousFinancialPrompt {
  type: 'AssetReview' | 'GoalReview' | 'TaxReview' | 'HealthReview' | 'VehicleReview' | 'RentalReview' | 'EmergencyReview';
  data: Record<string, any>;
  generated: Date;
}

export class LLMPromptService {
  /**
   * Generate anonymous asset allocation review prompt
   */
  static async generateAssetReviewPrompt(): Promise<string> {
    try {
      const investments = await db.investments.toArray();
      
      if (investments.length === 0) {
        return JSON.stringify({
          type: "AssetReview",
          equity: 0,
          debt: 0,
          gold: 0,
          cash: 100,
          age: 30,
          message: "No investments detected. Please provide asset allocation guidance for a 30-year-old beginner."
        }, null, 2);
      }

      const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
      
      // Categorize investments anonymously
      const equityValue = investments
        .filter(inv => ['MF-Growth', 'Stocks', 'SIP'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);
      
      const debtValue = investments
        .filter(inv => ['PPF', 'EPF', 'FD', 'RD', 'Bonds'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);
      
      const goldValue = investments
        .filter(inv => ['Gold', 'SGB'].includes(inv.type))
        .reduce((sum, inv) => sum + inv.currentValue, 0);

      const equityPercentage = Math.round((equityValue / totalValue) * 100);
      const debtPercentage = Math.round((debtValue / totalValue) * 100);
      const goldPercentage = Math.round((goldValue / totalValue) * 100);
      const cashPercentage = 100 - equityPercentage - debtPercentage - goldPercentage;

      const prompt = {
        type: "AssetReview",
        equity: equityPercentage,
        debt: debtPercentage,
        gold: goldPercentage,
        cash: Math.max(0, cashPercentage),
        age: 30, // Default - should come from user profile
        totalInvestments: investments.length,
        hasEmergencyFund: true, // Anonymized
        riskTolerance: "moderate"
      };

      return JSON.stringify(prompt, null, 2);
    } catch (error) {
      console.error('Error generating asset review prompt:', error);
      return JSON.stringify({ type: "AssetReview", error: "Unable to generate prompt" });
    }
  }

  /**
   * Generate anonymous goal review prompt
   */
  static async generateGoalReviewPrompt(): Promise<string> {
    try {
      const goals = await db.goals.toArray();
      
      if (goals.length === 0) {
        return JSON.stringify({
          type: "GoalReview",
          activeGoals: 0,
          message: "No financial goals set. Please provide guidance on essential financial goals for wealth building."
        }, null, 2);
      }

      const currentDate = new Date();
      const anonymizedGoals = goals.map(goal => {
        const yearsToTarget = Math.ceil((goal.targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const progressPercentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
        
        return {
          type: goal.type,
          yearsRemaining: yearsToTarget,
          progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
          priority: yearsToTarget <= 2 ? "high" : yearsToTarget <= 5 ? "medium" : "low"
        };
      });

      const prompt = {
        type: "GoalReview",
        activeGoals: goals.length,
        shortTermGoals: anonymizedGoals.filter(g => g.yearsRemaining <= 2).length,
        mediumTermGoals: anonymizedGoals.filter(g => g.yearsRemaining > 2 && g.yearsRemaining <= 5).length,
        longTermGoals: anonymizedGoals.filter(g => g.yearsRemaining > 5).length,
        onTrackGoals: anonymizedGoals.filter(g => g.progressPercentage >= 80).length,
        laggingGoals: anonymizedGoals.filter(g => g.progressPercentage < 50).length,
        hasEmergencyFund: true // Anonymized
      };

      return JSON.stringify(prompt, null, 2);
    } catch (error) {
      console.error('Error generating goal review prompt:', error);
      return JSON.stringify({ type: "GoalReview", error: "Unable to generate prompt" });
    }
  }

  /**
   * Generate anonymous tax optimization prompt
   */
  static async generateTaxReviewPrompt(): Promise<string> {
    try {
      const investments = await db.investments.toArray();
      
      // Analyze tax-saving investments anonymously
      const taxSavingInvestments = investments.filter(inv => inv.taxBenefit);
      const npsT1Amount = investments
        .filter(inv => inv.type === 'NPS-T1')
        .reduce((sum, inv) => sum + inv.investedValue, 0);
      
      const ppfAmount = investments
        .filter(inv => inv.type === 'PPF')
        .reduce((sum, inv) => sum + inv.investedValue, 0);

      const prompt = {
        type: "TaxReview",
        taxRegime: "new", // Fixed per spec
        npsT1Utilization: Math.min(100, Math.round((npsT1Amount / 50000) * 100)),
        ppfUtilization: Math.min(100, Math.round((ppfAmount / 150000) * 100)),
        taxSavingInvestments: taxSavingInvestments.length,
        hasELSS: investments.some(inv => inv.type.includes('ELSS')),
        sgbInvestments: investments.filter(inv => inv.type === 'SGB').length,
        financialYear: new Date().getFullYear()
      };

      return JSON.stringify(prompt, null, 2);
    } catch (error) {
      console.error('Error generating tax review prompt:', error);
      return JSON.stringify({ type: "TaxReview", error: "Unable to generate prompt" });
    }
  }

  /**
   * Generate anonymous emergency fund review prompt
   */
  static async generateEmergencyReviewPrompt(): Promise<string> {
    try {
      const emergencyFunds = await db.emergencyFunds.toArray();
      const transactions = await db.txns.toArray();
      
      // Calculate monthly expenses (anonymized)
      const monthlyExpenses = Math.abs(
        transactions
          .filter(txn => txn.amount < 0)
          .reduce((sum, txn) => sum + txn.amount, 0)
      ) / 12;

      const totalEmergencyFund = emergencyFunds.reduce((sum, fund) => sum + fund.currentAmount, 0);
      const monthsOfExpensesCovered = monthlyExpenses > 0 ? totalEmergencyFund / monthlyExpenses : 0;

      const prompt = {
        type: "EmergencyReview",
        monthsCovered: Math.round(monthsOfExpensesCovered * 10) / 10,
        targetMonths: 12, // Per spec
        fundingStatus: monthsOfExpensesCovered >= 12 ? "adequate" : monthsOfExpensesCovered >= 6 ? "partial" : "inadequate",
        hasMultipleFunds: emergencyFunds.length > 1,
        liquidityLevel: "high" // Anonymized assumption
      };

      return JSON.stringify(prompt, null, 2);
    } catch (error) {
      console.error('Error generating emergency review prompt:', error);
      return JSON.stringify({ type: "EmergencyReview", error: "Unable to generate prompt" });
    }
  }

  /**
   * Store generated prompt for audit trail
   */
  static async storePrompt(prompt: AnonymousFinancialPrompt): Promise<void> {
    try {
      // Store in a dedicated prompts table or as app settings
      await db.appSettings.put({
        id: `prompt-${Date.now()}`,
        key: `llm_prompt_${prompt.type.toLowerCase()}`,
        value: JSON.stringify(prompt)
      });
    } catch (error) {
      console.error('Error storing LLM prompt:', error);
    }
  }

  /**
   * Generate comprehensive financial review prompt
   */
  static async generateComprehensivePrompt(): Promise<string> {
    try {
      const [assetPrompt, goalPrompt, taxPrompt, emergencyPrompt] = await Promise.all([
        this.generateAssetReviewPrompt(),
        this.generateGoalReviewPrompt(),
        this.generateTaxReviewPrompt(),
        this.generateEmergencyReviewPrompt()
      ]);

      const comprehensivePrompt = {
        type: "ComprehensiveReview",
        timestamp: new Date().toISOString(),
        assets: JSON.parse(assetPrompt),
        goals: JSON.parse(goalPrompt),
        taxes: JSON.parse(taxPrompt),
        emergency: JSON.parse(emergencyPrompt),
        disclaimer: "This data is anonymized and contains no PII. Please provide comprehensive financial planning advice."
      };

      return JSON.stringify(comprehensivePrompt, null, 2);
    } catch (error) {
      console.error('Error generating comprehensive prompt:', error);
      return JSON.stringify({ 
        type: "ComprehensiveReview", 
        error: "Unable to generate comprehensive prompt",
        timestamp: new Date().toISOString()
      });
    }
  }
}
