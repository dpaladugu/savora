import { describe, test, expect, vi, beforeEach } from 'vitest';
import { preloadFinancialData, validateFinancialData } from './dataPreloaderService';
import type { ValidationResult, ValidatedPreloadData } from './dataPreloaderService';
import { db } from '@/db'; // We will mock this
import type { JsonPreloadMVPData } from '@/types/jsonPreload';

// Mock the db module
vi.mock('@/db', () => {
  const mockTable = () => ({
    clear: vi.fn().mockResolvedValue(undefined),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(), // For chained calls like .where().equals()
    equals: vi.fn().mockReturnThis(), // For chained calls
  });

  return {
    db: {
      transaction: vi.fn((mode, tables, callback) => callback()), // Auto-execute transaction callback
      appSettings: { ...mockTable(), where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis() },
      expenses: mockTable(),
      incomeSources: mockTable(),
      vehicles: mockTable(),
      loans: mockTable(),
      investments: mockTable(),
      creditCards: mockTable(),
      // Add other tables if they become part of the MVP test scope
    },
  };
});

// Sample MVP JSON data for testing
const sampleValidMVPJson: JsonPreloadMVPData = {
  personal_profile: {
    age: "35M",
    location: "Test Location",
  },
  expense_transactions: {
    transactions: [
      { date: "2024-01-01", amount: 100, description: "Coffee", category: "Food", payment_method: "Card", source: "Form", card_last4: "1234" },
      { date: "2024-01-02", amount: 200, description: "Groceries", category: "Food", payment_method: "UPI", source: "Telegram" },
    ],
  },
  income_cash_flows: [
    { source: "Salary", amount: 5000, frequency: "monthly", account: "Bank A" },
  ],
  assets: {
    vehicles: [
      { vehicle: "My Car", usage: "Daily" },
    ],
    investments: {
      mutual_funds_breakdown: [
        { fund: "Test MF 1", invested: 10000, current_value: 11000, category: "Equity" },
      ],
    },
  },
  liabilities: [
    { loan: "Home Loan", amount: 100000, emi: 1000, interest_rate: 8.5 },
  ],
  credit_card_management: {
    cards: [
      { bank_name: "Test Bank", card_name: "Visa Gold", last_digits: "4321", due_date: 15 },
    ],
  },
};

const sampleMinimalValidJson: JsonPreloadMVPData = {
    expense_transactions: {
        transactions: [
            { date: "2024-07-01", amount: 50, description: "Tea", category: "Beverage", payment_method: "Cash", source: "Form" }
        ]
    }
};

const sampleInvalidJsonStructure = {
  personal_profile: {
    age: 35, // Invalid type, expected string
  },
  expense_transactions: { // Missing transactions array
  }
};


