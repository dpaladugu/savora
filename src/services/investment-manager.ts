
import { FirestoreService, FirestoreInvestment } from "./firestore";
import { Logger } from "./logger";

export interface Investment {
  id?: string;
  name: string;
  type: 'stocks' | 'mutual_funds' | 'bonds' | 'fixed_deposit' | 'real_estate' | 'crypto' | 'others';
  amount: number;
  units?: number;
  price?: number;
  currentValue?: number;
  purchaseDate: string;
  maturityDate?: string;
  expectedReturn?: number;
  actualReturn?: number;
  riskLevel: 'low' | 'medium' | 'high';
  userId?: string;
}

export interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  returnPercentage: number;
  assetAllocation: { [type: string]: number };
  riskDistribution: { [risk: string]: number };
}

export class InvestmentManager {
  static async addInvestment(userId: string, investment: Omit<Investment, 'id' | 'userId'>): Promise<string> {
    try {
      Logger.info('Adding investment', { userId, investment });
      
      const investmentData: Omit<FirestoreInvestment, 'id'> = {
        ...investment,
        userId,
        date: investment.purchaseDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await FirestoreService.addInvestment(userId, investmentData);
      Logger.info('Investment added successfully', { id });
      return id;
    } catch (error) {
      Logger.error('Error adding investment', error);
      throw error;
    }
  }

  static async updateInvestment(userId: string, investmentId: string, updates: Partial<Investment>): Promise<void> {
    try {
      Logger.info('Updating investment', { userId, investmentId, updates });
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await FirestoreService.updateInvestment(userId, investmentId, updateData);
      Logger.info('Investment updated successfully');
    } catch (error) {
      Logger.error('Error updating investment', error);
      throw error;
    }
  }

  static async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    try {
      Logger.info('Deleting investment', { userId, investmentId });
      await FirestoreService.deleteInvestment(userId, investmentId);
      Logger.info('Investment deleted successfully');
    } catch (error) {
      Logger.error('Error deleting investment', error);
      throw error;
    }
  }

  static async getInvestments(userId: string): Promise<Investment[]> {
    try {
      Logger.info('Getting investments', { userId });
      const firestoreInvestments = await FirestoreService.getInvestments(userId);
      
      // Convert FirestoreInvestment to Investment
      const investments: Investment[] = firestoreInvestments.map(investment => ({
        id: investment.id,
        name: investment.name,
        type: investment.type as Investment['type'],
        amount: investment.amount,
        units: investment.units,
        price: investment.price,
        currentValue: investment.currentValue,
        purchaseDate: investment.purchaseDate,
        maturityDate: investment.maturityDate,
        expectedReturn: investment.expectedReturn,
        actualReturn: investment.actualReturn,
        riskLevel: investment.riskLevel,
        userId: investment.userId
      }));
      
      return investments.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    } catch (error) {
      Logger.error('Error getting investments', error);
      return [];
    }
  }

  static async calculatePortfolio(userId: string): Promise<Portfolio> {
    try {
      const investments = await this.getInvestments(userId);
      
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
      const totalReturns = totalValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

      const assetAllocation: { [type: string]: number } = {};
      const riskDistribution: { [risk: string]: number } = {};

      investments.forEach(inv => {
        const value = inv.currentValue || inv.amount;
        assetAllocation[inv.type] = (assetAllocation[inv.type] || 0) + value;
        riskDistribution[inv.riskLevel] = (riskDistribution[inv.riskLevel] || 0) + value;
      });

      return {
        totalValue,
        totalInvested,
        totalReturns,
        returnPercentage,
        assetAllocation,
        riskDistribution
      };
    } catch (error) {
      Logger.error('Error calculating portfolio', error);
      return {
        totalValue: 0,
        totalInvested: 0,
        totalReturns: 0,
        returnPercentage: 0,
        assetAllocation: {},
        riskDistribution: {}
      };
    }
  }

  static getInvestmentTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'stocks', label: 'Stocks' },
      { value: 'mutual_funds', label: 'Mutual Funds' },
      { value: 'bonds', label: 'Bonds' },
      { value: 'fixed_deposit', label: 'Fixed Deposit' },
      { value: 'real_estate', label: 'Real Estate' },
      { value: 'crypto', label: 'Cryptocurrency' },
      { value: 'others', label: 'Others' }
    ];
  }

  static getRiskLevels(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'low', label: 'Low Risk', color: '#10b981' },
      { value: 'medium', label: 'Medium Risk', color: '#f59e0b' },
      { value: 'high', label: 'High Risk', color: '#ef4444' }
    ];
  }
}
