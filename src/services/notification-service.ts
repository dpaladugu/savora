
import { toast } from '@/hooks/use-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationService {
  private static defaultDuration = 5000;

  static success(options: NotificationOptions) {
    toast({
      title: options.title,
      description: options.description,
      duration: options.duration || this.defaultDuration,
      action: options.action ? {
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
    });
  }

  static error(options: NotificationOptions) {
    toast({
      title: options.title,
      description: options.description,
      variant: 'destructive',
      duration: options.duration || this.defaultDuration,
      action: options.action ? {
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
    });
  }

  static warning(options: NotificationOptions) {
    toast({
      title: `⚠️ ${options.title}`,
      description: options.description,
      duration: options.duration || this.defaultDuration,
      action: options.action ? {
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
    });
  }

  static info(options: NotificationOptions) {
    toast({
      title: `ℹ️ ${options.title}`,
      description: options.description,
      duration: options.duration || this.defaultDuration,
      action: options.action ? {
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
    });
  }

  // Quick methods for common scenarios
  static expenseAdded(amount: number) {
    this.success({
      title: 'Expense Added',
      description: `₹${amount.toLocaleString()} expense recorded successfully`
    });
  }

  static investmentAdded(name: string, amount: number) {
    this.success({
      title: 'Investment Added',
      description: `${name} - ₹${amount.toLocaleString()} added to portfolio`
    });
  }

  static dataImported(count: number, type: string) {
    this.success({
      title: 'Data Imported',
      description: `${count} ${type} records imported successfully`
    });
  }

  static networkError() {
    this.error({
      title: 'Network Error',
      description: 'Please check your internet connection and try again',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    });
  }

  static validationError(field: string) {
    this.error({
      title: 'Validation Error',
      description: `Please check the ${field} field and try again`
    });
  }

  static goalAchieved(goalName: string) {
    this.success({
      title: '🎉 Goal Achieved!',
      description: `Congratulations! You've reached your goal: ${goalName}`
    });
  }

  static emergencyFundLow(shortfall: number) {
    this.warning({
      title: 'Emergency Fund Low',
      description: `Your emergency fund is ₹${shortfall.toLocaleString()} below the recommended amount`
    });
  }
}
