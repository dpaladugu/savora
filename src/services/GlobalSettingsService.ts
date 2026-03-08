
import { db } from '@/lib/db';
import type { GlobalSettings, Contact } from '@/lib/db';

export class GlobalSettingsService {
  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const settings = await db.globalSettings.get('global-settings-singleton');
      if (settings) return settings;

      const defaultSettings: GlobalSettings = {
        id: 'global-settings-singleton',
        userName: 'Devavratha',
        userMission: 'Antifragile Debt-Freedom by 2029',
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
        // removed: failedPinAttempts, maxFailedAttempts (self-destruct removed from spec)
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
      await db.globalSettings.put({ ...existing, ...updates });
    } catch (error) {
      console.error('Error updating global settings:', error);
      throw error;
    }
  }

  static async addEmergencyContact(contact: Contact): Promise<void> {
    try {
      const settings = await this.getGlobalSettings();
      await db.globalSettings.put({
        ...settings,
        emergencyContacts: [...settings.emergencyContacts, contact],
      });
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  static async updateAutoLockMinutes(minutes: number): Promise<void> {
    if (minutes < 1 || minutes > 10) throw new Error('Auto lock minutes must be between 1 and 10');
    await this.updateGlobalSettings({ autoLockMinutes: minutes });
  }

  static async updateTaxRegime(regime: 'Old' | 'New'): Promise<void> {
    await this.updateGlobalSettings({ taxRegime: regime });
  }

  /** @deprecated Self-destruct removed from spec v1.3 — kept as no-ops for backward compat */
  static async incrementFailedPinAttempts(): Promise<number> { return 0; }
  static async resetFailedPinAttempts(): Promise<void> {}
  static async shouldTriggerSelfDestruct(): Promise<boolean> { return false; }

  static async getSettings(): Promise<GlobalSettings | null> {
    try {
      return (await db.globalSettings.limit(1).first()) ?? null;
    } catch {
      return null;
    }
  }
}
