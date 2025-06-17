
import { supabase } from '@/integrations/supabase/client';
import { Investment, Portfolio } from './investment-manager';
import { Logger } from './logger';

export class SupabaseInvestmentManager {
  static async addInvestment(userId: string, investment: Omit<Investment, 'id' | 'userId'>): Promise<string> {
    try {
      Logger.info('Adding investment to Supabase', { userId, investment });
      
      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: userId,
          name: investment.name,
          type: investment.type,
          amount: investment.amount,
          units: investment.units || null,
          price: investment.price || null,
          current_value: investment.currentValue || null,
          purchase_date: investment.purchaseDate,
          maturity_date: investment.maturityDate || null,
          expected_return: investment.expectedReturn || null,
          actual_return: investment.actualReturn || null,
          risk_level: investment.riskLevel,
          source: 'manual'
        })
        .select('id')
        .single();

      if (error) throw error;
      Logger.info('Investment added successfully', { id: data.id });
      return data.id;
    } catch (error) {
      Logger.error('Error adding investment', error);
      throw error;
    }
  }

  static async updateInvestment(userId: string, investmentId: string, updates: Partial<Investment>): Promise<void> {
    try {
      Logger.info('Updating investment', { userId, investmentId, updates });
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.units !== undefined) updateData.units = updates.units;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue;
      if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate;
      if (updates.maturityDate !== undefined) updateData.maturity_date = updates.maturityDate;
      if (updates.expectedReturn !== undefined) updateData.expected_return = updates.expectedReturn;
      if (updates.actualReturn !== undefined) updateData.actual_return = updates.actualReturn;
      if (updates.riskLevel !== undefined) updateData.risk_level = updates.riskLevel;

      const { error } = await supabase
        .from('investments')
        .update(updateData)
        .eq('id', investmentId)
        .eq('user_id', userId);

      if (error) throw error;
      Logger.info('Investment updated successfully');
    } catch (error) {
      Logger.error('Error updating investment', error);
      throw error;
    }
  }

  static async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    try {
      Logger.info('Deleting investment', { userId, investmentId });
      
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId)
        .eq('user_id', userId);

      if (error) throw error;
      Logger.info('Investment deleted successfully');
    } catch (error) {
      Logger.error('Error deleting investment', error);
      throw error;
    }
  }

  static async getInvestments(userId: string): Promise<Investment[]> {
    try {
      Logger.info('Getting investments from Supabase', { userId });
      
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      const investments: Investment[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as Investment['type'],
        amount: parseFloat(row.amount),
        units: row.units ? parseFloat(row.units) : undefined,
        price: row.price ? parseFloat(row.price) : undefined,
        currentValue: row.current_value ? parseFloat(row.current_value) : undefined,
        purchaseDate: row.purchase_date,
        maturityDate: row.maturity_date || undefined,
        expectedReturn: row.expected_return ? parseFloat(row.expected_return) : undefined,
        actualReturn: row.actual_return ? parseFloat(row.actual_return) : undefined,
        riskLevel: row.risk_level as 'low' | 'medium' | 'high',
        userId: row.user_id
      }));

      return investments;
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
}
