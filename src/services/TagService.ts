/**
 * src/services/TagService.ts
 *
 * A dedicated service for handling all CRUD operations for tags
 * in the Dexie database.
 */

import { db } from "@/db";
import type { DexieTagRecord as AppTag } from "@/db";

export class TagService {

  /**
   * Adds a new tag record to the database.
   * @param tagData The tag data to add. 'id' should be omitted, 'user_id' should be set.
   * @returns The id of the newly added tag.
   */
  static async addTag(tagData: Omit<AppTag, 'id'>): Promise<string> {
    try {
      const newId = self.crypto.randomUUID();
      const recordToAdd: AppTag = {
        ...tagData,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.tags.add(recordToAdd);
      return newId;
    } catch (error) {
      console.error("Error in TagService.addTag:", error);
      throw error;
    }
  }

  /**
   * Updates an existing tag record.
   * @param id The id of the tag to update.
   * @param updates A partial object of the tag data to update.
   * @returns The number of updated records.
   */
  static async updateTag(id: string, updates: Partial<AppTag>): Promise<number> {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      const updatedCount = await db.tags.update(id, updateData);
      return updatedCount;
    } catch (error) {
      console.error(`Error in TagService.updateTag for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a tag record from the database.
   * @param id The id of the tag to delete.
   */
  static async deleteTag(id: string): Promise<void> {
    try {
      await db.tags.delete(id);
    } catch (error) {
      console.error(`Error in TagService.deleteTag for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all tags for a given user.
   * @param userId The ID of the user whose tags to fetch.
   * @returns A promise that resolves to an array of tags.
   */
  static async getTags(userId: string): Promise<AppTag[]> {
    try {
      if (!userId) return [];
      const tags = await db.tags.where('user_id').equals(userId).sortBy('name');
      return tags;
    } catch (error) {
      console.error(`Error in TagService.getTags for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Checks if a tag with the given name already exists for a user.
   * @param name The name of the tag (case-insensitive).
   * @param userId The ID of the user.
   * @returns The existing tag record or undefined.
   */
  static async getTagByName(name: string, userId: string): Promise<AppTag | undefined> {
    try {
        if (!userId) return undefined;
        // The schema uses &[user_id+name] as a compound index, so this query should be efficient.
        const tag = await db.tags.where({ user_id: userId, name: name.toLowerCase() }).first();
        return tag;
    } catch (error) {
        console.error(`Error in TagService.getTagByName for name ${name}:`, error);
        throw error;
    }
  }

  /**
   * Counts the usage of a tag in the expenses table.
   * In a real app, this would be expanded to check other tables that use tags.
   * @param tagName The name of the tag (case-sensitive as it appears in tags_flat).
   * @returns A promise that resolves to the usage count.
   */
  static async getTagUsageCount(tagName: string): Promise<number> {
      try {
          const usageCount = await db.expenses.where('tags_flat').includesIgnoreCase(tagName).count();
          return usageCount;
      } catch (error) {
          console.error(`Error in TagService.getTagUsageCount for tag ${tagName}:`, error);
          throw error;
      }
  }
}
