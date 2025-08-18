
import { db } from '@/lib/db';

interface Subscription {
  id: string;
  name: string;
  cost: number;
  category: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  nextRenewal: Date;
  autoRenew: boolean;
  reminderEnabled: boolean;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionService {
  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      return await db.subscriptions.orderBy('nextRenewal').toArray();
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  static async addSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const id = crypto.randomUUID();
      await db.subscriptions.add({
        ...subscription,
        id,
        createdAt: now,
        updatedAt: now
      });
      return id;
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    try {
      await db.subscriptions.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async deleteSubscription(id: string): Promise<void> {
    try {
      await db.subscriptions.delete(id);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  static async getActiveSubscriptions(): Promise<Subscription[]> {
    try {
      return await db.subscriptions.toArray();
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      return [];
    }
  }

  static async getUpcomingRenewals(days: number = 7): Promise<Subscription[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      return await db.subscriptions
        .where('nextRenewal')
        .belowOrEqual(cutoffDate)
        .and(sub => sub.reminderEnabled)
        .toArray();
    } catch (error) {
      console.error('Error fetching upcoming renewals:', error);
      return [];
    }
  }

  static calculateNextRenewal(startDate: Date, cycle: 'Monthly' | 'Quarterly' | 'Yearly'): Date {
    const nextRenewal = new Date(startDate);
    
    switch (cycle) {
      case 'Monthly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
      case 'Quarterly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 3);
        break;
      case 'Yearly':
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        break;
    }
    
    return nextRenewal;
  }
}
