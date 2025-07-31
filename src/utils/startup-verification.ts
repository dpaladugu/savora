
import { Logger } from '@/services/logger';
import { db } from '@/db'; // Changed from '@/lib/db' to '@/db'

export interface StartupCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export async function performStartupVerification(): Promise<StartupCheck[]> {
  const checks: StartupCheck[] = [];
  
  // Check 1: Database connectivity
  try {
    await db.expenses.toArray();
    checks.push({
      name: 'Database Connectivity',
      status: 'success',
      message: 'Database is accessible and functioning'
    });
  } catch (error) {
    checks.push({
      name: 'Database Connectivity',
      status: 'error',
      message: 'Failed to connect to database',
      details: error
    });
  }

  // Check 2: Essential services
  try {
    Logger.info('Startup verification running');
    checks.push({
      name: 'Logging Service',
      status: 'success',
      message: 'Logger service is working'
    });
  } catch (error) {
    checks.push({
      name: 'Logging Service',
      status: 'error',
      message: 'Logger service failed',
      details: error
    });
  }

  // Check 3: Local storage availability
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    checks.push({
      name: 'Local Storage',
      status: 'success',
      message: 'Local storage is available'
    });
  } catch (error) {
    checks.push({
      name: 'Local Storage',
      status: 'warning',
      message: 'Local storage might not be available',
      details: error
    });
  }

  // Check 4: Crypto API availability
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      const uuid = crypto.randomUUID();
      checks.push({
        name: 'Crypto API',
        status: 'success',
        message: 'Crypto API is available for UUID generation'
      });
    } else {
      checks.push({
        name: 'Crypto API',
        status: 'warning',
        message: 'Crypto API not available, using fallback'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Crypto API',
      status: 'warning',
      message: 'Crypto API check failed',
      details: error
    });
  }

  // Check 5: React/DOM availability
  try {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      checks.push({
        name: 'DOM Environment',
        status: 'success',
        message: 'Running in proper DOM environment'
      });
    } else {
      checks.push({
        name: 'DOM Environment',
        status: 'error',
        message: 'DOM environment not detected'
      });
    }
  } catch (error) {
    checks.push({
      name: 'DOM Environment',
      status: 'error',
      message: 'DOM environment check failed',
      details: error
    });
  }

  return checks;
}

export function logStartupResults(checks: StartupCheck[]) {
  console.log('=== Startup Verification Results ===');
  checks.forEach(check => {
    const icon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details) {
      console.log('  Details:', check.details);
    }
  });
  
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('🎉 All startup checks passed!');
  } else {
    console.log(`🔍 Startup completed with ${errorCount} errors and ${warningCount} warnings`);
  }
}
