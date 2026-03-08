/**
 * RentalPropertyService — all writes use canonical `db` from '@/lib/db'
 * so the Dexie Audit Middleware (§19) intercepts every mutation.
 */

import { db } from '@/lib/db';
import type { RentalProperty, Tenant } from '@/lib/db';

export class RentalPropertyService {
  static async createProperty(property: Omit<RentalProperty, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.rentalProperties.add({ ...property, id });
    return id;
  }

  static async getAllProperties(): Promise<RentalProperty[]> {
    return db.rentalProperties.toArray().catch(() => []);
  }

  static async getPropertyById(id: string): Promise<RentalProperty | undefined> {
    return db.rentalProperties.get(id).catch(() => undefined);
  }

  static async updateProperty(id: string, updates: Partial<RentalProperty>): Promise<void> {
    await db.rentalProperties.update(id, { ...updates, updatedAt: new Date() });
  }

  static async deleteProperty(id: string): Promise<void> {
    // Also remove associated tenants
    await db.tenants.where('propertyId').equals(id).delete();
    await db.rentalProperties.delete(id);
  }

  /** Properties where today's date is past the dueDay (rent overdue) */
  static async getPropertiesWithDueRent(): Promise<
    Array<RentalProperty & { daysOverdue: number }>
  > {
    const properties = await db.rentalProperties.toArray().catch(() => []);
    const currentDay = new Date().getDate();
    return properties
      .filter(p => currentDay > (p.dueDay ?? 1))
      .map(p => ({ ...p, daysOverdue: currentDay - (p.dueDay ?? 1) }));
  }

  static async getTotalRentalIncome(): Promise<number> {
    const props = await db.rentalProperties.toArray().catch(() => []);
    return props.reduce((sum, p) => sum + (p.monthlyRent ?? 0), 0);
  }

  static async getRentalAnalytics(): Promise<{
    totalProperties: number;
    totalMonthlyIncome: number;
    totalAnnualTax: number;
    avgRentPerProperty: number;
    propertiesWithOverdueRent: number;
  }> {
    const [properties, overdue] = await Promise.all([
      db.rentalProperties.toArray().catch(() => []),
      this.getPropertiesWithDueRent(),
    ]);
    const totalMonthlyIncome = properties.reduce((sum, p) => sum + (p.monthlyRent ?? 0), 0);
    // totalAnnualTax: sum from RentalProperty schema if present
    const totalAnnualTax = 0; // db.rentalProperties schema in lib/db.ts doesn't store tax fields
    return {
      totalProperties: properties.length,
      totalMonthlyIncome,
      totalAnnualTax,
      avgRentPerProperty: properties.length > 0 ? totalMonthlyIncome / properties.length : 0,
      propertiesWithOverdueRent: overdue.length,
    };
  }
}

export class TenantService {
  static async addTenant(tenant: Omit<Tenant, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.tenants.add({ ...tenant, id });
    return id;
  }

  static async getTenantsForProperty(propertyId: string): Promise<Tenant[]> {
    return db.tenants.where('propertyId').equals(propertyId).toArray().catch(() => []);
  }

  static async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    await db.tenants.update(id, { ...updates, updatedAt: new Date() });
  }

  static async deleteTenant(id: string): Promise<void> {
    await db.tenants.delete(id);
  }
}
