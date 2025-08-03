import { db } from '@/lib/db';
import type { GlobalSettings, Contact } from '@/lib/db';

export class GlobalSettingsService {
  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const settings = await db.globalSettings.get('global-settings-singleton');
      if (settings) {
        return settings;
      }

      // Create default settings if none exist
      const defaultSettings: GlobalSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New',
        autoLockMinutes: 5,
        birthdayBudget: 0,
        birthdayAlertDays: 7,
        emergencyContacts: [],
        dependents: [],
        salaryCreditDay: 1,
        annualBonus: 0,
        medicalInflationRate: 8.0,
        educationInflation: 10.0,
        vehicleInflation: 6.0,
        maintenanceInflation: 7.0,
        privacyMask: false,
        failedPinAttempts: 0,
        maxFailedAttempts: 10,
        darkMode: false,
        timeZone: 'Asia/Kolkata',
        isTest: false,
        theme: 'light',
        deviceThemes: {},
        revealSecret: '',
      };

      await db.globalSettings.add(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error fetching global settings:', error);
      throw error;
    }
  }

  static async updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<void> {
    try {
      const existing = await this.getGlobalSettings();
      await db.globalSettings.put({
        ...existing,
        ...updates
      });
    } catch (error) {
      console.error('Error updating global settings:', error);
      throw error;
    }
  }

  static async addEmergencyContact(contact: Contact): Promise<void> {
    try {
      const settings = await this.getGlobalSettings();
      const updatedContacts = [...settings.emergencyContacts, contact];
      await db.globalSettings.put({
        ...settings,
        emergencyContacts: updatedContacts
      });
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  static async updateAutoLockMinutes(minutes: number): Promise<void> {
    try {
      if (minutes < 1 || minutes > 10) {
        throw new Error('Auto lock minutes must be between 1 and 10');
      }
      await this.updateGlobalSettings({ autoLockMinutes: minutes });
    } catch (error) {
      console.error('Error updating auto lock minutes:', error);
      throw error;
    }
  }

  static async updateTaxRegime(regime: 'Old' | 'New'): Promise<void> {
    try {
      await this.updateGlobalSettings({ taxRegime: regime });
    } catch (error) {
      console.error('Error updating tax regime:', error);
      throw error;
    }
  }

  static async incrementFailedPinAttempts(): Promise<number> {
    try {
      const settings = await this.getGlobalSettings();
      const newAttempts = settings.failedPinAttempts + 1;
      
      await this.updateGlobalSettings({ 
        failedPinAttempts: newAttempts 
      });
      
      return newAttempts;
    } catch (error) {
      console.error('Error incrementing failed PIN attempts:', error);
      throw error;
    }
  }

  static async resetFailedPinAttempts(): Promise<void> {
    try {
      await this.updateGlobalSettings({ 
        failedPinAttempts: 0 
      });
    } catch (error) {
      console.error('Error resetting failed PIN attempts:', error);
      throw error;
    }
  }

  static async shouldTriggerSelfDestruct(): Promise<boolean> {
    try {
      const settings = await this.getGlobalSettings();
      return settings.failedPinAttempts >= settings.maxFailedAttempts;
    } catch (error) {
      console.error('Error checking self-destruct status:', error);
      return false;
    }
  }
}
