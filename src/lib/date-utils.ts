// Based on the conceptual code from the previous step
import { parseISO, addDays, addWeeks, addMonths, addYears, setDate, getDate, getDaysInMonth, set, format } from 'date-fns';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  dayOfWeek?: number; // 0 (Sun) - 6 (Sat) // Note: date-fns uses 0 for Sunday
  dayOfMonth?: number; // 1-31
}

export function calculateNextOccurrenceDate(
  currentNextDateStr: string, // ISO string YYYY-MM-DD that just occurred
  rule: RecurrenceRule
): string {
  let currentOccurrenceDate = parseISO(currentNextDateStr);
  let newDate: Date;

  switch (rule.frequency) {
    case 'daily':
      newDate = addDays(currentOccurrenceDate, rule.interval);
      break;
    case 'weekly':
      // For weekly, the dayOfWeek from the rule should ideally determine the next occurrence's day.
      // However, a simpler model is that the 'start_date' sets the day of the week, and subsequent
      // occurrences are just 'interval' weeks later.
      // If rule.dayOfWeek is specified, it implies the start_date was on this day.
      newDate = addWeeks(currentOccurrenceDate, rule.interval);
      break;
    case 'monthly':
      const targetMonthDate = addMonths(currentOccurrenceDate, rule.interval);
      if (rule.dayOfMonth) {
        // If a specific day_of_month is set for the rule (e.g. "always on the 15th")
        const daysInTargetMonth = getDaysInMonth(targetMonthDate);
        newDate = setDate(targetMonthDate, Math.min(rule.dayOfMonth, daysInTargetMonth));
      } else {
        // If no specific day_of_month, maintain the original day, clamping if necessary
        // (e.g. Jan 31st -> Feb 28th/29th)
        // This is date-fns' default behavior for addMonths if the target month is shorter.
        newDate = targetMonthDate;
      }
      break;
    case 'yearly':
      const targetYearDate = addYears(currentOccurrenceDate, rule.interval);
      // Similar to monthly, maintain original day/month, clamping for Feb 29 if needed.
      // If rule.dayOfMonth is set, it implies a specific day (e.g. Jan 15th every year)
      // and the month would be implicitly from currentOccurrenceDate or a fixed rule.monthOfYear.
      if (rule.dayOfMonth) {
        // Assuming month is derived from currentOccurrenceDate.month
        const targetMonthInYear = set(targetYearDate, { month: currentOccurrenceDate.getMonth() });
        const daysInTargetMonth = getDaysInMonth(targetMonthInYear);
        newDate = setDate(targetMonthInYear, Math.min(rule.dayOfMonth, daysInTargetMonth));
      } else {
        newDate = targetYearDate;
      }
      break;
    default:
      // To satisfy TypeScript, though the type system should prevent this.
      throw new Error('Invalid frequency');
  }
  return format(newDate, 'yyyy-MM-dd');
}
