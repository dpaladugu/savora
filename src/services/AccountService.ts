/**
 * src/services/AccountService.ts
 *
 * A dedicated service for handling all CRUD operations for user accounts
 * (bank accounts, wallets, etc.) in the Dexie database.
 */

import { db } from "@/db";
import type { DexieAccountRecord as AppAccount } from "@/db";

export class AccountService {

  /**
   * Adds a new account record to the database.
   * @param accountData The account data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added account.
   */
  static async addAccount(accountData: Omit<AppAccount, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppAccount = {
        ...accountData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.accounts.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in AccountService.addAccount:", error);
      throw error;
    }
  }

  /**
   * Updates an existing account record.
   * @param id The id of the account to update.
   * @param updates A partial object of the account data to update.
   * @returns The number of updated records.
   */
  static async updateAccount(id: string, updates: Partial<AppAccount>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.accounts.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in AccountService.updateAccount for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes an account record from the database.
   * @param id The id of the account to delete.
   */
  static async deleteAccount(id: string): Promise<void> {
    try {
      await db.accounts.delete(id);
    } catch (error) {
      console.error(`Error in AccountService.deleteAccount for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all accounts for a given user.
   * @param userId The ID of the user whose accounts to fetch.
   * @returns A promise that resolves to an array of accounts.
   */
  static async getAccounts(userId: string): Promise<AppAccount[]> {
    try {
      if (!userId) return [];
      const accounts = await db.accounts.where('user_id').equals(userId).toArray();
      return accounts;
    } catch (error) {
      console.error(`Error in AccountService.getAccounts for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single account by its ID.
   * @param id The ID of the account to fetch.
   * @returns A promise that resolves to the account record or undefined if not found.
   */
  static async getAccountById(id: string): Promise<AppAccount | undefined> {
    try {
      const account = await db.accounts.get(id);
      return account;
    } catch (error)      {
      console.error(`Error in AccountService.getAccountById for id ${id}:`, error);
      throw error;
    }
  }
}
