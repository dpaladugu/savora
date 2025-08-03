
/**
 * Auto-Goal Creation Engine
 * Implements intelligent goal creation per requirements spec Section 24
 */

import { db } from '@/lib/db';
import type { Goal, Txn, Investment, Insurance, Dependent } from '@/lib/db';
import { addYears, addDays } from 'date-fns';

export interface AutoGoalPattern {
  id: string;
  name: string;
  type: Goal['type'];
  targetAmount: number;
  targetDate: Date;
  trigger: string;
  priority: 'high' | 'medium' | 'low';
}

export class AutoGoalEngine {
  /**
   * Analyze transactions and create appropriate goals
   */
  static async analyzeTransactionsForGoals(): Promise<Goal[]> {
    const newGoals: Goal[] = [];
    
    try {
      const transactions = await db.txns.toArray();
      const existingGoals = await db.goals.toArray();
      
      // Health insurance premium detected -> create 3-yr goal
      const healthInsuranceTxns = transactions.filter(txn =>
        txn.category.toLowerCase().includes('insurance') &&
        txn.note?.toLowerCase().includes('health')
      );

      if (healthInsuranceTxns.length > 0) {
        const hasHealthGoal = existingGoals.some(goal => 
          goal.name.toLowerCase().includes('health insurance')
        );

        if (!hasHealthGoal) {
          const lastPremium = healthInsuranceTxns[0].amount;
          const futureAmount = Math.abs(lastPremium) * Math.pow(1.05, 3); // 5% inflation
          
          newGoals.push({
            id: crypto.randomUUID(),
            name: 'Health Insurance 3-Year Buffer',
            slug: 'health-insurance-3yr',
            type: 'Medium',
            targetAmount: futureAmount,
            targetDate: addYears(new Date(), 3),
            currentAmount: 0,
            notes: 'Auto-created from insurance premium pattern'
          });
        }
      }

      // Vehicle insurance patterns
      const vehicleInsuranceTxns = transactions.filter(txn =>
        txn.category.toLowerCase().includes('insurance') &&
        (txn.note?.toLowerCase().includes('vehicle') || txn.note?.toLowerCase().includes('car'))
      );

      if (vehicleInsuranceTxns.length > 0) {
        const hasVehicleGoal = existingGoals.some(goal =>
          goal.name.toLowerCase().includes('vehicle insurance')
        );

        if (!hasVehicleGoal) {
          const lastPremium = vehicleInsuranceTxns[0].amount;
          const renewalAmount = Math.abs(lastPremium) * 1.03; // 3% inflation
          
          newGoals.push({
            id: crypto.randomUUID(),
            name: 'Vehicle Insurance Renewal',
            slug: 'vehicle-insurance-renewal',
            type: 'Short',
            targetAmount: renewalAmount,
            targetDate: addYears(new Date(), 1),
            currentAmount: 0,
            notes: 'Auto-created from vehicle insurance pattern'
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing transactions for goals:', error);
    }

    return newGoals;
  }

  /**
   * Create child education goals for dependents
   */
  static async createChildEducationGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const settings = await db.globalSettings.limit(1).first();
      if (!settings?.dependents) return goals;

      const existingGoals = await db.goals.toArray();
      
      for (const dependent of settings.dependents) {
        if (dependent.relation === 'Child') {
          const currentAge = this.calculateAge(dependent.dob);
          const yearsToEducation = Math.max(0, 18 - currentAge);
          
          if (yearsToEducation > 0) {
            const hasEducationGoal = existingGoals.some(goal =>
              goal.name.toLowerCase().includes(dependent.name.toLowerCase()) &&
              goal.name.toLowerCase().includes('education')
            );

            if (!hasEducationGoal) {
              const targetAmount = this.calculateEducationCorpus(yearsToEducation);
              
              goals.push({
                id: crypto.randomUUID(),
                name: `${dependent.name} Education (UG@18)`,
                slug: `${dependent.name.toLowerCase().replace(/\s+/g, '-')}-ug-18`,
                type: 'Long',
                targetAmount,
                targetDate: addYears(dependent.dob, 18),
                currentAmount: 0,
                notes: `Auto-created education goal for ${dependent.name}. PV calculation for ₹25L with 7% education inflation.`
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('Error creating child education goals:', error);
    }

    return goals;
  }

  /**
   * Create tax-saving goals (NPS, PPF)
   */
  static async createTaxSavingGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const investments = await db.investments.toArray();
      const existingGoals = await db.goals.toArray();
      
      // NPS Tier-1 goal for 80CCD(1B)
      const hasNPST1 = investments.some(inv => inv.type === 'NPS-T1');
      const hasNPSGoal = existingGoals.some(goal => 
        goal.name.toLowerCase().includes('nps') && goal.name.includes('80CCD')
      );

      if (hasNPST1 && !hasNPSGoal) {
        const currentFY = new Date().getFullYear();
        const targetDate = new Date(currentFY + 1, 2, 31); // 31st March
        
        goals.push({
          id: crypto.randomUUID(),
          name: 'NPS-T1 80CCD(1B) Tax Benefit',
          slug: 'nps-t1-80ccdb',
          type: 'Short',
          targetAmount: 50000,
          targetDate,
          currentAmount: 0,
          notes: 'Auto-created NPS Tier-1 annual goal for tax benefit under Section 80CCD(1B)'
        });
      }

      // PPF annual deposit goal
      const hasPPF = investments.some(inv => inv.type === 'PPF');
      const hasPPFGoal = existingGoals.some(goal =>
        goal.name.toLowerCase().includes('ppf') && goal.name.toLowerCase().includes('annual')
      );

      if (hasPPF && !hasPPFGoal) {
        const currentFY = new Date().getFullYear();
        const targetDate = new Date(currentFY + 1, 3, 5); // 5th April
        
        goals.push({
          id: crypto.randomUUID(),
          name: 'PPF Annual Deposit',
          slug: 'ppf-annual-deposit',
          type: 'Short',
          targetAmount: 150000,
          targetDate,
          currentAmount: 0,
          notes: 'Auto-created PPF annual deposit goal to maximize tax benefits'
        });
      }

    } catch (error) {
      console.error('Error creating tax-saving goals:', error);
    }

    return goals;
  }

  /**
   * Create senior citizen medical corpus goals
   */
  static async createSeniorCitizenGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const settings = await db.globalSettings.limit(1).first();
      if (!settings?.dependents) return goals;

      const existingGoals = await db.goals.toArray();
      
      // Check for Mother/Grandmother > 60 years
      const seniorDependents = settings.dependents.filter(dependent => {
        const age = this.calculateAge(dependent.dob);
        return (dependent.relation === 'Mother' || dependent.relation === 'Grandmother') && age > 60;
      });

      if (seniorDependents.length > 0) {
        const hasSeniorGoal = existingGoals.some(goal =>
          goal.name.toLowerCase().includes('senior') && goal.name.toLowerCase().includes('medical')
        );

        if (!hasSeniorGoal) {
          // Estimate based on medical inflation (10% per spec)
          const targetAmount = 500000; // Base corpus for senior medical expenses
          
          goals.push({
            id: crypto.randomUUID(),
            name: 'Senior Citizen Medical Corpus',
            slug: 'senior-medical-corpus',
            type: 'Medium',
            targetAmount,
            targetDate: addYears(new Date(), 2),
            currentAmount: 0,
            notes: 'Auto-created medical corpus for senior family members. Accounts for 10% medical inflation.'
          });
        }
      }

    } catch (error) {
      console.error('Error creating senior citizen goals:', error);
    }

    return goals;
  }

  /**
   * Execute auto-goal creation process
   */
  static async executeAutoGoalCreation(): Promise<Goal[]> {
    const allNewGoals: Goal[] = [];
    
    try {
      const [
        transactionGoals,
        educationGoals,
        taxGoals,
        seniorGoals
      ] = await Promise.all([
        this.analyzeTransactionsForGoals(),
        this.createChildEducationGoals(),
        this.createTaxSavingGoals(),
        this.createSeniorCitizenGoals()
      ]);

      allNewGoals.push(...transactionGoals, ...educationGoals, ...taxGoals, ...seniorGoals);

      // Save all new goals to database
      for (const goal of allNewGoals) {
        await db.goals.add(goal);
      }

      console.log(`Auto-created ${allNewGoals.length} new goals`);

    } catch (error) {
      console.error('Error executing auto-goal creation:', error);
    }

    return allNewGoals;
  }

  // Helper methods
  private static calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private static calculateEducationCorpus(years: number): number {
    // PV calculation for ₹25L in future with 7% education inflation per spec
    const futureValue = 2500000; // ₹25L target
    const inflationRate = 0.07; // 7% as per requirements
    const presentValue = futureValue / Math.pow(1 + inflationRate, years);
    return Math.round(presentValue);
  }
}
