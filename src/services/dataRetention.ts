
/**
 * src/services/dataRetention.ts
 *
 * Data retention service. Currently provides stub implementations
 * since the yearlySummaries table is not available in the current schema.
 */

import { db } from "@/db";

export class DataRetentionService {

  static async createYearlySummary(): Promise<void> {
    console.warn('Data retention service not yet implemented - yearlySummaries table not available in current schema');
  }

  static async getYearlySummaries(): Promise<any[]> {
    console.warn('Data retention service not yet implemented - yearlySummaries table not available in current schema');
    return [];
  }

  static async archiveOldData(): Promise<void> {
    console.warn('Data archival not yet implemented');
  }

  static async cleanupOldData(): Promise<void> {
    console.warn('Data cleanup not yet implemented');
  }
}
