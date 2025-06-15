import { Logger } from "./logger";

export interface ParsedExpense {
  date: string;
  amount: number;
  description: string;
  category: string;
  paymentMethod?: string;
  type: 'expense' | 'income';
}

export interface ParsedInvestment {
  date: string;
  name: string;
  amount: number;
  units?: number;
  type: string;
  scheme?: string;
}

export class EnhancedCSVParser {
  static detectCSVType(content: string): 'axio' | 'kuvera' | 'credit-card' | 'bank-statement' | 'unknown' {
    const lowerContent = content.toLowerCase();
    
    // Check for specific headers and patterns
    if (lowerContent.includes('payment mode') || lowerContent.includes('walnut') || lowerContent.includes('axio')) {
      return 'axio';
    }
    
    if (lowerContent.includes('fund house') || lowerContent.includes('kuvera') || lowerContent.includes('folio')) {
      return 'kuvera';
    }
    
    if (lowerContent.includes('merchant') || lowerContent.includes('credit') || lowerContent.includes('card number')) {
      return 'credit-card';
    }
    
    if (lowerContent.includes('debit') || lowerContent.includes('balance') || lowerContent.includes('transaction')) {
      return 'bank-statement';
    }
    
    return 'unknown';
  }

  static parseCSV(content: string, type?: string): ParsedExpense[] | ParsedInvestment[] {
    try {
      const detectedType = type || this.detectCSVType(content);
      Logger.info('Parsing CSV', { detectedType });

      switch (detectedType) {
        case 'axio':
          return this.parseAxioExpenses(content);
        case 'kuvera':
          return this.parseKuveraInvestments(content);
        case 'credit-card':
          return this.parseCreditCardStatement(content);
        case 'bank-statement':
          return this.parseBankStatement(content);
        default:
          return this.parseGenericCSV(content);
      }
    } catch (error) {
      Logger.error('Error parsing CSV', error);
      throw new Error('Failed to parse CSV file. Please check the format.');
    }
  }

