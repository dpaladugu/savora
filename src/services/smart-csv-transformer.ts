
import { Logger } from "./logger";

export interface TransformationRule {
  sourceColumn: string;
  targetField: string;
  transformer?: (value: string) => any;
  validator?: (value: any) => boolean;
  defaultValue?: any;
}

export class SmartCSVTransformer {
  static transformExpenseData(data: any[], columnMapping: Record<string, string>) {
    return data.map((row, index) => {
      try {
        const transformed = {
          description: row[columnMapping['Notes']] || row[columnMapping['Description']] || 'Unknown Transaction',
          amount: this.parseAmount(row[columnMapping['Amount']]),
          category: this.normalizeCategory(row[columnMapping['Category']]),
          date: this.parseDate(row[columnMapping['Date']]),
          paymentMethod: this.normalizePaymentMethod(row[columnMapping['Mode']] || row[columnMapping['Payment Method']]),
          tags: this.extractTags(row[columnMapping['Tag']] || row[columnMapping['Tags']]),
          type: 'expense' as const,
          source: 'csv' as const
        };

        // Validate required fields
        if (!transformed.amount || transformed.amount <= 0) {
          throw new Error(`Invalid amount in row ${index + 1}`);
        }

        if (!transformed.date) {
          throw new Error(`Invalid date in row ${index + 1}`);
        }

        return transformed;
      } catch (error) {
        Logger.error(`Error transforming expense row ${index + 1}:`, error);
        throw error;
      }
    });
  }

  static transformInvestmentData(data: any[], columnMapping: Record<string, string>) {
    return data.map((row, index) => {
      try {
        const transformed = {
          name: row[columnMapping['Fund Name']] || row[columnMapping['Name']] || 'Unknown Investment',
          amount: this.parseAmount(row[columnMapping['Amount']]),
          type: this.normalizeInvestmentType(row[columnMapping['Type']]),
          purchaseDate: this.parseDate(row[columnMapping['Date']] || row[columnMapping['Purchase Date']]),
          units: this.parseNumber(row[columnMapping['Units']]),
          nav: this.parseNumber(row[columnMapping['NAV']]),
          riskLevel: this.normalizeRiskLevel(row[columnMapping['Risk Level']]) as 'low' | 'medium' | 'high',
          source: 'csv' as const
        };

        // Validate required fields
        if (!transformed.amount || transformed.amount <= 0) {
          throw new Error(`Invalid amount in row ${index + 1}`);
        }

        if (!transformed.purchaseDate) {
          throw new Error(`Invalid date in row ${index + 1}`);
        }

        return transformed;
      } catch (error) {
        Logger.error(`Error transforming investment row ${index + 1}:`, error);
        throw error;
      }
    });
  }

  private static parseAmount(value: string): number {
    if (!value) return 0;
    
    // Remove currency symbols and commas
    const cleaned = value.toString().replace(/[₹,$\s]/g, '');
    const amount = parseFloat(cleaned);
    
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private static parseNumber(value: string): number | undefined {
    if (!value) return undefined;
    
    const num = parseFloat(value.toString().replace(/[,$\s]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  private static parseDate(value: string): string {
    if (!value) return '';
    
    try {
      // Try parsing various date formats
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        // Try DD/MM/YYYY format
        const parts = value.split(/[-/]/);
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
        return '';
      }
      
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private static normalizeCategory(value: string): string {
    if (!value) return 'Others';
    
    const categoryMap: Record<string, string> = {
      'food': 'Food & Dining',
      'transport': 'Transportation',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'bills': 'Bills & Utilities',
      'medical': 'Healthcare',
      'education': 'Education',
      'travel': 'Travel',
      'grocery': 'Groceries',
      'fuel': 'Transportation'
    };

    const normalized = value.toLowerCase().trim();
    return categoryMap[normalized] || value;
  }

  private static normalizePaymentMethod(value: string): string {
    if (!value) return 'Unknown';
    
    const methodMap: Record<string, string> = {
      'upi': 'UPI',
      'card': 'Credit Card',
      'cash': 'Cash',
      'bank': 'Bank Transfer',
      'netbanking': 'Net Banking'
    };

    const normalized = value.toLowerCase().trim();
    return methodMap[normalized] || value;
  }

  private static normalizeInvestmentType(value: string): string {
    if (!value) return 'others';
    
    const typeMap: Record<string, string> = {
      'mutual fund': 'mutual_funds',
      'mf': 'mutual_funds',
      'stock': 'stocks',
      'equity': 'stocks',
      'bond': 'bonds',
      'fd': 'fixed_deposit',
      'fixed deposit': 'fixed_deposit'
    };

    const normalized = value.toLowerCase().trim();
    return typeMap[normalized] || 'others';
  }

  private static normalizeRiskLevel(value: string): string {
    if (!value) return 'medium';
    
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('low')) return 'low';
    if (normalized.includes('high')) return 'high';
    return 'medium';
  }

  private static extractTags(value: string): string[] {
    if (!value) return [];
    
    return value.split(/[,;|]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
}
