
// Mock data integration service
export class DataIntegrationService {
  static async getInsuranceData(userId: string) {
    return [
      {
        id: '1',
        type: 'Health',
        premium: 25000,
        coverage: 500000,
        userId
      }
    ];
  }

  static async getEMIData(userId: string) {
    return [
      {
        id: '1',
        type: 'Home Loan',
        monthlyEMI: 35000,
        remainingAmount: 2500000,
        userId
      }
    ];
  }

  static async getRentalData(userId: string) {
    return [
      {
        id: '1',
        monthlyRent: 15000,
        property: 'Apartment',
        userId
      }
    ];
  }

  static calculateAnnualInsurancePremiums(insurances: any[]) {
    return insurances.reduce((sum, insurance) => sum + insurance.premium, 0);
  }

  static calculateMonthlyEMIs(emis: any[]) {
    return emis.reduce((sum, emi) => sum + emi.monthlyEMI, 0);
  }

  static calculateMonthlyRentalIncome(rentals: any[]) {
    return rentals.reduce((sum, rental) => sum + rental.monthlyRent, 0);
  }
}
