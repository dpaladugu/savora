
import { db } from "@/lib/db";
import type { GlobalSettings, Contact } from "@/lib/db";
import { Logger } from './logger';

export class GlobalSettingsService {
  private static readonly SETTINGS_ID = 'global-settings-singleton';

  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const settings = await db.globalSettings.get(GlobalSettingsService.SETTINGS_ID);
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings: GlobalSettings = {
          id: GlobalSettingsService.SETTINGS_ID,
          taxRegime: 'New',
          autoLockMinutes: 5,
          birthdayBudget: 0,
          birthdayAlertDays: 7,
          emergencyContacts: [],
        };
        
        await db.globalSettings.add(defaultSettings);
        Logger.info('Created default global settings');
        return defaultSettings;
      }
      
      return settings;
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.getGlobalSettings:', error);
      throw error;
    }
  }

  static async updateGlobalSettings(updates: Partial<Omit<GlobalSettings, 'id'>>): Promise<void> {
    try {
      const existingSettings = await GlobalSettingsService.getGlobalSettings();
      
      const updatedSettings: GlobalSettings = {
        ...existingSettings,
        ...updates,
        id: GlobalSettingsService.SETTINGS_ID, // Ensure ID remains constant
      };

      await db.globalSettings.put(updatedSettings);
      Logger.info('Updated global settings', updates);
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.updateGlobalSettings:', error);
      throw error;
    }
  }

  static async addEmergencyContact(contact: Contact): Promise<void> {
    try {
      const settings = await GlobalSettingsService.getGlobalSettings();
      const updatedContacts = [...settings.emergencyContacts, contact];
      
      await GlobalSettingsService.updateGlobalSettings({
        emergencyContacts: updatedContacts
      });
      Logger.info('Added emergency contact', contact);
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.addEmergencyContact:', error);
      throw error;
    }
  }

  static async removeEmergencyContact(contactName: string): Promise<void> {
    try {
      const settings = await GlobalSettingsService.getGlobalSettings();
      const updatedContacts = settings.emergencyContacts.filter(
        contact => contact.name !== contactName
      );
      
      await GlobalSettingsService.updateGlobalSettings({
        emergencyContacts: updatedContacts
      });
      Logger.info('Removed emergency contact', contactName);
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.removeEmergencyContact:', error);
      throw error;
    }
  }

  static async updateTaxRegime(regime: 'Old' | 'New'): Promise<void> {
    try {
      await GlobalSettingsService.updateGlobalSettings({ taxRegime: regime });
      Logger.info('Updated tax regime', regime);
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.updateTaxRegime:', error);
      throw error;
    }
  }

  static async updateAutoLockMinutes(minutes: number): Promise<void> {
    try {
      if (minutes < 1 || minutes > 10) {
        throw new Error('Auto lock minutes must be between 1 and 10');
      }
      
      await GlobalSettingsService.updateGlobalSettings({ autoLockMinutes: minutes });
      Logger.info('Updated auto lock minutes', minutes);
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.updateAutoLockMinutes:', error);
      throw error;
    }
  }

  static async updateBirthdaySettings(budget: number, alertDays: number): Promise<void> {
    try {
      await GlobalSettingsService.updateGlobalSettings({
        birthdayBudget: budget,
        birthdayAlertDays: alertDays
      });
      Logger.info('Updated birthday settings', { budget, alertDays });
    } catch (error) {
      Logger.error('Error in GlobalSettingsService.updateBirthdaySettings:', error);
      throw error;
    }
  }
}