  private static parseAxioExpenses(content: string): ParsedExpense[] {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));
    const descIndex = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('merchant'));
    const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('category'));
    const paymentIndex = headers.findIndex(h => h.toLowerCase().includes('payment'));

    return lines.slice(1).map(line => {
      const columns = this.parseCSVLine(line);
      
      return {
        date: this.parseDate(columns[dateIndex] || ''),
        amount: Math.abs(parseFloat(columns[amountIndex]?.replace(/[^\d.-]/g, '') || '0')),
        description: columns[descIndex] || 'Unknown Transaction',
        category: columns[categoryIndex] || 'Others',
        paymentMethod: columns[paymentIndex] || 'Unknown',
        type: 'expense' as const
      };
    }).filter(expense => expense.amount > 0);
  }

  private static parseKuveraInvestments(content: string): ParsedInvestment[] {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('fund') || h.toLowerCase().includes('scheme'));
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('value'));
    const unitsIndex = headers.findIndex(h => h.toLowerCase().includes('units'));

    return lines.slice(1).map(line => {
      const columns = this.parseCSVLine(line);
      
      return {
        date: this.parseDate(columns[dateIndex] || ''),
        name: columns[nameIndex] || 'Unknown Investment',
        amount: parseFloat(columns[amountIndex]?.replace(/[^\d.-]/g, '') || '0'),
        units: unitsIndex >= 0 ? parseFloat(columns[unitsIndex]?.replace(/[^\d.-]/g, '') || '0') : undefined,
        type: 'mutual_funds'
      };
    }).filter(investment => investment.amount > 0);
  }

  private static parseCreditCardStatement(content: string): ParsedExpense[] {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const descIndex = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('merchant'));
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));
    const typeIndex = headers.findIndex(h => h.toLowerCase().includes('type') || h.toLowerCase().includes('dr/cr'));

    return lines.slice(1).map(line => {
      const columns = this.parseCSVLine(line);
      const amount = Math.abs(parseFloat(columns[amountIndex]?.replace(/[^\d.-]/g, '') || '0'));
      const transactionType = columns[typeIndex]?.toLowerCase();
      
      return {
        date: this.parseDate(columns[dateIndex] || ''),
        amount,
        description: columns[descIndex] || 'Credit Card Transaction',
        category: this.categorizeTransaction(columns[descIndex] || ''),
        paymentMethod: 'Credit Card',
        type: (transactionType?.includes('cr') || transactionType?.includes('credit')) ? 'income' as const : 'expense' as const
      };
    }).filter(expense => expense.amount > 0);
  }

  private static parseBankStatement(content: string): ParsedExpense[] {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const descIndex = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('particulars'));
    const debitIndex = headers.findIndex(h => h.toLowerCase().includes('debit') || h.toLowerCase().includes('withdrawal'));
    const creditIndex = headers.findIndex(h => h.toLowerCase().includes('credit') || h.toLowerCase().includes('deposit'));

    return lines.slice(1).map(line => {
      const columns = this.parseCSVLine(line);
      const debitAmount = parseFloat(columns[debitIndex]?.replace(/[^\d.-]/g, '') || '0');
      const creditAmount = parseFloat(columns[creditIndex]?.replace(/[^\d.-]/g, '') || '0');
      
      if (debitAmount === 0 && creditAmount === 0) return null;
      
      return {
        date: this.parseDate(columns[dateIndex] || ''),
        amount: debitAmount || creditAmount,
        description: columns[descIndex] || 'Bank Transaction',
        category: this.categorizeTransaction(columns[descIndex] || ''),
        paymentMethod: 'Bank Transfer',
        type: debitAmount > 0 ? 'expense' : 'income'
      };
    }).filter(expense => expense !== null) as ParsedExpense[];
  }

  private static parseGenericCSV(content: string): ParsedExpense[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Try to auto-detect column positions
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('value'));
    const descIndex = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('desc'));
    
    if (dateIndex === -1 || amountIndex === -1) {
      throw new Error('Could not detect required columns (date, amount). Please use manual mapping.');
    }

    return lines.slice(1).map(line => {
      const columns = this.parseCSVLine(line);
      
      return {
        date: this.parseDate(columns[dateIndex] || ''),
        amount: Math.abs(parseFloat(columns[amountIndex]?.replace(/[^\d.-]/g, '') || '0')),
        description: columns[descIndex] || 'Transaction',
        category: 'Others',
        type: 'expense' as const
      };
    }).filter(expense => expense.amount > 0);
  }

  private static parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static parseDate(dateStr: string): string {
    try {
      // Handle various date formats
      const cleanDate = dateStr.replace(/"/g, '').trim();
      
      // Try ISO format first
      if (/^\d{4}-\d{2}-\d{2}/.test(cleanDate)) {
        return cleanDate.split(' ')[0];
      }
      
      // Try DD/MM/YYYY or MM/DD/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleanDate)) {
        const parts = cleanDate.split('/');
        // Assume DD/MM/YYYY for Indian format
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      // Try DD-MM-YYYY
      if (/^\d{1,2}-\d{1,2}-\d{4}/.test(cleanDate)) {
        const parts = cleanDate.split('-');
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      // Fallback to current date
      return new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food')) return 'Food & Dining';
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('gas')) return 'Transportation';
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('pizza')) return 'Food & Dining';
    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('netflix')) return 'Entertainment';
    if (desc.includes('electric') || desc.includes('water') || desc.includes('bill')) return 'Bills & Utilities';
    if (desc.includes('medical') || desc.includes('hospital') || desc.includes('pharmacy')) return 'Healthcare';
    if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping')) return 'Shopping';
    if (desc.includes('uber') || desc.includes('ola') || desc.includes('metro')) return 'Transportation';
    
    return 'Others';
  }
}
