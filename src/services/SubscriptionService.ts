
import { db } from '@/lib/db';
import type { Subscription } from '@/lib/db-schema-extended';

export class SubscriptionService {
  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const subscriptions = await db.subscriptions.orderBy('nextBillingDate').toArray();
      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  static async createSubscription(subscription: Omit<Subscription, 'id'>): Promise<string> {
    try {
      const id = await db.subscriptions.add({
        ...subscription,
        id: crypto.randomUUID()
      });
      return id.toString();
    } catch (error) {
      console.error('Error creating subscription:', error);
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

  static async getUpcomingSubscriptions(days: number = 7): Promise<Subscription[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const subscriptions = await db.subscriptions
        .where('nextBillingDate')
        .between(today, futureDate)
        .and(sub => sub.isActive)
        .toArray();

      return subscriptions;
    } catch (error) {
      console.error('Error fetching upcoming subscriptions:', error);
      throw error;
    }
  }
}
