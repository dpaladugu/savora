import { extendedDb } from '@/lib/db-schema-extended';
import { db } from '@/lib/db';
import type { Goal, Txn, Investment, Insurance, Dependent } from '@/lib/db';
import { addYears, addDays, addMonths } from 'date-fns';
import { createGoal } from '@/lib/goal-factory';

interface AutoGoalRule {
  trigger: string;
  goalName: string;
  targetAmount: number;
  targetDate: Date;
  type: Goal['type'];
  priority: 'high' | 'medium' | 'low';
  fundingSource: 'emergency' | 'surplus' | 'sip' | 'dedicated';
}

export class EnhancedAutoGoalEngine {
  static async executeAutoGoalCreation(): Promise<Goal[]> {
    const newGoals: Goal[] = [];
    try {
      const [
        insuranceGoals,
        vehicleGoals,
        childEducationGoals,
        seniorMedicalGoals,
        taxGoals,
        propertyGoals,
        familyGoals,
        festivalGoals
      ] = await Promise.all([
        this.createInsuranceRenewalGoals(),
        this.createVehicleMaintenanceGoals(),
        this.createChildEducationGoals(),
        this.createSeniorMedicalGoals(),
        this.createTaxSavingGoals(),
        this.createPropertyTaxGoals(),
        this.createFamilyMobilePackGoals(),
        this.createFestivalCorpusGoals()
      ]);

      newGoals.push(
        ...insuranceGoals, ...vehicleGoals, ...childEducationGoals,
        ...seniorMedicalGoals, ...taxGoals, ...propertyGoals,
        ...familyGoals, ...festivalGoals
      );

      for (const goal of newGoals) {
        await db.goals.add(goal);
      }

      return newGoals;
    } catch (error) {
      console.error('Error in auto-goal creation:', error);
      return [];
    }
  }

  private static async createInsuranceRenewalGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const insurancePolicies = await db.insurance.toArray();
      const existingGoals = await db.goals.toArray();

