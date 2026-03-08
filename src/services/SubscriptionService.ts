
import { db, type Subscription as DbSubscription } from '@/lib/db';

// Service-level Subscription type (extends DB type)
export interface Subscription extends Omit<DbSubscription, 'nextBilling'> {
  nextRenewal: Date;
  reminderEnabled: boolean;
}

// Helper to convert DB subscription to service subscription
function toServiceSubscription(sub: DbSubscription): Subscription {
  return {
    ...sub,
    nextRenewal: sub.nextBilling || sub.nextDue || new Date(),
    reminderEnabled: sub.reminderDays ? sub.reminderDays > 0 : false
  };
}

// Helper to convert service subscription to DB subscription
function toDbSubscription(sub: Partial<Subscription>): Partial<DbSubscription> {
  const { nextRenewal, reminderEnabled, ...rest } = sub;
  return {
    ...rest,
    nextBilling: nextRenewal || new Date(),
    nextDue: nextRenewal || new Date()
  };
}

export class SubscriptionService {
  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const subs = await db.subscriptions.orderBy('nextBilling').toArray();
      return subs.map(toServiceSubscription);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  static async addSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const id = crypto.randomUUID();
      const dbSub = toDbSubscription(subscription);
      await db.subscriptions.add({
        ...dbSub,
        id,
        name: subscription.name,
        cost: subscription.cost,
        billingCycle: subscription.billingCycle,
        nextBilling: subscription.nextRenewal || now,
        createdAt: now,
        updatedAt: now
      } as DbSubscription);
      return id;
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    try {
      const dbUpdates = toDbSubscription(updates);
      await db.subscriptions.update(id, {
        ...dbUpdates,
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
      const subs = await db.subscriptions.toArray();
      return subs.map(toServiceSubscription);
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
      return [];
    }
  }

  static async getUpcomingRenewals(days: number = 7): Promise<Subscription[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      const subs = await db.subscriptions
        .where('nextBilling')
        .belowOrEqual(cutoffDate)
        .toArray();
      
      return subs
        .filter(sub => sub.reminderDays && sub.reminderDays > 0)
        .map(toServiceSubscription);
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
