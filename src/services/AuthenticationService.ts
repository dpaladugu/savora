import { GlobalSettingsService } from './GlobalSettingsService';
import { db } from '@/lib/db';

export interface AuthResult {
  success: boolean;
  shouldSelfDestruct: boolean;
  attemptsRemaining: number;
}

export class AuthenticationService {
  private static readonly PIN_KEY = 'savora_pin_hash';
  private static readonly SESSION_KEY = 'savora_session';
  private static readonly REVEAL_KEY = 'savora_reveal_session';

  static async setPIN(pin: string): Promise<void> {
    try {
      const hash = await this.hashPIN(pin);
      localStorage.setItem(this.PIN_KEY, hash);
      await GlobalSettingsService.resetFailedPinAttempts();
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw error;
    }
  }

  static async verifyPIN(pin: string): Promise<AuthResult> {
    try {
      const storedHash = localStorage.getItem(this.PIN_KEY);
      if (!storedHash) {
        throw new Error('No PIN set');
      }

      const inputHash = await this.hashPIN(pin);
      const isValid = storedHash === inputHash;

      if (isValid) {
        await GlobalSettingsService.resetFailedPinAttempts();
        this.createSession();
        return {
          success: true,
          shouldSelfDestruct: false,
          attemptsRemaining: 10,
        };
      } else {
        const attempts = await GlobalSettingsService.incrementFailedPinAttempts();
        const shouldDestruct = await GlobalSettingsService.shouldTriggerSelfDestruct();
        
        if (shouldDestruct) {
          await this.selfDestruct();
        }

        return {
          success: false,
          shouldSelfDestruct: shouldDestruct,
          attemptsRemaining: 10 - attempts,
        };
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      throw error;
    }
  }

  static async hasPIN(): Promise<boolean> {
    return localStorage.getItem(this.PIN_KEY) !== null;
  }

  static isSessionValid(): boolean {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return false;

    try {
      const { timestamp, autoLockMinutes } = JSON.parse(session);
      const now = Date.now();
      const sessionDuration = autoLockMinutes * 60 * 1000; // Convert to milliseconds
      
      return (now - timestamp) < sessionDuration;
    } catch {
      return false;
    }
  }

  static createSession(): void {
    const session = {
      timestamp: Date.now(),
      autoLockMinutes: 5, // Default 5 minutes
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.REVEAL_KEY);
  }

  static async enablePrivacyMask(revealSecret: string): Promise<void> {
    try {
      await GlobalSettingsService.updateGlobalSettings({
        privacyMask: true,
        revealSecret: revealSecret,
      });
    } catch (error) {
      console.error('Error enabling privacy mask:', error);
      throw error;
    }
  }

  static async verifyRevealSecret(secret: string): Promise<boolean> {
    try {
      const settings = await GlobalSettingsService.getGlobalSettings();
      if (settings.revealSecret === secret) {
        // Create reveal session (5 minutes)
        const revealSession = {
          timestamp: Date.now(),
          duration: 5 * 60 * 1000, // 5 minutes
        };
        localStorage.setItem(this.REVEAL_KEY, JSON.stringify(revealSession));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying reveal secret:', error);
      return false;
    }
  }

  static isRevealActive(): boolean {
    const revealSession = localStorage.getItem(this.REVEAL_KEY);
    if (!revealSession) return false;

    try {
      const { timestamp, duration } = JSON.parse(revealSession);
      const now = Date.now();
      
      if ((now - timestamp) < duration) {
        return true;
      } else {
        localStorage.removeItem(this.REVEAL_KEY);
        return false;
      }
    } catch {
      localStorage.removeItem(this.REVEAL_KEY);
      return false;
    }
  }

  static async shouldShowMaskedAmounts(): Promise<boolean> {
    try {
      const settings = await GlobalSettingsService.getGlobalSettings();
      return settings.privacyMask && !this.isRevealActive();
    } catch {
      return false;
    }
  }

  static maskAmount(amount: number): string {
    return '₹***.**';
  }

  private static async hashPIN(pin: string): Promise<string> {
    // Using Web Crypto API for secure hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'savora_salt'); // Add salt for security
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async selfDestruct(): Promise<void> {
    try {
      console.warn('Self-destruct initiated due to too many failed attempts');
      
      // Clear all data
      await this.clearAllData();
      
      // Clear localStorage
      localStorage.clear();
      
      // Redirect to setup or show destruction message
      window.location.reload();
    } catch (error) {
      console.error('Error during self-destruct:', error);
    }
  }

  private static async clearAllData(): Promise<void> {
    try {
      // Clear all database tables
      await Promise.all([
        db.globalSettings.clear(),
        db.txns.clear(),
        db.goals.clear(),
        db.creditCards.clear(),
        db.vehicles.clear(),
        db.investments.clear(),
        db.rentalProperties.clear(),
        db.tenants.clear(),
        db.gold.clear(),
        db.insurance.clear(),
        db.loans.clear(),
        db.brotherRepayments.clear(),
        db.subscriptions.clear(),
        db.health.clear(),
        db.familyBankAccounts.clear(),
        db.familyTransfers.clear(),
        db.emergencyFunds.clear(),
        db.auditLogs.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.appSettings.clear(),
      ]);
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  static async checkAuthenticationStatus(): Promise<boolean> {
    try {
      // Check if user has set up authentication
      const settings = await db.globalSettings.limit(1).first();
      if (!settings) return false;
      
      // For now, return true if settings exist
      // This should be enhanced with actual PIN/biometric check
      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}
