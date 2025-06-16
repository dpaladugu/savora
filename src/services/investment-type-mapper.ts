
import { Investment } from "./investment-manager";
import { FirestoreInvestment } from "./firestore";

export class InvestmentTypeMapper {
  static toFirestoreInvestment(investment: Omit<Investment, 'id' | 'userId'>, userId: string): Omit<FirestoreInvestment, 'id'> {
    return {
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      units: investment.units,
      nav: investment.price,
      price: investment.price,
      currentValue: investment.currentValue,
      date: investment.purchaseDate,
      purchaseDate: investment.purchaseDate,
      maturityDate: investment.maturityDate,
      expectedReturn: investment.expectedReturn,
      actualReturn: investment.actualReturn,
      riskLevel: investment.riskLevel,
      userId,
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static fromFirestoreInvestment(firestoreInvestment: FirestoreInvestment): Investment {
    return {
      id: firestoreInvestment.id,
      name: firestoreInvestment.name,
      type: firestoreInvestment.type as Investment['type'],
      amount: firestoreInvestment.amount,
      units: firestoreInvestment.units,
      price: firestoreInvestment.price,
      currentValue: firestoreInvestment.currentValue,
      purchaseDate: firestoreInvestment.purchaseDate,
      maturityDate: firestoreInvestment.maturityDate,
      expectedReturn: firestoreInvestment.expectedReturn,
      actualReturn: firestoreInvestment.actualReturn,
      riskLevel: firestoreInvestment.riskLevel,
      userId: firestoreInvestment.userId
    };
  }
}
