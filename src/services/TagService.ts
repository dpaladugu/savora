
/**
 * src/services/TagService.ts
 *
 * A service for handling tag-related operations using the current database schema.
 * Since the current schema doesn't have a dedicated tags table, this service provides
 * stub implementations and warnings.
 */

import { db } from "@/db";

export class TagService {

  /**
   * Placeholder for tag management. Currently logs a warning since tags table doesn't exist.
   */
  static async addTag(): Promise<string> {
    console.warn('Tag service not yet implemented - tags table not available in current schema');
    throw new Error('Tag functionality not yet implemented');
  }

  static async updateTag(): Promise<number> {
    console.warn('Tag service not yet implemented - tags table not available in current schema');
    return 0;
  }

  static async deleteTag(): Promise<void> {
    console.warn('Tag service not yet implemented - tags table not available in current schema');
  }

  static async getTags(): Promise<any[]> {
    console.warn('Tag service not yet implemented - tags table not available in current schema');
    return [];
  }

  static async getTagByName(): Promise<any | undefined> {
    console.warn('Tag service not yet implemented - tags table not available in current schema');
    return undefined;
  }

  /**
   * Counts the usage of a tag in the expenses table by checking the tags field.
   * @param tagName The name of the tag (case-sensitive as it appears in tags).
   * @returns A promise that resolves to the usage count.
   */
  static async getTagUsageCount(tagName: string): Promise<number> {
    try {
      // Check expenses for tag usage
      const expensesWithTag = await db.expenses.filter(expense => {
        if (Array.isArray(expense.tags)) {
          return expense.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase());
        }
        return false;
      }).count();
      return expensesWithTag;
    } catch (error) {
      console.error(`Error in TagService.getTagUsageCount for tag ${tagName}:`, error);
      throw error;
    }
  }
}
