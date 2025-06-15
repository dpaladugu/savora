
import { Logger } from "./logger";

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

export class EnhancedNotificationService {
  private static toastFunction: ((options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }) => void) | null = null;

  static setToastFunction(toastFn: any) {
    this.toastFunction = toastFn;
  }

  static success(options: NotificationOptions) {
    Logger.info('Success notification', options);
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 3000
      });
    }
  }

  static error(options: NotificationOptions) {
    Logger.error('Error notification', options);
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'destructive',
        duration: options.duration || 5000
      });
    }
  }

  static warning(options: NotificationOptions) {
    Logger.warn('Warning notification', options);
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 4000
      });
    }
  }

  static info(options: NotificationOptions) {
    Logger.info('Info notification', options);
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 3000
      });
    }
  }

  // Predefined common notifications
  static expenseAdded() {
    this.success({
      title: "Expense Added",
      description: "Your expense has been recorded successfully"
    });
  }

  static expenseUpdated() {
    this.success({
      title: "Expense Updated",
      description: "Your expense has been updated successfully"
    });
  }

  static expenseDeleted() {
    this.success({
      title: "Expense Deleted",
      description: "Your expense has been removed"
    });
  }

  static networkError() {
    this.error({
      title: "Network Error",
      description: "Please check your connection and try again",
      duration: 5000
    });
  }

  static validationError(message?: string) {
    this.error({
      title: "Validation Error",
      description: message || "Please check your input and try again",
      duration: 4000
    });
  }

  static dataLoadError() {
    this.error({
      title: "Failed to Load Data",
      description: "Unable to load data. Please refresh the page.",
      duration: 5000
    });
  }
}
