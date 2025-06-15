
// Mock Firestore service for development
export class FirestoreService {
  static async getExpenses(userId: string) {
    // Mock data for development
    return [
      {
        id: '1',
        amount: 2500,
        description: 'Grocery Shopping',
        category: 'Food',
        date: '2024-01-15',
        userId
      },
      {
        id: '2',
        amount: 800,
        description: 'Gas Station',
        category: 'Transport',
        date: '2024-01-14',
        userId
      }
    ];
  }

  static async getInvestments(userId: string) {
    // Mock data for development
    return [
      {
        id: '1',
        amount: 50000,
        type: 'SIP',
        name: 'Large Cap Fund',
        date: '2024-01-01',
        userId
      },
      {
        id: '2',
        amount: 25000,
        type: 'Lumpsum',
        name: 'Mid Cap Fund',
        date: '2024-01-10',
        userId
      }
    ];
  }
}
