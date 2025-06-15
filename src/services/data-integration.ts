
import { FirestoreService } from './firestore';

export interface InsuranceData {
  id: string;
  policyName: string;
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  type: 'life' | 'health' | 'vehicle' | 'home' | 'other';
  status: 'active' | 'expired' | 'cancelled';
}

export interface EMIData {
  id: string;
  loanType: string;
  emiAmount: number;
  status: 'active' | 'completed' | 'defaulted';
}

export interface RentalData {
  id: string;
  propertyName: string;
  monthlyRent: number;
  status: 'active' | 'vacant' | 'sold';
}

export class DataIntegrationService {
  static async getInsuranceData(userId: string): Promise<InsuranceData[]> {
    try {
      // For now, we'll simulate this data since the insurance module isn't fully integrated with Firestore
      // In a real implementation, this would fetch from a Firestore collection
      const mockInsurances: InsuranceData[] = [
        {
          id: '1',
          policyName: 'Term Life Insurance',
          premium: 25000,
          frequency: 'yearly',
          type: 'life',
          status: 'active'
        },
        {
          id: '2',
          policyName: 'Health Insurance',
          premium: 15000,
          frequency: 'yearly',
          type: 'health',
          status: 'active'
        },
        {
          id: '3',
          policyName: 'Car Insurance',
          premium: 8000,
          frequency: 'yearly',
          type: 'vehicle',
          status: 'active'
        }
      ];
      
      console.log(`Fetched ${mockInsurances.length} insurance policies for user ${userId}`);
      return mockInsurances;
    } catch (error) {
      console.error('Failed to fetch insurance data:', error);
      return [];
    }
  }

  static async getEMIData(userId: string): Promise<EMIData[]> {
    try {
      // For now, we'll simulate this data since the EMI module isn't fully integrated with Firestore
      const mockEMIs: EMIData[] = [
        {
          id: '1',
          loanType: 'Home Loan',
          emiAmount: 45000,
          status: 'active'
        },
        {
          id: '2',
          loanType: 'Car Loan',
          emiAmount: 18000,
          status: 'active'
        }
      ];
      
      console.log(`Fetched ${mockEMIs.length} EMIs for user ${userId}`);
      return mockEMIs;
    } catch (error) {
      console.error('Failed to fetch EMI data:', error);
      return [];
    }
  }

  static async getRentalData(userId: string): Promise<RentalData[]> {
    try {
      // For now, we'll simulate this data since the rental module isn't fully integrated with Firestore
      const mockRentals: RentalData[] = [
        {
          id: '1',
          propertyName: 'Downtown Apartment',
          monthlyRent: 25000,
          status: 'active'
        }
      ];
      
      console.log(`Fetched ${mockRentals.length} rental properties for user ${userId}`);
      return mockRentals;
    } catch (error) {
      console.error('Failed to fetch rental data:', error);
      return [];
    }
  }

  static calculateAnnualInsurancePremiums(insurances: InsuranceData[]): number {
    return insurances
      .filter(insurance => insurance.status === 'active')
      .reduce((total, insurance) => {
        let annualPremium = insurance.premium;
        
        switch (insurance.frequency) {
          case 'monthly':
            annualPremium = insurance.premium * 12;
            break;
          case 'quarterly':
            annualPremium = insurance.premium * 4;
            break;
          case 'yearly':
            annualPremium = insurance.premium;
            break;
        }
        
        return total + annualPremium;
      }, 0);
  }

  static calculateMonthlyEMIs(emis: EMIData[]): number {
    return emis
      .filter(emi => emi.status === 'active')
      .reduce((total, emi) => total + emi.emiAmount, 0);
  }

  static calculateMonthlyRentalIncome(rentals: RentalData[]): number {
    return rentals
      .filter(rental => rental.status === 'active')
      .reduce((total, rental) => total + rental.monthlyRent, 0);
  }
}