      for (const policy of insurancePolicies) {
        const goalName = `${policy.type}-Insurance-${policy.provider}`;
        const hasExisting = existingGoals.some(g =>
          g.name.includes(policy.type) && g.name.includes('Insurance')
        );
        if (!hasExisting) {
          const inflationRate = policy.type === 'Health' ? 1.05 : 1.03;
          const base = policy.type === 'Health' ? 25000 : 15000;
          const targetAmount = Math.round(base * Math.pow(inflationRate, 3));
          const targetDate = policy.endDate ? addYears(policy.endDate, -1) : addYears(new Date(), 1);
          goals.push(createGoal({
            name: `${goalName} 3-Year Buffer`,
            slug: `${goalName.toLowerCase().replace(/\s+/g, '-')}-3yr`,
            type: policy.type === 'Health' ? 'Medium' : 'Short',
            targetAmount,
            targetDate,
            notes: `Auto-created from ${policy.type} insurance premium pattern.`
          }));
        }
      }
    } catch (error) {
      console.error('Error creating insurance goals:', error);
    }
    return goals;
  }

  private static async createVehicleMaintenanceGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const vehicles = await db.vehicles.toArray();
      const existingGoals = await db.goals.toArray();

      for (const vehicle of vehicles) {
        const regNo = vehicle.regNo || vehicle.registrationNumber || vehicle.id;
        const hasInsuranceGoal = existingGoals.some(g =>
          g.name.includes(regNo) && g.name.includes('Insurance')
        );
        if (!hasInsuranceGoal) {
          goals.push(createGoal({
            name: `Vehicle-Insurance-${regNo}`,
            slug: `vehicle-insurance-${regNo.toLowerCase()}`,
            type: 'Short',
            targetAmount: Math.round(15000 * 1.03),
            targetDate: vehicle.insuranceExpiry ? addDays(vehicle.insuranceExpiry, -30) : addMonths(new Date(), 11),
            notes: `Auto-created vehicle insurance renewal goal for ${vehicle.make} ${vehicle.model}`
          }));
        }

        const odometer = vehicle.odometer || vehicle.odometerReading || 0;
        if (odometer >= 40000) {
          const hasTyreGoal = existingGoals.some(g =>
            g.name.includes(regNo) && g.name.includes('Tyre')
          );
          if (!hasTyreGoal) {
            goals.push(createGoal({
              name: `Tyre-Replacement-${regNo}`,
              slug: `tyre-replacement-${regNo.toLowerCase()}`,
              type: 'Short',
              targetAmount: Math.round(25000 * 1.05),
              targetDate: addMonths(new Date(), 6),
              notes: `Auto-created tyre replacement goal. Vehicle has ${odometer} km.`
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error creating vehicle goals:', error);
    }
    return goals;
  }

  private static async createChildEducationGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const settings = await db.globalSettings.limit(1).first();
      if (!settings?.dependents) return goals;
      const existingGoals = await db.goals.toArray();
      const educationInflation = settings.educationInflation || 7.0;

      for (const dependent of settings.dependents) {
        if (dependent.relation === 'Child') {
          const currentAge = this.calculateAge(dependent.dob);
          const yearsToEducation = Math.max(0, 18 - currentAge);
          if (yearsToEducation > 0) {
            const hasGoal = existingGoals.some(g =>
              g.name.includes(dependent.name) && g.name.includes('UG@18')
            );
            if (!hasGoal) {
              const futureValue = 2500000;
              const presentValue = futureValue / Math.pow(1 + educationInflation / 100, yearsToEducation);
              goals.push(createGoal({
                name: `${dependent.name}-UG@18`,
                slug: `${dependent.name.toLowerCase().replace(/\s+/g, '-')}-ug-18`,
                type: 'Long',
                targetAmount: Math.round(presentValue),
                targetDate: addYears(dependent.dob, 18),
                notes: `PV calculation for ₹25L with ${educationInflation}% inflation over ${yearsToEducation} years.`
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating child education goals:', error);
    }
    return goals;
  }

  private static async createSeniorMedicalGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const settings = await db.globalSettings.limit(1).first();
      if (!settings?.dependents) return goals;
      const existingGoals = await db.goals.toArray();
      const medicalInflation = settings.medicalInflationRate || 10.0;
      const seniors = settings.dependents.filter(d => {
        const age = this.calculateAge(d.dob);
        return (d.relation === 'Mother' || d.relation === 'Grandmother') && age > 60;
      });
      if (seniors.length > 0) {
        const hasSeniorGoal = existingGoals.some(g =>
          g.name.includes('Senior') && g.name.includes('Medical')
        );
        if (!hasSeniorGoal) {
          const inflatedCorpus = 500000 * Math.pow(1 + medicalInflation / 100, 2);
          goals.push(createGoal({
            name: 'Senior-Citizen Medical-Corpus',
            slug: 'senior-medical-corpus',
            type: 'Medium',
            targetAmount: Math.round(inflatedCorpus),
            targetDate: addYears(new Date(), 2),
            notes: `Medical corpus for ${seniors.length} senior family member(s).`
          }));
        }
      }
    } catch (error) {
      console.error('Error creating senior medical goals:', error);
    }
    return goals;
  }

  private static async createTaxSavingGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const investments = await db.investments.toArray();
      const existingGoals = await db.goals.toArray();
      const currentFY = new Date().getFullYear();

      const hasNPST1 = investments.some(inv => inv.type === 'NPS-T1');
      const hasNPSGoal = existingGoals.some(g => g.name.includes('NPS-T1') && g.name.includes('80CCD'));
      if (hasNPST1 && !hasNPSGoal) {
        goals.push(createGoal({
          name: 'NPS-T1 80CCD(1B)',
          slug: 'nps-t1-80ccdb',
          type: 'Short',
          targetAmount: 50000,
          targetDate: new Date(currentFY + 1, 2, 31),
          notes: '₹50k NPS Tier-1 annual goal for Section 80CCD(1B) tax benefit'
        }));
      }

      const hasPPF = investments.some(inv => inv.type === 'PPF');
      const hasPPFGoal = existingGoals.some(g => g.name.includes('PPF') && g.name.includes('Annual'));
      if (hasPPF && !hasPPFGoal) {
        goals.push(createGoal({
          name: 'PPF Annual',
          slug: 'ppf-annual-deposit',
          type: 'Short',
          targetAmount: 150000,
          targetDate: new Date(currentFY + 1, 3, 5),
          notes: 'Maximize ₹1.5L PPF annual deposit limit'
        }));
      }
    } catch (error) {
      console.error('Error creating tax saving goals:', error);
    }
    return goals;
  }

  private static async createPropertyTaxGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const properties = await extendedDb.rentalProperties.toArray();
      const existingGoals = await db.goals.toArray();

      for (const property of properties) {
        const addressKey = property.address.substring(0, 10);

        if (!existingGoals.some(g => g.name.includes('Property-Tax') && g.name.includes(addressKey)) &&
          property.propertyTaxAnnual > 0) {
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + 11);
          targetDate.setDate(property.propertyTaxDueDay);
          goals.push(createGoal({
            name: `Property-Tax-${property.address.substring(0, 20)}`,
            slug: `property-tax-${property.id}`,
            type: 'Short',
            targetAmount: Math.round(property.propertyTaxAnnual * 1.05),
            targetDate,
            notes: `Property tax goal for ${property.address}.`
          }));
        }

        if (!existingGoals.some(g => g.name.includes('Water-Tax') && g.name.includes(addressKey)) &&
          property.waterTaxAnnual > 0) {
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + 11);
          targetDate.setDate(property.waterTaxDueDay);
          goals.push(createGoal({
            name: `Water-Tax-${property.address.substring(0, 20)}`,
            slug: `water-tax-${property.id}`,
            type: 'Short',
            targetAmount: Math.round(property.waterTaxAnnual * 1.03),
            targetDate,
            notes: `Water tax goal for ${property.address}.`
          }));
        }
      }
    } catch (error) {
      console.error('Error creating property tax goals:', error);
    }
    return goals;
  }

  private static async createFamilyMobilePackGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const existingGoals = await db.goals.toArray();
      if (!existingGoals.some(g => g.name.includes('Family-Mobile-Pack'))) {
        const cheapest84DayPack = 599;
        goals.push(createGoal({
          name: 'Family-Mobile-Pack-All',
          slug: 'family-mobile-pack-all',
          type: 'Short',
          targetAmount: 7 * cheapest84DayPack,
          targetDate: addDays(new Date(), 77),
          notes: `Family mobile pack for 7 numbers. 84-day pack ₹${cheapest84DayPack}/number.`
        }));
      }
    } catch (error) {
      console.error('Error creating family mobile goals:', error);
    }
    return goals;
  }

  private static async createFestivalCorpusGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    try {
      const existingGoals = await db.goals.toArray();
      if (!existingGoals.some(g => g.name.includes('Festival-Corpus'))) {
        const transactions = await db.txns.toArray();
        const festivalCategories = ['Gifts', 'Celebration', 'Festival', 'Religious'];
        const festivalSpending = transactions
          .filter(txn => festivalCategories.some(cat =>
            txn.category.toLowerCase().includes(cat.toLowerCase()) ||
            txn.note?.toLowerCase().includes(cat.toLowerCase())
          ))
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

        const estimatedAnnual = Math.max(festivalSpending / 3, 50000);
        const targetDate = new Date();
        targetDate.setMonth(8, 30);

        goals.push(createGoal({
          name: 'Festival-Corpus',
          slug: 'festival-corpus',
          type: 'Short',
          targetAmount: Math.round(estimatedAnnual * 1.1),
          targetDate,
          notes: `Festival corpus. Estimated annual need: ₹${Math.round(estimatedAnnual).toLocaleString()}`
        }));
      }
    } catch (error) {
      console.error('Error creating festival corpus goals:', error);
    }
    return goals;
  }

  private static calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  static async executeFundingPriorityStack(surplusAmount: number): Promise<{
    allocations: Array<{ goalId: string; goalName: string; amount: number }>;
    remaining: number;
  }> {
    const allocations: Array<{ goalId: string; goalName: string; amount: number }> = [];
    let remaining = surplusAmount;

    try {
      const goals = await db.goals.toArray();
      const priorityOrder = ['Short', 'Medium', 'Long'];

      for (const type of priorityOrder) {
        const typeGoals = goals.filter(g => g.type === type && g.currentAmount < g.targetAmount);
        for (const goal of typeGoals) {
          if (remaining <= 0) break;
          const needed = goal.targetAmount - goal.currentAmount;
          const allocated = Math.min(needed, remaining);
          allocations.push({ goalId: goal.id, goalName: goal.name, amount: allocated });
          remaining -= allocated;
        }
        if (remaining <= 0) break;
      }
    } catch (error) {
      console.error('Error in funding priority stack:', error);
    }

    return { allocations, remaining };
  }
}
