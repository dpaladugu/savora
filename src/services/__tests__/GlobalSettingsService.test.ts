
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalSettingsService } from '../GlobalSettingsService';
import { createMockDb } from '@/utils/test-utils';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: createMockDb(),
}));

// Mock logger
vi.mock('../logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('GlobalSettingsService', () => {
  const mockDb = createMockDb();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGlobalSettings', () => {
    it('should return existing global settings', async () => {
      const mockSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New' as const,
        autoLockMinutes: 5,
        birthdayBudget: 1000,
        birthdayAlertDays: 7,
        emergencyContacts: []
      };
      
      mockDb.globalSettings.get.mockResolvedValue(mockSettings);

      const result = await GlobalSettingsService.getGlobalSettings();

      expect(result).toEqual(mockSettings);
      expect(mockDb.globalSettings.get).toHaveBeenCalledWith('global-settings-singleton');
    });

    it('should create default settings if none exist', async () => {
      mockDb.globalSettings.get.mockResolvedValue(undefined);
      mockDb.globalSettings.add.mockResolvedValue('global-settings-singleton');

      const result = await GlobalSettingsService.getGlobalSettings();

      expect(result.taxRegime).toBe('New');
      expect(result.autoLockMinutes).toBe(5);
      expect(result.birthdayBudget).toBe(0);
      expect(result.birthdayAlertDays).toBe(7);
      expect(result.emergencyContacts).toEqual([]);
      expect(mockDb.globalSettings.add).toHaveBeenCalled();
    });
  });

  describe('updateGlobalSettings', () => {
    it('should update existing settings', async () => {
      const existingSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New' as const,
        autoLockMinutes: 5,
        birthdayBudget: 0,
        birthdayAlertDays: 7,
        emergencyContacts: []
      };
      
      mockDb.globalSettings.get.mockResolvedValue(existingSettings);
      mockDb.globalSettings.put.mockResolvedValue('global-settings-singleton');

      const updates = { autoLockMinutes: 10, birthdayBudget: 2000 };
      await GlobalSettingsService.updateGlobalSettings(updates);

      expect(mockDb.globalSettings.put).toHaveBeenCalledWith({
        ...existingSettings,
        ...updates
      });
    });
  });

  describe('addEmergencyContact', () => {
    it('should add an emergency contact', async () => {
      const existingSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New' as const,
        autoLockMinutes: 5,
        birthdayBudget: 0,
        birthdayAlertDays: 7,
        emergencyContacts: []
      };
      
      mockDb.globalSettings.get.mockResolvedValue(existingSettings);
      mockDb.globalSettings.put.mockResolvedValue('global-settings-singleton');

      const newContact = { name: 'John Doe', phone: '1234567890', relation: 'Brother' };
      await GlobalSettingsService.addEmergencyContact(newContact);

      expect(mockDb.globalSettings.put).toHaveBeenCalledWith({
        ...existingSettings,
        emergencyContacts: [newContact]
      });
    });
  });

  describe('updateAutoLockMinutes', () => {
    it('should update auto lock minutes within valid range', async () => {
      const existingSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New' as const,
        autoLockMinutes: 5,
        birthdayBudget: 0,
        birthdayAlertDays: 7,
        emergencyContacts: []
      };
      
      mockDb.globalSettings.get.mockResolvedValue(existingSettings);
      mockDb.globalSettings.put.mockResolvedValue('global-settings-singleton');

      await GlobalSettingsService.updateAutoLockMinutes(8);

      expect(mockDb.globalSettings.put).toHaveBeenCalledWith({
        ...existingSettings,
        autoLockMinutes: 8
      });
    });

    it('should reject invalid auto lock minutes', async () => {
      await expect(GlobalSettingsService.updateAutoLockMinutes(0))
        .rejects.toThrow('Auto lock minutes must be between 1 and 10');
        
      await expect(GlobalSettingsService.updateAutoLockMinutes(11))
        .rejects.toThrow('Auto lock minutes must be between 1 and 10');
    });
  });

  describe('updateTaxRegime', () => {
    it('should update tax regime', async () => {
      const existingSettings = {
        id: 'global-settings-singleton',
        taxRegime: 'New' as const,
        autoLockMinutes: 5,
        birthdayBudget: 0,
        birthdayAlertDays: 7,
        emergencyContacts: []
      };
      
      mockDb.globalSettings.get.mockResolvedValue(existingSettings);
      mockDb.globalSettings.put.mockResolvedValue('global-settings-singleton');

      await GlobalSettingsService.updateTaxRegime('Old');

      expect(mockDb.globalSettings.put).toHaveBeenCalledWith({
        ...existingSettings,
        taxRegime: 'Old'
      });
    });
  });
});
