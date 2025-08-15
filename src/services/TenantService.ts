
import { extendedDb } from '@/lib/db-schema-extended';
import type { Tenant } from '@/lib/db-schema-extended';

export class TenantService {
  /**
   * Add a new tenant
   */
  static async addTenant(tenant: Omit<Tenant, 'id'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      await extendedDb.tenants.add({
        ...tenant,
        id
      });
      return id;
    } catch (error) {
      console.error('Error adding tenant:', error);
      throw error;
    }
  }

  /**
   * Get all tenants
   */
  static async getAllTenants(): Promise<Tenant[]> {
    try {
      return await extendedDb.tenants.toArray();
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  /**
   * Get tenants by property
   */
  static async getTenantsByProperty(propertyId: string): Promise<Tenant[]> {
    try {
      return await extendedDb.tenants.where('propertyId').equals(propertyId).toArray();
    } catch (error) {
      console.error('Error fetching tenants for property:', error);
      return [];
    }
  }

  /**
   * Get active tenants (no end date or future end date)
   */
  static async getActiveTenants(): Promise<Tenant[]> {
    try {
      const tenants = await extendedDb.tenants.toArray();
      const today = new Date();
      
      return tenants.filter(tenant => 
        !tenant.endDate || tenant.endDate > today
      );
    } catch (error) {
      console.error('Error fetching active tenants:', error);
      return [];
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    try {
      await extendedDb.tenants.update(id, updates);
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  }

  /**
   * End tenancy
   */
  static async endTenancy(tenantId: string, endDate: Date): Promise<void> {
    try {
      await extendedDb.tenants.update(tenantId, { 
        endDate,
        depositRefundPending: true 
      });
    } catch (error) {
      console.error('Error ending tenancy:', error);
      throw error;
    }
  }

  /**
   * Mark deposit as refunded
   */
  static async markDepositRefunded(tenantId: string): Promise<void> {
    try {
      await extendedDb.tenants.update(tenantId, { 
        depositRefundPending: false 
      });
    } catch (error) {
      console.error('Error marking deposit refunded:', error);
      throw error;
    }
  }

  /**
   * Get tenants with pending deposit refunds
   */
  static async getTenantsWithPendingRefunds(): Promise<Tenant[]> {
    try {
      return await extendedDb.tenants.where('depositRefundPending').equals(true).toArray();
    } catch (error) {
      console.error('Error fetching tenants with pending refunds:', error);
      return [];
    }
  }
}
