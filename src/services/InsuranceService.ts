/**
 * InsuranceService — wired to canonical `db` from '@/lib/db'.
 * Writes to db.insurance (and mirrors to db.insurancePolicies for the
 * AuditEngine's combined-policy read in _buildRisks).
 * 
 * Audit Middleware (§19) fires automatically on all mutations.
 */

import { db } from '@/lib/db';
import type { Insurance } from '@/lib/db';

export class InsuranceService {

  static async addPolicy(policyData: Omit<Insurance, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const record: Insurance = {
      ...policyData,
      id,
      createdAt: policyData.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    await db.insurance.add(record);

    // Mirror to insurancePolicies so both AuditEngine and InsuranceGapAnalysis
    // (which reads insurancePolicies) see the data.
    try {
      await db.insurancePolicies.add({ ...record });
    } catch {
      // Ignore if already exists (primary-key conflict)
    }
    return id;
  }

  static async updatePolicy(id: string, updates: Partial<Insurance>): Promise<number> {
    const patched = { ...updates, updatedAt: new Date() };
    const count = await db.insurance.update(id, patched);
    // Best-effort mirror update
    await db.insurancePolicies.update(id, patched).catch(() => {});
    return count;
  }

  static async deletePolicy(id: string): Promise<void> {
    await Promise.all([
      db.insurance.delete(id),
      db.insurancePolicies.delete(id).catch(() => {}),
    ]);
  }

  static async getPolicies(): Promise<Insurance[]> {
    // Merge both tables; deduplicate by id so legacy insurancePolicies entries
    // that were added before this service was wired are also visible.
    const [a, b] = await Promise.all([
      db.insurance.toArray().catch(() => [] as Insurance[]),
      db.insurancePolicies.toArray().catch(() => [] as Insurance[]),
    ]);
    const map = new Map<string, Insurance>();
    [...a, ...b].forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }

  static async getPolicyById(id: string): Promise<Insurance | undefined> {
    return db.insurance.get(id).catch(() => undefined);
  }

  /**
   * Policies expiring within the next `withinDays` days.
   */
  static async getExpiringPolicies(withinDays = 30): Promise<Insurance[]> {
    const policies = await this.getPolicies();
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return policies.filter(p => {
      const end = p.endDate ? new Date(p.endDate) : null;
      return end && end <= cutoff;
    });
  }

  /**
   * Policies missing a nominee — used by AuditEngine risk checklist.
   */
  static async getPoliciesMissingNominee(): Promise<Insurance[]> {
    const policies = await this.getPolicies();
    return policies.filter(p => !(p.nominee || p.nomineeName || p.nomineeRelation));
  }
}