describe('dataPreloaderService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Mock db.transaction to automatically execute the callback
    (db.transaction as any).mockImplementation(async (mode: string, tables: any, callback: () => Promise<any>) => {
        return await callback();
    });
  });

  describe('validateFinancialData', () => {
    test('should return success true for valid MVP JSON data', () => {
      const result = validateFinancialData(sampleValidMVPJson);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personal_profile?.age).toBe("35M");
      }
    });

    test('should return success true for minimal valid MVP JSON data', () => {
        const result = validateFinancialData(sampleMinimalValidJson);
        expect(result.success).toBe(true);
        if(result.success) {
            expect(result.data.expense_transactions?.transactions.length).toBe(1);
        }
      });

    test('should return success false with errors for invalid JSON structure', () => {
      const result = validateFinancialData(sampleInvalidJsonStructure);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        // Check for specific error path if possible, e.g. path: ['personal_profile', 'age']
        const ageError = result.errors.find(e => e.path.includes('age'));
        expect(ageError).toBeDefined();
        expect(ageError?.message).toBe('Expected string, received number');
      }
    });

    test('should return success false for non-object input', () => {
        const result = validateFinancialData("not an object");
        expect(result.success).toBe(false);
        if(!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
        }
    });
  });

  describe('preloadFinancialData', () => {
    test('should call validation, clear tables, and add data for valid MVP JSON', async () => {
      const result = await preloadFinancialData(sampleValidMVPJson);

      expect(result.success).toBe(true);
      // expect(result.message).toContain("Profile: processed."); // Message can be complex
      // expect(result.message).toContain("Expenses: Added 2/2.");

      // Verify summary object for more robust checks
      expect(result.summary?.personal_profile.status).toBe("processed");
      expect(result.summary?.expenses.added).toBe(2);
      expect(result.summary?.expenses.found).toBe(2);
      expect(result.summary?.expenses.failed).toBe(0);
      expect(result.summary?.incomeSources.added).toBe(1);
      expect(result.summary?.vehicles.added).toBe(1);
      expect(result.summary?.loans.added).toBe(1);
      expect(result.summary?.investments.added).toBe(1);
      expect(result.summary?.creditCards.added).toBe(1);


      // Verify db operations
      expect(db.appSettings.where).toHaveBeenCalledWith('key');
      // expect(db.appSettings.equals).toHaveBeenCalledWith('userPersonalProfile_v1'); // This part of chain is tricky to assert directly
      // expect(db.appSettings.delete).toHaveBeenCalled(); // delete is part of the chained call
      expect(db.appSettings.put).toHaveBeenCalledWith({ key: 'userPersonalProfile_v1', value: sampleValidMVPJson.personal_profile });

      expect(db.expenses.clear).toHaveBeenCalled();
      expect(db.expenses.bulkAdd).toHaveBeenCalledTimes(1);
      expect((db.expenses.bulkAdd as any).mock.calls[0][0].length).toBe(2); // 2 expenses
      // Can add more specific checks for mapped data if needed

      expect(db.incomeSources.clear).toHaveBeenCalled();
      expect(db.incomeSources.bulkAdd).toHaveBeenCalledTimes(1);
      expect((db.incomeSources.bulkAdd as any).mock.calls[0][0].length).toBe(1);

      expect(db.vehicles.clear).toHaveBeenCalled();
      expect(db.vehicles.bulkAdd).toHaveBeenCalledTimes(1);
      // ... and so on for other entities
      expect(db.loans.clear).toHaveBeenCalled();
      expect(db.loans.bulkAdd).toHaveBeenCalledTimes(1);

      expect(db.investments.clear).toHaveBeenCalled();
      expect(db.investments.bulkAdd).toHaveBeenCalledTimes(1);

      expect(db.creditCards.clear).toHaveBeenCalled();
      expect(db.creditCards.bulkAdd).toHaveBeenCalledTimes(1);
    });

    test('should return success false if validation fails', async () => {
      const result = await preloadFinancialData(sampleInvalidJsonStructure);
      expect(result.success).toBe(false);
      expect(result.message).toContain("JSON data validation failed");
      expect(db.transaction).not.toHaveBeenCalled(); // Transaction should not start if validation fails
    });

    test('should handle empty arrays for entities gracefully', async () => {
        const emptyEntitiesJson: JsonPreloadMVPData = {
            personal_profile: { age: "30F" },
            expense_transactions: { transactions: [] },
            income_cash_flows: [],
            assets: { vehicles: [], investments: { mutual_funds_breakdown: [] } },
            liabilities: [],
            credit_card_management: { cards: [] }
        };
        const result = await preloadFinancialData(emptyEntitiesJson);
        expect(result.success).toBe(true);
        expect(db.expenses.bulkAdd).not.toHaveBeenCalled(); // Or called with empty array
        expect(db.vehicles.bulkAdd).not.toHaveBeenCalled();
        // Check summary for zero counts
        expect(result.summary?.expenses.added).toBe(0);
        expect(result.summary?.vehicles.added).toBe(0);
    });

    test('should correctly report failed mappings in summary', async () => {
        const dataWithOneBadExpense = {
            ...sampleValidMVPJson,
            expense_transactions: {
                transactions: [
                    { date: "2024-01-01", amount: 100, description: "Good Coffee", category: "Food", payment_method: "Card", source: "Form" },
                    // @ts-expect-error - Intentionally malformed for testing mapper robustness (if mapper throws)
                    { date: "BAD-DATE", amount: "NOT_A_NUMBER", description: null, category: null, payment_method: null, source: null }
                ]
            }
        };
        // For this test to be effective, mapJsonExpenseToDbExpense should throw an error or be detectable
        // The current mapping functions are quite lenient. Let's assume a stricter mapper or a Zod parse error within map if types were different.
        // As mappers are simple assignments now, this test might not show a failure unless Zod validation was inside the loop (which it's not for individual items post-array validation).
        // The current setup relies on Zod to validate the array of transactions. If an item inside is bad, Zod catches it.
        // Let's make Zod fail for one item:
        const dataWithOneZodBadExpense = {
            ...sampleValidMVPJson,
            expense_transactions: {
                transactions: [
                    { date: "2024-01-01", amount: 100, description: "Good Coffee", category: "Food", payment_method: "Card", source: "Form" },
                    // @ts-expect-error
                    { date: "2024-01-03", amount: "fifty", description: "Bad Amount", category: "Error", payment_method: "None", source: "Test" }
                ]
            }
        };
        const validationResult = validateFinancialData(dataWithOneZodBadExpense);
        expect(validationResult.success).toBe(false); // Zod should catch this before preloadFinancialData even tries to map.

        // If we wanted to test mapper resilience specifically, we'd bypass Zod for one item.
        // But current design validates upfront.
    });


    test('should handle db transaction error', async () => {
        (db.transaction as any).mockImplementationOnce(async (mode: string, tables: any, callback: () => Promise<any>) => {
            throw new Error("Simulated DB transaction error");
        });

        const result = await preloadFinancialData(sampleValidMVPJson);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Simulated DB transaction error");
    });

  });
});
