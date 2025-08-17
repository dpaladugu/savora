
import { extendedDb as db } from '@/lib/db-schema-extended';
import type { Subscription } from '@/lib/db-schema-extended';

export class SubscriptionService {
  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      return await db.subscriptions.orderBy('nextDue').toArray();
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  static async addSubscription(subscription: Omit<Subscription, 'id'>): Promise<string> {
    try {
      const id = await db.subscriptions.add({
        id: crypto.randomUUID(),
        ...subscription
      });
      return id.toString();
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    try {
      await db.subscriptions.update(id, updates);
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
      return await db.subscriptions.where('isActive').equals(1).toArray();
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
        .where('nextDue')
        .belowOrEqual(cutoffDate.getTime())
        .and(sub => !!sub.isActive)
        .toArray();
    } catch (error) {
      console.error('Error fetching upcoming renewals:', error);
      return [];
    }
  }

  static calculateNextDue(startDate: Date, cycle: 'Monthly' | 'Quarterly' | 'Yearly'): Date {
    const nextDue = new Date(startDate);
    
    switch (cycle) {
      case 'Monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'Quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'Yearly':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }
    
    return nextDue;
  }
}
