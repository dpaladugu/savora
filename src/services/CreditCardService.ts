
/**
 * src/services/CreditCardService.ts
 *
 * A service for handling credit card operations using the current database schema.
 */

import { db } from "@/lib/db";
import type { CreditCard } from "@/lib/db";

// Extended CreditCard interface to include missing fields from tests
export interface ExtendedCreditCard extends CreditCard {
  fxTxnFee: number;
  emiConversion: boolean;
}

export class CreditCardService {

  static async addCreditCard(cardData: Omit<ExtendedCreditCard, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      
      // Map to base CreditCard interface (remove extended fields)
      const { fxTxnFee, emiConversion, ...baseCardData } = cardData;
      
      const recordToAdd: CreditCard = {
        ...baseCardData,
        id: newId,
      };
      await db.creditCards.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in CreditCardService.addCreditCard:", error);
      throw error;
    }
  }

  static async updateCreditCard(id: string, updates: Partial<ExtendedCreditCard>): Promise<number> {
    try {
      // Remove extended fields before updating
      const { fxTxnFee, emiConversion, ...baseUpdates } = updates;
      const updatedCount = await db.creditCards.update(id, baseUpdates);
      return updatedCount;
    } catch (error) {
      console.error(`Error in CreditCardService.updateCreditCard for id ${id}:`, error);
      throw error;
    }
  }

  static async deleteCreditCard(id: string): Promise<void> {
    try {
      await db.creditCards.delete(id);
    } catch (error) {
      console.error(`Error in CreditCardService.deleteCreditCard for id ${id}:`, error);
      throw error;
    }
  }

  static async getCreditCards(): Promise<CreditCard[]> {
    try {
      const cards = await db.creditCards.toArray();
      return cards;
    } catch (error) {
      console.error(`Error in CreditCardService.getCreditCards:`, error);
      throw error;
    }
  }
}
