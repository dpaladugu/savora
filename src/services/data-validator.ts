
/**
 * Simple data validation utilities
 * This is a placeholder service for data validation functionality
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DataValidator {
  static validateRequired(value: any, fieldName: string): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }

  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        errors: ['Invalid email format']
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }

  static validateNumber(value: any, fieldName: string): ValidationResult {
    if (isNaN(Number(value))) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid number`]
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }
}
