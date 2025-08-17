
import { GlobalSettingsService } from './GlobalSettingsService';
import { AuthenticationService } from './AuthenticationService';

export interface UserSettings {
  darkMode: boolean;
  autoLockMinutes: number;
  privacyMask: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
}

export class UserSettingsService {
  static async getUserSettings(): Promise<UserSettings> {
    try {
      const globalSettings = await GlobalSettingsService.getGlobalSettings();
      
      return {
        darkMode: globalSettings.darkMode || false,
        autoLockMinutes: globalSettings.autoLockMinutes || 5,
        privacyMask: globalSettings.privacyMask || false,
        notificationsEnabled: true, // Default enabled
        emailNotifications: true,
        pushNotifications: false,
        language: 'en',
        currency: 'INR',
        timeZone: globalSettings.timeZone || 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY'
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      // Return defaults
      return {
        darkMode: false,
        autoLockMinutes: 5,
        privacyMask: false,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: false,
        language: 'en',
        currency: 'INR',
        timeZone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY'
      };
    }
  }

  static async updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
    try {
      // Update global settings that are stored there
      const globalUpdates: any = {};
      
      if (updates.darkMode !== undefined) {
        globalUpdates.darkMode = updates.darkMode;
        // Apply theme immediately
        if (updates.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      if (updates.autoLockMinutes !== undefined) {
        globalUpdates.autoLockMinutes = updates.autoLockMinutes;
      }
      
      if (updates.privacyMask !== undefined) {
        globalUpdates.privacyMask = updates.privacyMask;
      }
      
      if (updates.timeZone !== undefined) {
        globalUpdates.timeZone = updates.timeZone;
      }

      if (Object.keys(globalUpdates).length > 0) {
        await GlobalSettingsService.updateGlobalSettings(globalUpdates);
      }

      // Store other settings in localStorage for now
      const otherSettings = {
        notificationsEnabled: updates.notificationsEnabled,
        emailNotifications: updates.emailNotifications,
        pushNotifications: updates.pushNotifications,
        language: updates.language,
        currency: updates.currency,
        dateFormat: updates.dateFormat
      };

      const filteredSettings = Object.fromEntries(
        Object.entries(otherSettings).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(filteredSettings).length > 0) {
        const existingSettings = localStorage.getItem('userSettings');
        const currentSettings = existingSettings ? JSON.parse(existingSettings) : {};
        const updatedSettings = { ...currentSettings, ...filteredSettings };
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      }

    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  static async resetPIN(): Promise<void> {
    try {
      // Clear the PIN from localStorage
      localStorage.removeItem('savora_pin_hash');
      
      // Reset failed attempts
      await GlobalSettingsService.resetFailedPinAttempts();
      
      // Clear session
      AuthenticationService.clearSession();
      
    } catch (error) {
      console.error('Error resetting PIN:', error);
      throw error;
    }
  }

  static async exportUserData(): Promise<string> {
    try {
      // This would export all user data - placeholder implementation
      const data = {
        settings: await this.getUserSettings(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Reset global settings to defaults
      await GlobalSettingsService.updateGlobalSettings({
        darkMode: false,
        autoLockMinutes: 5,
        privacyMask: false,
        timeZone: 'Asia/Kolkata'
      });
      
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}
