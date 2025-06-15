
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
};

export type ValidationErrors = Record<string, string>;

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.entries(rules).forEach(([field, rule]) => {
    const error = validateField(data[field], rule);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: validationPatterns.email 
  },
  phone: { 
    pattern: validationPatterns.phone 
  },
  currency: { 
    required: true, 
    pattern: validationPatterns.currency 
  },
  percentage: { 
    pattern: validationPatterns.percentage 
  }
};
