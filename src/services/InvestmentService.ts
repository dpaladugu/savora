
import { db } from "@/db";
import type { Investment } from "@/db";

// Legacy compatibility interface for existing components
export interface InvestmentData {
  id?: string;
  fund_name: string;
  investment_type: string;
  category?: string;
  invested_value?: number;
  current_value?: number;
  purchaseDate?: string;
  quantity?: number;
  notes?: string;
}

export class InvestmentService {
  static async addInvestment(investmentData: Omit<InvestmentData, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      
      // Map InvestmentData to Investment interface
      const recordToAdd: Investment = {
        id: newId,
        type: investmentData.investment_type as Investment['type'] || 'Others',
        name: investmentData.fund_name,
        currentNav: 0,
        units: investmentData.quantity || 0,
        investedValue: investmentData.invested_value || 0,
        currentValue: investmentData.current_value || investmentData.invested_value || 0,
        startDate: investmentData.purchaseDate ? new Date(investmentData.purchaseDate) : new Date(),
        frequency: 'One-time',
        taxBenefit: false,
        familyMember: 'Me',
        notes: investmentData.notes || '',
        folioNo: '',
        maturityDate: undefined,
        sipAmount: undefined,
        sipDay: undefined,
        goalId: undefined,
        lockInYears: undefined,
        interestRate: undefined,
        interestCreditDate: undefined
      };
      
      await db.investments.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in InvestmentService.addInvestment:", error);
      throw error;
    }
  }

  static async bulkAddInvestments(investmentsData: InvestmentData[]): Promise<void> {
    try {
      const recordsToAdd: Investment[] = investmentsData.map(data => ({
        id: data.id || self.crypto.randomUUID(),
        type: data.investment_type as Investment['type'] || 'Others',
        name: data.fund_name,
        currentNav: 0,
        units: data.quantity || 0,
        investedValue: data.invested_value || 0,
        currentValue: data.current_value || data.invested_value || 0,
        startDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        frequency: 'One-time',
        taxBenefit: false,
        familyMember: 'Me',
        notes: data.notes || '',
        folioNo: '',
        maturityDate: undefined,
        sipAmount: undefined,
        sipDay: undefined,
        goalId: undefined,
        lockInYears: undefined,
        interestRate: undefined,
        interestCreditDate: undefined
      }));
      
      await db.investments.bulkAdd(recordsToAdd);
      console.log(`Bulk added ${recordsToAdd.length} investments.`);
    } catch (error) {
      console.error("Error in InvestmentService.bulkAddInvestments:", error);
      throw error;
    }
  }

  static async updateInvestment(id: string, updates: Partial<InvestmentData>): Promise<number> {
    try {
      // Map InvestmentData updates to Investment interface
      const investmentUpdates: Partial<Investment> = {};
      
      if (updates.fund_name) investmentUpdates.name = updates.fund_name;
      if (updates.investment_type) investmentUpdates.type = updates.investment_type as Investment['type'];
      if (updates.invested_value !== undefined) investmentUpdates.investedValue = updates.invested_value;
      if (updates.current_value !== undefined) investmentUpdates.currentValue = updates.current_value;
      if (updates.quantity !== undefined) investmentUpdates.units = updates.quantity;
      if (updates.notes !== undefined) investmentUpdates.notes = updates.notes;
      if (updates.purchaseDate) investmentUpdates.startDate = new Date(updates.purchaseDate);
      
      const updatedCount = await db.investments.update(id, investmentUpdates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in InvestmentService.updateInvestment for id ${id}:`, error);
      throw error;
    }
  }

  static async deleteInvestment(id: string): Promise<void> {
    try {
      await db.investments.delete(id);
    } catch (error) {
      console.error(`Error in InvestmentService.deleteInvestment for id ${id}:`, error);
      throw error;
    }
  }

  static async getInvestments(): Promise<InvestmentData[]> {
    try {
      const investments = await db.investments.toArray();
      
      // Map Investment to InvestmentData for compatibility
      return investments.map(investment => ({
        id: investment.id,
        fund_name: investment.name,
        investment_type: investment.type,
        invested_value: investment.investedValue,
        current_value: investment.currentValue,
        purchaseDate: investment.startDate.toISOString().split('T')[0],
        quantity: investment.units,
        notes: investment.notes
      }));
    } catch (error) {
      console.error(`Error in InvestmentService.getInvestments:`, error);
      throw error;
    }
  }

  static async getInvestmentById(id: string): Promise<InvestmentData | undefined> {
    try {
      const investment = await db.investments.get(id);
      if (!investment) return undefined;
      
      // Map Investment to InvestmentData for compatibility
      return {
        id: investment.id,
        fund_name: investment.name,
        investment_type: investment.type,
        invested_value: investment.investedValue,
        current_value: investment.currentValue,
        purchaseDate: investment.startDate.toISOString().split('T')[0],
        quantity: investment.units,
        notes: investment.notes
      };
    } catch (error) {
      console.error(`Error in InvestmentService.getInvestmentById for id ${id}:`, error);
      throw error;
    }
  }
}
