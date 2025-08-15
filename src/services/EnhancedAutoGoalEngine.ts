import { extendedDb } from '@/lib/db-schema-extended';
import { db } from '@/lib/db';
import type { Goal, Txn, Investment, Insurance, Dependent } from '@/lib/db';
import { addYears, addDays, addMonths } from 'date-fns';

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
  /**
   * Execute comprehensive auto-goal creation per Section 24.1
   */
  static async executeAutoGoalCreation(): Promise<Goal[]> {
    const newGoals: Goal[] = [];
    
    try {
      console.log('Starting auto-goal creation engine...');
      
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
        ...insuranceGoals,
        ...vehicleGoals,
        ...childEducationGoals,
        ...seniorMedicalGoals,
        ...taxGoals,
        ...propertyGoals,
        ...familyGoals,
        ...festivalGoals
      );

      // Save all new goals
      for (const goal of newGoals) {
        await db.goals.add(goal);
        console.log(`Auto-created goal: ${goal.name}`);
      }

      console.log(`Auto-goal engine completed. Created ${newGoals.length} goals.`);
      return newGoals;

    } catch (error) {
      console.error('Error in auto-goal creation:', error);
      return [];
    }
  }

  /**
   * Health & Term Insurance Renewal Goals
   */
  private static async createInsuranceRenewalGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const insurancePolicies = await db.insurance.toArray();
      const existingGoals = await db.goals.toArray();

      for (const policy of insurancePolicies) {
        const goalName = `${policy.type}-Insurance-${policy.provider}`;
        const hasExistingGoal = existingGoals.some(goal => 
          goal.name.includes(policy.type) && goal.name.includes('Insurance')
        );

        if (!hasExistingGoal) {
          const inflationRate = policy.type === 'Health' ? 1.05 : 1.03; // 5% health, 3% term
          // Use estimated premium since the Insurance interface doesn't have premium field
          const estimatedPremium = policy.type === 'Health' ? 25000 : 15000;
          const targetAmount = estimatedPremium * Math.pow(inflationRate, 3);
          const targetDate = addYears(policy.endDate, -1); // 1 year before expiry

          goals.push({
            id: crypto.randomUUID(),
            name: `${goalName} 3-Year Buffer`,
            slug: `${goalName.toLowerCase().replace(/\s+/g, '-')}-3yr`,
            type: policy.type === 'Health' ? 'Medium' : 'Short',
            targetAmount: Math.round(targetAmount),
            targetDate,
            currentAmount: 0,
            notes: `Auto-created from ${policy.type} insurance premium pattern. Accounts for ${policy.type === 'Health' ? '5%' : '3%'} annual inflation.`
          });
        }
      }
    } catch (error) {
      console.error('Error creating insurance renewal goals:', error);
    }

    return goals;
  }

  /**
   * Vehicle Maintenance & Insurance Goals
   */
  private static async createVehicleMaintenanceGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const vehicles = await db.vehicles.toArray();
      const existingGoals = await db.goals.toArray();

      for (const vehicle of vehicles) {
        // Vehicle insurance goal
        const insuranceGoalName = `Vehicle-Insurance-${vehicle.regNo}`;
        const hasInsuranceGoal = existingGoals.some(goal => 
          goal.name.includes(vehicle.regNo) && goal.name.includes('Insurance')
        );

        if (!hasInsuranceGoal) {
          const estimatedPremium = 15000; // Base estimate
          goals.push({
            id: crypto.randomUUID(),
            name: insuranceGoalName,
            slug: `vehicle-insurance-${vehicle.regNo.toLowerCase()}`,
            type: 'Short',
            targetAmount: Math.round(estimatedPremium * 1.03),
            targetDate: addDays(vehicle.insuranceExpiry, -30),
            currentAmount: 0,
            notes: `Auto-created vehicle insurance renewal goal for ${vehicle.make} ${vehicle.model}`
          });
        }

        // Tyre replacement goal (if odometer >= 40,000 km)
        if (vehicle.odometer >= 40000) {
          const tyreGoalName = `Tyre-Replacement-${vehicle.regNo}`;
          const hasTyreGoal = existingGoals.some(goal => 
            goal.name.includes(vehicle.regNo) && goal.name.includes('Tyre')
          );

          if (!hasTyreGoal) {
            const estimatedTyreCost = 25000; // Base estimate for set of 4 tyres
            goals.push({
              id: crypto.randomUUID(),
              name: tyreGoalName,
              slug: `tyre-replacement-${vehicle.regNo.toLowerCase()}`,
              type: 'Short',
              targetAmount: Math.round(estimatedTyreCost * 1.05),
              targetDate: addMonths(new Date(), 6),
              currentAmount: 0,
              notes: `Auto-created tyre replacement goal. Vehicle has ${vehicle.odometer} km.`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error creating vehicle goals:', error);
    }

    return goals;
  }

  /**
   * Child Education Goals (Kid-UG@18)
   */
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
            const goalName = `${dependent.name}-UG@18`;
            const hasEducationGoal = existingGoals.some(goal =>
              goal.name.includes(dependent.name) && goal.name.includes('UG@18')
            );

            if (!hasEducationGoal) {
              // PV calculation for ₹25L with education inflation
              const futureValue = 2500000; // ₹25L target
              const presentValue = futureValue / Math.pow(1 + (educationInflation / 100), yearsToEducation);
              
              goals.push({
                id: crypto.randomUUID(),
                name: goalName,
                slug: `${dependent.name.toLowerCase().replace(/\s+/g, '-')}-ug-18`,
                type: 'Long',
                targetAmount: Math.round(presentValue),
                targetDate: addYears(dependent.dob, 18),
                currentAmount: 0,
                notes: `Auto-created child education goal. PV calculation for ₹25L with ${educationInflation}% education inflation over ${yearsToEducation} years.`
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
   * Senior Citizen Medical Corpus (Mother & Grandmother > 60)
   */
  private static async createSeniorMedicalGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const settings = await db.globalSettings.limit(1).first();
      if (!settings?.dependents) return goals;

      const existingGoals = await db.goals.toArray();
      const medicalInflation = settings.medicalInflationRate || 10.0;

      const seniorDependents = settings.dependents.filter(dependent => {
        const age = this.calculateAge(dependent.dob);
        return (dependent.relation === 'Mother' || dependent.relation === 'Grandmother') && age > 60;
      });

      if (seniorDependents.length > 0) {
        const hasSeniorGoal = existingGoals.some(goal =>
          goal.name.includes('Senior') && goal.name.includes('Medical')
        );

        if (!hasSeniorGoal) {
          // Base medical corpus accounting for 10% medical inflation
          const baseCorpus = 500000;
          const inflatedCorpus = baseCorpus * Math.pow(1 + (medicalInflation / 100), 2);
          
          goals.push({
            id: crypto.randomUUID(),
            name: 'Senior-Citizen Medical-Corpus',
            slug: 'senior-medical-corpus',
            type: 'Medium',
            targetAmount: Math.round(inflatedCorpus),
            targetDate: addYears(new Date(), 2),
            currentAmount: 0,
            notes: `Auto-created medical corpus for ${seniorDependents.length} senior family member(s). Accounts for ${medicalInflation}% medical inflation.`
          });
        }
      }
    } catch (error) {
      console.error('Error creating senior medical goals:', error);
    }

    return goals;
  }

  /**
   * Tax Saving Goals (NPS-T1, PPF)
   */
  private static async createTaxSavingGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const investments = await db.investments.toArray();
      const existingGoals = await db.goals.toArray();
      
      // NPS Tier-1 80CCD(1B) goal
      const hasNPST1 = investments.some(inv => inv.type === 'NPS-T1');
      const hasNPSGoal = existingGoals.some(goal => 
        goal.name.includes('NPS-T1') && goal.name.includes('80CCD')
      );

      if (hasNPST1 && !hasNPSGoal) {
        const currentFY = new Date().getFullYear();
        const targetDate = new Date(currentFY + 1, 2, 31); // 31st March
        
        goals.push({
          id: crypto.randomUUID(),
          name: 'NPS-T1 80CCD(1B)',
          slug: 'nps-t1-80ccdb',
          type: 'Short',
          targetAmount: 50000,
          targetDate,
          currentAmount: 0,
          notes: 'Auto-created NPS Tier-1 annual goal for ₹50k tax benefit under Section 80CCD(1B)'
        });
      }

      // PPF Annual deposit goal
      const hasPPF = investments.some(inv => inv.type === 'PPF');
      const hasPPFGoal = existingGoals.some(goal =>
        goal.name.includes('PPF') && goal.name.includes('Annual')
      );

      if (hasPPF && !hasPPFGoal) {
        const currentFY = new Date().getFullYear();
        const targetDate = new Date(currentFY + 1, 3, 5); // 5th April
        
        goals.push({
          id: crypto.randomUUID(),
          name: 'PPF Annual',
          slug: 'ppf-annual-deposit',
          type: 'Short',
          targetAmount: 150000,
          targetDate,
          currentAmount: 0,
          notes: 'Auto-created PPF annual deposit goal to maximize ₹1.5L limit'
        });
      }
    } catch (error) {
      console.error('Error creating tax saving goals:', error);
    }

    return goals;
  }

  /**
   * Property Tax Goals
   */
  private static async createPropertyTaxGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const properties = await extendedDb.rentalProperties.toArray();
      const existingGoals = await db.goals.toArray();

      for (const property of properties) {
        // Property tax goal
        const propertyTaxGoalName = `Property-Tax-${property.address.substring(0, 20)}`;
        const hasPropertyTaxGoal = existingGoals.some(goal =>
          goal.name.includes('Property-Tax') && goal.name.includes(property.address.substring(0, 10))
        );

        if (!hasPropertyTaxGoal && property.propertyTaxAnnual > 0) {
          const targetAmount = Math.round(property.propertyTaxAnnual * 1.05);
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + 12 - 1); // 1 month before due
          targetDate.setDate(property.propertyTaxDueDay);

          goals.push({
            id: crypto.randomUUID(),
            name: propertyTaxGoalName,
            slug: `property-tax-${property.id}`,
            type: 'Short',
            targetAmount,
            targetDate,
            currentAmount: 0,
            notes: `Auto-created property tax goal for ${property.address}. Due on ${property.propertyTaxDueDay}th of each year.`
          });
        }

        // Water tax goal
        const waterTaxGoalName = `Water-Tax-${property.address.substring(0, 20)}`;
        const hasWaterTaxGoal = existingGoals.some(goal =>
          goal.name.includes('Water-Tax') && goal.name.includes(property.address.substring(0, 10))
        );

        if (!hasWaterTaxGoal && property.waterTaxAnnual > 0) {
          const targetAmount = Math.round(property.waterTaxAnnual * 1.03);
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + 12 - 1);
          targetDate.setDate(property.waterTaxDueDay);

          goals.push({
            id: crypto.randomUUID(),
            name: waterTaxGoalName,
            slug: `water-tax-${property.id}`,
            type: 'Short',
            targetAmount,
            targetDate,
            currentAmount: 0,
            notes: `Auto-created water tax goal for ${property.address}. Due on ${property.waterTaxDueDay}th of each year.`
          });
        }
      }
    } catch (error) {
      console.error('Error creating property tax goals:', error);
    }

    return goals;
  }

  /**
   * Family Mobile Pack Goal (7 numbers)
   */
  private static async createFamilyMobilePackGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const existingGoals = await db.goals.toArray();
      const hasFamilyMobileGoal = existingGoals.some(goal =>
        goal.name.includes('Family-Mobile-Pack')
      );

      if (!hasFamilyMobileGoal) {
        const cheapest84DayPack = 599; // Assumed base pack cost
        const totalCost = 7 * cheapest84DayPack; // 7 family members
        const targetDate = addDays(new Date(), 84 - 7); // 7 days before due

        goals.push({
          id: crypto.randomUUID(),
          name: 'Family-Mobile-Pack-All',
          slug: 'family-mobile-pack-all',
          type: 'Short',
          targetAmount: totalCost,
          targetDate,
          currentAmount: 0,
          notes: `Auto-created family mobile pack goal for 7 numbers. 84-day pack cost estimated at ₹${cheapest84DayPack} per number.`
        });
      }
    } catch (error) {
      console.error('Error creating family mobile goals:', error);
    }

    return goals;
  }

  /**
   * Festival Corpus Goal
   */
  private static async createFestivalCorpusGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    try {
      const existingGoals = await db.goals.toArray();
      const hasFestivalGoal = existingGoals.some(goal =>
        goal.name.includes('Festival-Corpus')
      );

      if (!hasFestivalGoal) {
        // Analyze last 3 years of festival spending from transactions
        const transactions = await db.txns.toArray();
        const festivalCategories = ['Gifts', 'Celebration', 'Festival', 'Religious'];
        
        const festivalSpending = transactions
          .filter(txn => 
            festivalCategories.some(cat => 
              txn.category.toLowerCase().includes(cat.toLowerCase()) ||
              txn.note?.toLowerCase().includes(cat.toLowerCase())
            )
          )
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

        const estimatedAnnualFestivalSpend = Math.max(festivalSpending / 3, 50000); // Minimum ₹50k
        const targetDate = new Date();
        targetDate.setMonth(8, 30); // 30th September

        goals.push({
          id: crypto.randomUUID(),
          name: 'Festival-Corpus',
          slug: 'festival-corpus',
          type: 'Short',
          targetAmount: Math.round(estimatedAnnualFestivalSpend * 1.1), // 10% buffer
          targetDate,
          currentAmount: 0,
          notes: `Auto-created festival corpus based on historical spending patterns. Estimated annual need: ₹${Math.round(estimatedAnnualFestivalSpend).toLocaleString()}`
        });
      }
    } catch (error) {
      console.error('Error creating festival corpus goals:', error);
    }

    return goals;
  }

  /**
   * Helper method to calculate age
   */
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

  /**
   * Execute funding priority stack per Section 24.2
   */
  static async executeFundingPriorityStack(surplusAmount: number): Promise<{
    allocations: Array<{ goalId: string; goalName: string; amount: number }>;
    remainingSurplus: number;
  }> {
    try {
      const goals = await db.goals.toArray();
      const emergencyFunds = await db.emergencyFunds.toArray();
      const allocations: Array<{ goalId: string; goalName: string; amount: number }> = [];
      let remainingSurplus = surplusAmount;

      // Priority 1: Emergency Fund (12 months)
      const totalEmergencyFund = emergencyFunds.reduce((sum, fund) => sum + fund.currentAmount, 0);
      const emergencyTarget = emergencyFunds.reduce((sum, fund) => sum + fund.targetAmount, 0);
      
      if (totalEmergencyFund < emergencyTarget && remainingSurplus > 5000) {
        const emergencyNeed = Math.min(emergencyTarget - totalEmergencyFund, remainingSurplus * 0.6);
        if (emergencyNeed > 0) {
          allocations.push({
            goalId: 'emergency-fund',
            goalName: 'Emergency Fund',
            amount: emergencyNeed
          });
          remainingSurplus -= emergencyNeed;
        }
      }

      // Priority 2: Insurance & statutory dues
      const insuranceGoals = goals.filter(goal => 
        goal.name.includes('Insurance') || goal.name.includes('Tax')
      ).sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

      for (const goal of insuranceGoals) {
        if (remainingSurplus <= 0) break;
        const needed = goal.targetAmount - goal.currentAmount;
        if (needed > 0) {
          const allocation = Math.min(needed, remainingSurplus * 0.3);
          allocations.push({
            goalId: goal.id!,
            goalName: goal.name,
            amount: allocation
          });
          remainingSurplus -= allocation;
        }
      }

      // Priority 3: Kid-UG & Retirement (equity-heavy buckets)
      const longTermGoals = goals.filter(goal => 
        goal.type === 'Long' && (goal.name.includes('UG@18') || goal.name.includes('Retirement'))
      );

      for (const goal of longTermGoals) {
        if (remainingSurplus <= 2000) break;
        const needed = goal.targetAmount - goal.currentAmount;
        if (needed > 0) {
          const allocation = Math.min(needed, remainingSurplus * 0.4);
          allocations.push({
            goalId: goal.id!,
            goalName: goal.name,
            amount: allocation
          });
          remainingSurplus -= allocation;
        }
      }

      return { allocations, remainingSurplus };

    } catch (error) {
      console.error('Error executing funding priority stack:', error);
      return { allocations: [], remainingSurplus: surplusAmount };
    }
  }
}
