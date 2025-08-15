
import { extendedDb } from '@/lib/db-schema-extended';
import type { RentalProperty, Tenant } from '@/lib/db-schema-extended';

export class RentalPropertyService {
  /**
   * Create a new rental property
   */
  static async createProperty(property: Omit<RentalProperty, 'id'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      await extendedDb.rentalProperties.add({
        ...property,
        id
      });
      return id;
    } catch (error) {
      console.error('Error creating rental property:', error);
      throw error;
    }
  }

  /**
   * Get all rental properties
   */
  static async getAllProperties(): Promise<RentalProperty[]> {
    try {
      return await extendedDb.rentalProperties.toArray();
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      return [];
    }
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(id: string): Promise<RentalProperty | undefined> {
    try {
      return await extendedDb.rentalProperties.get(id);
    } catch (error) {
      console.error('Error fetching property:', error);
      return undefined;
    }
  }

  /**
   * Update property
   */
  static async updateProperty(id: string, updates: Partial<RentalProperty>): Promise<void> {
    try {
      await extendedDb.rentalProperties.update(id, updates);
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Delete property
   */
  static async deleteProperty(id: string): Promise<void> {
    try {
      // Also delete associated tenants
      await extendedDb.tenants.where('propertyId').equals(id).delete();
      await extendedDb.rentalProperties.delete(id);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  /**
   * Get properties with rent due alerts
   */
  static async getPropertiesWithDueRent(): Promise<Array<RentalProperty & { daysOverdue: number }>> {
    try {
      const properties = await extendedDb.rentalProperties.toArray();
      const today = new Date();
      const currentDay = today.getDate();
      
      return properties
        .filter(property => currentDay >= property.dueDay)
        .map(property => ({
          ...property,
          daysOverdue: currentDay - property.dueDay
        }))
        .filter(property => property.daysOverdue > 0);
    } catch (error) {
      console.error('Error getting overdue properties:', error);
      return [];
    }
  }

  /**
   * Calculate total rental income
   */
  static async getTotalRentalIncome(): Promise<number> {
    try {
      const properties = await extendedDb.rentalProperties.toArray();
      return properties.reduce((total, property) => total + property.monthlyRent, 0);
    } catch (error) {
      console.error('Error calculating rental income:', error);
      return 0;
    }
  }

  /**
   * Get rental income analytics
   */
  static async getRentalAnalytics(): Promise<{
    totalProperties: number;
    totalMonthlyIncome: number;
    totalAnnualTax: number;
    avgRentPerProperty: number;
    propertiesWithOverdueRent: number;
  }> {
    try {
      const properties = await extendedDb.rentalProperties.toArray();
      const overdueProperties = await this.getPropertiesWithDueRent();
      
      const totalMonthlyIncome = properties.reduce((sum, p) => sum + p.monthlyRent, 0);
      const totalAnnualTax = properties.reduce((sum, p) => sum + p.propertyTaxAnnual + p.waterTaxAnnual, 0);
      
      return {
        totalProperties: properties.length,
        totalMonthlyIncome,
        totalAnnualTax,
        avgRentPerProperty: properties.length > 0 ? totalMonthlyIncome / properties.length : 0,
        propertiesWithOverdueRent: overdueProperties.length
      };
    } catch (error) {
      console.error('Error calculating rental analytics:', error);
      return {
        totalProperties: 0,
        totalMonthlyIncome: 0,
        totalAnnualTax: 0,
        avgRentPerProperty: 0,
        propertiesWithOverdueRent: 0
      };
    }
  }
}
