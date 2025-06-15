import { Logger } from "./logger";
import React from "react";
import { ToastActionElement } from "@/components/ui/toast";

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

export interface ToastFunction {
  (options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
    action?: ToastActionElement;
  }): void;
}

export class EnhancedNotificationService {
  private static toastFunction: ToastFunction | null = null;
  private static fallbackNotifications: NotificationOptions[] = [];
  private static maxFallbackNotifications = 5;

  static setToastFunction(toastFn: ToastFunction) {
    this.toastFunction = toastFn;
    
    // Process any queued fallback notifications
    if (this.fallbackNotifications.length > 0) {
      Logger.info('Processing queued notifications:', this.fallbackNotifications.length);
      this.fallbackNotifications.forEach(notification => {
        if (notification.title.toLowerCase().includes('error') || 
            notification.title.toLowerCase().includes('failed')) {
          this.error(notification);
        } else {
          this.success(notification);
        }
      });
      this.fallbackNotifications = [];
    }
  }

  private static queueFallbackNotification(notification: NotificationOptions) {
    this.fallbackNotifications.push(notification);
    
    // Keep only the most recent notifications
    if (this.fallbackNotifications.length > this.maxFallbackNotifications) {
      this.fallbackNotifications = this.fallbackNotifications.slice(-this.maxFallbackNotifications);
    }
    
    Logger.warn('Toast function not available, notification queued:', notification.title);
  }

  private static createActionButton(action: { label: string; onClick: () => void }): ToastActionElement {
    return React.createElement(
      'button',
      {
        onClick: action.onClick,
        className: 'text-sm underline hover:no-underline'
      },
      action.label
    ) as ToastActionElement;
  }

  static success(options: NotificationOptions) {
    Logger.info('Success notification', options);
    
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 3000,
        action: options.action ? this.createActionButton(options.action) : undefined
      });
    } else {
      this.queueFallbackNotification(options);
    }
  }

  static error(options: NotificationOptions) {
    Logger.error('Error notification', options);
    
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'destructive',
        duration: options.duration || 5000,
        action: options.action ? this.createActionButton(options.action) : undefined
      });
    } else {
      this.queueFallbackNotification(options);
    }
  }

  static warning(options: NotificationOptions) {
    Logger.warn('Warning notification', options);
    
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 4000,
        action: options.action ? this.createActionButton(options.action) : undefined
      });
    } else {
      this.queueFallbackNotification(options);
    }
  }

  static info(options: NotificationOptions) {
    Logger.info('Info notification', options);
    
    if (this.toastFunction) {
      this.toastFunction({
        title: options.title,
        description: options.description,
        variant: 'default',
        duration: options.duration || 3000,
        action: options.action ? this.createActionButton(options.action) : undefined
      });
    } else {
      this.queueFallbackNotification(options);
    }
  }

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

  static investmentAdded() {
    this.success({
      title: "Investment Added",
      description: "Your investment has been recorded successfully"
    });
  }

  static goalCreated() {
    this.success({
      title: "Goal Created",
      description: "Your financial goal has been set successfully"
    });
  }

  static dataImported(count: number, type: string = 'records') {
    this.success({
      title: "Data Imported",
      description: `Successfully imported ${count} ${type}`
    });
  }

  static networkError() {
    this.error({
      title: "Network Error",
      description: "Please check your connection and try again",
      duration: 5000,
      action: {
        label: "Retry",
        onClick: () => window.location.reload()
      }
    });
  }

  static validationError(message?: string) {
    this.error({
      title: "Validation Error",
      description: message || "Please check your input and try again",
      duration: 4000
    });
  }

  static dataLoadError(retry?: () => void) {
    this.error({
      title: "Failed to Load Data",
      description: "Unable to load data. Please refresh the page.",
      duration: 5000,
      action: retry ? {
        label: "Retry",
        onClick: retry
      } : undefined
    });
  }

  static criticalError(message?: string) {
    this.error({
      title: "Critical Error",
      description: message || "A critical error occurred. Please contact support if this persists.",
      duration: 8000
    });
  }

  static operationInProgress(operation: string) {
    this.info({
      title: "Operation in Progress",
      description: `${operation} is being processed...`,
      duration: 2000
    });
  }

  static operationCompleted(operation: string) {
    this.success({
      title: "Operation Completed",
      description: `${operation} completed successfully`,
      duration: 3000
    });
  }

  static testNotification() {
    this.info({
      title: "Test Notification",
      description: "Notification system is working correctly",
      duration: 2000
    });
  }
}
