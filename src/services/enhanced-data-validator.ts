
import { Logger } from "./logger";

export class EnhancedDataValidator {
  // Currency validation and formatting
  static validateAmount(amount: string | number): { isValid: boolean; error?: string; value?: number } {
    try {
      const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numValue)) {
        return { isValid: false, error: "Amount must be a valid number" };
      }
      
      if (numValue <= 0) {
        return { isValid: false, error: "Amount must be greater than zero" };
      }
      
      if (numValue > 10000000) {
        return { isValid: false, error: "Amount cannot exceed ₹1 crore" };
      }
      
      // Check for reasonable decimal places (max 2)
      const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        return { isValid: false, error: "Amount cannot have more than 2 decimal places" };
      }
      
      return { isValid: true, value: numValue };
    } catch (error) {
      Logger.error('Amount validation error', error);
      return { isValid: false, error: "Invalid amount format" };
    }
  }

  static formatCurrency(amount: number, currency: string = '₹'): string {
    try {
      return `${currency}${amount.toLocaleString('en-IN', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      })}`;
    } catch (error) {
      Logger.error('Currency formatting error', error);
      return `${currency}${amount}`;
    }
  }

  // Date validation
  static validateDate(dateString: string): { isValid: boolean; error?: string; value?: Date } {
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return { isValid: false, error: "Invalid date format" };
      }
      
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      if (date > today) {
        return { isValid: false, error: "Date cannot be in the future" };
      }
      
      if (date < oneYearAgo) {
        return { isValid: false, error: "Date cannot be more than a year ago" };
      }
      
      return { isValid: true, value: date };
    } catch (error) {
      Logger.error('Date validation error', error);
      return { isValid: false, error: "Invalid date" };
    }
  }

  // Text validation
  static validateText(text: string, options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    pattern?: RegExp;
    fieldName?: string;
  } = {}): { isValid: boolean; error?: string; value?: string } {
    const {
      minLength = 0,
      maxLength = Infinity,
      required = false,
      pattern,
      fieldName = "field"
    } = options;

    try {
      const trimmedText = text.trim();
      
      if (required && trimmedText.length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      if (trimmedText.length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
      }
      
      if (trimmedText.length > maxLength) {
        return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
      }
      
      if (pattern && !pattern.test(trimmedText)) {
        return { isValid: false, error: `${fieldName} format is invalid` };
      }
      
      return { isValid: true, value: trimmedText };
    } catch (error) {
      Logger.error('Text validation error', error);
      return { isValid: false, error: `Invalid ${fieldName}` };
    }
  }

  // Email validation
  static validateEmail(email: string): { isValid: boolean; error?: string; value?: string } {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateText(email, {
      required: true,
      pattern: emailPattern,
      fieldName: "email"
    });
  }

  // Phone validation (Indian format)
  static validatePhone(phone: string): { isValid: boolean; error?: string; value?: string } {
    const phonePattern = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      return { isValid: false, error: "Phone number must be 10 digits" };
    }
    
    return this.validateText(cleanPhone, {
      pattern: phonePattern,
      fieldName: "phone number"
    });
  }

  // Percentage validation
  static validatePercentage(value: number): { isValid: boolean; error?: string; value?: number } {
    if (isNaN(value)) {
      return { isValid: false, error: "Percentage must be a valid number" };
    }
    
    if (value < 0 || value > 100) {
      return { isValid: false, error: "Percentage must be between 0 and 100" };
    }
    
    return { isValid: true, value };
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Sanitization methods
  static sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  static sanitizeAmount(amount: string): string {
    return amount.replace(/[^\d.-]/g, '');
  }

  // Array validation
  static validateArray<T>(arr: T[], options: {
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: T) => boolean;
    fieldName?: string;
  } = {}): { isValid: boolean; error?: string; value?: T[] } {
    const {
      minLength = 0,
      maxLength = Infinity,
      itemValidator,
      fieldName = "array"
    } = options;

    if (!Array.isArray(arr)) {
      return { isValid: false, error: `${fieldName} must be an array` };
    }
    
    if (arr.length < minLength) {
      return { isValid: false, error: `${fieldName} must have at least ${minLength} items` };
    }
    
    if (arr.length > maxLength) {
      return { isValid: false, error: `${fieldName} cannot have more than ${maxLength} items` };
    }
    
    if (itemValidator) {
      const invalidItems = arr.filter(item => !itemValidator(item));
      if (invalidItems.length > 0) {
        return { isValid: false, error: `${fieldName} contains invalid items` };
      }
    }
    
    return { isValid: true, value: arr };
  }
}
