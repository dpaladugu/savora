
export class DataValidator {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidAmount(amount: string | number): boolean {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num > 0;
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static validateRequired(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return `${fieldName} is required`;
    }
    return null;
  }

  static validateNumber(value: any, fieldName: string, min?: number, max?: number): string | null {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    
    if (max !== undefined && num > max) {
      return `${fieldName} must be at most ${max}`;
    }
    
    return null;
  }

  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN');
  }

  static formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-IN');
  }
}
