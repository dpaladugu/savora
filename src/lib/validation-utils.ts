/**
 * src/lib/validation-utils.ts
 *
 * A collection of utility functions for data validation.
 */

/**
 * Validates if an email string has a valid format.
 * @param email The email string to validate.
 * @returns True if the email format is valid, false otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if a value is a positive number.
 * @param amount The string or number to validate.
 * @returns True if it's a positive number, false otherwise.
 */
export const isValidAmount = (amount: string | number): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

/**
 * Trims and removes potentially harmful HTML characters from a string.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * A simple required field validator.
 * @param value The value to check.
 * @param fieldName The name of the field for the error message.
 * @returns An error message string if invalid, or null if valid.
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * A simple number validator with optional min/max checks.
 * @param value The value to check.
 * @param fieldName The name of the field for the error message.
 * @param min Optional minimum value.
 * @param max Optional maximum value.
 * @returns An error message string if invalid, or null if valid.
 */
export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): string | null => {
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
};
