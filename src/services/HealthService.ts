
import { extendedDb } from '@/lib/db-schema-extended';
import type { Health, Prescription, Vaccination, Vital } from '@/lib/db-schema-extended';

export class HealthService {
  /**
   * Create or update health profile
   */
  static async saveHealthProfile(health: Omit<Health, 'id'>): Promise<string> {
    try {
      const existing = await extendedDb.health.limit(1).first();
      
      if (existing) {
        await extendedDb.health.update(existing.id, health);
        return existing.id;
      } else {
        const id = crypto.randomUUID();
        await extendedDb.health.add({
          ...health,
          id
        });
        return id;
      }
    } catch (error) {
      console.error('Error saving health profile:', error);
      throw error;
    }
  }

  /**
   * Get health profile
   */
  static async getHealthProfile(): Promise<Health | undefined> {
    try {
      return await extendedDb.health.limit(1).first();
    } catch (error) {
      console.error('Error fetching health profile:', error);
      return undefined;
    }
  }

  /**
   * Add prescription
   */
  static async addPrescription(prescription: Prescription): Promise<void> {
    try {
      const health = await this.getHealthProfile();
      if (!health) {
        // Create new health profile
        await this.saveHealthProfile({
          refillAlertDays: 7,
          prescriptions: [prescription],
          familyHistory: [],
          vaccinations: [],
          vitals: []
        });
      } else {
        const updatedPrescriptions = [...health.prescriptions, prescription];
        await extendedDb.health.update(health.id, {
          prescriptions: updatedPrescriptions
        });
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      throw error;
    }
  }

  /**
   * Add vaccination record
   */
  static async addVaccination(vaccination: Vaccination): Promise<void> {
    try {
      const health = await this.getHealthProfile();
      if (!health) {
        await this.saveHealthProfile({
          refillAlertDays: 7,
          prescriptions: [],
          familyHistory: [],
          vaccinations: [vaccination],
          vitals: []
        });
      } else {
        const updatedVaccinations = [...health.vaccinations, vaccination];
        await extendedDb.health.update(health.id, {
          vaccinations: updatedVaccinations
        });
      }
    } catch (error) {
      console.error('Error adding vaccination:', error);
      throw error;
    }
  }

  /**
   * Add vital signs
   */
  static async addVitals(vital: Vital): Promise<void> {
    try {
      const health = await this.getHealthProfile();
      if (!health) {
        await this.saveHealthProfile({
          refillAlertDays: 7,
          prescriptions: [],
          familyHistory: [],
          vaccinations: [],
          vitals: [vital]
        });
      } else {
        const updatedVitals = [...health.vitals, vital];
        await extendedDb.health.update(health.id, {
          vitals: updatedVitals
        });
      }
    } catch (error) {
      console.error('Error adding vitals:', error);
      throw error;
    }
  }

  /**
   * Get upcoming vaccination reminders
   */
  static async getUpcomingVaccinations(): Promise<Vaccination[]> {
    try {
      const health = await this.getHealthProfile();
      if (!health) return [];

      const today = new Date();
      const reminderDate = new Date();
      reminderDate.setDate(today.getDate() + 30); // 30 days ahead

      return health.vaccinations.filter(vaccination => 
        !vaccination.administeredDate && 
        vaccination.dueDate <= reminderDate
      );
    } catch (error) {
      console.error('Error fetching upcoming vaccinations:', error);
      return [];
    }
  }

  /**
   * Calculate BMI
   */
  static calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }

  /**
   * Get health analytics
   */
  static async getHealthAnalytics(): Promise<{
    totalPrescriptions: number;
    activePrescriptions: number;
    upcomingVaccinations: number;
    recentVitals: Vital[];
    currentBMI?: number;
  }> {
    try {
      const health = await this.getHealthProfile();
      if (!health) {
        return {
          totalPrescriptions: 0,
          activePrescriptions: 0,
          upcomingVaccinations: 0,
          recentVitals: [],
          currentBMI: undefined
        };
      }

      const upcomingVaccinations = await this.getUpcomingVaccinations();
      const recentVitals = health.vitals
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      const currentBMI = health.weightKg && health.heightCm ? 
        this.calculateBMI(health.weightKg, health.heightCm) : undefined;

      return {
        totalPrescriptions: health.prescriptions.length,
        activePrescriptions: health.prescriptions.length, // Simplified
        upcomingVaccinations: upcomingVaccinations.length,
        recentVitals,
        currentBMI
      };
    } catch (error) {
      console.error('Error calculating health analytics:', error);
      return {
        totalPrescriptions: 0,
        activePrescriptions: 0,
        upcomingVaccinations: 0,
        recentVitals: [],
        currentBMI: undefined
      };
    }
  }
}
