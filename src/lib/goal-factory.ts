import type { Goal } from '@/types/financial';

interface CreateGoalParams {
  name: string;
  slug?: string;
  type?: 'Short' | 'Medium' | 'Long';
  targetAmount: number;
  targetDate?: Date;
  currentAmount?: number;
  notes?: string;
  category?: string;
}

/**
 * Factory function to create a complete Goal object with all required fields
 */
export function createGoal(params: CreateGoalParams): Goal {
  const now = new Date();
  const targetDate = params.targetDate || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  return {
    id: crypto.randomUUID(),
    name: params.name,
    title: params.name, // Use name as title
    slug: params.slug,
    type: params.type,
    targetAmount: params.targetAmount,
    currentAmount: params.currentAmount || 0,
    deadline: targetDate.toISOString(),
    targetDate: targetDate,
    category: params.category || deriveCategory(params.type),
    notes: params.notes,
    createdAt: now,
    updatedAt: now
  };
}

function deriveCategory(type?: 'Short' | 'Medium' | 'Long'): string {
  switch (type) {
    case 'Short': return 'short-term';
    case 'Medium': return 'medium-term';
    case 'Long': return 'long-term';
    default: return 'general';
  }
}

/**
 * Helper to add timestamps to a Txn-like object
 */
export function withTimestamps<T>(obj: T): T & { createdAt: Date; updatedAt: Date } {
  const now = new Date();
  return {
    ...obj,
    createdAt: now,
    updatedAt: now
  };
}
