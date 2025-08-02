
import { db } from '@/db';
import { Logger } from '@/services/logger';

export interface StartupCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export async function performStartupVerification(): Promise<StartupCheck[]> {
  const checks: StartupCheck[] = [];
  
  try {
    // Database connectivity check
    await db.expenses.limit(1).toArray();
    checks.push({
      name: 'Database Connection',
      status: 'success',
      message: 'Database is accessible'
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'error',
      message: 'Failed to connect to database',
      details: error
    });
  }

  try {
    // Check for essential tables
    const expenseCount = await db.expenses.count();
    const incomeCount = await db.incomes.count();
    const investmentCount = await db.investments.count();
    
    checks.push({
      name: 'Data Integrity',
      status: 'success',
      message: `Found ${expenseCount} expenses, ${incomeCount} incomes, ${investmentCount} investments`
    });
  } catch (error) {
    checks.push({
      name: 'Data Integrity',
      status: 'warning',
      message: 'Could not verify data integrity',
      details: error
    });
  }

  try {
    // Check app settings
    const profile = await db.getPersonalProfile();
    checks.push({
      name: 'User Profile',
      status: profile ? 'success' : 'warning',
      message: profile ? 'User profile found' : 'No user profile found'
    });
  } catch (error) {
    checks.push({
      name: 'User Profile',
      status: 'warning',
      message: 'Could not check user profile',
      details: error
    });
  }

  try {
    // Check emergency fund settings
    const efSettings = await db.getEmergencyFundSettings();
    checks.push({
      name: 'Emergency Fund Settings',
      status: 'success',
      message: `Emergency fund target: ${efSettings.efMonths} months`
    });
  } catch (error) {
    checks.push({
      name: 'Emergency Fund Settings',
      status: 'warning',
      message: 'Using default emergency fund settings',
      details: error
    });
  }

  return checks;
}

export function logStartupResults(checks: StartupCheck[]): void {
  checks.forEach(check => {
    const logMessage = `${check.name}: ${check.message}`;
    switch (check.status) {
      case 'success':
        Logger.info(logMessage);
        break;
      case 'warning':
        Logger.debug(logMessage, check.details);
        break;
      case 'error':
        Logger.error(logMessage, check.details);
        break;
    }
  });
}
