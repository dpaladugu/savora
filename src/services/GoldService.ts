
import { extendedDb } from '@/lib/db-schema-extended';
import type { Gold } from '@/lib/db-schema-extended';

export class GoldService {
  /**
   * Add gold investment
   */
  static async addGold(gold: Omit<Gold, 'id'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      await extendedDb.gold.add({
        ...gold,
        id
      });
      return id;
    } catch (error) {
      console.error('Error adding gold investment:', error);
      throw error;
    }
  }

  /**
   * Get all gold investments
   */
  static async getAllGold(): Promise<Gold[]> {
    try {
      return await extendedDb.gold.toArray();
    } catch (error) {
      console.error('Error fetching gold investments:', error);
      return [];
    }
  }

  /**
   * Update gold investment
   */
  static async updateGold(id: string, updates: Partial<Gold>): Promise<void> {
    try {
      await extendedDb.gold.update(id, updates);
    } catch (error) {
      console.error('Error updating gold investment:', error);
      throw error;
    }
  }

  /**
   * Calculate total gold value at current market price
   */
  static async calculateCurrentGoldValue(currentGoldRate: number): Promise<{
    totalWeight: number;
    totalInvestedValue: number;
    currentMarketValue: number;
    totalProfit: number;
  }> {
    try {
      const goldInvestments = await extendedDb.gold.toArray();
      
      const totalWeight = goldInvestments.reduce((sum, gold) => sum + gold.netWeight, 0);
      const totalInvestedValue = goldInvestments.reduce((sum, gold) => 
        sum + gold.purchasePrice + gold.makingCharge + gold.gstPaid + gold.hallmarkCharge, 0
      );
      
      // Current market value based on net weight and current rate
      const currentMarketValue = goldInvestments.reduce((sum, gold) => {
        const purityMultiplier = gold.purity === '24K' ? 1 : 
                                gold.purity === '22K' ? 0.92 : 
                                gold.purity === '20K' ? 0.83 : 0.75;
        return sum + (gold.netWeight * currentGoldRate * purityMultiplier);
      }, 0);
      
      const totalProfit = currentMarketValue - totalInvestedValue;
      
      return {
        totalWeight,
        totalInvestedValue,
        currentMarketValue,
        totalProfit
      };
    } catch (error) {
      console.error('Error calculating gold value:', error);
      return {
        totalWeight: 0,
        totalInvestedValue: 0,
        currentMarketValue: 0,
        totalProfit: 0
      };
    }
  }

  /**
   * Get gold by family member
   */
  static async getGoldByFamilyMember(familyMember: string): Promise<Gold[]> {
    try {
      return await extendedDb.gold.where('familyMember').equals(familyMember).toArray();
    } catch (error) {
      console.error('Error fetching gold by family member:', error);
      return [];
    }
  }

  /**
   * Mark gold as sold
   */
  static async sellGold(goldId: string, salePrice: number, saleDate: Date): Promise<void> {
    try {
      const gold = await extendedDb.gold.get(goldId);
      if (!gold) throw new Error('Gold investment not found');
      
      const totalInvestedValue = gold.purchasePrice + gold.makingCharge + gold.gstPaid + gold.hallmarkCharge;
      const profit = salePrice - totalInvestedValue;
      
      await extendedDb.gold.update(goldId, {
        saleDate,
        salePrice,
        profit
      });
    } catch (error) {
      console.error('Error selling gold:', error);
      throw error;
    }
  }
}
