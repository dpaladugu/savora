
/**
 * src/services/CreditCardService.ts
 *
 * A service for handling credit card operations using the current database schema.
 */

import { db } from "@/db";
import type { CreditCard } from "@/db";

export class CreditCardService {

  static async addCreditCard(cardData: Omit<CreditCard, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: CreditCard = {
        ...cardData,
        id: newId,
      };
      await db.creditCards.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in CreditCardService.addCreditCard:", error);
      throw error;
    }
  }

  static async updateCreditCard(id: string, updates: Partial<CreditCard>): Promise<number> {
    try {
      const updatedCount = await db.creditCards.update(id, updates);
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
