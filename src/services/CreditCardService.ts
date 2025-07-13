/**
 * src/services/CreditCardService.ts
 *
 * A dedicated service for handling all CRUD operations for credit cards
 * in the Dexie database.
 */

import { db } from "@/db";
import type { DexieCreditCardRecord as AppCreditCard } from "@/db";

export class CreditCardService {

  /**
   * Adds a new credit card record to the database.
   * @param cardData The card data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added card.
   */
  static async addCreditCard(cardData: Omit<AppCreditCard, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppCreditCard = {
        ...cardData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.creditCards.add(recordToAdd);
      console.log(`Credit Card added with id: ${newId}`);
      return newId;
    } catch (error) {
      console.error("Error in CreditCardService.addCreditCard:", error);
      throw error;
    }
  }

  /**
   * Updates an existing credit card record.
   * @param id The id of the card to update.
   * @param updates A partial object of the card data to update.
   * @returns The number of updated records.
   */
  static async updateCreditCard(id: string, updates: Partial<AppCreditCard>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.creditCards.update(id, updateData);
      console.log(`Updated ${updatedCount} credit card(s).`);
      return updatedCount;
    } catch (error) {
      console.error(`Error in CreditCardService.updateCreditCard for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a credit card record from the database.
   * @param id The id of the card to delete.
   */
  static async deleteCreditCard(id: string): Promise<void> {
    try {
      await db.creditCards.delete(id);
      console.log(`Credit Card with id: ${id} deleted.`);
    } catch (error) {
      console.error(`Error in CreditCardService.deleteCreditCard for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all credit cards for a given user.
   * @param userId The ID of the user whose cards to fetch.
   * @returns A promise that resolves to an array of credit cards.
   */
  static async getCreditCards(userId: string): Promise<AppCreditCard[]> {
    try {
      if (!userId) return [];
      const cards = await db.creditCards.where('user_id').equals(userId).sortBy('name');
      return cards;
    } catch (error) {
      console.error(`Error in CreditCardService.getCreditCards for user ${userId}:`, error);
      throw error;
    }
  }
}
