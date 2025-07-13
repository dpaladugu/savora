/**
 * src/lib/format-utils.ts
 *
 * A collection of utility functions for formatting data for display.
 */

import { format as formatDateFns, parseISO, isValid } from 'date-fns';

/**
 * Formats a number as an INR currency string.
 * e.g., 12345.67 => "₹12,346"
 * @param amount The number to format.
 * @returns The formatted currency string, or 'N/A' if amount is invalid.
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a number as a percentage string with one decimal place.
 * e.g., 85.123 => "85.1%"
 * @param value The number to format.
 * @returns The formatted percentage string.
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formats a date string or Date object into a readable format like "Oct 26, 2023".
 * @param date The date string (YYYY-MM-DD or ISO) or Date object.
 * @returns The formatted date string, or 'N/A' if date is invalid.
 */
export const formatDate = (date?: string | Date): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'N/A';
  return formatDateFns(dateObj, 'PPP'); // e.g., "Oct 26, 2023"
};

/**
 * Formats a date string or Date object into a readable date-time format.
 * @param date The date string (ISO) or Date object.
 * @returns The formatted date-time string, or 'N/A' if date is invalid.
 */
export const formatDateTime = (date?: string | Date): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'N/A';
  return dateObj.toLocaleString('en-IN');
};
